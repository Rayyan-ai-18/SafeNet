import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Shield, Moon, Smartphone, WifiOff } from 'lucide-react'
import SEO from '../components/seo/SEO'
import DashboardShell from '../components/layout/DashboardShell'
import ScreenTimeChart from '../components/dashboard/ScreenTimeChart'
import AppBlockGrid from '../components/dashboard/AppBlockGrid'
import PauseToggle from '../components/dashboard/PauseToggle'

const childSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA - Child Profile & Device Controls',
  description: 'Manage your child\'s SafeNet SA profile. View screen time, block apps, set bedtime, and control internet access from one place.',
  url: 'https://safenet-sa.co.za/child',
  isPartOf: {
    '@type': 'Organization',
    name: 'SafeNet SA',
    url: 'https://safenet-sa.co.za',
  },
  about: {
    '@type': 'Thing',
    name: 'Child device management and parental controls',
  },
}

export default function Child() {
  const { childId } = useParams()
  const [internetPaused, setInternetPaused] = useState(false)
  const [bedtimeEnabled, setBedtimeEnabled] = useState(false)
  const [bedtimeStart, setBedtimeStart] = useState('20:00')
  const [bedtimeEnd, setBedtimeEnd] = useState('07:00')

  return (
    <DashboardShell>
      <SEO
        title="SafeNet SA - Child Profile & Device Controls"
        description="Manage your child's SafeNet SA profile. View screen time, block apps, set bedtime, and control internet access from one place."
        canonicalPath="/child"
        jsonLd={childSchema}
      />
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back */}
        <motion.a
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-safenet-text-2 hover:text-safenet-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.a>

        {/* Hero: Child info + pause control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-card-lg p-6 lg:p-8 border border-safenet-border shadow-safenet-sm"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-safenet-primary to-safenet-primary-dark flex items-center justify-center text-white font-bold text-2xl">
                L
              </div>
              <div>
                <h1 className="font-display text-heading-lg text-safenet-text">Liam</h1>
                <div className="flex items-center gap-2 mt-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-green-500"
                  />
                  <span className="text-sm text-safenet-text-2">Online</span>
                  <span className="text-sm text-safenet-text-3">·</span>
                  <span className="text-sm text-safenet-text-3">Android</span>
                </div>
              </div>
            </div>

            {/* Large pause toggle */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <PauseToggle
                  checked={!internetPaused}
                  onChange={() => setInternetPaused(!internetPaused)}
                  label=""
                />
                <span className="text-xs text-safenet-text-2 mt-1">
                  {internetPaused ? 'Internet paused' : 'Internet active'}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-card-lg border-2 transition-all ${
                internetPaused
                  ? 'bg-safenet-danger-light border-safenet-danger/30'
                  : 'bg-safenet-primary-light border-safenet-primary/20'
              }`}>
                <span className={`text-base font-semibold ${
                  internetPaused ? 'text-safenet-danger' : 'text-safenet-primary'
                }`}>
                  {internetPaused ? 'PAUSED' : 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Screen time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-safenet-primary" />
              <h3 className="font-display text-heading-sm text-safenet-text">Screen Time</h3>
            </div>
            <ScreenTimeChart used={127} limit={180} />
          </motion.div>

          {/* App blocking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-safenet-primary" />
              <h3 className="font-display text-heading-sm text-safenet-text">App Controls</h3>
            </div>
            <AppBlockGrid />
          </motion.div>
        </div>

        {/* Bedtime */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-safenet-primary" />
              <div>
                <h3 className="font-display text-heading-sm text-safenet-text">Bedtime</h3>
                <p className="text-sm text-safenet-text-2">Restrict internet access during sleeping hours</p>
              </div>
            </div>
            <PauseToggle
              checked={bedtimeEnabled}
              onChange={() => setBedtimeEnabled(!bedtimeEnabled)}
              label=""
            />
          </div>

          {bedtimeEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex flex-wrap items-center gap-4 pt-4 border-t border-safenet-border"
            >
              <div>
                <label className="block text-xs font-medium text-safenet-text-2 mb-1">From</label>
                <input
                  type="time"
                  value={bedtimeStart}
                  onChange={(e) => setBedtimeStart(e.target.value)}
                  className="px-3 py-2 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                />
              </div>
              <span className="text-safenet-text-3 mt-5">→</span>
              <div>
                <label className="block text-xs font-medium text-safenet-text-2 mb-1">To</label>
                <input
                  type="time"
                  value={bedtimeEnd}
                  onChange={(e) => setBedtimeEnd(e.target.value)}
                  className="px-3 py-2 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                />
              </div>
              <button className="px-4 py-2 bg-safenet-primary text-white rounded-btn text-sm font-medium hover:bg-safenet-primary-dark transition-colors mt-4 sm:mt-0">
                Save Schedule
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  )
}
