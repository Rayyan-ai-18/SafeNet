import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, RotateCcw, Globe, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import AlertCard from '../components/ui/AlertCard'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'

// English demo messages
const enMessages = [
  { from: 'Thabo', text: 'yo guys did u see sipho\'s presentation lmao 😭', delay: 3.0 },
  { from: 'Aisha', text: 'hahaha it was SO bad 💀💀', delay: 5.5 },
  { from: 'Thabo', text: 'bro nobody even likes you at school', delay: 8.0 },
  { from: 'Thabo', text: 'you should just stay home and disappear', delay: 10.5 },
]

// Zulu demo messages
const zuMessages = [
  { from: 'Thabo', text: 'Sawubona bantu, nibonile uSipho namhlanje? 😭', delay: 3.0 },
  { from: 'Aisha', text: 'Yebo, wahleka wonke umuntu 💀', delay: 5.5 },
  { from: 'Thabo', text: 'Akekho okunakekela wena esikoleni', delay: 8.0 },
  { from: 'Thabo', text: 'Ungcono uhlale ekhaya ungabonakali', delay: 10.5 },
]

const stats = [
  { value: '1 in 3', label: 'Face cyberbullying', description: 'South African children affected' },
  { value: '94', suffix: '%', label: 'On WhatsApp', description: 'SA smartphone users' },
  { value: '0.3', suffix: 's', label: 'Detection time', description: "Luna's average threat speed" },
  { value: '11', suffix: '', label: 'Languages', description: 'SA languages Luna speaks 🇿🇦' },
]

const PHONE_W = 280
const PHONE_H = 560

