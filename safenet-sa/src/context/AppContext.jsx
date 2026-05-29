import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loadFamilySnapshot } from '../lib/db'

const AppContext = createContext(null)

const initialChildren = [
  { id: '1', name: 'Liam', isOnline: true, screenTime: 87, internetPaused: false, lastSeen: 'Just now', device: 'Android', lat: -26.2041, lng: 28.0473, address: 'Melville, Johannesburg' },
  { id: '2', name: 'Zara', isOnline: false, screenTime: 62, internetPaused: false, lastSeen: '30 min ago', device: 'iPhone', lat: -26.1918, lng: 28.0330, address: 'Auckland Park, Johannesburg' },
  { id: '3', name: 'Kwame', isOnline: true, screenTime: 145, internetPaused: true, lastSeen: 'Just now', device: 'Samsung', lat: -26.2150, lng: 28.0600, address: 'Braamfontein, Johannesburg' },
]

const initialZones = [
  { id: 'home', name: 'Home', icon: 'Home', lat: -26.2041, lng: 28.0473, radius: 500, color: '#0F7B4D' },
  { id: 'school', name: "St. John's School", icon: 'GraduationCap', lat: -26.1850, lng: 28.0350, radius: 300, color: '#F59E0B' },
]

const initialSchoolHours = {
  enabled: true,
  schedule: [
    { id: 'morning', label: 'Morning', start: '08:00', end: '13:00' },
    { id: 'afternoon', label: 'Afternoon', start: '13:30', end: '15:30' },
  ],
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  childOverrides: {
    '1': { paused: false },  // Liam
    '2': { paused: true },   // Zara - homeschooled
    '3': { paused: false },  // Kwame
  },
}

const initialAlerts = [
  { id: '1', title: 'Phishing link blocked', severity: 'high', description: 'Luna blocked a suspicious link sent via WhatsApp pretending to be from SASSA.', lunaExplanation: 'Credential harvesting site detected and blocked before it could load. No data was shared.', timestamp: Date.now() - 1000 * 60 * 5, actionTaken: 'Blocked', isRead: false, childId: '1' },
  { id: '2', title: 'Attempted uninstall detected', severity: 'critical', description: 'Kwame attempted to remove SafeNet SA from his device.', lunaExplanation: 'Device admin privileges prevented the uninstall. The app remains active and protecting.', timestamp: Date.now() - 1000 * 60 * 60, actionTaken: 'Prevented', isRead: false, childId: '3' },
  { id: '3', title: 'New app installed', severity: 'low', description: "TikTok was installed on Liam's device.", lunaExplanation: 'TikTok has been added to monitored apps. Age-appropriate content filters applied.', timestamp: Date.now() - 1000 * 60 * 120, actionTaken: 'Monitored', isRead: false, childId: '1' },
  { id: '4', title: 'All children safe', severity: 'safe', description: 'All children are within safe zones. No threats detected in the last hour.', lunaExplanation: 'All monitored devices are secure. No suspicious activity detected.', timestamp: Date.now() - 1000 * 60 * 60, actionTaken: 'All clear', isRead: true },
  { id: '5', title: 'Screen time limit reached', severity: 'medium', description: "Liam has exceeded today's screen time limit of 3 hours.", lunaExplanation: 'Screen time limit reached. Internet access has been paused for the evening.', timestamp: Date.now() - 1000 * 60 * 180, actionTaken: 'Paused', isRead: true, childId: '1' },
  { id: '6', title: 'GPS boundary alert', severity: 'medium', description: 'Zara left the designated safe zone.', lunaExplanation: 'Notification sent. Zara returned to safe zone 5 minutes later.', timestamp: Date.now() - 1000 * 60 * 480, actionTaken: 'Notified', isRead: true, childId: '2' },
  { id: '7', title: 'Suspicious contact detected', severity: 'high', description: 'Unknown contact attempted to send a phishing link to Liam.', lunaExplanation: 'Contact flagged and messages monitored.', timestamp: Date.now() - 1000 * 60 * 420, actionTaken: 'Flagged', isRead: false, childId: '1' },
]

const initialZoneAlerts = [
  { child: 'Kwame', zone: "St. John's School", time: 'Left 1 hour ago', type: 'departure' },
]

export function AppProvider({ children }) {
  const [childrenList, setChildrenList] = useState(initialChildren)
  const [zones, setZones] = useState(initialZones)
  const [schoolHours, setSchoolHours] = useState(initialSchoolHours)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [zoneAlerts, setZoneAlerts] = useState(initialZoneAlerts)
  const [family, setFamily] = useState({ plan: 'free' })
  const [isLive, setIsLive] = useState(false)

  // Hydrate from Supabase when configured + signed in; otherwise keep demo data.
  useEffect(() => {
    let cancelled = false
    loadFamilySnapshot().then((snap) => {
      if (cancelled || !snap) return
      if (snap.children?.length) setChildrenList(snap.children)
      if (snap.zones?.length) setZones(snap.zones)
      if (snap.alerts?.length) setAlerts(snap.alerts)
      if (snap.family) setFamily(snap.family)
      setIsLive(true)
    }).catch(() => { /* stay on demo data */ })
    return () => { cancelled = true }
  }, [])

  const toggleInternetPause = useCallback((childId) => {
    setChildrenList(prev => prev.map(c =>
      c.id === childId ? { ...c, internetPaused: !c.internetPaused } : c
    ))
  }, [])

  const updateScreenTime = useCallback((childId, minutes) => {
    setChildrenList(prev => prev.map(c =>
      c.id === childId ? { ...c, screenTime: minutes } : c
    ))
  }, [])

  const addZone = useCallback((zone) => {
    setZones(prev => [...prev, { ...zone, id: `zone-${Date.now()}` }])
  }, [])

  const removeZone = useCallback((zoneId) => {
    setZones(prev => prev.filter(z => z.id !== zoneId))
  }, [])

  const updateZone = useCallback((zoneId, updates) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updates } : z))
  }, [])

  const updateSchoolHours = useCallback((updates) => {
    setSchoolHours(prev => ({ ...prev, ...updates }))
  }, [])

  const toggleChildSchoolOverride = useCallback((childId) => {
    setSchoolHours(prev => ({
      ...prev,
      childOverrides: {
        ...prev.childOverrides,
        [childId]: { paused: !prev.childOverrides[childId]?.paused },
      },
    }))
  }, [])

  const markAlertRead = useCallback((alertId) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, isRead: true } : a
    ))
  }, [])

  const addAlert = useCallback((alert) => {
    setAlerts(prev => [{ ...alert, id: `alert-${Date.now()}` }, ...prev])
  }, [])

  const addZoneAlert = useCallback((alert) => {
    setZoneAlerts(prev => [alert, ...prev])
  }, [])

  const value = {
    children: childrenList,
    zones,
    schoolHours,
    alerts,
    zoneAlerts,
    family,
    isLive,
    toggleInternetPause,
    updateScreenTime,
    addZone,
    removeZone,
    updateZone,
    updateSchoolHours,
    toggleChildSchoolOverride,
    markAlertRead,
    addAlert,
    addZoneAlert,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
