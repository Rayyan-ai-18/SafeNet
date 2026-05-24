import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Shield, MessageCircle, Volume2, FileText, GraduationCap, Sparkles } from 'lucide-react'
import { gsap } from '../../lib/gsap'

const capabilities = [
  'Live phishing scanner',
  'SA language NLP',
  'Voice alerts in Zulu',
  'Weekly digest',
  'School Shield',
  'Conversational AI',
]

export default function LunaShowcase() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const copyRef = useRef(null)
  const chatRef = useRef(null)
  const chatContentRef = useRef(null)
  const pillsRef = useRef([])

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

      gsap.fromTo(copyRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(pillsRef.current,
        { opacity: 0, x: -15 },
        {
          opacity: 1, x: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(chatRef.current,
        { opacity: 0, x: 30 },
        {
          opacity: 1, x: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="luna" className="bg-safenet-surface py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            Powered by Luna AI
          </span>
        </div>

        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-16 max-w-3xl mx-auto">
          The intelligence underneath SafeNet SA is ours. Entirely.
        </h2>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex-1 max-w-lg">
            <p ref={copyRef} className="text-lg text-safenet-text-2 leading-relaxed mb-8">
              Luna is not a vendor. Not a third-party API. Not a white-label. We built Luna from the ground up. Every model. Every pipeline. Every insight. It belongs to us — which means it belongs to you.
            </p>

            {/* Capability pills */}
            <div className="flex flex-wrap gap-2">
              {capabilities.map((cap, i) => (
                <span
                  key={cap}
                  ref={el => pillsRef.current[i] = el}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-safenet-text-2 rounded-full border border-safenet-border shadow-safenet-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-safenet-primary" />
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Chat window */}
          <div ref={chatRef} className="flex-1 max-w-md w-full">
            <div className="bg-white rounded-card-lg shadow-safenet-xl border border-safenet-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-safenet-border bg-safenet-surface">
                <div className="w-8 h-8 rounded-full bg-safenet-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-safenet-text flex items-center gap-2">
                    Luna AI
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <div className="text-[11px] text-safenet-text-3">Always watching</div>
                </div>
              </div>

              {/* Chat content */}
              <div className="p-4 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-safenet-primary-light text-safenet-primary-dark text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]">
                    What was the link Luna blocked this morning?
                  </div>
                </div>

                {/* Luna typing */}
                <div className="flex justify-start">
                  <div className="bg-safenet-surface text-safenet-text text-sm px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%]">
                    <span>Someone sent Liam a link pretending to be from SASSA offering a R1,500 grant. It was a credential harvesting site. Luna blocked it before it loaded. No data was shared. Liam is safe. </span>
                    <span className="inline-block text-green-600">✓</span>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-safenet-border flex items-center gap-2">
                <div className="flex-1 bg-safenet-surface rounded-full px-4 py-2 text-sm text-safenet-text-3">
                  Ask Luna anything…
                </div>
                <button className="w-8 h-8 rounded-full bg-safenet-primary flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
