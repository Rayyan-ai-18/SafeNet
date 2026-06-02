import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, MessageCircle, MapPin, Lock, Languages, WifiOff, Clock, Navigation, Bell } from 'lucide-react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import Toggle from '../ui/Toggle'

const bentoCards = [
  {
    title: 'WhatsApp Monitoring',
    desc: 'We are the only platform that reads WhatsApp threats in isiZulu, Afrikaans, Sotho and isiXhosa, all on the phone itself. The messages never leave the device, so it stays POPIA safe.',
    icon: MessageCircle,
    span: 'lg:col-span-2 lg:row-span-2',
    variant: 'primary',
    pills: ['On-device NLP', 'Never transmitted', 'SA languages'],
  },
  {
    title: 'Luna AI Alerts',
    desc: 'Someone sent Liam a fake SASSA link claiming R1,500. Luna blocked it instantly.',
    icon: Shield,
    span: 'lg:col-span-1 lg:row-span-1',
    variant: 'default',
    alertPreview: true,
  },
  {
    title: 'Internet Pause',
    desc: 'Pause the internet with one tap.',
    icon: WifiOff,
    span: 'lg:col-span-1 lg:row-span-1',
    variant: 'default',
    pauseToggle: true,
  },
  {
    title: 'GPS Location',
    desc: 'Always know where your child is.',
    icon: MapPin,
    span: 'lg:col-span-2 lg:row-span-1',
    variant: 'surface',
  },
  {
    title: 'Cannot Be Uninstalled',
    desc: 'Your child cannot remove it.',
    icon: Lock,
    span: 'lg:col-span-1 lg:row-span-1',
    variant: 'default',
  },
  {
    title: '11 Languages',
    desc: 'Alerts in every South African language, so the news reaches you in the words you actually speak at home.',
    icon: Languages,
    span: 'lg:col-span-2 lg:row-span-1',
    variant: 'surface',
    languages: ['English', 'isiZulu', 'Afrikaans', 'isiXhosa', 'Sesotho', 'Setswana', 'Sepedi', 'Tshivenḓa', 'Xitsonga', 'siSwati', 'isiNdebele'],
  },
  {
    title: 'Screen Time Reports',
    desc: 'Daily and weekly breakdown of your child\'s app usage.',
    icon: Clock,
    span: 'lg:col-span-1 lg:row-span-1',
    variant: 'default',
    screenTime: true,
  },
  {
    title: 'Safe Zones',
    desc: 'Get notified when your child arrives or leaves home, school, or other trusted places.',
    icon: Navigation,
    span: 'lg:col-span-1 lg:row-span-1',
    variant: 'default',
    safeZones: true,
  },
  {
    title: 'School Hours Mode',
    desc: 'Quietly switch off the distractions during class. Set it once and you can forget about it.',
    icon: Bell,
    span: 'lg:col-span-2 lg:row-span-1',
    variant: 'surface',
    schoolHours: true,
  },
]

