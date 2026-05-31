import React, { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

// Pre-launch: honest, sourced reasons SafeNet exists, not fabricated
// customer testimonials. Replace with real pilot quotes once we have them.
const pillars = [
  {
    stat: '1 in 3',
    text: 'South African children have been exposed to cyberbullying or harmful content online, most of it on WhatsApp.',
    source: 'UNICEF South Africa',
  },
  {
    stat: '11 languages',
    text: 'Threats arrive in a child\'s home language, where English-only filters miss them. Luna is built to understand and detect across all 11.',
    source: 'Why we built SafeNet',
  },
  {
    stat: 'On-device',
    text: 'Message content never leaves the phone and is never stored. Parents see threat alerts, never the chats. POPIA compliant by design.',
    source: 'How SafeNet works',
  },
]

export default function Testimonials() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current

      gsap.fromTo([labelRef.current, headlineRef.current],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-safenet-surface py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            Why SafeNet
          </span>
        </div>

        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-16 max-w-2xl mx-auto">
          Built for South African families
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.source}
              ref={el => cardsRef.current[i] = el}
              className="bg-white rounded-card-lg p-6 lg:p-8 shadow-safenet-sm border border-safenet-border"
            >
              {/* Stat */}
              <div className="font-display text-display-sm text-safenet-primary mb-3 tabular-nums">
                {pillar.stat}
              </div>

              {/* Statement */}
              <p className="text-sm text-safenet-text-2 leading-relaxed mb-6">
                {pillar.text}
              </p>

              {/* Source */}
              <div className="text-[11px] font-semibold text-safenet-text-3 uppercase tracking-wider">
                {pillar.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
