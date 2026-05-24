import React from 'react'
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
        <Footer />
      </div>
    </>
  )
}
