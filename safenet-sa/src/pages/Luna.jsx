import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Sparkles, Globe, Shield, MessageCircle, Activity, AlertTriangle } from 'lucide-react'
import { gsap } from '../lib/gsap'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import LunaOrb from '../components/ui/LunaOrb'
import { useLunaVoice } from '../hooks/useLunaVoice'

const suggestedQuestions = [
  { en: 'How does SafeNet protect my child?', zu: 'I-SafeNet ivikela ingane yami kanjani?' },
  { en: 'What is a honey trap?', zu: 'Uyini ugibe lwezinyosi?' },
  { en: 'What happens when Luna detects a threat?', zu: 'Kwenzekani uma uLuna ethola usongo?' },
  { en: 'Is my child\'s privacy protected?', zu: 'Ingabe ubumfihlo bengane yami buvikelekile?' },
  { en: 'Ngingakusebenzisa kanjani uSafeNet?', zu: 'Ngingakusebenzisa kanjani uSafeNet?' },
  { en: 'Ingane yami iphephile?', zu: 'Ingane yami iphephile?' },
]

const iconMap = {
  'How does SafeNet protect my child?': Shield,
  'What is a honey trap?': Activity,
  'What happens when Luna detects a threat?': AlertTriangle,
  'Is my child\'s privacy protected?': Shield,
  'Ngingakusebenzisa kanjani uSafeNet?': Globe,
  'Ingane yami iphephile?': Sparkles,
}

