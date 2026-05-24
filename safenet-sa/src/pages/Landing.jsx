import React from 'react'
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

export default function Landing() {
  return (
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
  )
}
