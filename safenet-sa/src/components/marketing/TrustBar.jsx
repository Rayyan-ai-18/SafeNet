import React, { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

const trustItems = [
  { label: '50.8M', sub: 'SA internet users', count: true, target: 50.8 },
  { label: '11', sub: 'Official languages', count: false },
  { label: 'POPIA', sub: 'Compliant', count: false },
  { label: 'Childline SA', sub: 'Partner', count: false },
  { label: 'Born in', sub: 'South Africa', count: false },
]

export default function TrustBar() {
  const sectionRef = useRef(null)
  const itemsRef = useRef([])
  const counterRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current

      gsap.fromTo(itemsRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )

      // Counter animation for 50.8M
      if (counterRef.current) {
        const counter = { value: 0 }
        gsap.to(counter, {
          value: 50.8,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: counterRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = counter.value.toFixed(1) + 'M'
            }
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-safenet-surface border-y border-safenet-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
          {trustItems.map((item, i) => (
            <div
              key={item.label}
              ref={el => itemsRef.current[i] = el}
              className="flex flex-col items-center text-center"
            >
              <span
                className={`font-display text-3xl sm:text-4xl text-safenet-primary ${
                  i === 0 ? '' : ''
                }`}
              >
                {i === 0 ? (
                  <span ref={counterRef}>0M</span>
                ) : (
                  item.label
                )}
              </span>
              <span className="text-sm text-safenet-text-2 mt-1">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
