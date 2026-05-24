import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Clock } from 'lucide-react'
import Toggle from '../ui/Toggle'

export default function ChildCard({ child = {}, onPause, index = 0 }) {
  const initials = (child.name || 'C')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-card-lg p-5 border border-safenet-border shadow-safenet-sm hover:shadow-safenet-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-safenet-primary to-safenet-primary-dark flex items-center justify-center text-white font-bold text-lg">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-safenet-text">{child.name || 'Loading…'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${child.isOnline ? 'bg-green-500' : 'bg-safenet-text-3'}`}
              />
              <span className="text-xs text-safenet-text-3">
                {child.isOnline ? 'Online' : 'Last seen: ' + (child.lastSeen || 'recently')}
              </span>
            </div>
          </div>
        </div>
        <button className="p-1 rounded-lg hover:bg-safenet-surface transition-colors">
          <MoreVertical className="w-4 h-4 text-safenet-text-3" />
        </button>
      </div>

      {/* Screen time preview */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-3.5 h-3.5 text-safenet-text-3" />
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-safenet-text-2">Screen time</span>
            <span className="text-safenet-text font-medium">{child.screenTime || '0'} min</span>
          </div>
          <div className="w-full h-1.5 bg-safenet-surface rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((child.screenTime || 0) / 180 * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-safenet-primary rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Pause toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-safenet-border">
        <span className="text-xs font-medium text-safenet-text-2">Internet access</span>
        <Toggle
          checked={!child.internetPaused}
          onChange={() => onPause?.(child.id, !child.internetPaused)}
        />
      </div>
    </motion.div>
  )
}
