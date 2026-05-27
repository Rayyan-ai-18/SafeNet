import { useState, useRef, useCallback, useEffect } from 'react'

const ZULU_KEYWORDS = ['sawubona', 'yebo', 'ngiyabonga', 'uthanda', 'izingane', 'wena', 'esikoleni', 'ukuxhashazwa', 'ungcono', 'uhlale', 'ekhaya', 'angikwazi', 'ngicela', 'kusasa', 'namuhla', 'mina', 'thina', 'nina', 'bona', 'akukho', 'bantu']

function detectLanguage(text) {
  const lower = text.toLowerCase().trim()
  const zuluScore = ZULU_KEYWORDS.filter(word => lower.includes(word)).length
  if (zuluScore >= 1) return 'zu'
  return 'en'
}

function getVoiceGender() {
  return localStorage.getItem('luna_voice_gender') || null
}

function isVoiceSetupDone() {
  return localStorage.getItem('luna_setup_done') === 'true'
}

export function useLunaVoice() {
  const [state, setState] = useState('idle') // 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [lunaResponse, setLunaResponse] = useState('')
  const [language, setLanguage] = useState('en')
  const [gender, setGender] = useState(null)
  const [showGenderChoice, setShowGenderChoice] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [browserSupported, setBrowserSupported] = useState(true)

  const recognitionRef = useRef(null)
  const synthesisRef = useRef(window.speechSynthesis)
  const utteranceRef = useRef(null)
  const audioRef = useRef(null)
  const boundaryTimerRef = useRef(null)
  const isListeningRef = useRef(false)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioChunksRef = useRef([])

  // Check browser support
  useEffect(() => {
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasSpeechSynthesis = 'speechSynthesis' in window
    setBrowserSupported(hasSpeechRecognition && hasSpeechSynthesis)

    // Check existing gender preference
    const savedGender = getVoiceGender()
    if (savedGender) setGender(savedGender)
    if (isVoiceSetupDone() && savedGender) {
      setShowGenderChoice(false)
    }
  }, [])

  // Find the best, most natural-sounding browser voice for language + gender.
  // Prefers higher-quality "Natural"/"Online"/Google voices over the default robotic ones.
  const findVoice = useCallback((lang, preferredGender) => {
    return new Promise((resolve) => {
      const loadVoices = () => {
        const voices = synthesisRef.current.getVoices()
        if (!voices.length) {
          setTimeout(loadVoices, 200)
          return
        }

        const naturalRe = /natural|neural|online|google|premium|enhanced/i
        const genderRe = preferredGender
          ? (preferredGender === 'F' ? /female|leah|thando|aria|jenny|zira/i : /male|luke|themba|guy|david/i)
          : null

        // Rank candidates: same language first, then "natural" quality, then gender match.
        const score = (v) => {
          let s = 0
          if (v.lang.startsWith(lang)) s += 100
          else if (lang === 'zu' && v.lang.startsWith('en')) s += 40 // no isiZulu voice -> en fallback
          if (naturalRe.test(v.name)) s += 20
          if (genderRe && genderRe.test(v.name)) s += 10
          if (v.localService === false) s += 5 // cloud voices tend to be more natural
          return s
        }

        const best = [...voices].sort((a, b) => score(b) - score(a))[0]
        resolve(best || voices[0])
      }

      loadVoices()
    })
  }, [])

  // Browser speech synthesis (used for isiZulu, and as English fallback)
  const speakBrowser = useCallback(async (text, lang, preferredGender) => {
    return new Promise((resolve) => {
      if (!synthesisRef.current) {
        resolve()
        return
      }

      synthesisRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = lang === 'zu' ? 0.9 : 1.0
      utterance.pitch = 1.0

      findVoice(lang, preferredGender).then(voice => {
        if (voice) utterance.voice = voice
        utterance.lang = lang === 'zu' ? 'zu-ZA' : 'en-ZA'

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            window.dispatchEvent(new CustomEvent('luna-word-boundary'))
          }
        }

        utterance.onstart = () => setState('speaking')
        utterance.onend = () => { setState('idle'); resolve() }
        utterance.onerror = () => { setState('idle'); resolve() }

        utteranceRef.current = utterance
        synthesisRef.current.speak(utterance)
      })
    })
  }, [findVoice])

  // Speak Luna's response. English uses the natural Deepgram "aura" voice
  // (same as meet-luna-ai, via /api/luna-tts); isiZulu uses the browser voice.
  const speak = useCallback(async (text, lang, preferredGender) => {
    if (!text || !text.trim()) return

    if (lang === 'zu') {
      await speakBrowser(text, lang, preferredGender)
      return
    }

    try {
      const res = await fetch('/api/luna-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gender: preferredGender || 'F' }),
      })
      if (!res.ok) throw new Error(`TTS ${res.status}`)

      const { audio, format } = await res.json()
      if (!audio) throw new Error('No audio')

      const mime = format === 'wav' ? 'audio/wav' : format === 'ogg' ? 'audio/ogg' : 'audio/mpeg'

      await new Promise((resolve, reject) => {
        const el = new Audio(`data:${mime};base64,${audio}`)
        audioRef.current = el

        const startPulse = () => {
          clearInterval(boundaryTimerRef.current)
          boundaryTimerRef.current = setInterval(() => {
            window.dispatchEvent(new CustomEvent('luna-word-boundary'))
          }, 260)
        }
        const stopPulse = () => clearInterval(boundaryTimerRef.current)

        el.onplay = () => { setState('speaking'); startPulse() }
        el.onended = () => { stopPulse(); resolve() }
        el.onerror = () => { stopPulse(); reject(new Error('audio decode/playback error')) }
        el.play().catch((e) => { stopPulse(); reject(e) })
      })
      setState('idle')
    } catch {
      // Deepgram audio failed (decode/autoplay/network) - use browser voice instead
      await speakBrowser(text, lang, preferredGender)
    }
  }, [speakBrowser])

  // Ask Luna via the SafeNet serverless endpoint (Groq key stays server-side)
  const callGroq = useCallback(async (message, lang) => {
    try {
      const res = await fetch('/api/luna-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language: lang,
          history: conversationHistory.slice(-6),
        }),
      })

      if (!res.ok) {
        throw new Error(`Luna chat error: ${res.status}`)
      }

      const data = await res.json()
      return { response: data.reply || '' }
    } catch (err) {
      console.warn('Luna chat error:', err.message)
      return {
        response: lang === 'zu'
          ? 'ULuna akakwazi ukuxhumana okwamanje. Sicela uzame futhi.'
          : "Luna can't connect right now. Please try again.",
      }
    }
  }, [conversationHistory])

  // Process user input (defined BEFORE startListening to avoid TDZ ReferenceError)
  const processUserInput = useCallback(async (text, forcedLang) => {
    if (!text.trim()) return

    const detectedLang = forcedLang || detectLanguage(text)
    setLanguage(detectedLang)
    setState('thinking')

    // Check voice setup
    if (!isVoiceSetupDone()) {
      setShowGenderChoice(true)
      setConversationHistory(prev => [...prev, { role: 'user', text }])

      const setupMessage = 'Hi, I\'m Luna. Do you prefer a male or female voice?'
      setLunaResponse(setupMessage)
      await speak(setupMessage, 'en', null)
      setState('idle')
      return
    }

    // Add user message to history
    setConversationHistory(prev => [...prev, { role: 'user', text }])

    // Call Groq
    const { response } = await callGroq(text, detectedLang)
    setLunaResponse(response)
    setConversationHistory(prev => [...prev, { role: 'luna', text: response }])

    // Speak response
    const currentGender = getVoiceGender()
    await speak(response, detectedLang, currentGender)
    setState('idle')
  }, [callGroq, speak])

  // isiZulu: record mic audio and transcribe via Vulavula (Lelapa AI)
  const startVulavulaRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
        .find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || ''

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        isListeningRef.current = false
        mediaStreamRef.current?.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (!blob.size) { setState('idle'); return }

        setState('thinking')
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '')
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })

          const res = await fetch('/api/luna-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, mimeType: recorder.mimeType || 'audio/webm', language: 'zu' }),
          })
          if (!res.ok) throw new Error(`Transcribe ${res.status}`)
          const { text } = await res.json()

          if (text && text.trim()) {
            setTranscript(text)
            await processUserInput(text, 'zu')
          } else {
            setState('idle')
          }
        } catch (err) {
          console.warn('Vulavula transcription failed:', err.message)
          setState('idle')
        }
      }

      isListeningRef.current = true
      setState('listening')
      setTranscript('')
      setInterimTranscript('')
      mediaRecorderRef.current = recorder
      recorder.start()
    } catch (err) {
      console.warn('Mic access error:', err.message)
      isListeningRef.current = false
      setState('idle')
    }
  }, [processUserInput])

  // Start listening: browser recognition for English, Vulavula recording for isiZulu
  const startListening = useCallback(() => {
    if (language === 'zu') {
      startVulavulaRecording()
      return
    }

    if (!browserSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setBrowserSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language === 'zu' ? 'zu-ZA' : 'en-ZA'

    recognition.onstart = () => {
      isListeningRef.current = true
      setState('listening')
      setTranscript('')
      setInterimTranscript('')
    }

    let finalTranscript = ''

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        finalTranscript = final
        setTranscript(final)
        setInterimTranscript('')
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onend = () => {
      isListeningRef.current = false
      const text = finalTranscript
      if (text.trim()) {
        processUserInput(text)
      } else {
        setState('idle')
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      isListeningRef.current = false
      setState('idle')
      if (event.error === 'not-allowed') {
        setBrowserSupported(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [browserSupported, language, processUserInput, startVulavulaRecording])

  // Set gender preference
  const setGenderPreference = useCallback(async (preferredGender) => {
    localStorage.setItem('luna_voice_gender', preferredGender)
    localStorage.setItem('luna_setup_done', 'true')
    setGender(preferredGender)
    setShowGenderChoice(false)

    const greeting = preferredGender === 'F' ? 'Wonderful! I\'ll use a female voice. How can I help you today?' : 'Great! I\'ll use a male voice. How can I help you today?'
    setLunaResponse(greeting)
    await speak(greeting, 'en', preferredGender)
    setState('idle')
  }, [speak])

  // Send text input (for suggested questions)
  const sendTextInput = useCallback(async (text) => {
    if (!text.trim()) return
    setTranscript(text)

    const detectedLang = detectLanguage(text)
    setLanguage(detectedLang)
    setState('thinking')

    // Check voice setup first
    if (!isVoiceSetupDone()) {
      setShowGenderChoice(true)
      setConversationHistory(prev => [...prev, { role: 'user', text }])

      const setupMessage = 'Hi, I\'m Luna. Do you prefer a male or female voice?'
      setLunaResponse(setupMessage)
      await speak(setupMessage, 'en', null)
      setState('idle')
      return
    }

    setConversationHistory(prev => [...prev, { role: 'user', text }])

    const { response } = await callGroq(text, detectedLang)
    setLunaResponse(response)
    setConversationHistory(prev => [...prev, { role: 'luna', text: response }])

    const currentGender = getVoiceGender()
    await speak(response, detectedLang, currentGender)
    setState('idle')
  }, [callGroq, speak])

  // Stop listening
  const stopListening = useCallback(() => {
    // isiZulu recording: stopping triggers the recorder's onstop -> transcription
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      return
    }
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop()
      isListeningRef.current = false
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    clearInterval(boundaryTimerRef.current)
    setState('idle')
  }, [])

  // Toggle language
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'zu' : 'en')
  }, [])

  return {
    state,
    transcript,
    interimTranscript,
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
    toggleLanguage,
  }
}

export default useLunaVoice
