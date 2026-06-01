import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Sparkles, Globe, Shield, Activity, AlertTriangle, Check, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gsap } from '../lib/gsap'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import LunaOrb from '../components/ui/LunaOrb'
import { useLunaVoice } from '../hooks/useLunaVoice'
import { LUNA_LANGUAGES, getLanguage, canMic } from '../lib/lunaLanguages'
import { LUNA_SUGGESTIONS, getSuggestion } from '../data/lunaSuggestions'

const iconMap = { Shield, Activity, AlertTriangle, Globe, Sparkles }


export default function Luna() {
  const {
    state, sessionActive, transcript, interimTranscript, lunaResponse, language,
    showGenderChoice, conversationHistory, browserSupported,
    startListening, stopListening, sendTextInput, setGenderPreference, setLanguageCode,
    gender,
  } = useLunaVoice()

  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const micEnabled = canMic(language)
  const activeLang = getLanguage(language)

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
    if (sessionActive) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSuggestedClick = (question) => {
    sendTextInput(getSuggestion(question, language))
  }

  const handleLanguageSelect = (code) => {
    setLanguageCode(code)
    setLangOpen(false)
  }

  // Close the language menu on outside click / Escape
  useEffect(() => {
    if (!langOpen) return
    const onClick = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setLangOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [langOpen])

  return (
    <>
      <SEO
        title="Talk to Luna - SafeNet SA Voice AI Guardian"
        description="Meet Luna, the AI guardian for South African families. Ask Luna about cyberbullying, grooming, honey traps, and online safety. Speaks English plus 9 SA languages including Zulu, Xhosa, Afrikaans, and Sesotho. Free to use."
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

              {/* Status indicator (short text only) */}
              <div className="min-h-[1.5rem] mb-4 flex items-center justify-center">
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
                    <motion.p key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium text-safenet-primary">
                      Speaking<span className="animate-pulse">...</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Your transcript */}
              {(interimTranscript || transcript) && (
                <div className="mb-3 px-4 py-3 bg-safenet-surface rounded-lg border border-safenet-border text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-safenet-text-3 mb-1">You</p>
                  <p className="text-sm text-safenet-text-2 leading-relaxed break-words">
                    {transcript || interimTranscript}
                    {interimTranscript && !transcript && <span className="animate-pulse">|</span>}
                  </p>
                </div>
              )}

              {/* Luna's reply */}
              <AnimatePresence>
                {lunaResponse && (state === 'speaking' || state === 'idle') && (
                  <motion.div
                    key="luna-reply"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 px-4 py-3 bg-safenet-primary-light/60 rounded-lg border border-safenet-primary/15 text-left"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-safenet-primary mb-1">Luna</p>
                    <p className="text-sm text-safenet-text leading-relaxed break-words">
                      {lunaResponse}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Mic button (only for languages we can transcribe: English, isiZulu) */}
              {micEnabled ? (
                <div className="flex justify-center mb-4">
                  <motion.button
                    onClick={handleMicClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-safenet-md ${
                      sessionActive
                        ? 'bg-safenet-danger text-white'
                        : 'bg-safenet-primary text-white'
                    }`}
                  >
                    {sessionActive ? (
                      <MicOff className="w-7 h-7" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </motion.button>
                </div>
              ) : (
                <p className="text-sm text-safenet-text-3 mb-4">
                  Type or tap a question below. Luna replies in {activeLang.native}.
                </p>
              )}

              {/* Browser support note */}
              {micEnabled && !browserSupported && (
                <p className="text-xs text-safenet-accent mb-3">
                  Best experienced in Chrome on desktop or Android.
                </p>
              )}

              {/* Controls row */}
              <div className="flex items-center justify-center gap-3">
                {/* Language picker */}
                <div ref={langRef} className="relative">
                  <button
                    onClick={() => setLangOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={langOpen}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-safenet-surface border border-safenet-border text-xs font-medium text-safenet-text-2 hover:text-safenet-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safenet-primary/40"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {activeLang.native}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.ul
                        role="listbox"
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 max-h-72 overflow-y-auto bg-white rounded-card border border-safenet-border shadow-safenet-lg py-1.5 z-20"
                      >
                        {LUNA_LANGUAGES.map((l) => (
                          <li key={l.code} role="option" aria-selected={l.code === language}>
                            <button
                              onClick={() => handleLanguageSelect(l.code)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-safenet-primary-light ${
                                l.code === language ? 'text-safenet-primary font-semibold' : 'text-safenet-text-2'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {l.native}
                                {!l.canVoice && (
                                  <span className="text-[10px] font-medium text-safenet-text-3 uppercase tracking-wide">text</span>
                                )}
                              </span>
                              {l.code === language && <Check className="w-4 h-4 flex-shrink-0" />}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

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
              {LUNA_SUGGESTIONS.map((q, i) => {
                const text = getSuggestion(q, language)
                const Icon = iconMap[q.icon] || Sparkles
                return (
                  <button
                    key={q.id}
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

          {/* About section for SEO depth */}
          <div className="max-w-3xl mx-auto mt-12 px-4">
            <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 lg:p-8">
              <h2 className="font-display text-heading-lg text-safenet-text mb-4">What is SafeNet SA and how does it protect your child?</h2>
              <div className="text-sm text-safenet-text-2 leading-relaxed space-y-3">
                <p>
                  SafeNet SA is South Africa's first AI-powered child digital safety platform. At its heart is Luna - a guardian AI that runs on your child's Android phone, monitoring WhatsApp, TikTok, and Instagram for cyberbullying, grooming, and harmful content. Every link is scanned before your child taps it, blocking fake SASSA phishing sites, adult content, and malicious downloads instantly.
                </p>
                <p>
                  What makes SafeNet different from global parental control apps? Luna speaks Zulu and understands South African cultural context. She detects threats across all 11 official languages - including cyberbullying in Zulu slang, grooming in Afrikaans, and phishing scams in Sesotho. According to <a href="https://www.childlinesa.org.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">Childline South Africa</a>, online grooming cases have risen sharply, with perpetrators using indigenous languages to target children. <a href="https://www.unicef.org/southafrica/reports" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">UNICEF South Africa</a> reports that 1 in 3 SA children face cyberbullying.
                </p>
                <p>
                  Luna processes everything on-device - meaning message content never leaves your child's phone. Parents receive only threat alerts with the threat category and severity level, never the actual chat content. This makes SafeNet fully <strong className="text-safenet-text">POPIA compliant by architecture</strong>. You can <Link to="/how-it-works" className="text-safenet-primary font-medium hover:underline">see exactly how it works</Link>, or <Link to="/demo" className="text-safenet-primary font-medium hover:underline">watch Luna catch a threat in real time</Link>.
                </p>
              </div>
            </div>
          </div>

        </main>

        <Footer />
      </div>
    </>
  )
}
