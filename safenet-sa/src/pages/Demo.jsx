import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, RotateCcw, Globe, AlertTriangle, Check, Link as LinkIcon, Smartphone, MapPin, Languages, Mic } from 'lucide-react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import AlertCard from '../components/ui/AlertCard'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'

// English demo messages — extended with more context
const enMessages = [
  { from: 'Thabo', text: 'yo guys did u see sipho presentation lmao 😭', delay: 1.5 },
  { from: 'Aisha', text: 'hahaha it was SO bad 💀💀', delay: 3.5 },
  { from: 'Thabo', text: 'bro nobody even likes you at school', delay: 5.5 },
  { from: 'Thabo', text: 'you should just stay home and disappear', delay: 7.5 },
]

// Zulu demo messages
const zuMessages = [
  { from: 'Thabo', text: 'Sawubona bantu, nibonile uSipho namhlanje? 😭', delay: 1.5 },
  { from: 'Aisha', text: 'Yebo, wahleka wonke umuntu 💀', delay: 3.5 },
  { from: 'Thabo', text: 'Akekho okunakekela wena esikoleni', delay: 5.5 },
  { from: 'Thabo', text: 'Ungcono uhlale ekhaya ungabonakali', delay: 7.5 },
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
        {isFlagged && (
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[9px] font-semibold text-safenet-text-3">{message.from}</span>
            <span className="text-[8px] text-red-500 font-bold">⚠️ Flagged</span>
          </div>
        )}
        <span>{message.text}</span>
      </div>
    </div>
  )
}

function TypingDots({ letter }) {
  return (
    <div className="flex items-center gap-2 mb-3 ml-8">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
        {letter || 'A'}
      </div>
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-2xl rounded-bl-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
      </div>
    </div>
  )
}

