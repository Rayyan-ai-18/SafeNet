import React from 'react'
import { motion } from 'framer-motion'

export default function PauseToggle({ checked = false, onChange, label = 'Internet access', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.button
        onClick={() => onChange?.(!checked)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative w-14 h-7 rounded-full transition-colors duration-300
          ${checked ? 'bg-safenet-primary' : 'bg-safenet-text-3'}
        `}
      >
        <motion.div
          animate={{ x: checked ? 28 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-safenet-sm"
        />
      </motion.button>
      <span className="text-sm font-medium text-safenet-text-2">{label}</span>
    </div>
  )
}
