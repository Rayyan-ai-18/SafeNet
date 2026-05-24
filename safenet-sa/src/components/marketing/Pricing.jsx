import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Shield, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import Button from '../ui/Button'
import Toggle from '../ui/Toggle'

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    desc: 'Basic protection for one child',
    features: [
      'WhatsApp monitoring',
      'Luna AI alerts',
      'Basic location tracking',
      'Email support',
    ],
    cta: 'Get Started Free',
    variant: 'ghost',
    popular: false,
  },
  {
    name: 'Guardian',
    price: { monthly: 89, annual: 890 },
    desc: 'Complete family protection',
    features: [
      'Everything in Free',
      'Up to 4 children',
      '11 language support',
      'Voice alerts',
      'Weekly digest',
      'Priority support',
    ],
    cta: 'Start Protecting',
    variant: 'primary',
    popular: true,
  },
  {
    name: 'Sentinel',
    price: { monthly: 149, annual: 1490 },
    desc: 'Maximum security for large families',
    features: [
      'Everything in Guardian',
      'Unlimited children',
      'School Shield integration',
      'ISP billing integration',
      'Dedicated account manager',
      '24/7 phone support',
    ],
    cta: 'Go Sentinel',
    variant: 'outline',
    popular: false,
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const toggleRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current

      gsap.fromTo([labelRef.current, headlineRef.current, toggleRef.current],
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
    <section ref={sectionRef} id="pricing" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            Pricing
          </span>
        </div>

        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-8 max-w-2xl mx-auto">
          Protection for every family
        </h2>

        {/* Toggle */}
        <div ref={toggleRef} className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${!annual ? 'text-safenet-text' : 'text-safenet-text-3'}`}>Monthly</span>
          <Toggle
            checked={annual}
            onChange={() => setAnnual(!annual)}
            className="!w-12 !h-6"
          />
          <span className={`text-sm font-medium ${annual ? 'text-safenet-text' : 'text-safenet-text-3'}`}>
            Annual
            <span className="ml-1.5 text-xs text-safenet-primary font-semibold">Save 17%</span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              ref={el => cardsRef.current[i] = el}
              layout
              className={`
                relative rounded-card-lg p-8
                ${plan.popular
                  ? 'bg-white border-2 border-safenet-primary shadow-safenet-lg'
                  : 'bg-white border border-safenet-border shadow-safenet-sm'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-safenet-primary text-white text-xs font-semibold rounded-full">
                    <Star className="w-3 h-3" />
                    Most popular
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <h3 className="font-display text-heading-md text-safenet-text mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={annual ? 'annual' : 'monthly'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="font-display text-display-sm text-safenet-text"
                    >
                      R{annual ? plan.price.annual : plan.price.monthly}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-sm text-safenet-text-3">
                    {annual ? '/year' : '/month'}
                  </span>
                </div>
                <p className="text-sm text-safenet-text-2 mt-1">{plan.desc}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-safenet-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-safenet-text-2">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/auth">
                <Button
                  variant={plan.variant}
                  className="w-full"
                  magnetic
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