export default function Luna() {
  const {
    state, transcript, interimTranscript, lunaResponse, language,
    showGenderChoice, conversationHistory, browserSupported, groqConfigured,
    startListening, stopListening, sendTextInput, setGenderPreference, toggleLanguage,
    gender,
  } = useLunaVoice()

  const heroRef = useRef(null)
  const headingRef = useRef(null)
  const subRef = useRef(null)
  const orbCardRef = useRef(null)
  const chipsRef = useRef([])
  const scrollRef = useRef(null)

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      gsap.fromTo(subRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: 'power2.out' })
      gsap.fromTo(orbCardRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out' })
      gsap.fromTo(chipsRef.current, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.5, ease: 'power2.out',
      })
    }, heroRef)
    return () => ctx.revert()
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversationHistory])

  const handleMicClick = () => {
    if (state === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSuggestedClick = (question) => {
    const text = language === 'zu' ? question.zu : question.en
    sendTextInput(text)
  }

  return (
    <>
      <SEO
        title="Talk to Luna — SafeNet SA Voice AI"
        description="Meet Luna, your AI guardian. Ask Luna anything about keeping your child safe online. Speaks English and Zulu."
        canonicalPath="/luna"
      />
      <div className="min-h-screen bg-safenet-bg">
        <Nav />

        <main ref={heroRef} className="pt-24 pb-16 px-4">
          {/* Section 1: Hero */}
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 ref={headingRef} className="font-display text-display-sm sm:text-display-md text-safenet-text mb-4">
              Meet Luna.
            </h1>
            <p ref={subRef} className="text-lg text-safenet-text-2 max-w-lg mx-auto">
              She watches so you don't have to.
            </p>
          </div>

          {/* Section 2: Orb + Voice Interface */}
          <div ref={orbCardRef} className="max-w-md mx-auto mb-10">
            <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-8 text-center">
              {/* Luna Orb */}
              <div className="flex justify-center mb-6">
                <LunaOrb state={state === 'thinking' || state === 'listening' || state === 'speaking' ? state : 'idle'} size={140} />
              </div>

              {/* Status text */}
              <div className="h-12 mb-4">
                <AnimatePresence mode="wait">
                  {state === 'idle' && !lunaResponse && (
                    <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-safenet-text-3">
                      Tap to talk to Luna
                    </motion.p>
                  )}
                  {state === 'listening' && (
                    <motion.p key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium text-safenet-primary">
                      Listening<span className="animate-pulse">...</span>
                    </motion.p>
                  )}
                  {state === 'thinking' && (
                    <motion.p key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-safenet-text-2">
                      Luna is thinking<span className="animate-pulse">...</span>
                    </motion.p>
                  )}
                  {state === 'speaking' && (
                    <motion.p key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-safenet-text-2 leading-relaxed max-w-sm mx-auto">
                      {lunaResponse}
                    </motion.p>
                  )}
                  {state === 'idle' && lunaResponse && (
                    <motion.p key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-safenet-text leading-relaxed max-w-sm mx-auto">
                      {lunaResponse}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Live transcript */}
              {(interimTranscript || transcript) && (
                <div className="mb-4 px-4 py-2.5 bg-safenet-surface rounded-lg border border-safenet-border">
                  <p className="text-sm text-safenet-text-2">
                    {transcript || interimTranscript}
                    {interimTranscript && !transcript && <span className="animate-pulse">|</span>}
                  </p>
                </div>
              )}

              {/* Gender choice */}
              <AnimatePresence>
                {showGenderChoice && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <p className="text-sm font-medium text-safenet-text mb-3">Choose Luna's voice:</p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setGenderPreference('F')}
                        className="px-6 py-2.5 rounded-btn bg-safenet-primary text-white font-medium text-sm hover:bg-safenet-primary-dark transition-colors"
                      >
                        Female
                      </button>
                      <button
                        onClick={() => setGenderPreference('M')}
                        className="px-6 py-2.5 rounded-btn bg-safenet-surface text-safenet-text border border-safenet-border font-medium text-sm hover:bg-safenet-border transition-colors"
                      >
                        Male
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mic button */}
              <div className="flex justify-center mb-4">
                <motion.button
                  onClick={handleMicClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-safenet-md ${
                    state === 'listening'
                      ? 'bg-safenet-danger text-white'
                      : 'bg-safenet-primary text-white'
                  }`}
                >
                  {state === 'listening' ? (
                    <MicOff className="w-7 h-7" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </motion.button>
              </div>

              {/* Browser support note */}
              {!browserSupported && (
                <p className="text-xs text-safenet-accent mb-3">
                  Best experienced in Chrome on desktop or Android.
                </p>
              )}

              {/* Groq config note */}
              {!groqConfigured && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[11px] text-amber-700">
                    Add your free Groq API key to <code className="bg-amber-100 px-1 rounded">.env</code> to activate Luna's brain.
                    Get one at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com</a>
                  </p>
                </div>
              )}

              {/* Controls row */}
              <div className="flex items-center justify-center gap-3">
                {/* Language toggle */}
                <button
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-safenet-surface border border-safenet-border text-xs font-medium text-safenet-text-2 hover:text-safenet-text transition-colors"
                >
                  <span className="text-base leading-none">{language === 'en' ? '🇿🇦' : '🇿🇦'}</span>
                  {language === 'en' ? 'EN' : 'ZU'}
                </button>

                {/* Gender indicator */}
                {gender && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-safenet-surface border border-safenet-border text-xs text-safenet-text-3">
                    {gender === 'F' ? '♀' : '♂'} {gender === 'F' ? 'Female' : 'Male'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Suggested questions */}
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-center text-xs font-semibold text-safenet-text-3 uppercase tracking-wider mb-4">
              Try asking Luna
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {suggestedQuestions.map((q, i) => {
                const text = language === 'zu' ? q.zu : q.en
                const Icon = iconMap[q.en] || Sparkles
                return (
                  <button
                    key={i}
                    ref={el => chipsRef.current[i] = el}
                    onClick={() => handleSuggestedClick(q)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-safenet-primary-light text-safenet-primary text-sm font-medium hover:bg-safenet-primary/20 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {text}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 4: Conversation history */}
          {conversationHistory.length > 0 && (
            <div className="max-w-lg mx-auto">
              <p className="text-center text-xs font-semibold text-safenet-text-3 uppercase tracking-wider mb-4">
                Conversation
              </p>
              <div ref={scrollRef} className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                  {conversationHistory.slice(-8).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'luna' && (
                        <div className="w-6 h-6 rounded-full bg-safenet-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mr-2 mt-1">
                          L
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-safenet-primary text-white rounded-br-sm'
                            : 'bg-white border border-safenet-border shadow-safenet-sm text-safenet-text rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}
