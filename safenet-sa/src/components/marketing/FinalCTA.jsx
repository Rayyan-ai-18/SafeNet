import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gsap } from '../../lib/gsap'
import Button from '../ui/Button'

export default function FinalCTA() {
  const sectionRef = useRef(null)
  const headlineRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.cta-word')
        gsap.fromTo(words,
          { opacity: 0, y: 30, rotateX: -15 },
          {
            opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.04, ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const headlineWords = ['Every', 'day,', 'your', 'child', 'is', 'online', 'without', 'you.', 'Luna', 'is', 'there', 'when', 'you', "can't", 'be.']

  return (
    <section ref={sectionRef} className="relative bg-safenet-primary py-24 lg:py-32 overflow-hidden grain-overlay">
      {/* Animated mesh gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-safenet-accent/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h2
          ref={headlineRef}
          className="font-display text-display-sm sm:text-display-md lg:text-display-lg text-white mb-8 leading-[1.15]"
        >
          {headlineWords.map((word, i) => (
            <span key={i} className="cta-word inline-block mr-[0.25em]">{word}</span>
          ))}
        </h2>

        {/* Sub */}
        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
          Free to start, ready in about five minutes, and built to keep your family's data private under POPIA.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/auth">
            <Button
              variant="secondary"
              size="lg"
              className="!bg-white !text-safenet-primary hover:!bg-white/90 !shadow-safenet-lg"
              magnetic
            >
              <Shield className="w-5 h-5" />
              Protect My Child
            </Button>
          </Link>
          <a href="#features" className="inline-flex items-center gap-2 text-base font-medium text-white/80 hover:text-white transition-colors">
            Learn more
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
