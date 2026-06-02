import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Languages, MessageCircle, Ear, Volume2 } from 'lucide-react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

const languages = [
  { name: 'English', native: 'English', speakers: '1.5M', flag: '🇿🇦' },
  { name: 'isiZulu', native: 'isiZulu', speakers: '12M', flag: '🇿🇦' },
  { name: 'Afrikaans', native: 'Afrikaans', speakers: '6.5M', flag: '🇿🇦' },
  { name: 'isiXhosa', native: 'isiXhosa', speakers: '8.2M', flag: '🇿🇦' },
  { name: 'Sesotho', native: 'Sesotho', speakers: '3.8M', flag: '🇿🇦' },
  { name: 'Setswana', native: 'Setswana', speakers: '4.1M', flag: '🇿🇦' },
  { name: 'Sepedi', native: 'Sepedi', speakers: '4.6M', flag: '🇿🇦' },
  { name: 'Tshivenḓa', native: 'Tshivenḓa', speakers: '1.3M', flag: '🇿🇦' },
  { name: 'Xitsonga', native: 'Xitsonga', speakers: '2.3M', flag: '🇿🇦' },
  { name: 'siSwati', native: 'siSwati', speakers: '1.3M', flag: '🇿🇦' },
  { name: 'isiNdebele', native: 'isiNdebele', speakers: '1.1M', flag: '🇿🇦' },
]

const capabilities = [
  {
    icon: MessageCircle,
    title: 'WhatsApp Alerts',
    desc: 'Receive threat alerts and activity summaries in your preferred language via WhatsApp.',
  },
  {
    icon: Ear,
    title: 'Voice Alerts',
    desc: 'Luna speaks alerts aloud in English and isiZulu today, with more SA languages on the way.',
  },
  {
    icon: Volume2,
    title: 'Voice Commands',
    desc: 'Ask Luna by voice in English or isiZulu. "Ingane yami ikuphephi?" (is my child safe?), answered in isiZulu.',
  },
  {
    icon: Languages,
    title: 'Dashboard Translation',
    desc: 'Full dashboard, settings, and alert history translated into any of the 11 official languages.',
  },
]

export default function LanguagesSection() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const headlineRef = useRef(null)
  const langRef = useRef([])
  const capsRef = useRef([])

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

      gsap.fromTo(langRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1, scale: 1, stagger: 0.04, duration: 0.4, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(capsRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="languages" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label */}
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            Languages
          </span>
        </div>

        {/* Headline */}
        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-4 max-w-3xl mx-auto">
          Safety that speaks your language. All 11 of them.
        </h2>
        <p className="text-center text-safenet-text-2 text-base max-w-2xl mx-auto mb-16">
          SafeNet SA understands all 11 official South African languages.
          Every alert and the full dashboard are available in your language, with Luna's voice in English and isiZulu today and more on the way.
        </p>

        {/* Language grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-16">
          {languages.map((lang, i) => (
            <motion.div
              key={lang.name}
              ref={el => langRef.current[i] = el}
              className="bg-safenet-surface border border-safenet-border rounded-card-lg p-4 text-center hover:border-safenet-primary/30 hover:shadow-safenet-sm transition-all"
            >
              <div className="text-lg mb-1">{lang.flag}</div>
              <div className="text-sm font-semibold text-safenet-text">{lang.native}</div>
              <div className="text-[10px] text-safenet-text-3 mt-0.5">{lang.name}</div>
              <div className="text-[10px] text-safenet-primary font-medium mt-1">{lang.speakers}</div>
            </motion.div>
          ))}
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon
            return (
              <motion.div
                key={cap.title}
                ref={el => capsRef.current[i] = el}
                className="bg-safenet-surface rounded-card-lg p-6 border border-safenet-border"
              >
                <div className="w-10 h-10 rounded-xl bg-safenet-primary-light flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-safenet-primary" />
                </div>
                <h3 className="font-display text-heading-sm text-safenet-text mb-2">{cap.title}</h3>
                <p className="text-sm text-safenet-text-2 leading-relaxed">{cap.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
