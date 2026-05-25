import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Shield, Bot } from 'lucide-react'
import { gsap } from '../../lib/gsap'
import Button from '../ui/Button'

const translations = {
  en: {
    features: 'Features',
    howItWorks: 'How it works',
    pricing: 'Pricing',
    forSchools: 'For Schools',
    languages: 'Languages',
    howItWorksPage: 'How It Works',
    liveDemo: 'Live Demo',
    talkToLuna: 'Talk to Luna',
    signIn: 'Sign in',
    protectMyChild: 'Protect My Child',
    dashboard: 'Dashboard',
    poweredBy: 'Powered by Luna AI',
  },
  zu: {
    features: 'Izici',
    howItWorks: 'Isebenza kanjani',
    pricing: 'Intengo',
    forSchools: 'Izikole',
    languages: 'Izilimi',
    howItWorksPage: 'Isebenza Kanjani',
    liveDemo: 'Umbukiso',
    talkToLuna: 'Khuluma noLuna',
    signIn: 'Ngena ngemvume',
    protectMyChild: 'Vikela Ingane Yami',
    dashboard: 'Ideshibhodi',
    poweredBy: 'Ixhaswe uLuna AI',
  },
}

const navLinks = [
  { key: 'features', href: '#features' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'pricing', href: '#pricing' },
  { key: 'forSchools', href: '#for-schools' },
  { key: 'languages', href: '#languages' },
]

const extraPages = [
  { key: 'howItWorksPage', path: '/how-it-works' },
  { key: 'liveDemo', path: '/demo', highlight: true },
  { key: 'talkToLuna', path: '/luna', icon: Bot },
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
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-safenet-primary flex items-center justify-center transition-shadow group-hover:shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-safenet-text tracking-tight">SafeNet SA</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {/* Landing anchor links */}
            {isLanding && navLinks.map((link, i) => (
              <a
                key={link.key}
                ref={el => linksRef.current[i] = el}
                href={link.href}
                className="text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors"
              >
                {t[link.key]}
              </a>
            ))}
            {/* Extra pages */}
            {extraPages.map((page) => {
              const isActive = location.pathname === page.path
              const Icon = page.icon
              return (
                <Link
                  key={page.key}
                  to={page.path}
                  className={`text-sm font-medium transition-colors ${
                    page.highlight
                      ? 'inline-flex items-center gap-1.5 px-4 py-1.5 bg-safenet-primary-light text-safenet-primary rounded-full hover:bg-safenet-primary/20'
                      : isActive
                        ? 'text-safenet-primary'
                        : 'text-safenet-text-2 hover:text-safenet-text'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {t[page.key]}
                </Link>
              )
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-6 pl-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-safenet-surface border border-safenet-border text-sm font-medium text-safenet-text-2 hover:text-safenet-text hover:bg-safenet-primary-light/50 transition-all duration-200"
              title="Toggle language"
            >
              <span className="text-base leading-none">🇿🇦</span>
              {lang === 'en' ? 'EN' : 'ZU'}
            </button>
            {user ? (
              <Link to="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors">
                  {t.signIn}
                </Link>
                <Link to="/auth">
                  <Button variant="primary" size="sm">{t.protectMyChild}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile language toggle */}
          <button
            onClick={toggleLang}
            className="lg:hidden p-2 rounded-lg hover:bg-safenet-surface transition-colors mr-1 text-xs font-medium text-safenet-text-2"
          >
            {lang === 'en' ? '🇿🇦 EN' : '🇿🇦 ZU'}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-safenet-surface transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-safenet-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">              {navLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-base font-medium text-safenet-text-2 hover:text-safenet-text py-2"
                  >
                    {t[link.key]}
                  </a>
                ))}
                {/* Extra pages in mobile menu */}
                <div className="pt-2 pb-2 border-b border-safenet-border space-y-2">
                  <div className="px-2 pb-2">
                    <span className="text-[10px] font-semibold text-safenet-text-3 uppercase tracking-widest">Pages</span>
                  </div>
                  {extraPages.map((page) => {
                    const Icon = page.icon
                    return (
                      <Link
                        key={page.key}
                        to={page.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 text-base font-medium py-2 ${
                          page.highlight
                            ? 'text-safenet-primary'
                            : 'text-safenet-text-2 hover:text-safenet-text'
                        }`}
                      >
                        {Icon && <Icon className="w-5 h-5" />}
                        {t[page.key]}
                      </Link>
                    )
                  })}
                </div>
              <div className="pt-4 border-t border-safenet-border space-y-3">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" className="w-full">{t.dashboard}</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full">{t.signIn}</Button>
                    </Link>
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" className="w-full">{t.protectMyChild}</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
