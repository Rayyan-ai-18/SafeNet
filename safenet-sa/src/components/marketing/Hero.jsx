import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gsap } from '../../lib/gsap'
import Button from '../ui/Button'
import PhoneMockup from '../ui/PhoneMockup'

export default function Hero() {
  const headlineRef = useRef(null)
  const subRef = useRef(null)
  const ctaRef = useRef(null)
  const trustRef = useRef(null)
  const badgeRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Badge fade in
      gsap.fromTo(badgeRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })

      // Headline: split words and animate
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.hero-word')
        gsap.fromTo(words,
          { opacity: 0, y: 30, rotateX: -20 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.03, ease: 'power3.out', delay: 0.2 }
        )
      }

      // Subheadline
      gsap.fromTo(subRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.6, ease: 'power2.out' })

      // CTAs
      gsap.fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.8, ease: 'power2.out' })

      // Trust line
      gsap.fromTo(trustRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 1.1, ease: 'power2.out' })
    })

    return () => ctx.revert()
  }, [])

  const headlineWords = [
    'Your', 'child', 'is', 'safe', 'online.',
    'We', 'made', 'certain', 'of', 'it.'
  ]

  return (
    <section className="relative min-h-screen overflow-hidden bg-white">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-50" />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] glow-primary pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 pb-16 lg:pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text */}
          <div className="flex-1 max-w-xl lg:max-w-[55%]">
            {/* Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-3 py-1.5 bg-safenet-primary-light rounded-full text-sm text-safenet-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-safenet-primary pulse-dot" />
              <span className="text-xs font-medium">Now protecting SA families · Free to start</span>
            </div>

            {/* Headline */}
            <h1 ref={headlineRef} className="font-display text-display sm:text-display-lg lg:text-display text-safenet-text mb-6 leading-[1.1]">
              {headlineWords.map((word, i) => (
                <span key={i} className="hero-word inline-block mr-[0.3em]">{word}</span>
              ))}
            </h1>

            {/* Subheadline */}
            <p ref={subRef} className="text-lg sm:text-xl text-safenet-text-2 max-w-[520px] leading-relaxed mb-8">
              The only digital safety platform built for South African families.
              Monitors WhatsApp. Speaks Zulu. Ready in 5 minutes.
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4">
              <Link to="/auth">
                <Button variant="primary" size="lg" magnetic>
                  <Shield className="w-5 h-5" />
                  Protect My Child
                </Button>
              </Link>
              <a href="#how-it-works" className="group inline-flex items-center gap-2 text-base font-medium text-safenet-text-2 hover:text-safenet-text transition-colors">
                Watch how it works
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Trust line */}
            <p ref={trustRef} className="text-sm text-safenet-text-3 mt-6">
              POPIA compliant · No credit card required · Cancel anytime
            </p>
            <p className="text-sm text-safenet-text-3 mt-2">
              <a href="#features" className="text-safenet-primary hover:underline">Explore all features</a>
              {' · '}
              <a href="#pricing" className="text-safenet-primary hover:underline">View pricing</a>
            </p>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex-1 flex justify-center lg:justify-end relative">
            <PhoneMockup />

            {/* Floating alert card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 lg:-left-8 glass rounded-2xl p-4 shadow-safenet-lg max-w-[240px]"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-safenet-primary-light flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-safenet-text">Liam is safe</span>
                </div>
                <p className="text-xs text-safenet-text-3 leading-relaxed">
                  Luna blocked a phishing link · 2 min ago
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
