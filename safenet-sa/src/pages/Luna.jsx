import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Sparkles, Globe, Shield, Activity, AlertTriangle, HelpCircle, ExternalLink, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
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

const lunaFaqItems = [
  {
    q: 'How does SafeNet protect my child on WhatsApp?',
    a: 'Luna monitors WhatsApp messages in real time using on-device AI. Every link is scanned before your child taps it - blocking phishing sites, fake SASSA scams, and adult content. Cyberbullying and grooming language is detected in under a second, and parents receive instant push notifications with the threat category. Message content never leaves the device. <LinkInternal to="/how-it-works">See how it works →</LinkInternal>',
  },
  {
    q: 'What is a honey trap and how does Luna detect it?',
    a: 'A honey trap is a grooming tactic where an adult poses as a child online to build trust with a minor, often using fake profiles on platforms like TikTok, Instagram, or WhatsApp. Luna is trained to detect grooming patterns - including inappropriate age-gap dynamics, secrecy requests, and sexual language - across English and isiZulu conversations. According to <ExternalLink href="https://www.childlinesa.org.za">Childline South Africa</ExternalLink>, honey trap cases have risen significantly in SA.',
  },
  {
    q: 'Is my child\'s privacy protected when Luna scans their messages?',
    a: 'Absolutely. SafeNet is fully POPIA compliant by architecture - not as an afterthought. All WhatsApp analysis runs entirely on your child\'s device using Luna AI. Message content never leaves the device and is never stored or transmitted. Parents see only threat alerts - not chat content. This on-device approach means SafeNet is the most privacy-respecting child safety solution available to South African families.',
  },
  {
    q: 'What languages does Luna speak?',
    a: 'Luna speaks English and isiZulu today, with all 11 official South African languages on the roadmap: Afrikaans, isiXhosa, Sesotho, Setswana, Sepedi, Tshivenḓa, Xitsonga, siSwati, and isiNdebele. You can ask Luna questions in either English or isiZulu - she understands and responds in the same language you use. <LinkInternal to="/how-it-works">Learn about Luna\'s language support →</LinkInternal>',
  },
  {
    q: 'Ngingakusebenzisa kanjani uSafeNet? (How do I use SafeNet?)',
    a: 'Ungaqala ngokulanda uhlelo lokusebenza lweSafeNet ku-Google Play Store, ufake inombolo yakho yocingo yaseNingizimu Afrika, bese uskena i-QR code efonini yengane yakho. Ngemva kwalokho, uLuna usebenza ngokuzenzakalelayo ekugadeni ingane yakho. <LinkInternal to="/how-it-works">Funda kabanzi →</LinkInternal>',
  },
]

const faqSchemaLuna = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: lunaFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a.replace(/<[^>]*>/g, ''),
    },
  })),
}

function LunaFAQAnswer({ text }) {
  const parts = text.split(/(<LinkInternal[^>]*>[^<]*<\/LinkInternal>|<ExternalLink[^>]*>[^<]*<\/ExternalLink>)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null
        const linkInternalMatch = part.match(/<LinkInternal to="([^"]+)">([^<]*)<\/LinkInternal>/)
        const externalLinkMatch = part.match(/<ExternalLink href="([^"]+)">([^<]*)<\/ExternalLink>/)
        if (linkInternalMatch) {
          return <Link key={i} to={linkInternalMatch[1]} className="text-safenet-primary font-medium hover:underline">{linkInternalMatch[2]}</Link>
        }
        if (externalLinkMatch) {
          return <a key={i} href={externalLinkMatch[1]} target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline inline-flex items-center gap-1">{externalLinkMatch[2]} <ExternalLink className="w-3 h-3" /></a>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function LunaFAQSection() {
  const [openIndex, setOpenIndex] = useState(null)
  const faqRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(faqRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: faqRef.current, start: 'top 85%', once: true },
      })
    }, faqRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={faqRef} className="bg-white py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-4">FAQ</span>
          <h2 className="font-display text-display-sm text-safenet-text max-w-xl mx-auto">Common questions about Luna and SafeNet SA</h2>
        </div>

        <div className="space-y-3">
          {lunaFaqItems.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className="bg-white rounded-card-lg border border-safenet-border overflow-hidden transition-shadow hover:shadow-safenet-sm">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-sm font-semibold text-safenet-text leading-snug pr-2">{item.q}</h3>
                  <HelpCircle className={`w-4 h-4 flex-shrink-0 text-safenet-text-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-sm text-safenet-text-2 leading-relaxed">
                    <LunaFAQAnswer text={item.a} />
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
          <Link to="/how-it-works" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ArrowRight className="w-3 h-3" />
            How SafeNet works
          </Link>
          <Link to="/demo" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ArrowRight className="w-3 h-3" />
            Watch the demo
          </Link>
          <a href="https://www.childlinesa.org.za" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ExternalLink className="w-3 h-3" />
            Childline SA
          </a>
          <a href="https://www.unicef.org/southafrica/reports" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ExternalLink className="w-3 h-3" />
            UNICEF SA
          </a>
        </div>
      </div>
    </section>
  )
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
        title="Talk to Luna - SafeNet SA Voice AI Guardian"
        description="Meet Luna, the AI guardian for South African families. Ask Luna about cyberbullying, grooming, honey traps, and online safety. Speaks English and isiZulu. Free to use."
        canonicalPath="/luna"
        jsonLd={[faqSchemaLuna]}
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

          {/* About section for SEO depth */}
          <div className="max-w-3xl mx-auto mt-12 px-4">
            <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 lg:p-8">
              <h2 className="font-display text-heading-lg text-safenet-text mb-4">What is SafeNet SA and how does it protect your child?</h2>
              <div className="text-sm text-safenet-text-2 leading-relaxed space-y-3">
                <p>
                  SafeNet SA is South Africa's first AI-powered child digital safety platform. At its heart is Luna - a guardian AI that runs on your child's Android phone, monitoring WhatsApp, TikTok, and Instagram for cyberbullying, grooming, and harmful content. Every link is scanned before your child taps it, blocking fake SASSA phishing sites, adult content, and malicious downloads instantly.
                </p>
                <p>
                  What makes SafeNet different from global parental control apps? Luna speaks isiZulu and understands South African cultural context. She detects threats across all 11 official languages - including cyberbullying in isiZulu slang, grooming in Afrikaans, and phishing scams in Sesotho. According to <a href="https://www.childlinesa.org.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">Childline South Africa</a>, online grooming cases have risen sharply, with perpetrators using indigenous languages to target children. <a href="https://www.unicef.org/southafrica/reports" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">UNICEF South Africa</a> reports that 1 in 3 SA children face cyberbullying.
                </p>
                <p>
                  Luna processes everything on-device - meaning message content never leaves your child's phone. Parents receive only threat alerts with the threat category and severity level, never the actual chat content. This makes SafeNet fully <strong className="text-safenet-text">POPIA compliant by architecture</strong>. You can <Link to="/how-it-works" className="text-safenet-primary font-medium hover:underline">see exactly how it works</Link>, or <Link to="/demo" className="text-safenet-primary font-medium hover:underline">watch Luna catch a threat in real time</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <LunaFAQSection />
        </main>

        <Footer />
      </div>
    </>
  )
}
