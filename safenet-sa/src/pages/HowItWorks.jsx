import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Smartphone, Link as LinkIcon, AlertTriangle, ThumbsUp, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../lib/gsap'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'

const steps = [
  {
    icon: Smartphone,
    iconBg: 'bg-safenet-primary-light',
    iconColor: 'text-safenet-primary',
    title: 'Install SafeNet in 30 seconds',
    desc: 'Parent downloads the app from the Google Play Store or Apple App Store. Add your child\'s device by scanning a simple QR code. That\'s it — you\'re protected.',
    side: 'left',
  },
  {
    icon: Sparkles,
    iconBg: 'bg-safenet-primary-light',
    iconColor: 'text-safenet-primary',
    title: 'Luna runs silently in the background',
    desc: 'Your child uses their phone exactly as before — watching YouTube, chatting on WhatsApp, scrolling TikTok. They won\'t even know Luna is there. A small green dot in the status bar is the only sign.',
    side: 'right',
    hasMiniPhone: true,
  },
  {
    icon: Link,
    iconBg: 'bg-safenet-accent-light',
    iconColor: 'text-safenet-accent',
    title: 'Every link scanned before your child sees it',
    desc: 'Phishing links, fake SASSA grant scams, adult content, malware download sites — Luna scans every single URL before your child can tap it. Safe links pass through instantly. Threats get blocked with a warning.',
    side: 'left',
    hasScanAnimation: true,
  },
  {
    icon: AlertTriangle,
    iconBg: 'bg-safenet-danger-light',
    iconColor: 'text-safenet-danger',
    title: 'Threat detected — you know in under a second',
    desc: 'Cyberbullying, harassment, dangerous messages — Luna reads WhatsApp, Instagram, and TikTok conversations in real time. The moment a threat is detected, you get an instant alert on your phone with the exact message and threat level.',
    side: 'right',
    hasAlertCard: true,
  },
  {
    icon: ThumbsUp,
    iconBg: 'bg-safenet-primary-light',
    iconColor: 'text-safenet-primary',
    title: 'You decide what happens next',
    desc: 'Block the offending app instantly. Call your child with one tap. Set screen time limits. Or simply stay informed with daily summaries. You\'re always in control — Luna is your guardian, not your replacement.',
    side: 'left',
    hasActions: true,
  },
]

