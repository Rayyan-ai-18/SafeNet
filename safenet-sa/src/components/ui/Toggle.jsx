import React from 'react'
import { motion } from 'framer-motion'

export default function Toggle({ enabled, onChange, label, size = 'md', className = '' }) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translateX: 16 },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translateX: 20 },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translateX: 28 },
  }
  const dims = sizes[size] || sizes.md

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex items-center flex-shrink-0
        ${dims.track} rounded-full
        transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-safenet-primary/40
        ${enabled ? 'bg-safenet-primary' : 'bg-safenet-border-strong'}
        ${className}
      `}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          transform: enabled ? `translateX(${dims.translateX}px)` : 'translateX(2px)',
        }}
        className={`
          inline-block ${dims.thumb} rounded-full bg-white shadow-safenet-sm
        `}
      />
    </button>
  )
}
