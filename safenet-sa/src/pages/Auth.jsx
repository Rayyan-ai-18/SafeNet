import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Phone, ArrowRight, Check, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'

const consentItems = [
  {
    title: 'Internet activity monitoring',
    desc: 'We monitor websites visited and apps used. Message content never leaves your child\'s device. Ever.',
    required: true,
  },
  {
    title: 'Location tracking',
    desc: 'We track your child\'s location in real-time to ensure their physical safety.',
    required: true,
  },
  {
    title: 'WhatsApp & communication analysis',
    desc: 'Luna AI analyses WhatsApp messages on-device for threats. Nothing is transmitted or stored.',
    required: true,
  },
  {
    title: 'App & device management',
    desc: 'Remotely manage app permissions, screen time limits, and internet access.',
    required: true,
  },
  {
    title: 'Data storage & retention',
    desc: 'Alert data stored securely for 90 days. Location data stored for 30 days. You can request deletion anytime.',
    required: true,
  },
]

const authSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA — Sign Up & POPIA Consent',
  description: 'Create your SafeNet SA account. South African phone verification with full POPIA compliance consent.',
  url: 'https://safenet-sa.co.za/auth',
  isPartOf: {
    '@type': 'Organization',
    name: 'SafeNet SA',
    url: 'https://safenet-sa.co.za',
  },
  about: {
    '@type': 'Thing',
    name: 'Parental control and child safety sign-up',
  },
  inLanguage: ['en-ZA', 'zu', 'af', 'xh', 'st', 'tn', 'nso', 've', 'ts', 'ss', 'nr'],
}

export default function Auth() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [consent, setConsent] = useState({})
  const [allAgreed, setAllAgreed] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    if (formRef.current) {
      const inputs = formRef.current.querySelectorAll('input, button')
      if (inputs.length) {
        // Simple entrance
      }
    }
  }, [step])

  const handleSendOTP = () => {
    if (phone.length >= 10) setStep('otp')
  }

  const handleVerifyOTP = () => {
    if (otp.length >= 4) setStep('consent')
  }

  const handleComplete = () => {
    // Navigate to dashboard
    window.location.href = '/dashboard'
  }

  const toggleConsent = (title) => {
    setConsent(prev => {
      const next = { ...prev, [title]: !prev[title] }
      setAllAgreed(consentItems.every(item => next[item.title]))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="SafeNet SA — Sign Up & POPIA Consent"
        description="Create your SafeNet SA account. South African phone verification with full POPIA compliance consent."
        canonicalPath="/auth"
        jsonLd={authSchema}
      />
      <Nav />
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
        <div className="w-full max-w-md">
          {/* Back */}
          {step !== 'phone' && (
            <button
              onClick={() => {
                if (step === 'otp') setStep('phone')
                else if (step === 'consent') setStep('otp')
              }}
              className="flex items-center gap-1.5 text-sm text-safenet-text-2 hover:text-safenet-text mb-8 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <AnimatePresence mode="wait">
            {/* Phone step */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-safenet-primary-light flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-safenet-primary" />
                  </div>
                  <h1 className="font-display text-display-sm text-safenet-text mb-2">Welcome to SafeNet SA</h1>
                  <p className="text-sm text-safenet-text-2">Enter your South African phone number to get started</p>
                </div>

                <div ref={formRef} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-safenet-text mb-1.5">Phone number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-safenet-text-3 font-medium">+27</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="82 123 4567"
                        className="w-full pl-12 pr-4 py-3 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text placeholder:text-safenet-text-3 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40 focus:border-safenet-primary"
                        maxLength={9}
                      />
                    </div>
                    <p className="text-xs text-safenet-text-3 mt-1.5">We'll send you a one-time verification code</p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    onClick={handleSendOTP}
                    disabled={phone.length < 9}
                    magnetic
                  >
                    Send verification code
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* OTP step */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-safenet-primary-light flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-safenet-primary" />
                  </div>
                  <h1 className="font-display text-display-sm text-safenet-text mb-2">Verify your number</h1>
                  <p className="text-sm text-safenet-text-2">Enter the 6-digit code sent to +27 {phone}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3.5 bg-safenet-surface border border-safenet-border rounded-input text-safenet-text placeholder:text-safenet-text-3 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40 focus:border-safenet-primary font-mono"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    onClick={handleVerifyOTP}
                    disabled={otp.length < 4}
                    magnetic
                  >
                    Verify & Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="text-center text-xs text-safenet-text-3">
                    Didn't receive it? <button className="text-safenet-primary font-medium hover:underline">Resend</button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* POPIA Consent step */}
            {step === 'consent' && (
              <motion.div
                key="consent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-safenet-primary-light flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-safenet-primary" />
                  </div>
                  <h1 className="font-display text-display-sm text-safenet-text mb-2">POPIA Consent</h1>
                  <p className="text-sm text-safenet-text-2">
                    Under South Africa's Protection of Personal Information Act, we need your consent for the following:
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {consentItems.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => toggleConsent(item.title)}
                      className={`
                        w-full text-left p-4 rounded-card-lg border-2 transition-all
                        ${consent[item.title]
                          ? 'border-safenet-primary bg-safenet-primary-light'
                          : 'border-safenet-border bg-white hover:border-safenet-primary/30'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors
                          ${consent[item.title]
                            ? 'bg-safenet-primary border-safenet-primary'
                            : 'border-safenet-border-strong'
                          }
                        `}>
                          {consent[item.title] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-safenet-text">{item.title}</div>
                          <div className="text-xs text-safenet-text-2 mt-1 leading-relaxed">{item.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-card-lg bg-safenet-surface border border-safenet-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allAgreed}
                      onChange={() => {
                        if (allAgreed) {
                          setConsent({})
                          setAllAgreed(false)
                        } else {
                          const all = {}
                          consentItems.forEach(item => { all[item.title] = true })
                          setConsent(all)
                          setAllAgreed(true)
                        }
                      }}
                      className="w-4 h-4 rounded border-safenet-border-strong text-safenet-primary focus:ring-safenet-primary"
                    />
                    <span className="text-sm font-medium text-safenet-text">I agree to all of the above</span>
                  </label>

                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    onClick={handleComplete}
                    disabled={!allAgreed}
                    magnetic
                  >
                    Start Protecting My Family
                    <Shield className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  )
}
