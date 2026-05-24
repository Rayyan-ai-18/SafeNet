import React, { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

const steps = [
  { number: '01', title: 'Download & Log In', desc: 'Download and log in with your SA number. No password needed.' },
  { number: '02', title: 'Connect Your Child', desc: 'Scan the QR code on your child\'s phone. 60 seconds.' },
  { number: '03', title: 'Luna Protects', desc: 'Luna AI monitors immediately. Alerts in your language.' },
]

export default function HowItWorks() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const cardsRef = useRef([])
  const pathRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current

      // Label & headline
      gsap.fromTo([labelRef.current, headlineRef.current],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      // SVG path draw
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength()
        gsap.set(pathRef.current, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none none' },
        })
      }

      // Step cards stagger
      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="bg-safenet-surface py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label */}
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            How SafeNet SA Works
          </span>
        </div>

        {/* Headline */}
        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-16 max-w-2xl mx-auto">
          Set up in 5 minutes. Protection that lasts.
        </h2>

        {/* Steps with connecting line */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* SVG connecting line (hidden on mobile) */}
          <svg
            className="hidden md:block absolute top-24 left-[12.5%] right-[12.5%] w-[75%] h-[2px]"
            viewBox="0 0 800 2"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d="M 0 1 L 800 1"
              stroke="#CBD5E1"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {steps.map((step, i) => (
            <div
              key={step.number}
              ref={el => cardsRef.current[i] = el}
              className="relative bg-white rounded-card-lg shadow-safenet-md p-8 text-center"
            >
              {/* Number */}
              <div className="w-14 h-14 rounded-full bg-safenet-primary-light flex items-center justify-center mx-auto mb-6">
                <span className="font-display text-2xl text-safenet-primary">{step.number}</span>
              </div>

              {/* Content */}
              <h3 className="font-display text-heading-md text-safenet-text mb-3">{step.title}</h3>
              <p className="text-base text-safenet-text-2 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
