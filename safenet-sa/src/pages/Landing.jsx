import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mic, Shield, Link as LinkIcon, Bell, ArrowRight, Sparkles, RotateCcw } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Hero from '../components/marketing/Hero'
import TrustBar from '../components/marketing/TrustBar'
import Problem from '../components/marketing/Problem'
import HowItWorks from '../components/marketing/HowItWorks'
import FeaturesBento from '../components/marketing/FeaturesBento'
import LunaShowcase from '../components/marketing/LunaShowcase'
import ForSchools from '../components/marketing/ForSchools'
import LanguagesSection from '../components/marketing/LanguagesSection'
import Pricing from '../components/marketing/Pricing'
import Testimonials from '../components/marketing/Testimonials'
import FinalCTA from '../components/marketing/FinalCTA'
import LunaOrb from '../components/ui/LunaOrb'
import { useLunaVoice } from '../hooks/useLunaVoice'
import { gsap, ScrollTrigger } from '../lib/gsap'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SafeNet SA',
  url: 'https://safenet-sa.co.za',
  logo: 'https://safenet-sa.co.za/favicon.svg',
  description:
    'The only digital safety platform built for South African families. Monitors WhatsApp. Speaks Zulu. Ready in 5 minutes.',
  foundingLocation: 'South Africa',
  areaServed: 'ZA',
  knowsLanguage: [
    'en', 'zu', 'af', 'xh', 'st', 'tn', 'nso', 've', 'ts', 'ss', 'nr',
  ],
  sameAs: [],
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SafeNet SA',
  operatingSystem: 'Android, iOS',
  applicationCategory: 'SecurityApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ZAR',
    description: 'Free tier available; Guardian plan R89/month; Sentinel plan R149/month',
  },
  availableLanguage: [
    'English', 'isiZulu', 'Afrikaans', 'isiXhosa', 'Sesotho',
    'Setswana', 'Sepedi', 'Tshivenḓa', 'Xitsonga', 'siSwati', 'isiNdebele',
  ],
}

const homepageStats = [
  { value: '1 in 3', label: 'Face cyberbullying', description: 'South African children affected' },
  { value: '94', suffix: '%', label: 'On WhatsApp', description: 'SA smartphone users' },
  { value: '0.3', suffix: 's', label: 'Detection time', description: "Luna's average threat speed" },
  { value: '11', suffix: '', label: 'Languages', description: 'SA languages Luna speaks 🇿🇦' },
]

const protectCards = [
  { icon: LinkIcon, color: 'text-safenet-primary', bg: 'bg-safenet-primary-light', title: 'Link Scanner', desc: 'Every link checked before your child taps it — phishing, scams, adult content blocked instantly.' },
  { icon: Shield, color: 'text-safenet-accent', bg: 'bg-safenet-accent-light', title: 'Threat Detector', desc: 'Cyberbullying caught in 0.3 seconds with real-time WhatsApp, Instagram, and TikTok monitoring.' },
  { icon: Bell, color: 'text-safenet-danger', bg: 'bg-safenet-danger-light', title: 'Instant Alerts', desc: 'You know the moment something happens. Threat level, context, and suggested actions sent to your phone.' },
]