function PhoneScreen({ screenState, messages, showTypingAisha, showTypingThabo, flaggedMessageIndex, showBanner, isZu, showLunaPower }) {
  const lunaDotRef = useRef(null)

  useEffect(() => {
    if (!lunaDotRef.current) return
    if (showBanner) {
      gsap.to(lunaDotRef.current, {
        backgroundColor: '#EF4444',
        boxShadow: '0 0 8px rgba(239,68,68,0.6)',
        scale: 1.3,
        duration: 0.3,
        ease: 'power2.out',
      })
    } else {
      gsap.to(lunaDotRef.current, {
        backgroundColor: '#0F7B4D',
        boxShadow: '0 0 4px rgba(15,123,77,0.4)',
        scale: 1,
        duration: 0.3,
      })
    }
  }, [showBanner])

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
          <motion.div key="whatsapp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden bg-white relative">
            {/* Banner overlay */}
            <AnimatePresence>
              {showBanner && (
                <motion.div
                  initial={{ y: -60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -60, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-safenet-danger to-red-500 text-white text-[11px] font-semibold text-center py-2.5 shadow-lg rounded-t-[36px] flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  🛡️ Luna blocked a threat
                </motion.div>
              )}
            </AnimatePresence>

            {/* WhatsApp header */}
            <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
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

              {showTypingAisha && <TypingDots letter="A" />}
              {showTypingThabo && <TypingDots letter="T" />}
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 px-3 pb-2 pt-1 bg-[#ECE5DD]">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-200">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 text-[11px] text-gray-400">Message</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a6 6 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}

        {screenState === 'luna-power' && (
          <motion.div key="luna-power" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-gradient-to-b from-safenet-primary-light/30 via-white to-safenet-surface px-4 overflow-y-auto">
            {/* Header */}
            <div className="pt-6 pb-3 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-12 h-12 rounded-full bg-safenet-primary flex items-center justify-center mx-auto mb-3 shadow-lg"
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-sm font-bold text-safenet-text">Luna Intercepted</h3>
              <p className="text-[9px] text-safenet-text-3 mt-0.5">WhatsApp · 0.3s response</p>
            </div>

            {/* Blocked message quote */}
            <div className="bg-white rounded-xl border border-safenet-border p-3 mb-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0 mt-0.5">T</div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[8px] font-semibold text-safenet-text-3">Thabo</span>
                    <span className="text-[7px] text-red-500 font-bold">⚠️ Flagged</span>
                  </div>
                  <p className="text-[10px] text-safenet-text leading-relaxed">{isZu ? '"Ungcono uhlale ekhaya ungabonakali"' : '"...just stay home and disappear"'}</p>
                </div>
              </div>
            </div>

            {/* Capability badges - always visible in luna-power state */}
            <div className="text-center mb-2">
              <span className="text-[8px] font-semibold text-safenet-text-3 uppercase tracking-wider">Luna also monitors</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { icon: LinkIcon, label: 'Link Scanner', color: 'text-safenet-primary', bg: 'bg-safenet-primary-light' },
                { icon: Smartphone, label: 'Screen Time', color: 'text-safenet-accent', bg: 'bg-safenet-accent-light' },
                { icon: MapPin, label: 'Location', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: Languages, label: '11 Languages', color: 'text-purple-500', bg: 'bg-purple-50' },
              ].map((cap) => {
                const CapIcon = cap.icon
                return (
                  <motion.div
                    key={cap.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className={`${cap.bg} rounded-lg px-2.5 py-2 flex items-center gap-2`}
                  >
                    <div className={`w-6 h-6 rounded-full ${cap.bg} flex items-center justify-center`}>
                      <CapIcon className={`w-3.5 h-3.5 ${cap.color}`} />
                    </div>
                    <span className={`text-[9px] font-medium ${cap.color}`}>{cap.label}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Zulu badge */}
            <div className="bg-gradient-to-r from-safenet-primary/10 to-safenet-primary-light/50 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-safenet-primary/20">
              <span className="text-lg">🇿🇦</span>
              <div>
                <p className="text-[10px] font-semibold text-safenet-text">Detects threats in 11 official languages</p>
                <p className="text-[8px] text-safenet-text-3">Including isiZulu, Sesotho, Afrikaans & more</p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-auto pt-2 pb-4 text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-safenet-primary rounded-full shadow-md">
                <Check className="w-3 h-3 text-white" />
                <span className="text-[8px] font-semibold text-white">Always watching. Always safe.</span>
              </div>
            </div>
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
  const [showCapabilities, setShowCapabilities] = useState(false)
  const [showConclusion, setShowConclusion] = useState(false)
  const [showZuluBadge, setShowZuluBadge] = useState(false)
  const [showZuluDemo, setShowZuluDemo] = useState(false)
  const [showFinalCTA, setShowFinalCTA] = useState(false)
  const [scanCount, setScanCount] = useState(2847)
  const [replayKey, setReplayKey] = useState(0)
  const [timelinePhase, setTimelinePhase] = useState('')

  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  const phoneRef = useRef(null)
  const alertRef = useRef(null)
  const resultRef = useRef(null)
  const statsRef = useRef(null)
  const capabilitiesRef = useRef(null)
  const conclusionRef = useRef(null)
  const zuluDemoRef = useRef(null)
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

  // Demo timeline — uses state changes only (no direct GSAP on refs during timeline)
  const runTimeline = useCallback(() => {
    // Reset all state
    msgCountRef.current = 0
    setScreenState('home')
    setMessages([])
    setShowTypingAisha(false)
    setShowTypingThabo(false)
    setFlaggedMessageIndex(-1)
    setShowBanner(false)
    setShowAlert(false)
    setShowResult(false)
    setShowCapabilities(false)
    setShowConclusion(false)
    setShowZuluBadge(false)
    setShowZuluDemo(false)
    setShowFinalCTA(false)
    setTimelinePhase('')

    const tl = gsap.timeline()

    // Phase 1: Entrance (0-1.5s)
    tl.to(phoneRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0)
    tl.add(() => setTimelinePhase('entrance'), 0)

    // Phase 2: WhatsApp opens (1.5s)
    tl.add(() => {
      setScreenState('whatsapp')
      setTimelinePhase('chat')
    }, 1.8)

    // Phase 3: Chat messages arrive (3-10s)
    tl.add(() => {
      msgCountRef.current++
      setMessages(prev => [...prev, { from: 'Thabo', text: msgData[0].text }])
    }, 3.0)

    tl.add(() => setShowTypingAisha(true), 4.0)
    tl.add(() => setShowTypingAisha(false), 4.7)

    tl.add(() => {
      msgCountRef.current++
      setMessages(prev => [...prev, { from: 'Aisha', text: msgData[1].text }])
    }, 5.0)

    tl.add(() => setShowTypingThabo(true), 6.5)
    tl.add(() => setShowTypingThabo(false), 7.2)

    tl.add(() => {
      msgCountRef.current++
      setMessages(prev => [...prev, { from: 'Thabo', text: msgData[2].text }])
    }, 7.5)

    // Phase 4: The big bullying message + flagging (10s)
    tl.add(() => setShowTypingThabo(true), 9.0)
    tl.add(() => setShowTypingThabo(false), 9.7)

    tl.add(() => {
      msgCountRef.current++
      const newIdx = msgCountRef.current - 1
      setMessages(prev => [...prev, { from: 'Thabo', text: msgData[3].text }])
      setFlaggedMessageIndex(newIdx)
    }, 10.0)

    // Phase 5: Alert fires — banner + AlertCard (10.5s)
    tl.add(() => {
      setShowBanner(true)
      setShowAlert(true)
      setTimelinePhase('alert')
    }, 10.5)

    // Phase 6: Phone transitions to Luna Power screen (14s)
    tl.add(() => {
      setScreenState('luna-power')
      setTimelinePhase('luna-power')
    }, 14.0)

    // Phase 7: Right side capabilities appear (16s-22s)
    tl.add(() => {
      setShowCapabilities(true)
    }, 16.5)

    // Phase 8: Result text (22s)
    tl.add(() => {
      setShowResult(true)
      setTimelinePhase('result')
    }, 22.0)

    // Phase 9: Zulu demo starts — show that Luna works in Zulu too (28s)
    tl.add(() => {
      setShowZuluDemo(true)
      setTimelinePhase('zulu-demo')
    }, 28.0)

    // Phase 10: Bilingual conclusion (35s)
    tl.add(() => {
      setShowConclusion(true)
      setTimelinePhase('conclusion')
    }, 35.0)

    // Phase 11: Final CTA buttons (42s)
    tl.add(() => {
      setShowFinalCTA(true)
      setTimelinePhase('complete')
    }, 42.0)
  }, [msgData])

  // GSAP animations that fire AFTER state changes flush to DOM
  useEffect(() => {
    if (!showAlert) return
    const timer = setTimeout(() => {
      if (alertRef.current) {
        gsap.fromTo(alertRef.current, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.4)' })
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [showAlert])

  useEffect(() => {
    if (!showResult) return
    const timer = setTimeout(() => {
      if (resultRef.current) {
        gsap.fromTo(resultRef.current.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out' })
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [showResult])

  useEffect(() => {
    if (!showCapabilities) return
    const timer = setTimeout(() => {
      if (capabilitiesRef.current?.children) {
        gsap.fromTo(capabilitiesRef.current.children, { opacity: 0, y: 16 }, {
          opacity: 1, y: 0, stagger: 0.15, duration: 0.4, ease: 'power2.out',
        })
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [showCapabilities])

  useEffect(() => {
    if (!showConclusion) return
    const timer = setTimeout(() => {
      if (conclusionRef.current) {
        gsap.fromTo(conclusionRef.current, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        })
        gsap.fromTo(conclusionRef.current.querySelectorAll('[data-animate]'), { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out', delay: 0.3,
        })
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [showConclusion])

  useEffect(() => {
    if (!showZuluDemo) return
    const timer = setTimeout(() => {
      if (zuluDemoRef.current) {
        gsap.fromTo(zuluDemoRef.current, { opacity: 0, scale: 0.9 }, {
          opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
        })
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [showZuluDemo])

  // Run timeline on mount and on language switch
  useEffect(() => {
    const timer = setTimeout(() => {
      runTimeline()
    }, 600)
    return () => clearTimeout(timer)
  }, [replayKey, runTimeline])

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

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zu' : 'en')
  }

  return (
    <>
      <SEO
        title="Live Demo — SafeNet SA"
        description="Watch Luna detect and block cyberbullying in real time. See SafeNet SA's threat detection in action across all 11 SA languages."
        canonicalPath="/demo"
      />
      <div className="min-h-screen bg-[#F4F6F5]">
        <Nav />

        <main ref={sectionRef} className="pt-24 pb-16 px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h1 ref={headingRef} className="font-display text-display-sm sm:text-display-md text-safenet-text mb-4">
              See Luna in Action
            </h1>
            <p className="text-base text-safenet-text-2 max-w-lg mx-auto mb-6">
              Watch how Luna detects and blocks cyberbullying on WhatsApp — in under a second. Then see everything else Luna can do.
            </p>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-safenet-primary-light text-safenet-primary text-sm font-medium hover:bg-safenet-primary/20 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {isZu ? '🇿🇦 Watch in English' : '🇿🇦 Watch in Zulu'}
              </button>
              <button
                onClick={handleReplay}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-safenet-border text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors shadow-safenet-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Replay Demo
              </button>
              {timelinePhase && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-safenet-surface text-xs text-safenet-text-3 border border-safenet-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-safenet-primary animate-pulse" />
                  {timelinePhase === 'entrance' && 'Starting...'}
                  {timelinePhase === 'chat' && 'Chat loading...'}
                  {timelinePhase === 'alert' && '⚡ Threat detected!'}
                  {timelinePhase === 'luna-power' && '🛡️ Luna intercepted'}
                  {timelinePhase === 'result' && '✓ Threat blocked'}
                  {timelinePhase === 'zulu-demo' && '🇿🇦 Zulu detection'}
                  {timelinePhase === 'conclusion' && '✨ Luna\'s full power'}
                  {timelinePhase === 'complete' && '✅ Demo complete'}
                </span>
              )}
            </div>
          </div>

          {/* Main demo area */}
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-10 lg:gap-14">
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
                      isZu={isZu}
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

            {/* Right panel */}
            <div className="flex-1 w-full max-w-md mx-auto lg:mx-0 space-y-4">
              {/* Monitoring card */}
              <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow" />
                  <h3 className="font-display text-heading-sm text-safenet-text">Luna Monitoring</h3>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🟢</span>
                    <span className="text-sm font-medium text-safenet-text">Active</span>
                    <span className="text-sm text-safenet-text-3">— watching WhatsApp</span>
                  </div>
                </div>

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

              {/* Capabilities showcase — appears after alert */}
              <AnimatePresence>
                {showCapabilities && (
                  <motion.div
                    key="capabilities"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="text-center">
                      <span className="text-xs font-semibold text-safenet-text-3 uppercase tracking-wider">What else Luna protects</span>
                    </div>
                    <div ref={capabilitiesRef} className="space-y-3">
                      {/* Link Scanner */}
                      <div className="bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-safenet-primary-light flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="w-5 h-5 text-safenet-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-safenet-text">Link Scanner</h4>
                          <p className="text-xs text-safenet-text-3">Scans every URL before your child taps — phishing, scams, blocked.</p>
                        </div>
                      </div>

                      {/* Screen Time */}
                      <div className="bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-safenet-accent-light flex items-center justify-center flex-shrink-0">
                          <Smartphone className="w-5 h-5 text-safenet-accent" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-safenet-text">Screen Time Controls</h4>
                          <p className="text-xs text-safenet-text-3">Set limits, view daily usage, manage app access remotely.</p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-safenet-text">Location Alerts</h4>
                          <p className="text-xs text-safenet-text-3">Know when your child arrives at school or leaves a safe zone.</p>
                        </div>
                      </div>

                      {/* Voice / AI */}
                      <div className="bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Mic className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-safenet-text">Voice AI Guardian</h4>
                          <p className="text-xs text-safenet-text-3">Talk to Luna in English or Zulu. Ask anything about your child's safety.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Zulu Detection Demo Section */}
          <AnimatePresence>
            {showZuluDemo && (
              <motion.section
                key="zulu-demo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto mt-12"
              >
                <div ref={zuluDemoRef} className="bg-white rounded-card-2xl shadow-safenet-lg border border-safenet-border overflow-hidden">
                  <div className="bg-gradient-to-r from-safenet-primary/5 via-safenet-primary-light/20 to-purple-50 p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Left: Zulu badge + text */}
                      <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-safenet-primary shadow-sm mb-4 border border-safenet-border">
                          <span className="text-lg">🇿🇦</span>
                          Bilingual AI
                        </div>
                        <h3 className="font-display text-heading-lg text-safenet-text mb-3">
                          Luna speaks isiZulu too
                        </h3>
                        <p className="text-base text-safenet-text-2 leading-relaxed mb-4">
                          Luna understands and detects threats in all 11 official South African languages — not just English. 
                          Cyberbullying in isiZulu, phishing in Afrikaans, scams in Sesotho — Luna catches them all.
                        </p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                          {['English', 'isiZulu', 'Afrikaans', 'isiXhosa', 'Sesotho', 'Setswana', 'Sepedi', 'Tshivenḓa', 'Xitsonga', 'siSwati', 'isiNdebele'].map((langName) => (
                            <span key={langName} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-[11px] font-medium text-safenet-text-2 border border-safenet-border/50 shadow-sm">
                              ✓ {langName}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Mini phone with Zulu messages */}
                      <div className="flex-shrink-0">
                        <div className="relative" style={{ width: 180, height: 340 }}>
                          <div className="absolute inset-0 bg-[#F0F2F1] rounded-[28px]" style={{ boxShadow: '0 0 0 2px #D1D5DB, 0 12px 40px rgba(0,0,0,0.12)' }}>
                            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-[#1A1A1A] rounded-[14px] z-20" />
                            <div className="absolute top-[8px] left-[8px] right-[8px] bottom-[8px] bg-white rounded-[22px] overflow-hidden">
                              {/* Zulu WhatsApp content */}
                              <div className="bg-[#075E54] px-3 py-1.5 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[6px] font-bold">T</div>
                                <span className="text-[9px] font-semibold text-white">Sipho's Class</span>
                              </div>
                              <div className="bg-[#ECE5DD] p-2 h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc6\' fill-opacity=\'0.25\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                                <div className="flex items-start gap-1.5 mb-2">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[5px] font-bold flex-shrink-0">T</div>
                                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-2 py-1 max-w-[75%]">
                                    <span className="text-[8px] text-safenet-text">Ungcono uhlale ekhaya</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[5px] font-bold flex-shrink-0">T</div>
                                  <div className="bg-red-50 rounded-2xl rounded-bl-sm px-2 py-1 max-w-[75%] border-l-[2px] border-safenet-danger">
                                    <span className="text-[8px] text-safenet-text"><span className="text-red-500 font-bold">⚠️</span> ungabonakali</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

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

          {/* Bilingual Conclusion Section */}
          <AnimatePresence>
            {showConclusion && (
              <motion.section
                key="conclusion"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto mt-16"
              >
                <div ref={conclusionRef}>
                  <div className="bg-white rounded-card-2xl shadow-safenet-lg border border-safenet-border overflow-hidden">
                    {/* English section */}
                    <div className="p-8 lg:p-12 text-center border-b border-safenet-border/50">
                      <div className="w-14 h-14 rounded-full bg-safenet-primary-light flex items-center justify-center mx-auto mb-5">
                        <Shield className="w-7 h-7 text-safenet-primary" />
                      </div>
                      <h2 className="font-display text-display-sm sm:text-display-md text-safenet-text mb-4">
                        Luna is always watching.<br />
                        <span className="text-safenet-primary">Always protecting.</span>
                      </h2>
                      <p className="text-base text-safenet-text-2 max-w-lg mx-auto leading-relaxed mb-6">
                        From cyberbullying to phishing links, screen time to location safety — 
                        Luna is your family's complete digital guardian. 
                        <strong className="text-safenet-text"> Free to start. Ready in 5 minutes.</strong>
                      </p>
                      <div className="flex flex-wrap justify-center gap-3 mb-6">
                        {['WhatsApp', 'Instagram', 'TikTok', 'YouTube', 'Chrome'].map((platform) => (
                          <span
                            key={platform}
                            data-animate
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-safenet-surface rounded-full text-sm font-medium text-safenet-text-2 border border-safenet-border/50 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 text-safenet-primary" />
                            {platform}
                          </span>
                        ))}
                      </div>
                      {showFinalCTA && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-wrap justify-center gap-4"
                        >
                          <Link to="/auth">
                            <Button variant="primary" size="lg">
                              <Shield className="w-5 h-5" />
                              {isZu ? 'Qala Mahhala' : 'Get Started Free'}
                            </Button>
                          </Link>
                          <Link to="/how-it-works">
                            <Button variant="secondary" size="lg">
                              {isZu ? 'Funda Kabanzi' : 'Learn More'}
                            </Button>
                          </Link>
                        </motion.div>
                      )}
                    </div>

                    {/* Zulu section */}
                    <div className="p-8 lg:p-12 text-center bg-gradient-to-b from-safenet-primary/5 to-white">
                      <span className="text-4xl mb-4 block">🇿🇦</span>
                      <h2 className="font-display text-heading-lg sm:text-display-sm text-safenet-text mb-4">
                        ULuna uhlale ebhele.<br />
                        <span className="text-safenet-primary">Uhlale evikela.</span>
                      </h2>
                      <p className="text-base text-safenet-text-2 max-w-lg mx-auto leading-relaxed mb-6">
                        Kusukela ekuxhashazweni ku-inthanethi kuya kuzixhumanisi eziyingozi, 
                        isikhathi sesikrini nokuphepha kwendawo — uLuna ungumqaphi wakho ophelele. 
                        <strong className="text-safenet-text"> Mahhala ukuqala. Ilungile ngemizuzu emi-5.</strong>
                      </p>
                      {showFinalCTA && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex flex-wrap justify-center gap-4"
                        >
                          <Link to="/auth">
                            <Button variant="primary" size="lg">
                              <Shield className="w-5 h-5" />
                              {isZu ? 'Qala Mahhala' : 'Get Started Free'}
                            </Button>
                          </Link>
                          <Link to="/how-it-works">
                            <Button variant="secondary" size="lg">
                              {isZu ? 'Funda Kabanzi' : 'Learn More'}
                            </Button>
                          </Link>
                        </motion.div>
                      )}
                      <p className="mt-5 text-xs text-safenet-text-3">
                        🇿🇦 Built for South African families. POPIA compliant. <span className="text-safenet-primary font-medium">14-day free trial</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </>
  )
}
