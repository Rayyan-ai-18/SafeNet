import React, { useRef, useEffect } from 'react'
import { Star } from 'lucide-react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

const testimonials = [
  {
    name: 'Nomsa M.',
    location: 'Soweto',
    quote: 'Finally something that works on WhatsApp. My daughter spends hours there and now I can actually know she\'s safe without being on her shoulder.',
    rating: 5,
  },
  {
    name: 'Johan V.',
    location: 'Stellenbosch',
    quote: 'My son tried to uninstall it three times. Still there. Still protecting him. The factory reset protection alone is worth the price.',
    rating: 5,
  },
  {
    name: 'Thandi N.',
    location: 'Durban',
    quote: 'Luna sent the alert in Zulu. I understood exactly what was happening. My child was safe because I understood the threat immediately.',
    rating: 5,
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
            Testimonials
          </span>
        </div>

        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-16 max-w-2xl mx-auto">
          Trusted by South African families
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, i) => (
            <div
              key={testimonial.name}
              ref={el => cardsRef.current[i] = el}
              className="bg-white rounded-card-lg p-6 lg:p-8 shadow-safenet-sm border border-safenet-border"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-safenet-accent text-safenet-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-safenet-text-2 leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div>
                <div className="font-semibold text-safenet-text text-sm">{testimonial.name}</div>
                <div className="text-xs text-safenet-text-3">{testimonial.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