function StepCard({ step, index }) {
  const cardRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const fromX = step.side === 'left' ? -40 : 40
      gsap.fromTo(cardRef.current, { opacity: 0, x: fromX }, {
        opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: cardRef.current, start: 'top 80%', toggleActions: 'play none none none' },
      })
    }, cardRef)
    return () => ctx.revert()
  }, [step.side])

  const Icon = step.icon

  return (
    <div
      ref={cardRef}
      className={`flex flex-col ${step.side === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
    >
      {/* Text content */}
      <div className="flex-1 max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl ${step.iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${step.iconColor}`} />
          </div>
          <span className="text-xs font-semibold text-safenet-text-3 tracking-wider uppercase">Step {index + 1}</span>
        </div>
        <h3 className="font-display text-heading-lg text-safenet-text mb-4">{step.title}</h3>
        <p className="text-base text-safenet-text-2 leading-relaxed">{step.desc}</p>
      </div>

      {/* Visual */}
      <div className="flex-1 max-w-sm w-full">
        {step.hasMiniPhone && (
          <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 text-center">
            <div className="relative mx-auto w-[180px] h-[30px] bg-[#F0F2F1] rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 0 0 1px #D1D5DB, 0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-safenet-primary pulse-glow" />
              <span className="text-[8px] text-safenet-text-3 font-mono">9:41</span>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="w-2 h-1.5 border border-safenet-text-3 rounded-sm" />
                <span className="text-[8px] text-safenet-text-3">●●●●</span>
              </div>
            </div>
            <p className="text-xs text-safenet-text-3 mt-3">Luna's green dot in the status bar — the only sign she's there.</p>
          </div>
        )}

        {step.hasScanAnimation && (
          <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="px-3 py-2 bg-safenet-surface rounded-lg border border-safenet-border">
                <LinkIcon className="w-5 h-5 text-safenet-text-2" />
              </div>
              <motion.div
                animate={{ x: [0, 20, 40] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-safenet-primary text-lg"
              >
                →
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-12 h-12 rounded-full bg-safenet-primary-light flex items-center justify-center"
              >
                <Shield className="w-6 h-6 text-safenet-primary" />
              </motion.div>
              <motion.div
                animate={{ x: [0, -20, -40] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-green-500 text-lg"
              >
                ✓
              </motion.div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Safe
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-safenet-danger font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-safenet-danger" /> Blocked
              </span>
            </div>
          </div>
        )}

        {step.hasAlertCard && (
          <div className="bg-white rounded-card-lg shadow-safenet-md border-l-[3px] border-safenet-danger p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-safenet-danger-light flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-safenet-danger" />
              </div>
              <div>
                <div className="text-xs font-bold text-safenet-text uppercase tracking-wider mb-1">⚡ ALERT</div>
                <p className="text-sm font-semibold text-safenet-text mb-1">Cyberbullying detected</p>
                <p className="text-xs text-safenet-text-3">WhatsApp · Just now · Threat: 94%</p>
                <div className="mt-2 w-full h-1.5 bg-safenet-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '94%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-safenet-danger rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step.hasActions && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Block App', bg: 'bg-safenet-danger-light', color: 'text-safenet-danger', icon: Shield },
              { label: 'Call Child', bg: 'bg-safenet-primary-light', color: 'text-safenet-primary', icon: Smartphone },
              { label: 'Stay Informed', bg: 'bg-safenet-accent-light', color: 'text-safenet-accent', icon: AlertTriangle },
            ].map((action) => {
              const ActionIcon = action.icon
              return (
                <div key={action.label} className={`rounded-lg ${action.bg} p-3 text-center`}>
                  <ActionIcon className={`w-5 h-5 ${action.color} mx-auto mb-1`} />
                  <span className={`text-[10px] font-medium ${action.color}`}>{action.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {!step.hasMiniPhone && !step.hasScanAnimation && !step.hasAlertCard && !step.hasActions && (
          <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-8 flex items-center justify-center min-h-[160px]">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${step.iconBg} flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-8 h-8 ${step.iconColor}`} />
              </div>
              <p className="text-sm text-safenet-text-3">Simple setup. Instant protection.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo([labelRef.current, headlineRef.current],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <>
      <SEO
        title="How SafeNet SA Works — Digital Safety for South African Families"
        description="See how SafeNet SA protects your child online. Install in 30 seconds. Luna AI monitors WhatsApp, blocks threats, and alerts parents instantly."
        canonicalPath="/how-it-works"
      />
      <div className="min-h-screen bg-[#F4F6F5]">
        <Nav />

        <main ref={sectionRef} className="pt-28 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div ref={labelRef} className="inline-flex items-center gap-2 px-3 py-1.5 bg-safenet-primary-light rounded-full text-xs font-semibold text-safenet-primary mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                How SafeNet SA Works
              </div>
              <h1 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-safenet-text max-w-2xl mx-auto">
                Set up in 5 minutes. Protection that lasts.
              </h1>
            </div>

            {/* Steps */}
            <div className="space-y-20 lg:space-y-28">
              {steps.map((step, i) => (
                <StepCard key={step.title} step={step} index={i} />
              ))}
            </div>

            {/* Final CTA */}
            <div className="mt-20 text-center bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-10">
              <h2 className="font-display text-heading-lg text-safenet-text mb-4">
                Start protecting your child today 🇿🇦
              </h2>
              <p className="text-base text-safenet-text-2 mb-6 max-w-md mx-auto">
                Trusted by South African families. Free to start.
              </p>
              <Link to="/auth">
                <Button variant="primary" size="lg">
                  <Shield className="w-5 h-5" />
                  Get SafeNet Free
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
