import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mic, ArrowRight, Sparkles, RotateCcw, ExternalLink, HelpCircle } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Hero from '../components/marketing/Hero'
import TrustBar from '../components/marketing/TrustBar'
import Problem from '../components/marketing/Problem'
import HowItWorks from '../components/marketing/HowItWorks'
import FeaturesBento from '../components/marketing/FeaturesBento'
import ForSchools from '../components/marketing/ForSchools'
import LanguagesSection from '../components/marketing/LanguagesSection'
import Pricing from '../components/marketing/Pricing'
import Testimonials from '../components/marketing/Testimonials'
import ContactSection from '../components/marketing/ContactSection'
import FinalCTA from '../components/marketing/FinalCTA'
import LunaOrb from '../components/ui/LunaOrb'
import { useLunaVoice } from '../hooks/useLunaVoice'
import { gsap, ScrollTrigger } from '../lib/gsap'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'

const faqItems = [
  {
    q: 'How does SafeNet protect my child online?',
    a: 'Luna watches WhatsApp, TikTok and Instagram for grooming and bullying, and checks every link before your child taps it, so phishing sites, fake SASSA scams and adult content get stopped. When something is wrong, you get a notification within about a second telling you what kind of threat it was. <LinkInternal to="/how-it-works">See how it works →</LinkInternal>',
  },
  {
    q: 'Is my child\'s privacy protected?',
    a: 'Yes, and it works that way from the start. All the analysis happens on your child\'s own phone. The messages themselves never leave the device and are never stored, so you see that a threat was found, not the private conversation. That is what keeps SafeNet POPIA compliant. <ExternalLink href="https://popia.co.za">Learn about POPIA compliance →</ExternalLink>',
  },
  {
    q: 'Does SafeNet work in isiZulu and other SA languages?',
    a: 'Yes. Luna speaks English and isiZulu today, and the rest of the 11 official languages are on the way. A scam in Sesotho or bullying in isiZulu reads completely differently to an English-only filter, and closing that gap is exactly why we built Luna. <LinkInternal to="/luna">Talk to Luna in your language →</LinkInternal>',
  },
  {
    q: 'How much does SafeNet cost?',
    a: 'You can start free, with WhatsApp monitoring, Luna alerts and basic location tracking. Guardian (R89/month) adds up to 4 children, all 11 languages and voice alerts. Sentinel (R149/month) adds unlimited children, School Shield and 24/7 phone support. <LinkInternal to="/auth">Start free →</LinkInternal>',
  },
  {
    q: 'On which phones does SafeNet work?',
    a: 'SafeNet runs on Android, and it is tuned for the affordable phones most SA families actually use, like the Samsung A-series, rather than a high-end test device. WhatsApp monitoring, location, screen time and app blocking all work on Android, and iPhone support is on the way. According to <ExternalLink href="https://www.unicef.org/southafrica/reports">UNICEF South Africa</ExternalLink>, 94% of SA teens get online by smartphone, so that is where we start.',
  },
  {
    q: 'How is SafeNet different from other parental control apps?',
    a: 'SafeNet is the only child-safety app that genuinely speaks isiZulu and understands how scams and grooming work in a South African context. The detection is trained on local languages, slang and patterns, not translated in from elsewhere. We work with <ExternalLink href="https://www.childlinesa.org.za">Childline South Africa</ExternalLink>, and because the analysis stays on the phone, your child\'s privacy is protected by design.',
  },
]

