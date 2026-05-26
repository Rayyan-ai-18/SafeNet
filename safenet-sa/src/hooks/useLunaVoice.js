import { useState, useRef, useCallback, useEffect } from 'react'

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama3-8b-8192'

const ZULU_KEYWORDS = ['sawubona', 'yebo', 'ngiyabonga', 'uthanda', 'izingane', 'wena', 'esikoleni', 'ukuxhashazwa', 'ungcono', 'uhlale', 'ekhaya', 'angikwazi', 'ngicela', 'kusasa', 'namuhla', 'mina', 'thina', 'nina', 'bona', 'akukho', 'bantu']

const LUNA_SYSTEM_PROMPT = `You are Luna, the AI guardian of SafeNet SA — South Africa's child digital safety platform. You speak in whatever language the user speaks to you in (English or isiZulu). You are warm, caring, and maternal — like a trusted family friend. You help parents understand: how SafeNet works, what cyberbullying looks like in SA, what grooming and honey trap tactics look like, how SafeNet protects their child, and what to do when they receive an alert. Keep all responses to 2-3 sentences maximum — your response will be spoken aloud. No bullet points, no markdown, no jargon. Always end with warmth or an offer to help further. Message content is never stored or transmitted — always reassure parents of this when relevant.`

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
  const [groqConfigured, setGroqConfigured] = useState(true)

  const recognitionRef = useRef(null)
  const synthesisRef = useRef(window.speechSynthesis)
  const utteranceRef = useRef(null)
  const isListeningRef = useRef(false)

  // Check browser support
  useEffect(() => {
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasSpeechSynthesis = 'speechSynthesis' in window
    setBrowserSupported(hasSpeechRecognition && hasSpeechSynthesis)

    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      setGroqConfigured(false)
    }

    // Check existing gender preference
    const savedGender = getVoiceGender()
    if (savedGender) setGender(savedGender)
    if (isVoiceSetupDone() && savedGender) {
      setShowGenderChoice(false)
    }
  }, [])

  // Find best voice for language + gender
  const findVoice = useCallback((lang, preferredGender) => {
    return new Promise((resolve) => {
      // Wait for voices to load
      const loadVoices = () => {
        const voices = synthesisRef.current.getVoices()
        if (!voices.length) {
          // Try again after a short delay
          setTimeout(loadVoices, 200)
          return
        }

        let voice = null

        // Try matching language + gender first
        if (preferredGender) {
          const genderFilter = preferredGender === 'F' ? /female/i : /male/i
          voice = voices.find(v =>
            v.lang.startsWith(lang) && genderFilter.test(v.name)
          )
        }

        // Fallback: just match language
        if (!voice) {
          voice = voices.find(v => v.lang.startsWith(lang))
        }

        // Fallback: match language broadly
        if (!voice && lang === 'zu') {
          voice = voices.find(v => v.lang.startsWith('en'))
        }

        // Ultimate fallback: first available
        if (!voice) {
          voice = voices[0]
        }

        resolve(voice)
      }

      loadVoices()
    })
  }, [])

  // Speak Luna's response
  const speak = useCallback(async (text, lang, preferredGender) => {
    return new Promise((resolve) => {
      if (!synthesisRef.current) {
        resolve()
        return
      }

      // Cancel any ongoing speech
      synthesisRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = lang === 'zu' ? 0.85 : 1.0
      utterance.pitch = lang === 'zu' ? 0.9 : 1.0

      findVoice(lang, preferredGender).then(voice => {
        if (voice) utterance.voice = voice
        utterance.lang = lang === 'zu' ? 'zu-ZA' : 'en-ZA'

        // Track word boundaries for orb animation
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            window.dispatchEvent(new CustomEvent('luna-word-boundary'))
          }
        }

        utterance.onstart = () => {
          setState('speaking')
        }

        utterance.onend = () => {
          setState('idle')
          resolve()
        }

        utterance.onerror = () => {
          setState('idle')
          resolve()
        }

        utteranceRef.current = utterance
        synthesisRef.current.speak(utterance)
      })
    })
  }, [findVoice])

  // Call Groq API
  const callGroq = useCallback(async (message, lang) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return {
        response: lang === 'zu'
          ? 'ULuna akakwazi ukuphendula okwamanje. Sicela ufake i-Groq API key kwi-.env file yakho.'
          : "Luna can't respond right now. Please add your Groq API key to the .env file. You can get a free key at console.groq.com.",
      }
    }

    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: LUNA_SYSTEM_PROMPT },
            ...conversationHistory.slice(-6).map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.text,
            })),
            { role: 'user', content: message },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      if (!res.ok) {
        throw new Error(`Groq API error: ${res.status}`)
      }

      const data = await res.json()
      return { response: data.choices[0]?.message?.content || '' }
    } catch (err) {
      console.warn('Groq API error:', err.message)
      return {
        response: lang === 'zu'
          ? 'ULuna akakwazi ukuxhumana okwamanje. Sicela uzame futhi.'
          : "Luna can't connect right now. Please try again.",
      }
    }
  }, [conversationHistory])

  // Process user input (defined BEFORE startListening to avoid TDZ ReferenceError)
  const processUserInput = useCallback(async (text) => {
    if (!text.trim()) return

    const detectedLang = detectLanguage(text)
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

  // Start listening (references processUserInput which is now defined above)
  const startListening = useCallback(() => {
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
  }, [browserSupported, language, processUserInput])

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
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop()
      isListeningRef.current = false
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
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
    groqConfigured,
    startListening,
    stopListening,
    sendTextInput,
    setGenderPreference,
    toggleLanguage,
  }
}

export default useLunaVoice
