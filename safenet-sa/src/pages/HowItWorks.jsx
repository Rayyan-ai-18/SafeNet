import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Smartphone, Link as LinkIcon, AlertTriangle, ThumbsUp, Sparkles, Languages } from 'lucide-react'
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
    title: { en: 'Parent installs SafeNet in 30 seconds', zu: 'Umzali ufaka i-SafeNet ngemizuzwana engu-30' },
    desc: 'Download the app. Enter your SA phone number. Scan the QR code on your child\'s phone. Done.',
    side: 'left',
    hasQRVisual: true,
  },
  {
    icon: Sparkles,
    iconBg: 'bg-safenet-primary-light',
    iconColor: 'text-safenet-primary',
    title: { en: 'Luna runs silently in the background', zu: 'ULuna usebenza buthule ngemuva' },
    desc: 'A small green dot appears in your child\'s status bar. Luna is active. Your child uses their phone normally.',
    side: 'right',
    hasMiniPhone: true,
  },
  {
    icon: LinkIcon,
    iconBg: 'bg-safenet-accent-light',
    iconColor: 'text-safenet-accent',
    title: { en: 'Every link and message scanned before your child sees it', zu: 'Zonke izixhumanisi nemilayezo kuhlolwa ngaphambi kokuba ingane yakho ibone' },
    desc: 'Fake SASSA sites, phishing links, adult content — blocked instantly. Cyberbullying and grooming detected on-device.',
    side: 'left',
    hasScanAnimation: true,
  },
  {
    icon: AlertTriangle,
    iconBg: 'bg-safenet-danger-light',
    iconColor: 'text-safenet-danger',
    title: { en: 'Threat detected — you know in under a second', zu: 'Usongo lutholakele — wazi ngaphansi komzuzwana' },
    desc: 'You receive a push notification with the threat type, severity, and culturally appropriate guidance in your language. Message content never leaves your child\'s device.',
    side: 'right',
    hasAlertCard: true,
  },
  {
    icon: ThumbsUp,
    iconBg: 'bg-safenet-primary-light',
    iconColor: 'text-safenet-primary',
    title: { en: 'You decide what happens next', zu: 'Wena unquma okulandelayo' },
    desc: 'Block the app. Pause the internet. Call your child. Or simply stay informed. SafeNet gives you the information — you make the decision.',
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
  // Use English as default, showing zu in lang toggle context
  const currentTitle = step.title.en

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
        <h3 className="font-display text-heading-lg text-safenet-text mb-4">{currentTitle}</h3>
        <p className="text-base text-safenet-text-2 leading-relaxed">{step.desc}</p>
        {/* Zulu translation toggle hint */}
        <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-safenet-primary-light/30 rounded-full text-[10px] text-safenet-text-3 border border-safenet-border/30">
          <Languages className="w-3 h-3" />
          <span>{step.title.zu}</span>
        </div>
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

        {step.hasQRVisual && (
          <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-8 flex items-center justify-center min-h-[180px]">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-2xl ${step.iconBg} flex items-center justify-center mx-auto mb-3`}>
                <Smartphone className={`w-10 h-10 ${step.iconColor}`} />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-16 h-16 bg-white border-2 border-safenet-border rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-0.5">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-sm ${Math.random() > 0.5 ? 'bg-safenet-text' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-safenet-primary" />
                <div className="w-16 h-16 bg-white border-2 border-safenet-border rounded-lg flex items-center justify-center">
                  <Shield className="w-8 h-8 text-safenet-primary" />
                </div>
              </div>
              <p className="text-xs text-safenet-text-3 mt-3">Scan the QR code on your child's phone to link their device.</p>
            </div>
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
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Safe — passes through
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-safenet-danger font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-safenet-danger" /> Blocked — threat stopped
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
                <div className="text-xs font-bold text-safenet-text uppercase tracking-wider mb-1">⚡ LUNA ALERT</div>
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
                <p className="text-xs text-safenet-text-3 mt-2 italic leading-relaxed">
                  Message content never leaves your child's device.
                </p>
              </div>
            </div>
          </div>
        )}

        {step.hasActions && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Block App', bg: 'bg-safenet-danger-light', color: 'text-safenet-danger', icon: Shield },
              { label: 'Pause Internet', bg: 'bg-safenet-accent-light', color: 'text-safenet-accent', icon: Smartphone },
              { label: 'Call Child', bg: 'bg-safenet-primary-light', color: 'text-safenet-primary', icon: AlertTriangle },
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
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const privacyRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo([labelRef.current, headlineRef.current],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
      gsap.fromTo(privacyRef.current, { opacity: 0, y: 16 }, {
        opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out',
        scrollTrigger: { trigger: privacyRef.current, start: 'top 90%', once: true },
      })
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
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>

            {/* Privacy Note */}
            <div ref={privacyRef} className="mt-16 bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-safenet-primary-light flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-safenet-primary" />
                </div>
                <div>
                  <h3 className="font-display text-heading-sm text-safenet-text mb-2">
                    Your child's privacy is sacred
                  </h3>
                  <p className="text-sm text-safenet-text-2 leading-relaxed">
                    SafeNet never reads or stores your child's messages. Luna's AI runs entirely on your child's device. 
                    Only threat alerts — never message content — are sent to you. POPIA compliant by design.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-safenet-primary-light/30 rounded-full text-[11px] text-safenet-primary font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-safenet-primary" /> Messages never leave the device
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-safenet-accent-light/30 rounded-full text-[11px] text-safenet-accent font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-safenet-accent" /> Threat alerts only
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-safenet-danger-light/30 rounded-full text-[11px] text-safenet-danger font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-safenet-danger" /> POPIA compliant
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-10 text-center bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-10">
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
