import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Instagram, Music2, MessageSquare, Ghost,
  ShieldCheck, BellRing, Link as LinkIcon, Lock, Clock, Phone, Check,
  Ban, WifiOff, PhoneCall, PhoneOff, X,
} from 'lucide-react'

const platforms = [
  { name: 'WhatsApp', Icon: MessageCircle, color: '#25D366' },
  { name: 'Instagram', Icon: Instagram, color: '#E1306C' },
  { name: 'TikTok', Icon: Music2, color: '#111827' },
  { name: 'Snapchat', Icon: Ghost, color: '#F59E0B' },
  { name: 'SMS', Icon: MessageSquare, color: '#0F7B4D' },
]

// Multiple flagged instances across different platforms
const threats = [
  { platform: 'WhatsApp', Icon: MessageCircle, color: '#25D366', type: 'Cyberbullying', text: '“nobody likes you, just disappear”', status: 'Blocked', time: '2m ago' },
  { platform: 'Instagram', Icon: Instagram, color: '#E1306C', type: 'Grooming attempt', text: '“don’t tell your mom about this”', status: 'Blocked', time: '14m ago' },
  { platform: 'SMS', Icon: MessageSquare, color: '#0F7B4D', type: 'Phishing link', text: 'sassa-verify.co.za', status: 'Link blocked', time: '1h ago' },
  { platform: 'TikTok', Icon: Music2, color: '#111827', type: 'Predatory DM', text: '“send a pic, our little secret”', status: 'Blocked', time: '3h ago' },
  { platform: 'Snapchat', Icon: Ghost, color: '#F59E0B', type: 'Scam / fake link', text: 'free-robux-now.link', status: 'Link blocked', time: '5h ago' },
]

const statusStyle = (status) =>
  status === 'Blocked'
    ? 'bg-safenet-danger-light text-safenet-danger'
    : 'bg-safenet-accent-light text-safenet-accent'

