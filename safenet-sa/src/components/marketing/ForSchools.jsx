import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Users, Shield, Bell, BookOpen, Building2, ArrowRight } from 'lucide-react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import Button from '../ui/Button'
import { Link } from 'react-router-dom'

const schoolFeatures = [
  {
    icon: Building2,
    title: 'School-Wide Dashboard',
    desc: 'Monitor all enrolled students from a single admin panel with real-time alerts and location overview.',
  },
  {
    icon: BookOpen,
    title: 'Curriculum Mode',
    desc: 'Automatically silence devices during class hours, exams, and study periods across the entire school.',
  },
  {
    icon: Shield,
    title: 'Luna AI for Schools',
    desc: 'AI-powered threat detection tuned for school environments - bullying detection, suspicious contact alerts.',
  },
  {
    icon: Users,
    title: 'Batch Enrollment',
    desc: 'Enroll entire classes or grades at once via CSV upload. Parent consent managed digitally (POPIA compliant).',
  },
  {
    icon: Bell,
    title: 'Emergency Broadcast',
    desc: 'Send instant safety alerts to all parents when lockdowns, evacuations, or emergencies occur.',
  },
  {
    icon: GraduationCap,
    title: 'ISP Partnership',
    desc: 'Whitelabel SafeNet SA directly into your school\'s existing parent communication app or ISP bundle.',
  },
]

// Honest, pilot-stage credibility (no fabricated adoption numbers).
const stats = [
  { value: '11', label: 'Official SA languages' },
  { value: 'POPIA', label: 'Compliant by design' },
  { value: '0', label: 'Messages ever stored' },
  { value: 'Pilot', label: 'In active pilot' },
]

export default function ForSchools() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const featuresRef = useRef([])
  const statsRef = useRef(null)

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

      gsap.fromTo(featuresRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(statsRef.current?.children,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1, scale: 1, stagger: 0.1, duration: 0.4, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="for-schools" className="bg-safenet-surface py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label */}
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            For Schools
          </span>
        </div>

        {/* Headline */}
        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-4 max-w-3xl mx-auto">
          Digital safety infrastructure for every school in South Africa
        </h2>
        <p className="text-center text-safenet-text-2 text-base max-w-2xl mx-auto mb-12">
          Extend SafeNet SA protection across your entire school. From classroom device management 
          to emergency broadcasts - built for South African schools, compliant with POPIA.
        </p>

        {/* Stats row */}
        <div ref={statsRef} className="flex flex-wrap justify-center gap-8 lg:gap-16 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-display-sm text-safenet-primary">{stat.value}</div>
              <div className="text-sm text-safenet-text-2">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {schoolFeatures.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                ref={el => featuresRef.current[i] = el}
                className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm hover:shadow-safenet-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-safenet-primary-light flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-safenet-primary" />
                </div>
                <h3 className="font-display text-heading-sm text-safenet-text mb-2">{feature.title}</h3>
                <p className="text-sm text-safenet-text-2 leading-relaxed">{feature.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-white rounded-card-lg p-8 lg:p-12 border border-safenet-border shadow-safenet-md max-w-3xl mx-auto">
            <h3 className="font-display text-heading-md text-safenet-text mb-3">
              Ready to protect your school?
            </h3>
            <p className="text-sm text-safenet-text-2 mb-6 max-w-lg mx-auto">
              Get a custom quote for your school. Volume discounts available for 
              public schools and no-fee schools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button variant="primary" size="lg" magnetic>
                  Enroll Your School
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg">
                Talk to our team
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
