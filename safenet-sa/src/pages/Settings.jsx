import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Globe, CreditCard, Shield, Check, ChevronRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import DashboardShell from '../components/layout/DashboardShell'

const tabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'plan', label: 'Plan', icon: CreditCard },
  { id: 'privacy', label: 'Privacy', icon: Shield },
]

const languages = [
  { code: 'en', name: 'English', native: 'English', speakers: '1.5M' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', speakers: '6.5M' },
  { code: 'zu', name: 'isiZulu', native: 'isiZulu', speakers: '12M' },
  { code: 'xh', name: 'isiXhosa', native: 'isiXhosa', speakers: '8.2M' },
  { code: 'st', name: 'Sesotho', native: 'Sesotho', speakers: '3.8M' },
  { code: 'tn', name: 'Setswana', native: 'Setswana', speakers: '4.1M' },
  { code: 'nso', name: 'Sepedi', native: 'Sepedi', speakers: '4.6M' },
  { code: 've', name: 'Tshivenḓa', native: 'Tshivenḓa', speakers: '1.3M' },
  { code: 'ts', name: 'Xitsonga', native: 'Xitsonga', speakers: '2.3M' },
  { code: 'ss', name: 'siSwati', native: 'siSwati', speakers: '1.3M' },
  { code: 'nr', name: 'isiNdebele', native: 'isiNdebele', speakers: '1.1M' },
]

const settingsSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA - Account & Privacy Settings',
  description: 'Manage your SafeNet SA account, language preferences, subscription plan, and POPIA privacy settings.',
  url: 'https://safenet-sa.co.za/settings',
  isPartOf: {
    '@type': 'Organization',
    name: 'SafeNet SA',
    url: 'https://safenet-sa.co.za',
  },
  about: {
    '@type': 'Thing',
    name: 'Parental control account settings and privacy management',
  },
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account')
  const [selectedLang, setSelectedLang] = useState('en')

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm">
              <h3 className="font-display text-heading-sm text-safenet-text mb-4">Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-safenet-text mb-1.5">Full name</label>
                  <input
                    type="text"
                    defaultValue="Parent Name"
                    className="w-full px-3.5 py-2.5 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-safenet-text mb-1.5">Phone number</label>
                  <input
                    type="tel"
                    defaultValue="+27 82 123 4567"
                    className="w-full px-3.5 py-2.5 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-safenet-text mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue="parent@example.com"
                    className="w-full px-3.5 py-2.5 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                  />
                </div>
                <button className="px-5 py-2.5 bg-safenet-primary text-white rounded-btn text-sm font-medium hover:bg-safenet-primary-dark transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm">
              <h3 className="font-display text-heading-sm text-safenet-text mb-4">Danger Zone</h3>
              <p className="text-sm text-safenet-text-2 mb-4">Permanently delete your account and all associated data.</p>
              <button className="px-5 py-2.5 bg-safenet-danger text-white rounded-btn text-sm font-medium hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-4">
            <p className="text-sm text-safenet-text-2 mb-4">
              Choose your preferred language for alerts, notifications, and the Luna AI interface.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`
                    flex items-center justify-between p-4 rounded-card-lg border-2 transition-all
                    ${selectedLang === lang.code
                      ? 'border-safenet-primary bg-safenet-primary-light'
                      : 'border-safenet-border bg-white hover:border-safenet-primary/30'
                    }
                  `}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-safenet-text">{lang.native}</div>
                    <div className="text-xs text-safenet-text-3">{lang.name} · {lang.speakers} speakers</div>
                  </div>
                  {selectedLang === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-safenet-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case 'plan':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-heading-sm text-safenet-text">Current Plan</h3>
                  <p className="text-sm text-safenet-text-2">You are on the Guardian plan</p>
                </div>
                <span className="px-3 py-1 bg-safenet-primary-light text-safenet-primary rounded-full text-xs font-semibold">
                  R89/month
                </span>
              </div>
              <div className="space-y-2">
                {['Up to 4 children', '11 language support', 'Voice alerts', 'Weekly digest', 'Priority support'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-safenet-text-2">
                    <Check className="w-4 h-4 text-safenet-primary" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm">
              <h3 className="font-display text-heading-sm text-safenet-text mb-4">Billing</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-safenet-surface rounded-card-lg">
                  <span className="text-sm text-safenet-text">Next payment</span>
                  <span className="text-sm font-medium text-safenet-text">R89 on 1 July 2026</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-safenet-surface rounded-card-lg">
                  <span className="text-sm text-safenet-text">Payment method</span>
                  <span className="text-sm font-medium text-safenet-text">Visa ···· 4242</span>
                </div>
                <button className="text-sm text-safenet-primary font-medium hover:underline">
                  Manage billing →
                </button>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm">
              <h3 className="font-display text-heading-sm text-safenet-text mb-4">POPIA Compliance</h3>
              <p className="text-sm text-safenet-text-2 leading-relaxed mb-4">
                SafeNet SA is fully compliant with the Protection of Personal Information Act (POPIA) of South Africa. 
                Your data is processed lawfully, transparently, and for the specific purpose of child safety monitoring.
              </p>
              <div className="space-y-3">
                {[
                  { title: 'Data collected', desc: 'Real-time location, app usage, screen time, alert data' },
                  { title: 'Data storage', desc: 'Alert data: 90 days. Location data: 30 days. Message content: never stored.' },
                  { title: 'Data processing', desc: 'All WhatsApp analysis is on-device. No message content leaves the device.' },
                  { title: 'Your rights', desc: 'Access, rectify, delete, and object to processing at any time.' },
                ].map((item) => (
                  <div key={item.title} className="p-3 bg-safenet-surface rounded-card-lg">
                    <div className="text-sm font-semibold text-safenet-text mb-0.5">{item.title}</div>
                    <div className="text-xs text-safenet-text-2">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-card-lg p-6 border border-safenet-border shadow-safenet-sm">
              <h3 className="font-display text-heading-sm text-safenet-text mb-4">Data Export</h3>
              <p className="text-sm text-safenet-text-2 mb-4">Download all data SafeNet SA holds about your family.</p>
              <button className="px-5 py-2.5 bg-safenet-primary text-white rounded-btn text-sm font-medium hover:bg-safenet-primary-dark transition-colors">
                Request Data Export
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardShell>
      <SEO
        title="SafeNet SA - Account & Privacy Settings"
        description="Manage your SafeNet SA account, language preferences, subscription plan, and POPIA privacy settings."
        canonicalPath="/settings"
        jsonLd={settingsSchema}
      />
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-6 h-6 text-safenet-primary" />
            <h1 className="font-display text-display-sm text-safenet-text">Settings</h1>
          </div>
          <p className="text-sm text-safenet-text-2">Manage your account, language, plan, and privacy</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-safenet-primary text-white shadow-safenet-sm'
                    : 'bg-white text-safenet-text-2 border border-safenet-border hover:border-safenet-primary/30'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </DashboardShell>
  )
}