const pillars = [
  { Icon: LinkIcon, title: 'Blocks dangerous links', body: 'Phishing, scams and fake giveaways are stopped before your child can tap them.' },
  { Icon: ShieldCheck, title: 'Keeps children secure', body: 'Grooming, bullying and predatory messages are caught on-device, across every app.' },
  { Icon: BellRing, title: 'Real-time parent alerts', body: 'You are notified the moment a threat is found - on average within 0.3 seconds.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] } }),
}

export default function ProtectionShowcase() {
  // Demo-only parent actions (simulated; wired to the real app later)
  const [feedback, setFeedback] = useState(null) // { Icon, text }
  const [callStage, setCallStage] = useState(null) // 'ringing' | 'connected' | null
  const timersRef = useRef([])

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  useEffect(() => () => clearTimers(), [])

  const flash = (Icon, text) => {
    clearTimers()
    setFeedback({ Icon, text })
    timersRef.current.push(setTimeout(() => setFeedback(null), 3500))
  }

  const handleBlock = () => flash(Ban, 'TikTok blocked on Liam’s phone')
  const handlePause = () => flash(WifiOff, 'Internet paused for Liam')
  const handleCall = () => {
    clearTimers()
    setFeedback(null)
    setCallStage('ringing')
    timersRef.current.push(setTimeout(() => setCallStage('connected'), 1600))
  }
  const endCall = () => { clearTimers(); setCallStage(null) }

  return (
    <section className="max-w-6xl mx-auto mt-16 px-4">
      {/* Header */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-safenet-primary-light text-safenet-primary text-xs font-semibold tracking-wide uppercase mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Always-on protection
        </span>
        <h2 className="font-display text-heading-lg text-safenet-text mb-3">
          Luna protects on every app your child uses
        </h2>
        <p className="text-safenet-text-2 leading-relaxed">
          Not just WhatsApp. Luna watches across messaging and social platforms, blocks dangerous
          links, and alerts you in real time - so your child stays safe wherever they are online.
        </p>
      </motion.div>

      {/* Platform coverage row */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        className="flex flex-wrap items-center justify-center gap-3 mb-10"
      >
        {platforms.map((p) => (
          <div
            key={p.name}
            className="inline-flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full bg-white border border-safenet-border shadow-safenet-sm"
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
              <p.Icon className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-safenet-text">{p.name}</span>
            <Check className="w-3.5 h-3.5 text-safenet-primary" />
          </div>
        ))}
      </motion.div>

      {/* Main grid: live threat feed + parent alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Live threat feed - multiple flagged instances */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-safenet-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safenet-primary animate-pulse" />
              <h3 className="text-sm font-semibold text-safenet-text">Threats blocked today</h3>
            </div>
            <span className="text-xs font-semibold text-safenet-primary tabular-nums">5 of 5 handled</span>
          </div>

          <ul className="divide-y divide-safenet-border">
            {threats.map((t, i) => (
              <motion.li
                key={i}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: t.color }}>
                  <t.Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-safenet-text truncate">{t.type}</p>
                    <span className="text-[11px] text-safenet-text-3">· {t.platform}</span>
                  </div>
                  <p className="text-xs text-safenet-text-2 truncate">{t.text}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle(t.status)}`}>
                    <Lock className="w-3 h-3" />
                    {t.status}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-safenet-text-3 tabular-nums">
                    <Clock className="w-3 h-3" />
                    {t.time}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right: real-time parent alert + link blocking */}
        <div className="space-y-6">
          {/* Parent alert */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="relative bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-safenet-text">Parent gets a real-time alert</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-safenet-primary-light text-safenet-primary text-[11px] font-semibold tabular-nums">
                Delivered in 0.3s
              </span>
            </div>

            {/* Push notification mock */}
            <div className="rounded-card-lg bg-safenet-surface border border-safenet-border p-3.5 flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-safenet-primary flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-safenet-text">SafeNet SA</p>
                  <span className="text-[10px] text-safenet-text-3">now</span>
                </div>
                <p className="text-xs text-safenet-text-2 leading-snug mt-0.5">
                  Threat blocked on <span className="font-semibold text-safenet-text">Liam’s</span> WhatsApp -
                  cyberbullying detected and stopped. Tap to review.
                </p>
              </div>
            </div>

            {/* Quick actions (simulated for the demo) */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={handleBlock}
                className="inline-flex items-center justify-center gap-1.5 py-2 rounded-btn bg-safenet-surface border border-safenet-border text-safenet-text text-xs font-medium hover:bg-safenet-surface-2 active:scale-[0.97] transition"
              >
                <Ban className="w-3.5 h-3.5" /> Block app
              </button>
              <button
                onClick={handlePause}
                className="inline-flex items-center justify-center gap-1.5 py-2 rounded-btn bg-safenet-surface border border-safenet-border text-safenet-text text-xs font-medium hover:bg-safenet-surface-2 active:scale-[0.97] transition"
              >
                <WifiOff className="w-3.5 h-3.5" /> Pause net
              </button>
              <button
                onClick={handleCall}
                className="inline-flex items-center justify-center gap-1.5 py-2 rounded-btn bg-safenet-primary text-white text-xs font-medium hover:bg-safenet-primary-dark active:scale-[0.97] transition"
              >
                <Phone className="w-3.5 h-3.5" /> Call Liam
              </button>
            </div>

            {/* Action confirmation */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-safenet-primary-light text-safenet-primary text-xs font-medium w-full"
                >
                  <feedback.Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{feedback.text}</span>
                  <Check className="w-4 h-4 ml-auto" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulated call overlay */}
            <AnimatePresence>
              {callStage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 rounded-card-lg bg-safenet-text/95 flex flex-col items-center justify-center text-white p-5"
                >
                  <div className="w-16 h-16 rounded-full bg-safenet-primary flex items-center justify-center text-2xl font-bold mb-3">L</div>
                  <p className="text-base font-semibold">Liam</p>
                  <p className="text-xs text-white/70 mb-1">{callStage === 'ringing' ? 'Calling…' : 'Connected'}</p>
                  {callStage === 'ringing'
                    ? <PhoneCall className="w-5 h-5 text-safenet-primary-light mb-5 animate-pulse" />
                    : <span className="text-[11px] text-safenet-primary-light mb-5 tabular-nums">00:03</span>}
                  <button
                    onClick={endCall}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-safenet-danger text-white text-sm font-medium hover:opacity-90 active:scale-95 transition"
                  >
                    <PhoneOff className="w-4 h-4" /> End call
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Link blocking */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-5"
          >
            <h3 className="text-sm font-semibold text-safenet-text mb-3">Dangerous links are blocked</h3>
            <div className="flex items-center gap-3 rounded-card bg-safenet-danger-light border border-safenet-danger/20 px-3.5 py-3">
              <span className="w-9 h-9 rounded-lg bg-safenet-danger/10 flex items-center justify-center flex-shrink-0">
                <LinkIcon className="w-5 h-5 text-safenet-danger" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-mono text-safenet-danger line-through truncate">sassa-verify.co.za</p>
                <p className="text-[11px] text-safenet-text-2">Fake SASSA grant - phishing</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-safenet-danger text-white text-[11px] font-semibold flex-shrink-0">
                <Lock className="w-3 h-3" /> Blocked
              </span>
            </div>
            <p className="text-xs text-safenet-text-3 mt-3 leading-relaxed">
              Luna checks every link your child receives and blocks phishing, scams and fake giveaways before they open.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            custom={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            className="bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-5"
          >
            <span className="inline-flex w-10 h-10 rounded-xl bg-safenet-primary-light items-center justify-center mb-3">
              <p.Icon className="w-5 h-5 text-safenet-primary" />
            </span>
            <h4 className="text-sm font-semibold text-safenet-text mb-1">{p.title}</h4>
            <p className="text-xs text-safenet-text-2 leading-relaxed">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
