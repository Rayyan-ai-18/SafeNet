import React from 'react'
import { motion } from 'framer-motion'

export default function PhoneMockup({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.5 }}
      className={`relative ${className}`}
    >
      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] h-[580px] bg-white rounded-[40px] shadow-safenet-xl border-[3px] border-safenet-border-strong overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-[14px] z-10" />
        
        {/* Screen content - SafeNet dashboard preview */}
        <div className="pt-8 px-4 pb-4 h-full flex flex-col bg-safenet-surface">
          {/* Status bar */}
          <div className="flex justify-between items-center mb-3 px-2 text-[10px] text-safenet-text-3 font-mono">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 border border-safenet-text-3 rounded-sm" />
              <span className="text-xs">●●●●</span>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-medium text-safenet-primary">SafeNet SA</div>
              <div className="text-[8px] text-safenet-text-3">Liam's phone</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-safenet-primary flex items-center justify-center text-white text-[10px] font-bold">L</div>
          </div>

          {/* Status banner */}
          <div className="bg-safenet-primary-light rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-safenet-primary pulse-dot" />
            <span className="text-[11px] font-medium text-safenet-primary">All children safe</span>
          </div>

          {/* Child card */}
          <div className="bg-white rounded-xl p-3 shadow-safenet-sm mb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-safenet-primary to-safenet-primary-dark flex items-center justify-center text-white text-sm font-bold">L</div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-safenet-text">Liam</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-safenet-text-3">Online · 2h screen time</span>
              </div>
            </div>
            <div className="w-9 h-5 rounded-full bg-safenet-primary flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Alert */}
          <div className="bg-white rounded-xl p-3 shadow-safenet-sm mb-3 border-l-[3px] border-safenet-accent">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-safenet-accent-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px]">⚠</span>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-safenet-text">Phishing blocked</div>
                <div className="text-[9px] text-safenet-text-3 mt-0.5 leading-tight">Fake SASSA link blocked by Luna</div>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-safenet-text-2 uppercase tracking-wider mb-2">Today's Activity</div>
            <div className="space-y-2">
              {['WhatsApp', 'YouTube', 'Chrome'].map((app, i) => (
                <div key={app} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-safenet-sm">
                  <div className={`w-6 h-6 rounded-lg ${
                    i === 0 ? 'bg-green-100' : i === 1 ? 'bg-red-100' : 'bg-blue-100'
                  } flex items-center justify-center text-[10px]`}>
                    {app[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-safenet-text">{app}</div>
                    <div className="text-[9px] text-safenet-text-3">{['45 min', '22 min', '15 min'][i]}</div>
                  </div>
                  <div className="w-16 h-1.5 bg-safenet-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      i === 0 ? 'bg-safenet-primary w-3/4' : i === 1 ? 'bg-safenet-accent w-1/3' : 'bg-blue-400 w-1/4'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