function MessageBubble({ message, isFlagged }) {
  return (
    <div className={`flex items-start gap-2 mb-3 ${message.from === 'you' ? 'justify-end' : 'justify-start'}`}>
      {message.from !== 'you' && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
          {message.from[0]}
        </div>
      )}
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
          isFlagged
            ? 'bg-red-50 border-l-[3px] border-safenet-danger rounded-bl-sm'
            : message.from === 'you'
              ? 'bg-safenet-primary text-white rounded-br-sm'
              : 'bg-gray-100 text-safenet-text rounded-bl-sm'
        }`}
      >
        {message.from !== 'you' && !isFlagged && (
          <div className="text-[9px] font-semibold text-safenet-text-3 mb-0.5">{message.from}</div>
        )}
        <span>{message.text}</span>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2 mb-3 ml-8">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
        A
      </div>
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-2xl rounded-bl-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
      </div>
    </div>
  )
}

function PhoneScreen({ screenState, messages, showTypingAisha, showTypingThabo, flaggedMessageIndex, showBanner }) {
  const lunaDotRef = useRef(null)

  useEffect(() => {
    if (!lunaDotRef.current) return
    if (screenState === 'threat') {
      gsap.to(lunaDotRef.current, {
        backgroundColor: '#EF4444',
        boxShadow: '0 0 8px rgba(239,68,68,0.6)',
        scale: 1.3,
        duration: 0.3,
        ease: 'power2.out',
      })
      setTimeout(() => {
        gsap.to(lunaDotRef.current, {
          backgroundColor: '#0F7B4D',
          boxShadow: '0 0 4px rgba(15,123,77,0.4)',
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          delay: 2,
        })
      }, 500)
    } else {
      gsap.to(lunaDotRef.current, {
        backgroundColor: '#0F7B4D',
        boxShadow: '0 0 4px rgba(15,123,77,0.4)',
        scale: 1,
        duration: 0.3,
      })
    }
  }, [screenState])

  return (
    <div className="h-full flex flex-col bg-white rounded-[36px] overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 text-[10px] text-safenet-text-3 font-mono">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-2">
          {/* Luna active dot */}
          <div
            ref={lunaDotRef}
            className="w-2 h-2 rounded-full bg-safenet-primary pulse-dot"
          />
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-2 border border-safenet-text-3 rounded-sm" />
            <span className="text-xs">●●●●</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screenState === 'home' && (
          <motion.div key="home" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 px-3 pb-3 overflow-hidden">
            {/* App header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] font-bold text-safenet-primary">SafeNet SA</div>
                <div className="text-[8px] text-safenet-text-3">Liam's phone</div>
              </div>
              <div className="w-7 h-7 rounded-full bg-safenet-primary flex items-center justify-center text-white text-[10px] font-bold">L</div>
            </div>

            {/* Status card */}
            <div className="bg-safenet-primary-light rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-safenet-primary pulse-glow" />
              <span className="text-[11px] font-medium text-safenet-primary">All children safe</span>
            </div>

            {/* Child card */}
            <div className="bg-white rounded-xl p-3 shadow-safenet-sm mb-2 flex items-center gap-3 border border-safenet-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-safenet-primary to-safenet-primary-dark flex items-center justify-center text-white text-sm font-bold">L</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-safenet-text">Liam</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-safenet-text-3">Online · 2h screen time</span>
                </div>
              </div>
              <div className="w-9 h-5 rounded-full bg-safenet-primary flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white" />
              </div>
            </div>

            {/* Warning card */}
            <div className="bg-white rounded-xl p-3 shadow-safenet-sm mb-2 border-l-[3px] border-safenet-accent">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-safenet-accent-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px]">⚠</span>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-safenet-text">Phishing blocked</div>
                  <div className="text-[9px] text-safenet-text-3 mt-0.5">Fake SASSA link blocked by Luna</div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div>
              <div className="text-[10px] font-semibold text-safenet-text-2 uppercase tracking-wider mb-1.5">Today's Activity</div>
              <div className="space-y-1.5">
                {[
                  { name: 'WhatsApp', time: '45 min', color: 'bg-safenet-primary', w: 'w-3/4', avatarBg: 'bg-green-100' },
                  { name: 'YouTube', time: '22 min', color: 'bg-safenet-accent', w: 'w-1/3', avatarBg: 'bg-red-100' },
                  { name: 'Chrome', time: '15 min', color: 'bg-blue-400', w: 'w-1/4', avatarBg: 'bg-blue-100' },
                ].map((app) => (
                  <div key={app.name} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-safenet-sm border border-safenet-border/50">
                    <div className={`w-6 h-6 rounded-lg ${app.avatarBg} flex items-center justify-center text-[10px] font-bold text-safenet-text`}>
                      {app.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-medium text-safenet-text">{app.name}</div>
                      <div className="text-[9px] text-safenet-text-3">{app.time}</div>
                    </div>
                    <div className="w-16 h-1.5 bg-safenet-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${app.color} ${app.w}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {screenState === 'whatsapp' && (
          <motion.div key="whatsapp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* WhatsApp header */}
            <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-3">
              <button className="text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">S</div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-white">Sipho's Class 💬</div>
                <div className="text-[9px] text-white/70">3 participants</div>
              </div>
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-[#ECE5DD] p-3 overflow-y-auto" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc6\' fill-opacity=\'0.25\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              <div className="bg-white/90 rounded-lg px-2.5 py-1.5 mb-4 text-center shadow-sm">
                <span className="text-[10px] text-safenet-text-3">Yesterday</span>
              </div>

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <MessageBubble message={msg} isFlagged={flaggedMessageIndex === i} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {showTypingAisha && <TypingDots />}

              {showBanner && (
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-safenet-danger to-red-500 text-white text-[11px] font-semibold text-center py-3 rounded-t-[36px] shadow-lg"
                >
                  🛡️ Luna blocked a threat
                </motion.div>
              )}

              {/* Input bar */}
              <div className="mt-auto pt-2">
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-200">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1 text-[11px] text-gray-400">Message</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screenState === 'blocked' && (
          <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-safenet-danger-light flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 text-safenet-danger" />
            </motion.div>
            <h3 className="text-base font-bold text-safenet-text mb-2">Threat Blocked</h3>
            <p className="text-[11px] text-safenet-text-2 text-center leading-relaxed">
              Luna detected and blocked harmful content. Your child is safe.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Demo() {
  const [lang, setLang] = useState('en')
  const [screenState, setScreenState] = useState('home')
  const [messages, setMessages] = useState([])
  const [showTypingAisha, setShowTypingAisha] = useState(false)
  const [showTypingThabo, setShowTypingThabo] = useState(false)
  const [flaggedMessageIndex, setFlaggedMessageIndex] = useState(-1)
  const [showBanner, setShowBanner] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [scanCount, setScanCount] = useState(2847)
  const [replayKey, setReplayKey] = useState(0)

  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  const phoneRef = useRef(null)
  const alertRef = useRef(null)
  const resultRef = useRef(null)
  const statsRef = useRef(null)
  const scanIntervalRef = useRef(null)

  const isZu = lang === 'zu'
  const msgData = isZu ? zuMessages : enMessages

  // Scan counter ticker
  useEffect(() => {
    scanIntervalRef.current = setInterval(() => {
      setScanCount(prev => prev + 1)
    }, 2000)
    return () => clearInterval(scanIntervalRef.current)
  }, [])

  const msgCountRef = useRef(0)

  // Demo timeline
  const runTimeline = useCallback(() => {
    // Reset
    msgCountRef.current = 0
    setScreenState('home')
    setMessages([])
    setShowTypingAisha(false)
    setShowTypingThabo(false)
    setFlaggedMessageIndex(-1)
    setShowBanner(false)
    setShowAlert(false)
    setShowResult(false)

    const tl = gsap.timeline({
      onComplete: () => {
        setShowResult(true)
      },
    })

    // Entrance
    tl.add(() => setScreenState('home'))
    tl.to(phoneRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0)

    // t=1.5s — Open WhatsApp
    tl.add(() => setScreenState('whatsapp'), 1.5)

    // t=3.0s — Thabo first message
    tl.add(() => {
      msgCountRef.current++
      setMessages(prev => [...prev, { from: 'Thabo', text: msgData[0].text }])
    }, 3.0)

    // t=4.5s — Aisha typing
    tl.add(() => setShowTypingAisha(true), 4.5)
    tl.add(() => setShowTypingAisha(false), 5.2)

    // t=5.5s — Aisha message
    tl.add(() => {
      msgCountRef.current++
      setMessages(prev => [...prev, { from: 'Aisha', text: msgData[1].text }])
    }, 5.5)

    // t=7.0s — Thabo typing
    tl.add(() => setShowTypingThabo(true), 7.0)
    tl.add(() => setShowTypingThabo(false), 7.7)

    // t=8.0s — Thabo first bullying
    tl.add(() => {
      msgCountRef.current++
      setMessages(prev => [...prev, { from: 'Thabo', text: msgData[2].text }])
    }, 8.0)

    // t=9.5s — Thabo typing again
    tl.add(() => setShowTypingThabo(true), 9.5)
    tl.add(() => setShowTypingThabo(false), 10.2)

    // t=10.5s — Second bullying (the big one)
    tl.add(() => {
      msgCountRef.current++
      const newIdx = msgCountRef.current - 1
      setMessages(prev => [...prev, { from: 'Thabo', text: msgData[3].text }])
      setFlaggedMessageIndex(newIdx)
      setScreenState('threat')
    }, 10.5)

    // t=11.0s — Alert fires
    tl.add(() => {
      setShowBanner(true)
      setShowAlert(true)
      if (alertRef.current) {
        gsap.fromTo(alertRef.current, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.4)' })
      }
    }, 11.0)

    // t=13.5s — Return to green
    tl.add(() => {
      setScreenState('blocked')
    }, 13.5)

    // t=14.0s — Result text
    tl.add(() => {
      setShowResult(true)
      if (resultRef.current) {
        gsap.fromTo(resultRef.current.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out' })
      }
    }, 14.0)
  }, [msgData])

  // Run timeline on mount and on language switch
  useEffect(() => {
    const timer = setTimeout(() => {
      runTimeline()
    }, 500)
    return () => clearTimeout(timer)
  }, [replayKey, lang])

  // GSAP ScrollTrigger for entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
      gsap.fromTo(statsRef.current?.children || [], { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: statsRef.current, start: 'top 85%', once: true },
      })
    })
    return () => ctx.revert()
  }, [])

  const handleReplay = () => {
    setReplayKey(k => k + 1)
  }

  return (
    <>
      <SEO
        title="Live Demo — SafeNet SA"
        description="Watch Luna detect and block cyberbullying in real time. See SafeNet SA's threat detection in action."
        canonicalPath="/demo"
      />
      <div className="min-h-screen bg-[#F4F6F5]">
        <Nav />

        <main ref={sectionRef} className="pt-24 pb-16 px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 ref={headingRef} className="font-display text-display-sm sm:text-display-md text-safenet-text mb-3">
              See Luna in Action
            </h1>
            <p className="text-base text-safenet-text-2 max-w-lg mx-auto mb-4">
              Watch how Luna detects and blocks cyberbullying in real time — in under a second.
            </p>

            {/* Language toggle */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setLang(lang === 'en' ? 'zu' : 'en')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-safenet-primary-light text-safenet-primary text-sm font-medium hover:bg-safenet-primary/20 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {isZu ? '🇿🇦 Watch in English' : '🇿🇦 Watch in Zulu'}
              </button>
              <button
                onClick={handleReplay}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-safenet-border text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors shadow-safenet-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Replay Demo
              </button>
            </div>
          </div>

          {/* Main demo area: two columns */}
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
            {/* Left: Phone mockup */}
            <div ref={phoneRef} className="flex-shrink-0 mx-auto lg:mx-0">
              <div
                className="relative"
                style={{ width: PHONE_W, height: PHONE_H }}
              >
                {/* Phone frame */}
                <div
                  className="absolute inset-0 bg-[#F0F2F1] rounded-[44px]"
                  style={{
                    boxShadow: '0 0 0 2px #D1D5DB, 0 20px 60px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.8)',
                  }}
                >
                  {/* Dynamic island */}
                  <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-[#1A1A1A] rounded-[20px] z-20" />

                  {/* Screen area */}
                  <div className="absolute top-[12px] left-[12px] right-[12px] bottom-[12px] bg-white rounded-[36px] overflow-hidden">
                    <PhoneScreen
                      screenState={screenState}
                      messages={messages}
                      showTypingAisha={showTypingAisha}
                      showTypingThabo={showTypingThabo}
                      flaggedMessageIndex={flaggedMessageIndex}
                      showBanner={showBanner}
                    />
                  </div>
                </div>
              </div>

              {/* Result text below phone */}
              <div ref={resultRef} className="text-center mt-6">
                {showResult && (
                  <>
                    <p className="font-display text-heading-sm text-safenet-text">
                      Luna caught this in 0.3 seconds.
                    </p>
                    <p className="text-sm text-safenet-text-2 mt-1">
                      {isZu ? 'Ngaphambi kokuba uLiam alimale.' : 'Before Liam could be hurt.'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right: Dashboard */}
            <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
              {/* Monitoring card */}
              <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow" />
                  <h3 className="font-display text-heading-sm text-safenet-text">Luna Monitoring</h3>
                </div>

                {/* Status row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🟢</span>
                    <span className="text-sm font-medium text-safenet-text">Active</span>
                    <span className="text-sm text-safenet-text-3">— watching WhatsApp</span>
                  </div>
                </div>

                {/* Scan counter */}
                <div className="flex items-center gap-2 px-3 py-2 bg-safenet-primary-light rounded-lg">
                  <Shield className="w-4 h-4 text-safenet-primary" />
                  <span className="text-sm font-medium text-safenet-primary">
                    {scanCount.toLocaleString()} scans today
                  </span>
                </div>
              </div>

              {/* Alert feed */}
              <div className="space-y-3">
                <AnimatePresence>
                  {!showAlert && (
                    <motion.div
                      key="no-threats"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-4 text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-safenet-primary-light flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-5 h-5 text-safenet-primary" />
                      </div>
                      <p className="text-sm font-medium text-safenet-text">No threats detected today ✓</p>
                      <p className="text-xs text-safenet-text-3 mt-1">All children are safe</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showAlert && (
                    <div ref={alertRef}>
                      <AlertCard
                        severity="high"
                        title="LUNA ALERT"
                        description={isZu ? 'Ukuxhashazwa okulotholwe uLuna' : 'Cyberbullying detected'}
                        timestamp="WhatsApp · Just now"
                        threatLevel={94}
                        threatText={isZu ? '"Ungcono uhlale ekhaya ungabonakali"' : '"...stay home and disappear"'}
                        actions={[
                          { label: 'Review', variant: 'primary', onClick: () => {} },
                          { label: 'Call Liam', variant: 'secondary', onClick: () => {} },
                        ]}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div ref={statsRef} className="max-w-5xl mx-auto mt-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  description={stat.description}
                  suffix={stat.suffix || ''}
                />
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
