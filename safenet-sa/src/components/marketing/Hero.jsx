import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Sparkles, Mic } from 'lucide-react'
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
    'SafeNet', 'is', 'the', 'bridge', 'between',
    'South', 'African', "children's", 'digital',
    'world', 'and', 'their', 'parents.'
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
              <span className="text-xs font-medium">Speaking isiZulu · POPIA compliant · Free to start</span>
            </div>

            {/* Headline */}
            <h1 ref={headlineRef} className="font-display text-display sm:text-display-lg lg:text-display text-safenet-text mb-6 leading-[1.1]">
              {headlineWords.map((word, i) => (
                <span key={i} className="hero-word inline-block mr-[0.3em]">{word}</span>
              ))}
            </h1>

            {/* Subheadline */}
            <p ref={subRef} className="text-lg sm:text-xl text-safenet-text-2 max-w-[520px] leading-relaxed mb-8">
              Detect cyberbullying. Block grooming. Speak isiZulu. Built for South Africa.
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4">
              <Link to="/demo">
                <Button variant="primary" size="lg" magnetic>
                  <Sparkles className="w-5 h-5" />
                  Watch Live Demo
                </Button>
              </Link>
              <Link to="/luna" className="group inline-flex items-center gap-2 text-base font-medium text-safenet-text-2 hover:text-safenet-text transition-colors">
                <Mic className="w-4 h-4" />
                Talk to Luna
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Privacy Trust Badge */}
            <div ref={trustRef} className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-safenet-text-3">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-safenet-primary" />
                Messages never leave your child's device
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-safenet-primary" />
                POPIA compliant
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-safenet-primary" />
                Child dignity protected
              </span>
            </div>
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
