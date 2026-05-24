import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Shield, ChevronDown } from 'lucide-react'
import { gsap } from '../../lib/gsap'
import Button from '../ui/Button'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'For Schools', href: '#for-schools' },
  { label: 'Languages', href: '#languages' },
]

export default function Nav({ user }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef(null)
  const linksRef = useRef([])
  const location = useLocation()
  const isLanding = location.pathname === '/'

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
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-safenet-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-xl text-safenet-text tracking-tight">SafeNet SA</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-safenet-primary-light text-safenet-primary rounded-full border border-safenet-primary/20">
                Powered by Luna AI
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          {isLanding && (
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, i) => (
                <a
                  key={link.label}
                  ref={el => linksRef.current[i] = el}
                  href={link.href}
                  className="text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors">
                  Sign in
                </Link>
                <Link to="/auth">
                  <Button variant="primary" size="sm">Protect My Child</Button>
                </Link>
              </>
            )}
          </div>

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
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-safenet-text-2 hover:text-safenet-text py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-safenet-border space-y-3">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full">Sign in</Button>
                    </Link>
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" className="w-full">Protect My Child</Button>
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
