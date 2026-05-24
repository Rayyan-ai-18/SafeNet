import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react'

const severityConfig = {
  critical: { color: 'bg-red-500', border: 'border-l-red-500', icon: AlertTriangle },
  high: { color: 'bg-orange-500', border: 'border-l-orange-500', icon: AlertTriangle },
  medium: { color: 'bg-amber-500', border: 'border-l-amber-500', icon: Info },
  low: { color: 'bg-blue-500', border: 'border-l-blue-500', icon: Info },
  safe: { color: 'bg-green-500', border: 'border-l-green-500', icon: ShieldCheck },
}

export default function AlertCard({ alert = {}, index = 0 }) {
  const severity = alert.severity || 'low'
  const config = severityConfig[severity] || severityConfig.low
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        bg-white rounded-card-lg p-4 border border-safenet-border border-l-[3px] ${config.border}
        shadow-safenet-sm hover:shadow-safenet-md transition-shadow
        ${alert.isRead ? 'opacity-70' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full ${severity === 'safe' ? 'bg-green-100' : 'bg-amber-100'} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${severity === 'safe' ? 'text-green-600' : 'text-amber-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-safenet-text truncate">{alert.title || 'Security Alert'}</h4>
            <span className="text-[10px] text-safenet-text-3 whitespace-nowrap">
              {alert.timestamp ? new Date(alert.timestamp).toLocaleString('en-ZA') : ''}
            </span>
          </div>
          <p className="text-xs text-safenet-text-2 leading-relaxed mb-2">
            {alert.description || 'No details available'}
          </p>

          {/* Luna explanation */}
          {alert.lunaExplanation && (
            <div className="bg-safenet-primary-light rounded-lg p-2.5 mt-2">
              <div className="text-[10px] font-semibold text-safenet-primary mb-0.5">Luna says:</div>
              <p className="text-xs text-safenet-text-2 leading-relaxed">{alert.lunaExplanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`
              inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full
              ${severity === 'safe' ? 'bg-green-100 text-green-700' : ''}
              ${severity === 'critical' || severity === 'high' ? 'bg-red-100 text-red-700' : ''}
              ${severity === 'medium' || severity === 'low' ? 'bg-amber-100 text-amber-700' : ''}
            `}>
              {alert.actionTaken || severity}
            </span>
            {!alert.isRead && (
              <span className="text-[10px] text-safenet-text-3">· Unread</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
