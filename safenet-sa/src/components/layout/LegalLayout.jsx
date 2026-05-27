import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import SEO from '../seo/SEO'
import Nav from './Nav'
import Footer from './Footer'

// Shared wrapper for the legal pages (Privacy, Terms, POPIA).
export default function LegalLayout({ title, description, canonicalPath, updated, children }) {
  return (
    <>
      <SEO title={`${title} - SafeNet SA`} description={description} canonicalPath={canonicalPath} />
      <div className="min-h-screen bg-white">
        <Nav />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-safenet-text-2 hover:text-safenet-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="flex items-center gap-2 mb-2 text-safenet-primary">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">SafeNet SA</span>
          </div>
          <h1 className="font-display text-display-sm text-safenet-text mb-2">{title}</h1>
          {updated && <p className="text-sm text-safenet-text-3 mb-6">Last updated: {updated}</p>}

          <div className="mb-8 rounded-card-lg bg-safenet-accent-light border border-safenet-accent/20 px-4 py-3 text-sm text-safenet-text-2">
            This is a plain-language template provided for transparency. Please have it reviewed by a
            legal professional before relying on it for compliance.
          </div>

          <div className="legal-prose space-y-5 text-[15px] leading-relaxed text-safenet-text-2">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