// Homepage mini Luna voice section
function LunaVoiceTeaser() {
  const { state, language, startListening, stopListening, browserSupported, lunaResponse, transcript, sendTextInput } = useLunaVoice()
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-safenet-surface py-16 lg:py-20">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-8 text-center">
          <div className="flex justify-center mb-4">
            <LunaOrb state={state === 'listening' || state === 'speaking' || state === 'thinking' ? state : 'idle'} size={96} />
          </div>
          <h3 className="font-display text-heading-sm text-safenet-text mb-2">Talk to Luna</h3>
          <p className="text-sm text-safenet-text-2 mb-5">
            Ask Luna anything about keeping your child safe online.
          </p>

          <div className="flex justify-center mb-4">
            <motion.button
              onClick={() => state === 'listening' ? stopListening() : startListening()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-safenet-md ${
                state === 'listening' ? 'bg-safenet-danger text-white' : 'bg-safenet-primary text-white'
              }`}
            >
              <Mic className="w-6 h-6" />
            </motion.button>
          </div>

          {transcript && (
            <div className="mb-3 px-3 py-2 bg-safenet-surface rounded-lg text-sm text-safenet-text-2">
              {transcript}
            </div>
          )}

          {lunaResponse && (
            <div className="mb-3 px-3 py-2 bg-safenet-primary-light rounded-lg text-sm text-safenet-text">
              {lunaResponse}
            </div>
          )}

          {!browserSupported && (
            <p className="text-xs text-safenet-accent mb-3">Best experienced in Chrome</p>
          )}

          <Link to="/luna" className="inline-flex items-center gap-1 text-sm font-medium text-safenet-primary hover:underline">
            Visit Luna's page
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// How Luna Protects - 3 cards
function HowLunaProtects() {
  const cardsRef = useRef([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardsRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-white py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-4">
            How Luna Protects
          </span>
          <h2 className="font-display text-display-sm text-safenet-text max-w-xl mx-auto">
            Three layers of protection
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {protectCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                ref={el => cardsRef.current[i] = el}
                className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 text-center hover:shadow-safenet-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl ${card.bg} flex items-center justify-center mx-auto mb-4`}>
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

// Live Demo Teaser
function LiveDemoTeaser() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-safenet-surface py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Mini phone mockup */}
          <div className="flex-shrink-0">
            <div
              className="relative mx-auto"
              style={{ width: 240, height: 480 }}
            >
              <div
                className="absolute inset-0 bg-[#F0F2F1] rounded-[36px]"
                style={{ boxShadow: '0 0 0 2px #D1D5DB, 0 20px 60px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.8)' }}
              >
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1A1A1A] rounded-[18px] z-20" />
                <div className="absolute top-[10px] left-[10px] right-[10px] bottom-[10px] bg-white rounded-[28px] overflow-hidden">
                  <div className="h-full bg-[#ECE5DD] flex flex-col" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc6\' fill-opacity=\'0.25\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                    {/* Chat messages frozen */}
                    <div className="pt-6 px-2">
                      <div className="bg-white/90 rounded-lg px-2 py-1 mb-3 text-center shadow-sm">
                        <span className="text-[9px] text-safenet-text-3">Yesterday</span>
                      </div>
                      <div className="flex items-start gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">T</div>
                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-2.5 py-1.5 max-w-[75%]">
                          <div className="text-[8px] font-semibold text-safenet-text-3 mb-0.5">Thabo</div>
                          <span className="text-[10px] text-safenet-text">bro nobody even likes you at school</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">T</div>
                        <div className="bg-red-50 rounded-2xl rounded-bl-sm px-2.5 py-1.5 max-w-[75%] border-l-[2px] border-safenet-danger">
                          <div className="text-[8px] font-semibold text-safenet-text-3 mb-0.5">Thabo <span className="text-red-500 font-bold">⚠️</span></div>
                          <span className="text-[10px] text-safenet-text">you should just stay home and disappear</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-display text-heading-lg text-safenet-text mb-3">
              See Luna catch a threat live
            </h2>
            <p className="text-base text-safenet-text-2 mb-6 max-w-md mx-auto lg:mx-0">
              Watch the exact moment Luna detects and blocks cyberbullying on WhatsApp — in real time, in under a second.
            </p>
            <Link to="/demo">
              <Button variant="primary" size="lg">
                <RotateCcw className="w-5 h-5" />
                Watch Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Stats Strip
function StatsStrip() {
  const statsRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(statsRef.current?.children || [], { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: statsRef.current, start: 'top 85%', once: true },
      })
    }, statsRef)
    return () => ctx.revert()
  }, [])

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {homepageStats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              description={stat.description}
              suffix={stat.suffix || ''}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <SEO
        title="SafeNet SA — Digital Safety for South African Families"
        description="The only digital safety platform built for South African families. Monitors WhatsApp. Speaks Zulu. POPIA compliant. Ready in 5 minutes."
        canonicalPath="/"
        jsonLd={[organizationSchema, softwareSchema]}
      />
      <div className="min-h-screen bg-white">
        <Nav />
        <Hero />
        <TrustBar />
        <Problem />
        <HowItWorks />
        <FeaturesBento />
        <LunaShowcase />
        <ForSchools />
        <LanguagesSection />
        <Pricing />
        <Testimonials />
        <FinalCTA />
        {/* New sections appended before footer */}
        <HowLunaProtects />
        <LunaVoiceTeaser />
        <LiveDemoTeaser />
        <StatsStrip />
        <Footer />
      </div>
    </>
  )
}