export default function FeaturesBento() {
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
          opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="features" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={labelRef} className="text-center mb-4">
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full">
            Features
          </span>
        </div>

        <h2 ref={headlineRef} className="font-display text-display-sm sm:text-display-md text-center text-safenet-text mb-16 max-w-3xl mx-auto">
          Everything you need to keep your child safe
        </h2>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-[200px]">
          {bentoCards.map((card, i) => (
            <motion.div
              key={card.title}
              ref={el => cardsRef.current[i] = el}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`
                relative rounded-card-lg p-6 lg:p-8 overflow-hidden
                ${card.span}
                ${card.variant === 'primary' ? 'bg-safenet-primary text-white grain-overlay' : ''}
                ${card.variant === 'default' ? 'bg-white border border-safenet-border shadow-safenet-sm' : ''}
                ${card.variant === 'surface' ? 'bg-safenet-surface border border-safenet-border' : ''}
                ${card.title === 'Internet Pause' ? 'flex flex-col items-center justify-center' : ''}
                ${card.title === 'Cannot Be Uninstalled' ? 'flex flex-col items-center justify-center' : ''}
              `}
            >
              {/* WhatsApp Monitoring - large card */}
              {card.variant === 'primary' && (
                <>
                  <div className="relative z-10">
                    <card.icon className="w-10 h-10 text-white/90 mb-4" />
                    <h3 className="font-display text-heading-lg text-white mb-3">{card.title}</h3>
                    <p className="text-sm text-white/80 leading-relaxed max-w-md">{card.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {card.pills.map(pill => (
                        <span key={pill} className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-white/15 text-white/90 rounded-full border border-white/20">
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Luna AI Alerts */}
              {card.alertPreview && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon className="w-5 h-5 text-safenet-primary" />
                    <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  </div>
                  <div className="bg-amber-50 border-l-[3px] border-safenet-accent rounded-lg p-3">
                    <div className="text-xs font-semibold text-amber-800 mb-1">⚠ Phishing blocked</div>
                    <p className="text-xs text-amber-700/80 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              )}

              {/* Internet Pause */}
              {card.pauseToggle && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Toggle className="mb-3" />
                  <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  <p className="text-sm text-safenet-text-2 mt-1">{card.desc}</p>
                </div>
              )}

              {/* GPS Location */}
              {card.title === 'GPS Location' && !card.alertPreview && !card.pauseToggle && card.variant === 'surface' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon className="w-5 h-5 text-safenet-primary" />
                    <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  </div>
                  <p className="text-sm text-safenet-text-2 mb-3">{card.desc}</p>
                  <div className="bg-safenet-primary/5 rounded-lg p-3 border border-safenet-primary/10">
                    <div className="flex items-center gap-2 text-xs text-safenet-text-2">
                      <div className="w-2 h-2 rounded-full bg-safenet-primary pulse-dot" />
                      <span>Current location updated 2 min ago</span>
                    </div>
                    <div className="mt-2 h-16 bg-gradient-to-br from-safenet-primary/10 to-safenet-primary/5 rounded-md flex items-center justify-center">
                      <span className="text-[10px] text-safenet-text-3">Map preview</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cannot Be Uninstalled */}
              {card.title === 'Cannot Be Uninstalled' && !card.alertPreview && !card.pauseToggle && card.variant === 'default' && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <card.icon className="w-8 h-8 text-safenet-primary mb-3" />
                  <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  <p className="text-sm text-safenet-text-2 mt-1">{card.desc}</p>
                </div>
              )}

              {/* 11 Languages */}
              {card.languages && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <card.icon className="w-5 h-5 text-safenet-primary" />
                    <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  </div>
                  <p className="text-sm text-safenet-text-2 mb-4">{card.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {card.languages.map((lang, li) => (
                      <motion.span
                        key={lang}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: li * 0.05 }}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-white text-safenet-text-2 rounded-full border border-safenet-border"
                      >
                        {lang}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Screen Time Reports */}
              {card.screenTime && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon className="w-5 h-5 text-safenet-primary" />
                    <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  </div>
                  <p className="text-sm text-safenet-text-2 mb-auto">{card.desc}</p>
                  {/* Mini chart */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-safenet-text-3 w-14">WhatsApp</span>
                      <div className="flex-1 h-3 bg-safenet-surface rounded-full overflow-hidden">
                        <div className="h-full w-[65%] bg-safenet-primary rounded-full" />
                      </div>
                      <span className="text-[10px] font-medium text-safenet-text-2">45m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-safenet-text-3 w-14">YouTube</span>
                      <div className="flex-1 h-3 bg-safenet-surface rounded-full overflow-hidden">
                        <div className="h-full w-[35%] bg-safenet-accent rounded-full" />
                      </div>
                      <span className="text-[10px] font-medium text-safenet-text-2">22m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-safenet-text-3 w-14">TikTok</span>
                      <div className="flex-1 h-3 bg-safenet-surface rounded-full overflow-hidden">
                        <div className="h-full w-[25%] bg-blue-400 rounded-full" />
                      </div>
                      <span className="text-[10px] font-medium text-safenet-text-2">15m</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Safe Zones */}
              {card.safeZones && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon className="w-5 h-5 text-safenet-primary" />
                    <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  </div>
                  <p className="text-sm text-safenet-text-2 mb-auto">{card.desc}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2.5 bg-safenet-surface rounded-lg px-3 py-2 border border-safenet-border">
                      <div className="w-6 h-6 rounded-full bg-safenet-primary-light flex items-center justify-center">
                        <svg className="w-3 h-3 text-safenet-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-safenet-text">Home</div>
                        <div className="text-[10px] text-safenet-primary">Liam arrived 15m ago</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-safenet-primary" />
                    </div>
                    <div className="flex items-center gap-2.5 bg-safenet-surface rounded-lg px-3 py-2 border border-safenet-border">
                      <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                        <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-safenet-text">St. John\'s School</div>
                        <div className="text-[10px] text-safenet-text-3">Awaiting arrival</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-safenet-text-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* School Hours Mode */}
              {card.schoolHours && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon className="w-5 h-5 text-safenet-primary" />
                    <h3 className="font-display text-heading-sm text-safenet-text">{card.title}</h3>
                  </div>
                  <p className="text-sm text-safenet-text-2 mb-4">{card.desc}</p>
                  <div className="flex items-center gap-4 mt-auto">
                    {/* Schedule preview */}
                    <div className="flex-1 bg-safenet-primary/5 rounded-lg p-3 border border-safenet-primary/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-safenet-text uppercase tracking-wider">Today</span>
                        <span className="text-[10px] text-safenet-primary font-medium">Active</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-safenet-text-3">08:00 – 13:00</span>
                          <span className="text-safenet-text-2">Morning</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-safenet-text-3">13:30 – 15:30</span>
                          <span className="text-safenet-text-2">Afternoon</span>
                        </div>
                      </div>
                    </div>
                    {/* Pause indicator */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-safenet-primary-light flex items-center justify-center">
                        <Bell className="w-5 h-5 text-safenet-primary" />
                      </div>
                      <span className="text-[10px] font-medium text-safenet-text-2">On Schedule</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
