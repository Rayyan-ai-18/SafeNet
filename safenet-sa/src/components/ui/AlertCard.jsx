import React from 'react'
import { motion } from 'framer-motion'

const severityConfig = {
  safe: { border: 'border-safenet-primary', bg: 'bg-safenet-primary-light', icon: '🟢', label: 'Safe' },
  low: { border: 'border-safenet-border-strong', bg: 'bg-safenet-surface', icon: 'ℹ️', label: 'Info' },
  medium: { border: 'border-safenet-accent', bg: 'bg-safenet-accent-light', icon: '⚠️', label: 'Warning' },
  high: { border: 'border-orange-400', bg: 'bg-orange-50', icon: '🚨', label: 'High' },
  critical: { border: 'border-safenet-danger', bg: 'bg-safenet-danger-light', icon: '🔴', label: 'Critical' },
}

export default function AlertCard({
  severity = 'high',
  title,
  description,
  timestamp,
  threatLevel,
  threatText,
  actions,
  className = '',
}) {
  const config = severityConfig[severity] || severityConfig.high

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`bg-white rounded-card-lg shadow-safenet-md border-l-[3px] ${config.border} overflow-hidden ${className}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center text-sm flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-safenet-text uppercase tracking-wider">{title}</span>
              {timestamp && (
                <span className="text-[10px] text-safenet-text-3 flex-shrink-0">{timestamp}</span>
              )}
            </div>
            <p className="text-xs text-safenet-text-2 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Threat level bar */}
        {threatLevel !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-safenet-text-3 mb-1">
              <span>Threat level</span>
              <span className="font-semibold text-safenet-text">{threatLevel}%</span>
            </div>
            <div className="w-full h-2 bg-safenet-surface rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${threatLevel}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  threatLevel > 80 ? 'bg-safenet-danger' :
                  threatLevel > 50 ? 'bg-safenet-accent' : 'bg-safenet-primary'
                }`}
              />
            </div>
          </div>
        )}

        {/* Threat text quote */}
        {threatText && (
          <div className="bg-safenet-danger-light/50 rounded-lg px-3 py-2 mb-3">
            <p className="text-[11px] text-safenet-danger italic leading-relaxed">"{threatText}"</p>
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 pt-2 border-t border-safenet-border">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className={`flex-1 text-xs font-medium py-1.5 rounded-btn transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-safenet-primary text-white hover:bg-safenet-primary-dark'
                    : 'bg-safenet-surface text-safenet-text-2 hover:text-safenet-text border border-safenet-border'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
