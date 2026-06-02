import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Database, GraduationCap, Lock, ArrowRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import LunaShowcase from '../components/marketing/LunaShowcase'
import TeamSection from '../components/marketing/TeamSection'
import { gsap } from '../lib/gsap'
import Button from '../components/ui/Button'

const moatCards = [
  {
    icon: Database,
    color: 'text-safenet-primary',
    bg: 'bg-safenet-primary-light',
    title: 'SA Language Intelligence',
    desc: 'The only threat database trained on South African languages, slang, and cultural context. Built with Childline SA data.',
  },
  {
    icon: GraduationCap,
    color: 'text-safenet-accent',
    bg: 'bg-safenet-accent-light',
    title: 'School & Government Distribution',
    desc: 'Institutional partnerships that deliver more families than any marketing budget. One school MOU equals thousands of protected children.',
  },
  {
    icon: Lock,
    color: 'text-safenet-danger',
    bg: 'bg-safenet-danger-light',
    title: 'On-Device Privacy by Architecture',
    desc: 'Message content never transmitted. Parents see threat alerts, not chats. POPIA compliant from the first line of code.',
  },
]

const marketStats = [
  { value: '1 in 3', label: 'SA children face cyberbullying' },
  { value: '94%', label: 'of SA teens are online by smartphone' },
  { value: '11', label: 'official languages, one platform' },
]

const milestones = [
  { period: 'NOW', label: 'Building and testing with pilot families', active: true },
  { period: 'NEXT', label: '50 retained SA families with real usage data', active: false },
  { period: 'THEN', label: 'School pilots across Gauteng, WC, KZN', active: false },
  { period: 'FUTURE', label: '11 SA languages. Every child protected.', active: false },
]

function InvestorHero() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current?.children || [], { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="bg-white pt-28 lg:pt-36 pb-16 lg:pb-20">
      <div ref={ref} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-5">
          Investors
        </span>
        <h1 className="font-display text-display-sm sm:text-display-md text-safenet-text mb-5">
          Safety infrastructure for South Africa's children
        </h1>
        <p className="text-lg text-safenet-text-2 leading-relaxed max-w-2xl mx-auto">
          SafeNet protects children where global parental-control apps cannot: in the languages they speak,
          against the scams they actually face, on the phones they actually use. Here is the advantage, the
          technology, and where we are going.
        </p>
      </div>
    </section>
  )
}

function MarketStrip() {
  return (
    <section className="bg-safenet-surface py-14 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {marketStats.map((s) => (
            <div key={s.label} className="bg-white rounded-card-lg border border-safenet-border shadow-safenet-sm p-6">
              <div className="font-display text-display-sm text-safenet-primary tabular-nums">{s.value}</div>
              <div className="text-sm text-safenet-text-2 mt-2 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TheMoat() {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardsRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-white py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-4">
            Our Advantage
          </span>
          <h2 className="font-display text-display-sm text-safenet-text max-w-xl mx-auto">
            What makes SafeNet irreplaceable
          </h2>
          <p className="text-base text-safenet-text-2 max-w-lg mx-auto mt-3">
            Three things that would take any competitor years to replicate.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {moatCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                ref={el => cardsRef.current[i] = el}
                className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 hover:shadow-safenet-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <h3 className="font-display text-heading-sm text-safenet-text mb-2">{card.title}</h3>
                <p className="text-sm text-safenet-text-2 leading-relaxed">{card.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PilotTarget() {
  const sectionRef = useRef(null)
  const timelineRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
      if (timelineRef.current) {
        gsap.fromTo(timelineRef.current.children, { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, stagger: 0.2, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: timelineRef.current, start: 'top 80%', once: true },
        })
      }
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-safenet-surface py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-display-sm text-safenet-text mb-3">
            Where we are going
          </h2>
          <p className="text-base text-safenet-text-2 max-w-lg mx-auto">
            We are not showing you a billion-rand projection. We are showing you the next 50 families we will protect.
          </p>
        </div>

        <div ref={timelineRef} className="relative">
          <div className="hidden lg:flex items-start justify-between">
            {milestones.map((m, i) => (
              <div key={m.period} className="flex flex-col items-center flex-1 relative">
                {i < milestones.length - 1 && (
                  <div className="absolute top-4 left-[60%] w-full h-0.5 bg-safenet-border">
                    <div className={`h-full bg-safenet-primary transition-all duration-1000 ${m.active ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 ${
                  m.active
                    ? 'bg-safenet-primary text-white shadow-lg shadow-safenet-primary/30'
                    : 'bg-white border-2 border-safenet-border text-safenet-text-3'
                }`}>
                  ●
                </div>
                <div className={`text-xs font-bold mb-1 ${m.active ? 'text-safenet-primary' : 'text-safenet-text-3'}`}>
                  {m.period}
                </div>
                <div className={`text-xs text-center px-2 ${m.active ? 'text-safenet-text font-medium' : 'text-safenet-text-3'}`}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:hidden space-y-6">
            {milestones.map((m, i) => (
              <div key={m.period} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    m.active
                      ? 'bg-safenet-primary text-white shadow-md'
                      : 'bg-white border-2 border-safenet-border text-safenet-text-3'
                  }`}>
                    ●
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 h-10 bg-safenet-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className={`text-xs font-bold mb-0.5 ${m.active ? 'text-safenet-primary' : 'text-safenet-text-3'}`}>
                    {m.period}
                  </div>
                  <div className={`text-sm ${m.active ? 'text-safenet-text font-medium' : 'text-safenet-text-2'}`}>
                    {m.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function InvestorCTA() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-display-sm text-safenet-text mb-4">
          Let us talk
        </h2>
        <p className="text-base text-safenet-text-2 mb-8 max-w-lg mx-auto leading-relaxed">
          We are building the safety layer for a generation of South African children. If that is a mission
          you want to back, we would like to hear from you.
        </p>
        <Link to="/#contact">
          <Button variant="primary" size="lg">
            Get in touch
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

export default function Investors() {
  return (
    <>
      <SEO
        title="Investors - SafeNet SA"
        description="SafeNet SA is building digital safety infrastructure for South African families: on-device, multilingual, POPIA compliant. See the advantage, the technology, and the roadmap."
        canonicalPath="/investors"
      />
      <div className="min-h-screen bg-white">
        <Nav />
        <InvestorHero />
        <MarketStrip />
        <TheMoat />
        <LunaShowcase />
        <PilotTarget />
        <TeamSection />
        <InvestorCTA />
        <Footer />
      </div>
    </>
  )
}