function FAQSection() {
  const sectionRef = useRef(null)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="faq" ref={sectionRef} className="bg-white py-16 lg:py-20 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="font-display text-display-sm text-safenet-text max-w-xl mx-auto">
            Frequently asked questions
          </h2>
          <p className="text-base text-safenet-text-2 max-w-lg mx-auto mt-3">
            Everything you need to know about keeping your child safe with SafeNet SA.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="bg-white rounded-card-lg border border-safenet-border overflow-hidden transition-shadow hover:shadow-safenet-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-sm font-semibold text-safenet-text leading-snug pr-2">
                    {item.q}
                  </h3>
                  <HelpCircle className={`w-4 h-4 flex-shrink-0 text-safenet-text-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-sm text-safenet-text-2 leading-relaxed space-y-2">
                    {/* Render the answer with potential link components */}
                    <AnswerRenderer text={item.a} />
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Internal & External links in context */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
          <Link to="/how-it-works" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ArrowRight className="w-3 h-3" />
            Read our full guide
          </Link>
          <Link to="/demo" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ArrowRight className="w-3 h-3" />
            Watch the demo
          </Link>
          <a href="https://www.childlinesa.org.za" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ExternalLink className="w-3 h-3" />
            Childline SA
          </a>
          <a href="https://www.unicef.org/southafrica/reports" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-safenet-surface rounded-full text-safenet-text-2 hover:text-safenet-primary transition-colors border border-safenet-border">
            <ExternalLink className="w-3 h-3" />
            UNICEF SA Reports
          </a>
        </div>
      </div>
    </section>
  )
}

// Helper to render FAQ answers with inline links
function AnswerRenderer({ text }) {
  // Parse the text for custom link components
  const parts = text.split(/(<LinkInternal[^>]*>[^<]*<\/LinkInternal>|<ExternalLink[^>]*>[^<]*<\/ExternalLink>|<strong>[^<]*<\/strong>)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null
        const linkInternalMatch = part.match(/<LinkInternal to="([^"]+)">([^<]*)<\/LinkInternal>/)
        const externalLinkMatch = part.match(/<ExternalLink href="([^"]+)">([^<]*)<\/ExternalLink>/)
        const strongMatch = part.match(/<strong>([^<]*)<\/strong>/)
        
        if (linkInternalMatch) {
          return <Link key={i} to={linkInternalMatch[1]} className="text-safenet-primary font-medium hover:underline">{linkInternalMatch[2]}</Link>
        }
        if (externalLinkMatch) {
          return <a key={i} href={externalLinkMatch[1]} target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline inline-flex items-center gap-1">{externalLinkMatch[2]} <ExternalLink className="w-3 h-3" /></a>
        }
        if (strongMatch) {
          return <strong key={i} className="font-semibold text-safenet-text">{strongMatch[1]}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}


const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does SafeNet SA protect my child online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SafeNet SA uses Luna AI to monitor WhatsApp, TikTok, and Instagram for cyberbullying and grooming. Every link is scanned before your child taps it. Threats are detected in under a second, and parents receive instant alerts - with message content never leaving the child\'s device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is SafeNet SA compliant with South African privacy laws?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. SafeNet SA is fully POPIA compliant by architecture - not as an afterthought. All WhatsApp analysis runs on-device. Message content is never transmitted or stored. Parents see only threat alerts, not chat content.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does SafeNet work in South African languages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Luna speaks English and isiZulu today, with all 11 official South African languages on the roadmap including Afrikaans, isiXhosa, Sesotho, Setswana, Sepedi, Tshivenḓa, Xitsonga, siSwati, and isiNdebele.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does SafeNet cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SafeNet offers a free tier with basic WhatsApp monitoring, Luna AI alerts, and location tracking. The Guardian plan at R89/month covers up to 4 children with all 11 languages and voice alerts. The Sentinel plan at R149/month includes unlimited children, School Shield integration, and 24/7 phone support.',
      },
    },
    {
      '@type': 'Question',
      name: 'On which platforms does SafeNet work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SafeNet runs on Android phones (optimised for the R1,500 Samsung A-series). WhatsApp monitoring works on Android. Location tracking, screen time management, and app blocking work across Android devices. iOS support is on the roadmap.',
      },
    },
  ],
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SafeNet SA',
  url: 'https://safenet-sa.co.za',
  logo: 'https://safenet-sa.co.za/favicon.svg',
  description:
    'The only digital safety platform built for South African families. Monitors WhatsApp. Speaks isiZulu. Ready in 5 minutes.',
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
  { value: '11', suffix: '', label: 'Languages', description: 'SA languages Luna supports 🇿🇦' },
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
            Full conversation on Luna's page →
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Suggested question chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[
            'How does SafeNet protect my child?',
            'What is a honey trap?',
            'What happens when Luna detects a threat?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => sendTextInput(q)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-safenet-border text-xs font-medium text-safenet-text-2 hover:text-safenet-primary hover:border-safenet-primary transition-colors shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// Stats Strip - SECTION A
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

// Demo Teaser - SECTION D
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
    <section ref={sectionRef} className="bg-white py-16 lg:py-20">
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
                    {/* Chat messages frozen with Luna detection moment */}
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
              See Luna catch a threat in real time
            </h2>
            <p className="text-base text-safenet-text-2 mb-6 max-w-md mx-auto lg:mx-0">
              Watch the 45-second demo and see exactly how SafeNet protects your child, in English and isiZulu.
            </p>
            <Link to="/demo">
              <Button variant="primary" size="lg">
                <RotateCcw className="w-5 h-5" />
                Watch the Demo →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <SEO
        title="SafeNet SA - Digital Safety for South African Families"
        description="The only digital safety platform built for South African families. Monitors WhatsApp. Speaks isiZulu. POPIA compliant. Ready in 5 minutes."
        canonicalPath="/"
        jsonLd={[organizationSchema, softwareSchema, faqSchema]}
      />
      <div className="min-h-screen bg-white">
        <Nav />
        <Hero />
        <TrustBar />
        <StatsStrip />
        <Problem />
        <HowItWorks />
        <LunaVoiceTeaser />
        <LiveDemoTeaser />
        <div id="features" className="scroll-mt-20"><FeaturesBento /></div>
        <LanguagesSection />
        <div id="pricing" className="scroll-mt-20"><Pricing /></div>
        <div id="schools" className="scroll-mt-20"><ForSchools /></div>
        <Testimonials />

        {/* Short body text for SEO depth */}
        <section id="about" className="bg-white py-12 lg:py-16 scroll-mt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-safenet-surface rounded-card-lg p-6 lg:p-8">
              <h2 className="font-display text-heading-lg text-safenet-text mb-3">About SafeNet SA</h2>
              <p className="text-sm text-safenet-text-2 leading-relaxed">
                SafeNet SA is the first AI child-safety platform built for South African families. While global apps scan only English keywords, Luna AI detects cyberbullying, grooming, phishing and adult content in South African languages, starting with English and isiZulu. According to <a href="https://www.unicef.org/southafrica/reports" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">UNICEF South Africa</a>, 1 in 3 SA children face cyberbullying and 94% of teens are online by smartphone. SafeNet runs on-device, so message content never leaves the child's phone, and is optimised for the affordable Android phones most families use. Built with guidance from <a href="https://www.childlinesa.org.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">Childline South Africa</a>. <Link to="/how-it-works" className="text-safenet-primary font-medium hover:underline">See how SafeNet works</Link> or <Link to="/demo" className="text-safenet-primary font-medium hover:underline">watch the live demo</Link>.
              </p>
            </div>
          </div>
        </section>

        <FAQSection />
        <FinalCTA />
        <ContactSection />
        <Footer />
      </div>
    </>
  )
}
