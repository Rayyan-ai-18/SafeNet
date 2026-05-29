import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Bell, MapPin, Settings, Shield,
  ChevronDown, LogOut, Menu, X, Bot, Home, UserCog
} from 'lucide-react'
import LunaWidget from '../dashboard/LunaWidget'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { PLANS, planOf } from '../../lib/entitlements'
import { priceFor } from '../../lib/billing'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Users, label: 'Children', path: '/children' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: MapPin, label: 'Location', path: '/location' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function DashboardShell({ children, user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user: authUser, signOut } = useAuth()
  const { family, alerts } = useApp()
  const currentUser = user || authUser
  const unreadAlerts = (alerts || []).filter((a) => !a.isRead && a.severity !== 'safe').length
  const planKey = planOf(family)
  const planPrice = planKey === 'free' ? 0 : priceFor(planKey, family?.billing_cycle || 'monthly')
  const planCycleLabel = { weekly: '/week', monthly: '/month', annual: '/year' }[family?.billing_cycle || 'monthly']

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-safenet-surface">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[240px] bg-white border-r border-safenet-border
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-safenet-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-safenet-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg text-safenet-text">SafeNet SA</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === item.path
                  ? 'bg-safenet-primary-light text-safenet-primary'
                  : 'text-safenet-text-2 hover:bg-safenet-surface hover:text-safenet-text'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Plan badge */}
        <div className="absolute bottom-4 left-3 right-3">
          <div className="bg-safenet-primary-light rounded-card-lg p-3">
            <div className="text-xs font-semibold text-safenet-primary mb-0.5">{PLANS[planKey].label} Plan</div>
            <div className="text-[10px] text-safenet-text-3">{planPrice ? `R${planPrice}${planCycleLabel}` : 'Free'}</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[240px]">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-safenet-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-safenet-surface transition-colors"
            >
              <Menu className="w-5 h-5 text-safenet-text-2" />
            </button>
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="inline-flex items-center gap-1.5 text-safenet-text-2 hover:text-safenet-text transition-colors font-medium">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <span className="text-safenet-text-3">/</span>
              <span className="text-safenet-text font-medium">
                {sidebarItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Luna button */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-safenet-primary-light text-safenet-primary rounded-full text-xs font-medium hover:bg-safenet-primary/20 transition-colors">
              <Bot className="w-3.5 h-3.5" />
              Ask Luna
            </button>

            {/* Notification bell -> Alerts */}
            <button
              onClick={() => navigate('/alerts')}
              aria-label={unreadAlerts ? `${unreadAlerts} unread alerts` : 'Alerts'}
              className="relative p-2 rounded-lg hover:bg-safenet-surface transition-colors"
            >
              <Bell className="w-5 h-5 text-safenet-text-2" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-safenet-danger text-white text-[10px] font-bold leading-none">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-safenet-surface transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-safenet-primary flex items-center justify-center text-white text-xs font-bold">
                  {currentUser?.displayName?.[0] || currentUser?.phone?.slice(-1) || 'P'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-safenet-text-3 hidden sm:block" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white border border-safenet-border rounded-card-lg shadow-safenet-lg py-1 z-50"
                  >
                    {/* Signed-in identity */}
                    <div className="px-3 py-2.5 border-b border-safenet-border">
                      <div className="text-sm font-semibold text-safenet-text truncate">
                        {currentUser?.displayName || currentUser?.fullName || 'Your account'}
                      </div>
                      {currentUser?.phone && (
                        <div className="text-xs text-safenet-text-3 truncate">{currentUser.phone}</div>
                      )}
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-safenet-text-2 hover:bg-safenet-surface hover:text-safenet-text transition-colors"
                    >
                      <UserCog className="w-4 h-4" />
                      Profile &amp; settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-safenet-text-2 hover:bg-safenet-surface hover:text-safenet-text transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Luna widget */}
      <LunaWidget />
    </div>
  )
}
