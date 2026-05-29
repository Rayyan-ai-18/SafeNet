import React from 'react'
import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import DashboardShell from '../components/layout/DashboardShell'
import ChildCard from '../components/dashboard/ChildCard'
import { useApp } from '../context/AppContext'

const childrenSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA - Children',
  description: "Manage the children protected by SafeNet SA. View each child's device, screen time, and safety status.",
  url: 'https://safenet-sa.co.za/children',
  isPartOf: { '@type': 'Organization', name: 'SafeNet SA', url: 'https://safenet-sa.co.za' },
}

export default function Children() {
  const { children } = useApp()
  const online = children.filter((c) => c.isOnline).length

  return (
    <DashboardShell>
      <SEO
        title="SafeNet SA - Children"
        description="Manage the children protected by SafeNet SA. View each child's device, screen time, and safety status."
        canonicalPath="/children"
        jsonLd={childrenSchema}
      />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-safenet-primary" />
              <h1 className="font-display text-display-sm text-safenet-text">Children</h1>
            </div>
            <p className="text-sm text-safenet-text-2">
              {children.length} {children.length === 1 ? 'child' : 'children'} protected, {online} online now
            </p>
          </div>
        </div>

        {/* Children grid */}
        {children.length === 0 ? (
          <div className="bg-white rounded-card-lg border border-safenet-border shadow-safenet-sm p-10 text-center">
            <Users className="w-8 h-8 text-safenet-text-3 mx-auto mb-3" />
            <p className="text-sm text-safenet-text-2">No children added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child, i) => (
              <Link key={child.id} to={`/child/${child.id}`}>
                <ChildCard child={child} index={i} />
              </Link>
            ))}
          </div>
        )}

        {/* Tap-through hint */}
        <p className="flex items-center gap-1.5 text-xs text-safenet-text-3">
          Tap a child to see their full safety profile
          <ChevronRight className="w-3.5 h-3.5" />
        </p>
      </div>
    </DashboardShell>
  )
}
