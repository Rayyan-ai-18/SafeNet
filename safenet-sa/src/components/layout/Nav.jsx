import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Shield } from 'lucide-react'
import { gsap } from '../../lib/gsap'
import Button from '../ui/Button'

const translations = {
  en: {
    liveDemo: 'Live Demo',
    talkToLuna: 'Talk to Luna',
    howItWorksPage: 'How It Works',
    getStarted: 'Get Started Free',
    dashboard: 'Dashboard',
  },
  zu: {
    liveDemo: 'Umbukiso',
    talkToLuna: 'Khuluma noLuna',
    howItWorksPage: 'Isebenza Kanjani',
    getStarted: 'Qala Mahhala',
    dashboard: 'Ideshibhodi',
  },
}

const navLinks = [
  { key: 'liveDemo', path: '/demo', highlight: true },
  { key: 'howItWorksPage', path: '/how-it-works' },
]

export default function Nav({ user }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lang, setLang] = useState(() => localStorage.getItem('safenet_lang') || 'en')
  const navRef = useRef(null)
  const linksRef = useRef([])
  const location = useLocation()
  const isLanding = location.pathname === '/'

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'zu' : 'en'
    setLang(newLang)
    localStorage.setItem('safenet_lang', newLang)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!navRef.current) return
    gsap.fromTo(navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
    gsap.fromTo(linksRef.current,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.1 }
    )
  }, [])

  const t = translations[lang] || translations.en

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 nav-blur border-b border-safenet-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-safenet-primary flex items-center justify-center transition-shadow group-hover:shadow-lg">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <span className="font-display text-lg lg:text-xl text-safenet-text tracking-tight">SafeNet SA</span>
          </Link>

          {/* Desktop nav - minimal */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.key}
                  to={link.path}
                  ref={el => linksRef.current[navLinks.indexOf(link)] = el}
                  className={`text-sm font-medium transition-colors ${
                    link.highlight
                      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-safenet-primary-light text-safenet-primary rounded-full hover:bg-safenet-primary/20'
                      : isActive
                        ? 'text-safenet-primary'
                        : 'text-safenet-text-2 hover:text-safenet-text'
                  }`}
                >
                  {link.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-safenet-primary" />
                  )}
                  {t[link.key]}
                </Link>
              )
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-safenet-surface border border-safenet-border text-[11px] font-medium text-safenet-text-2 hover:text-safenet-text hover:bg-safenet-primary-light/50 transition-all duration-200"
              title="Toggle language"
            >
              <span className="text-xs leading-none">🇿🇦</span>
              {lang === 'en' ? 'EN' : 'ZU'}
            </button>
            {user ? (
              <Link to="/dashboard">
                <Button variant="secondary" size="sm">{t.dashboard}</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="primary" size="sm" className="px-4">{t.getStarted}</Button>
              </Link>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              onClick={toggleLang}
              className="px-2 py-1.5 rounded-lg hover:bg-safenet-surface transition-colors text-xs font-medium text-safenet-text-2"
            >
              🇿🇦
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-safenet-surface transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - clean, minimal */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-safenet-border overflow-hidden"
          >
            <div className="px-4 py-5 space-y-1">
              {navLinks.map((link) => {
                return (
                  <Link
                    key={link.key}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-card-lg text-base font-medium transition-colors ${
                      link.highlight
                        ? 'bg-safenet-primary-light text-safenet-primary'
                        : 'text-safenet-text-2 hover:text-safenet-text hover:bg-safenet-surface'
                    }`}
                  >
                    {t[link.key]}
                    {link.highlight && (
                      <span className="ml-auto px-2 py-0.5 bg-safenet-primary text-white text-[9px] font-semibold rounded-full">Live</span>
                    )}
                  </Link>
                )
              })}
              <div className="pt-2 mt-2 border-t border-safenet-border">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" className="w-full">{t.dashboard}</Button>
                  </Link>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" className="w-full">{t.getStarted}</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
