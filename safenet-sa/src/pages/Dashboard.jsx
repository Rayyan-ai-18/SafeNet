import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Bell, ArrowRight, Users } from 'lucide-react'
import SEO from '../components/seo/SEO'
import DashboardShell from '../components/layout/DashboardShell'
import ChildCard from '../components/dashboard/ChildCard'
import AlertCard from '../components/dashboard/AlertCard'
import SafeZoneStatus from '../components/dashboard/SafeZoneStatus'
import SchoolHours from '../components/dashboard/SchoolHours'
import { useApp } from '../context/AppContext'

const dashboardSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA - Parent Dashboard',
  description: 'Monitor your children\'s digital safety in real-time. View alerts, screen time, location, and safe zones from your SafeNet SA dashboard.',
  url: 'https://safenet-sa.co.za/dashboard',
  isPartOf: {
    '@type': 'Organization',
    name: 'SafeNet SA',
    url: 'https://safenet-sa.co.za',
  },
  about: {
    '@type': 'Thing',
    name: 'Child safety monitoring dashboard',
  },
}

export default function Dashboard() {
  const { children, alerts, markAlertRead } = useApp()
  const hasAlerts = alerts.some(a => !a.isRead && a.severity !== 'safe')

  return (
    <DashboardShell>
      <SEO
        title="SafeNet SA - Parent Dashboard"
        description="Monitor your children's digital safety in real-time. View alerts, screen time, location, and safe zones from your SafeNet SA dashboard."
        canonicalPath="/dashboard"
        jsonLd={dashboardSchema}
      />
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            flex items-center gap-3 px-5 py-4 rounded-card-lg border
            ${hasAlerts
              ? 'bg-amber-50 border-amber-200'
              : 'bg-safenet-primary-light border-safenet-primary/20'
            }
          `}
        >
          <div className={`
            w-3 h-3 rounded-full
            ${hasAlerts ? 'bg-amber-500' : 'bg-safenet-primary'}
            pulse-dot
          `} />
          <p className={`text-sm font-medium ${hasAlerts ? 'text-amber-800' : 'text-safenet-primary'}`}>
            {hasAlerts ? 'Alerts require your attention' : 'All children safe and secure'}
          </p>
          <span className={`ml-auto text-xs ${hasAlerts ? 'text-amber-600' : 'text-safenet-primary'}`}>
            Updated just now
          </span>
        </motion.div>

        {/* Children grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-heading-md text-safenet-text flex items-center gap-2">
              <Users className="w-5 h-5 text-safenet-primary" />
              Your Children
            </h2>
            <Link to="/children" className="text-sm text-safenet-primary font-medium hover:underline">
              Manage children
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child, i) => (
              <Link key={child.id} to={`/child/${child.id}`}>
                <ChildCard child={child} index={i} />
              </Link>
            ))}
          </div>
        </div>

        {/* Safe Zone Status */}
        <SafeZoneStatus />

        {/* School Hours */}
        <SchoolHours />

        {/* Recent alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-heading-md text-safenet-text flex items-center gap-2">
              <Bell className="w-5 h-5 text-safenet-primary" />
              Recent Alerts
            </h2>
            <Link to="/alerts" className="text-sm text-safenet-primary font-medium hover:underline flex items-center gap-1">
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
