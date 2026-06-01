import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchToucanAudioUrl, isToucanApproved } from '../lib/voiceRouter'
import { canMic } from '../lib/lunaLanguages'

// Luna voice hook - mirrors the Luna-AI pipeline so it works cross-browser
// (incl. Safari/iOS): Silero VAD captures speech -> Groq Whisper STT
// (/api/luna-stt) -> chat (/api/luna-chat) -> Deepgram voice (/api/luna-tts).
// isiZulu replies use the browser voice (no isiZulu neural voice available).

const ZULU_KEYWORDS = ['sawubona', 'yebo', 'ngiyabonga', 'uthanda', 'izingane', 'wena', 'esikoleni', 'ukuxhashazwa', 'ungcono', 'uhlale', 'ekhaya', 'angikwazi', 'ngicela', 'kusasa', 'namuhla', 'mina', 'thina', 'nina', 'bona', 'akukho', 'bantu']

// Tiny silent WAV used to "unlock" audio playback on the first user gesture.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

const VAD_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort.js',
  'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.7/dist/bundle.min.js',
]

function detectLanguage(text) {
  const lower = text.toLowerCase().trim()
  const zuluScore = ZULU_KEYWORDS.filter(word => lower.includes(word)).length
  return zuluScore >= 1 ? 'zu' : 'en'
}

function getVoiceGender() {
  return localStorage.getItem('luna_voice_gender') || null
}

function isVoiceSetupDone() {
  return localStorage.getItem('luna_setup_done') === 'true'
}

