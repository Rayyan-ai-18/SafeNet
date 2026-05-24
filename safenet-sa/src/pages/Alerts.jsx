import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, ShieldCheck, Filter, ArrowUpDown, AlertTriangle, Search } from 'lucide-react'
import SEO from '../components/seo/SEO'
import DashboardShell from '../components/layout/DashboardShell'
import AlertCard from '../components/dashboard/AlertCard'

const filters = ['All', 'Critical', 'High', 'Medium', 'Low', 'Safe']

const allAlerts = [
  { id: '1', title: 'Attempted uninstall detected', severity: 'critical', description: 'Kwame attempted to remove SafeNet SA.', lunaExplanation: 'Device admin privileges prevented the uninstall. The app remains active and protecting.', timestamp: Date.now() - 1000 * 60 * 60, actionTaken: 'Prevented', isRead: false },
  { id: '2', title: 'Phishing link blocked', severity: 'high', description: 'Luna blocked a suspicious WhatsApp link pretending to be from SASSA.', lunaExplanation: 'Credential harvesting site blocked before loading.', timestamp: Date.now() - 1000 * 60 * 120, actionTaken: 'Blocked', isRead: false },
  { id: '3', title: 'New app installed', severity: 'low', description: 'TikTok was installed on Liam\'s device.', lunaExplanation: 'Monitored and content filters applied.', timestamp: Date.now() - 1000 * 60 * 240, actionTaken: 'Monitored', isRead: false },
  { id: '4', title: 'All children safe', severity: 'safe', description: 'All children within safe zones.', lunaExplanation: 'No suspicious activity detected.', timestamp: Date.now() - 1000 * 60 * 300, actionTaken: 'All clear', isRead: true },
  { id: '5', title: 'Screen time limit reached', severity: 'medium', description: 'Liam exceeded daily limit of 3 hours.', lunaExplanation: 'Internet paused for the evening.', timestamp: Date.now() - 1000 * 60 * 360, actionTaken: 'Paused', isRead: true },
  { id: '6', title: 'Suspicious contact detected', severity: 'high', description: 'Unknown contact attempted to send a phishing link.', lunaExplanation: 'Contact flagged and messages monitored.', timestamp: Date.now() - 1000 * 60 * 420, actionTaken: 'Flagged', isRead: false },
  { id: '7', title: 'GPS boundary alert', severity: 'medium', description: 'Zara left the designated safe zone.', lunaExplanation: 'Notification sent. Zara returned to safe zone 5 minutes later.', timestamp: Date.now() - 1000 * 60 * 480, actionTaken: 'Notified', isRead: true },
  { id: '8', title: 'New device detected', severity: 'low', description: 'Liam logged into a new device.', lunaExplanation: 'New device added to monitored list.', timestamp: Date.now() - 1000 * 60 * 600, actionTaken: 'Added', isRead: true },
]

const alertsSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA — Security Alerts & Threat History',
  description: 'View all security events across your family. Filter by severity, search alerts, and review Luna AI\'s threat detection history.',
  url: 'https://safenet-sa.co.za/alerts',
  isPartOf: {
    '@type': 'Organization',
    name: 'SafeNet SA',
    url: 'https://safenet-sa.co.za',
  },
  about: {
    '@type': 'Thing',
    name: 'Child safety alerts and security event history',
  },
}

export default function Alerts() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAlerts = allAlerts.filter(alert => {
    const matchesFilter = activeFilter === 'All' || alert.severity.toLowerCase() === activeFilter.toLowerCase()
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const unreadCount = allAlerts.filter(a => !a.isRead).length

  return (
    <DashboardShell>
      <SEO
        title="SafeNet SA — Security Alerts & Threat History"
        description="View all security events across your family. Filter by severity, search alerts, and review Luna AI's threat detection history."
        canonicalPath="/alerts"
        jsonLd={alertsSchema}
      />
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-6 h-6 text-safenet-primary" />
            <h1 className="font-display text-display-sm text-safenet-text">Alerts</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-safenet-danger-light text-safenet-danger rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-safenet-text-2">Monitor all security events across your family</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-safenet-text-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-safenet-border rounded-input text-sm text-safenet-text placeholder:text-safenet-text-3 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-safenet-border rounded-input text-sm text-safenet-text-2 hover:border-safenet-border-strong transition-colors">
            <ArrowUpDown className="w-4 h-4" />
            Sort
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all
                ${activeFilter === filter
                  ? 'bg-safenet-primary text-white shadow-safenet-sm'
                  : 'bg-white text-safenet-text-2 border border-safenet-border hover:border-safenet-primary/30 hover:text-safenet-text'
                }
              `}
            >
              {filter === 'Safe' && <ShieldCheck className="w-3 h-3" />}
              {filter === 'Critical' && <AlertTriangle className="w-3 h-3" />}
              {filter === 'All' && <Bell className="w-3 h-3" />}
              {filter}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <ShieldCheck className="w-12 h-12 text-safenet-primary/30 mx-auto mb-4" />
              <h3 className="font-display text-heading-md text-safenet-text mb-2">All clear</h3>
              <p className="text-sm text-safenet-text-2">No threats detected. Keep up the great work!</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} index={i} />
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
