import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Toggle from '../ui/Toggle'

const defaultApps = [
  { name: 'WhatsApp', icon: '💬', blocked: false, category: 'Social' },
  { name: 'TikTok', icon: '🎵', blocked: true, category: 'Social' },
  { name: 'YouTube', icon: '▶️', blocked: false, category: 'Video' },
  { name: 'Instagram', icon: '📷', blocked: true, category: 'Social' },
  { name: 'Chrome', icon: '🌐', blocked: false, category: 'Browser' },
  { name: 'Snapchat', icon: '👻', blocked: true, category: 'Social' },
  { name: 'Netflix', icon: '🎬', blocked: false, category: 'Video' },
  { name: 'Roblox', icon: '🎮', blocked: false, category: 'Gaming' },
  { name: 'Messages', icon: '💬', blocked: false, category: 'Communication' },
  { name: 'Camera', icon: '📸', blocked: false, category: 'Utility' },
]

export default function AppBlockGrid() {
  const [apps, setApps] = useState(defaultApps)

  const toggleApp = (name) => {
    setApps(prev => prev.map(app =>
      app.name === name ? { ...app, blocked: !app.blocked } : app
    ))
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {apps.map((app, i) => (
        <motion.button
          key={app.name}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => toggleApp(app.name)}
          className={`
            flex flex-col items-center gap-1.5 p-3 rounded-card-lg border transition-all
            ${app.blocked
              ? 'bg-safenet-danger-light border-safenet-danger/30 opacity-60'
              : 'bg-white border-safenet-border hover:border-safenet-primary/30 hover:shadow-safenet-sm'
            }
          `}
        >
          <span className="text-2xl">{app.icon}</span>
          <span className="text-[10px] font-medium text-safenet-text truncate w-full text-center">
            {app.name}
          </span>
          <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
            app.blocked
              ? 'bg-safenet-danger/10 text-safenet-danger'
              : 'bg-green-100 text-green-700'
          }`}>
            {app.blocked ? 'Blocked' : 'Allowed'}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
