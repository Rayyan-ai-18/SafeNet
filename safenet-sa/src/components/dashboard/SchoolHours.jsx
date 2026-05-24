import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, GraduationCap, PauseCircle, PlayCircle, Settings as SettingsIcon } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Toggle from '../ui/Toggle'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SchoolHours() {
  const { children, schoolHours, toggleChildSchoolOverride, updateSchoolHours } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const now = new Date()
  const currentDay = dayLabels[now.getDay() === 0 ? 6 : now.getDay() - 1]
  const todayActive = schoolHours.activeDays.includes(currentDay) && schoolHours.enabled

  // Determine if currently within school hours
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const inSchoolHours = schoolHours.schedule.some(block => {
    const [startH, startM] = block.start.split(':').map(Number)
    const [endH, endM] = block.end.split(':').map(Number)
    const startMin = startH * 60 + startM
    const endMin = endH * 60 + endM
    return todayActive && currentMinutes >= startMin && currentMinutes < endMin
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-heading-md text-safenet-text flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-safenet-primary" />
          School Hours
        </h2>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${todayActive ? 'text-safenet-primary' : 'text-safenet-text-3'}`}>
            {todayActive ? (inSchoolHours ? 'School in session' : 'Outside school hours') : 'No schedule today'}
          </span>
          <button
            onClick={() => setEditMode(!editMode)}
            className="p-1.5 rounded-lg hover:bg-safenet-surface transition-colors"
          >
            <SettingsIcon className={`w-4 h-4 ${editMode ? 'text-safenet-primary' : 'text-safenet-text-3'}`} />
          </button>
        </div>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-card-lg border border-safenet-border shadow-safenet-sm overflow-hidden"
      >
        {/* Schedule banner */}
        <div className={`px-5 py-4 flex items-center justify-between ${
          inSchoolHours ? 'bg-safenet-primary-light border-b border-safenet-primary/20' : 'bg-safenet-surface border-b border-safenet-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              inSchoolHours ? 'bg-safenet-primary' : 'bg-safenet-border-strong'
            }`}>
              <Clock className={`w-5 h-5 ${inSchoolHours ? 'text-white' : 'text-safenet-text-3'}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-safenet-text">
                {inSchoolHours ? 'School hours active' : 'Free time'}
              </div>
              <div className="text-xs text-safenet-text-3">
                {schoolHours.schedule.map(b => `${b.start} – ${b.end}`).join(' · ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {inSchoolHours && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-safenet-primary text-white rounded-full text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" />
                Active
              </span>
            )}
            <Toggle
              enabled={schoolHours.enabled}
              onChange={(val) => updateSchoolHours({ enabled: val })}
              size="sm"
            />
          </div>
        </div>

        {/* Children status */}
        <div className="p-5">
          <div className="space-y-2.5">
            {children.map((child) => {
              const override = schoolHours.childOverrides[child.id]
              const isPaused = override?.paused || false
              const effectiveStatus = inSchoolHours && schoolHours.enabled && !isPaused

              return (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 bg-safenet-surface rounded-card-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                      effectiveStatus ? 'bg-safenet-primary' : 'bg-safenet-text-3'
                    }`}>
                      {child.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-safenet-text">{child.name}</div>
                      <div className="text-xs text-safenet-text-3">
                        {effectiveStatus
                          ? 'Devices silenced — school hours'
                          : isPaused
                            ? 'Override: excluded from schedule'
                            : 'Normal mode'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {effectiveStatus && (
                      <Bell className="w-4 h-4 text-safenet-primary" />
                    )}
                    <button
                      onClick={() => toggleChildSchoolOverride(child.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPaused
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'hover:bg-safenet-surface-2 text-safenet-text-3'
                      }`}
                      title={isPaused ? 'Resume schedule' : 'Exclude from schedule'}
                    >
                      {isPaused ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Edit mode: schedule settings */}
        <AnimatePresence>
          {editMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-safenet-border"
            >
              <div className="p-5 space-y-4">
                {/* Active days */}
                <div>
                  <label className="text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-2 block">
                    Active Days
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {dayLabels.map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          const updated = schoolHours.activeDays.includes(day)
                            ? schoolHours.activeDays.filter(d => d !== day)
                            : [...schoolHours.activeDays, day]
                          updateSchoolHours({ activeDays: updated })
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          schoolHours.activeDays.includes(day)
                            ? 'bg-safenet-primary text-white'
                            : 'bg-safenet-surface text-safenet-text-3 border border-safenet-border'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule blocks */}
                <div>
                  <label className="text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-2 block">
                    Time Blocks
                  </label>
                  <div className="space-y-2">
                    {schoolHours.schedule.map((block) => (
                      <div key={block.id} className="flex items-center gap-3">
                        <span className="text-sm text-safenet-text-2 w-20">{block.label}</span>
                        <input
                          type="time"
                          value={block.start}
                          onChange={(e) => {
                            const updated = schoolHours.schedule.map(b =>
                              b.id === block.id ? { ...b, start: e.target.value } : b
                            )
                            updateSchoolHours({ schedule: updated })
                          }}
                          className="px-3 py-1.5 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                        />
                        <span className="text-safenet-text-3">→</span>
                        <input
                          type="time"
                          value={block.end}
                          onChange={(e) => {
                            const updated = schoolHours.schedule.map(b =>
                              b.id === block.id ? { ...b, end: e.target.value } : b
                            )
                            updateSchoolHours({ schedule: updated })
                          }}
                          className="px-3 py-1.5 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