// Encode Float32 PCM (from VAD) into a 16kHz mono WAV blob -> base64
function float32ToBase64Wav(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  const pcm = new Int16Array(buffer, 44)
  for (let i = 0; i < samples.length; i++) {
    pcm[i] = Math.max(-32768, Math.min(32767, samples[i] * 32768))
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

let vadScriptsPromise = null
function loadVadScripts() {
  if (window.vad) return Promise.resolve()
  if (vadScriptsPromise) return vadScriptsPromise
  vadScriptsPromise = VAD_SCRIPTS.reduce(
    (chain, src) => chain.then(() => new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`)
      if (existing) { resolve(); return }
      const el = document.createElement('script')
      el.src = src
      el.crossOrigin = 'anonymous'
      el.onload = resolve
      el.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.head.appendChild(el)
    })),
    Promise.resolve()
  ).then(async () => {
    for (let i = 0; i < 50 && !window.vad; i++) await new Promise(r => setTimeout(r, 100))
    if (!window.vad) throw new Error('VAD library unavailable')
  })
  return vadScriptsPromise
}

export function useLunaVoice() {
  const [state, setState] = useState('idle') // idle | listening | thinking | speaking
  const [sessionActive, setSessionActive] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lunaResponse, setLunaResponse] = useState('')
  const [language, setLanguage] = useState('en')
  const [gender, setGender] = useState(null)
  const [showGenderChoice, setShowGenderChoice] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [browserSupported, setBrowserSupported] = useState(true)

  const synthesisRef = useRef(window.speechSynthesis)
  const audioRef = useRef(null)
  const audioUnlockedRef = useRef(false)
  const boundaryTimerRef = useRef(null)
  const vadRef = useRef(null)
  const isProcessingRef = useRef(false)
  const historyRef = useRef([])
  const languageRef = useRef('en')

  useEffect(() => {
    const hasMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setBrowserSupported(hasMic)
    const savedGender = getVoiceGender()
    if (savedGender) setGender(savedGender)
  }, [])

  useEffect(() => { languageRef.current = language }, [language])

  // ── Audio element + iOS/Safari unlock (must run during a user gesture) ──
  const getAudioEl = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
      audioRef.current.playsInline = true
    }
    return audioRef.current
  }, [])

  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return
    try {
      const el = getAudioEl()
      el.src = SILENT_WAV
      el.volume = 0
      const p = el.play()
      if (p && p.then) p.then(() => { el.pause(); el.currentTime = 0; el.volume = 1 }).catch(() => { el.volume = 1 })
      if (synthesisRef.current) synthesisRef.current.getVoices()
      audioUnlockedRef.current = true
    } catch { /* falls back to browser voice */ }
  }, [getAudioEl])

  // ── Browser voice (isiZulu, and English fallback) ──
  const findVoice = useCallback((lang) => new Promise((resolve) => {
    const load = () => {
      const voices = synthesisRef.current.getVoices()
      if (!voices.length) { setTimeout(load, 200); return }
      const naturalRe = /natural|neural|online|google|premium|enhanced/i
      const score = (v) => {
        let s = 0
        if (v.lang.startsWith(lang)) s += 100
        else if (lang === 'zu' && v.lang.startsWith('en')) s += 40
        if (naturalRe.test(v.name)) s += 20
        if (v.localService === false) s += 5
        return s
      }
      resolve([...voices].sort((a, b) => score(b) - score(a))[0] || voices[0])
    }
    load()
  }), [])

  const speakBrowser = useCallback((text, lang) => new Promise((resolve) => {
    if (!synthesisRef.current) { resolve(); return }
    synthesisRef.current.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = lang === 'zu' ? 0.9 : 1.0
    findVoice(lang).then(voice => {
      if (voice) u.voice = voice
      u.lang = lang === 'zu' ? 'zu-ZA' : 'en-ZA'
      u.onboundary = (e) => { if (e.name === 'word') window.dispatchEvent(new CustomEvent('luna-word-boundary')) }
      u.onstart = () => setState('speaking')
      u.onend = () => resolve()
      u.onerror = () => resolve()
      synthesisRef.current.speak(u)
    })
  }), [findVoice])

  // ── Play an audio URL through the managed element, pulsing the avatar mouth.
  // Used by both the Deepgram (English) and Toucan (SA langs) paths so the
  // visualizer + iOS audio unlock behave identically. Rejects on audio error. ──
  const playUrlWithPulse = useCallback((url, { revoke = false } = {}) => new Promise((resolve, reject) => {
    const el = getAudioEl()
    const startPulse = () => {
      clearInterval(boundaryTimerRef.current)
      boundaryTimerRef.current = setInterval(() => window.dispatchEvent(new CustomEvent('luna-word-boundary')), 260)
    }
    const stop = () => { clearInterval(boundaryTimerRef.current); if (revoke) URL.revokeObjectURL(url) }
    el.onplay = () => startPulse()
    el.onended = () => { stop(); resolve() }
    el.onerror = () => { stop(); reject(new Error('audio error')) }
    el.src = url
    el.play().catch((e) => { stop(); reject(e) })
  }), [getAudioEl])

  // ── Speak: English -> Deepgram (/api/luna-tts). Other SA languages -> Toucan
  // service when that language is approved + configured, else browser voice.
  // Ndebele has no voice model anywhere, so it stays text-only. ──
  const speak = useCallback(async (text, lang) => {
    if (!text || !text.trim()) return
    setState('speaking')

    // Ndebele: no neural voice exists; the UI shows the text reply.
    if (lang === 'nbl' || lang === 'nr') return

    // Non-English SA languages: Toucan if approved, otherwise browser voice.
    if (lang && lang !== 'en') {
      if (isToucanApproved(lang)) {
        const url = await fetchToucanAudioUrl(text, lang)
        if (url) {
          try { await playUrlWithPulse(url, { revoke: true }); return }
          catch { /* service hiccup: fall through to browser voice */ }
        }
      }
      await speakBrowser(text, lang)
      return
    }

    // English (or unspecified): Deepgram, exactly as before.
    try {
      const res = await fetch('/api/luna-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gender: getVoiceGender() || 'F' }),
      })
      if (!res.ok) throw new Error(`TTS ${res.status}`)
      const { audio, format } = await res.json()
      if (!audio) throw new Error('No audio')

      const mime = format === 'wav' ? 'audio/wav' : 'audio/mpeg'
      const bin = atob(audio)
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      const url = URL.createObjectURL(new Blob([arr], { type: mime }))
      await playUrlWithPulse(url, { revoke: true })
    } catch {
      await speakBrowser(text, lang)
    }
  }, [playUrlWithPulse, speakBrowser])

  // ── STT: isiZulu via Vulavula, English via Groq Whisper (both get WAV) ──
  const transcribe = useCallback(async (float32) => {
    const audio = float32ToBase64Wav(float32)
    const isZulu = languageRef.current === 'zu'
    const res = await fetch(isZulu ? '/api/luna-transcribe' : '/api/luna-stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: isZulu
        ? JSON.stringify({ audio, mimeType: 'audio/wav', language: 'zu' })
        : JSON.stringify({ audio }),
    })
    if (!res.ok) throw new Error(`STT ${res.status}`)
    const data = await res.json()
    return (data.text || '').trim()
  }, [])

  // ── Chat ──
  const callChat = useCallback(async (message, lang) => {
    try {
      const res = await fetch('/api/luna-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: lang, history: historyRef.current.slice(-6) }),
      })
      if (!res.ok) throw new Error(`chat ${res.status}`)
      const data = await res.json()
      return data.reply || ''
    } catch {
      return lang === 'zu'
        ? 'ULuna akakwazi ukuxhumana okwamanje. Sicela uzame futhi.'
        : "Luna can't connect right now. Please try again."
    }
  }, [])

  const pushHistory = useCallback((entry) => {
    historyRef.current = [...historyRef.current, entry].slice(-12)
    setConversationHistory(historyRef.current)
  }, [])

  // ── One full turn: transcript -> chat -> speak ──
  const handleTurn = useCallback(async (text, forcedLang) => {
    if (!text || text.length < 2) { setState(sessionActive ? 'listening' : 'idle'); return }
    const lang = forcedLang || detectLanguage(text)
    setLanguage(lang)
    setTranscript(text)
    pushHistory({ role: 'user', text })

    setState('thinking')
    const reply = await callChat(text, lang)
    setLunaResponse(reply)
    pushHistory({ role: 'luna', text: reply })

    await speak(reply, lang)
    setState(vadRef.current ? 'listening' : 'idle')
  }, [callChat, pushHistory, speak, sessionActive])

  // VAD callback: a chunk of speech ended
  const onSpeechEnd = useCallback(async (float32) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    try {
      setState('thinking')
      const text = await transcribe(float32)
      await handleTurn(text, languageRef.current)
    } catch (e) {
      console.warn('Luna turn error:', e.message)
      setState(vadRef.current ? 'listening' : 'idle')
    } finally {
      isProcessingRef.current = false
    }
  }, [transcribe, handleTurn])

  // ── Start / stop the hands-free conversation ──
  const beginSession = useCallback(async () => {
    unlockAudio()
    try {
      await loadVadScripts()
      setState('thinking')
      const myVad = await window.vad.MicVAD.new({
        onSpeechStart: () => { if (!isProcessingRef.current) setState('listening') },
        onSpeechEnd: (audio) => onSpeechEnd(audio),
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.35,
        minSpeechFrames: 5,
      })
      vadRef.current = myVad
      await myVad.start()
      setSessionActive(true)

      // Greeting
      const greeting = languageRef.current === 'zu'
        ? 'Sawubona, nginguLuna. Ngingakusiza kanjani ukugcina ingane yakho iphephile namuhla?'
        : "Hi, I'm Luna. How can I help you keep your child safe today?"
      setLunaResponse(greeting)
      pushHistory({ role: 'luna', text: greeting })
      await speak(greeting, languageRef.current)
      setState('listening')
    } catch (e) {
      console.warn('Luna session error:', e.message)
      setSessionActive(false)
      setState('idle')
      setBrowserSupported(false)
    }
  }, [unlockAudio, onSpeechEnd, pushHistory, speak])

  const startListening = useCallback(() => {
    unlockAudio()
    if (sessionActive) return
    if (!isVoiceSetupDone()) { setShowGenderChoice(true); return }
    beginSession()
  }, [unlockAudio, sessionActive, beginSession])

  const stopListening = useCallback(() => {
    if (vadRef.current) {
      try { vadRef.current.pause() } catch { /* noop */ }
      try { vadRef.current.destroy?.() } catch { /* noop */ }
      vadRef.current = null
    }
    if (synthesisRef.current) synthesisRef.current.cancel()
    if (audioRef.current) audioRef.current.pause()
    clearInterval(boundaryTimerRef.current)
    isProcessingRef.current = false
    setSessionActive(false)
    setState('idle')
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    try { vadRef.current?.destroy?.() } catch { /* noop */ }
    try { synthesisRef.current?.cancel() } catch { /* noop */ }
    clearInterval(boundaryTimerRef.current)
  }, [])

  // ── Gender preference: chosen voice, then begin the session ──
  const setGenderPreference = useCallback(async (preferredGender) => {
    unlockAudio()
    localStorage.setItem('luna_voice_gender', preferredGender)
    localStorage.setItem('luna_setup_done', 'true')
    setGender(preferredGender)
    setShowGenderChoice(false)
    beginSession()
  }, [unlockAudio, beginSession])

  // ── Typed input (suggested questions) - no mic needed ──
  const sendTextInput = useCallback(async (text) => {
    if (!text.trim()) return
    unlockAudio()
    if (!isVoiceSetupDone()) {
      // default to a female voice so suggestions work without the mic flow
      localStorage.setItem('luna_voice_gender', 'F')
      localStorage.setItem('luna_setup_done', 'true')
      setGender('F')
    }
    await handleTurn(text, languageRef.current)
  }, [unlockAudio, handleTurn])

  // Set Luna's language explicitly (the picker). The selected language is the
  // source of truth for replies + voice. If we switch to a language we can't
  // take mic input for, end any live mic session so the UI stays consistent.
  const setLanguageCode = useCallback((code) => {
    setLanguage(code)
    languageRef.current = code
    if (!canMic(code) && vadRef.current) stopListening()
  }, [stopListening])

  return {
    state,
    sessionActive,
    transcript,
    interimTranscript: '',
    lunaResponse,
    language,
    gender,
    showGenderChoice,
    conversationHistory,
    browserSupported,
    startListening,
    stopListening,
    sendTextInput,
    setGenderPreference,
    setLanguageCode,
  }
}

export default useLunaVoice
