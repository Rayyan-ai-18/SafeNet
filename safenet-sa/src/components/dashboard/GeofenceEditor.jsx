import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Sliders, Trash2, Save, Home, GraduationCap, Building2, Heart, Star } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Toggle from '../ui/Toggle'

const ZONE_COLORS = [
  { label: 'Green', value: '#0F7B4D' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Orange', value: '#F97316' },
]

const ZONE_ICONS = [
  { label: 'Home', value: 'Home' },
  { label: 'School', value: 'GraduationCap' },
  { label: 'Work', value: 'Building2' },
  { label: 'Family', value: 'Heart' },
  { label: 'Favorites', value: 'Star' },
  { label: 'Custom', value: 'MapPin' },
]

const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 } // Johannesburg

export default function GeofenceEditor({ open, onClose, editZone = null }) {
  const { zones, addZone, updateZone, removeZone } = useApp()
  const isEditing = !!editZone

  const [name, setName] = useState('')
  const [radius, setRadius] = useState(500)
  const [color, setColor] = useState('#0F7B4D')
  const [icon, setIcon] = useState('Home')
  const [lat, setLat] = useState(DEFAULT_CENTER.lat)
  const [lng, setLng] = useState(DEFAULT_CENTER.lng)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (editZone) {
      setName(editZone.name)
      setRadius(editZone.radius)
      setColor(editZone.color)
      setIcon(editZone.icon || 'Home')
      setLat(editZone.lat)
      setLng(editZone.lng)
    } else if (open) {
      setName('')
      setRadius(500)
      setColor('#0F7B4D')
      setIcon('Home')
      setLat(DEFAULT_CENTER.lat)
      setLng(DEFAULT_CENTER.lng)
    }
  }, [editZone, open])

  const handleSave = () => {
    if (!name.trim()) return
    const zoneData = {
      name: name.trim(),
      radius,
      color,
      icon,
      lat,
      lng,
    }
    if (isEditing) {
      updateZone(editZone.id, zoneData)
    } else {
      addZone(zoneData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (editZone) {
      removeZone(editZone.id)
    }
    onClose()
    setShowDeleteConfirm(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[2000] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[2001] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-card-lg shadow-safenet-lg border border-safenet-border w-full max-w-md pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-safenet-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-safenet-primary-light flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-safenet-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-heading-sm text-safenet-text">
                      {isEditing ? 'Edit Safe Zone' : 'Add Safe Zone'}
                    </h3>
                    <p className="text-xs text-safenet-text-3">
                      {isEditing ? 'Modify zone settings' : 'Create a new geofence area'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-safenet-surface transition-colors"
                >
                  <X className="w-5 h-5 text-safenet-text-3" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Zone name */}
                <div>
                  <label className="block text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-1.5">
                    Zone Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Home, School, Grandma's House"
                    className="w-full px-3.5 py-2.5 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text placeholder:text-safenet-text-3 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
                  />
                </div>

                {/* Icon picker */}
                <div>
                  <label className="block text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-1.5">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ZONE_ICONS.map((icn) => (
                      <button
                        key={icn.value}
                        onClick={() => setIcon(icn.value)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          icon === icn.value
                            ? 'border-safenet-primary bg-safenet-primary-light'
                            : 'border-safenet-border hover:border-safenet-primary/30 bg-white'
                        }`}
                        title={icn.label}
                      >
                        {icn.value === 'Home' && <Home className="w-4 h-4" style={{ color: icon === icn.value ? '#0F7B4D' : '#6B7280' }} />}
                        {icn.value === 'GraduationCap' && <GraduationCap className="w-4 h-4" style={{ color: icon === icn.value ? '#0F7B4D' : '#6B7280' }} />}
                        {icn.value === 'Building2' && <Building2 className="w-4 h-4" style={{ color: icon === icn.value ? '#0F7B4D' : '#6B7280' }} />}
                        {icn.value === 'Heart' && <Heart className="w-4 h-4" style={{ color: icon === icn.value ? '#0F7B4D' : '#6B7280' }} />}
                        {icn.value === 'Star' && <Star className="w-4 h-4" style={{ color: icon === icn.value ? '#0F7B4D' : '#6B7280' }} />}
                        {icn.value === 'MapPin' && <MapPin className="w-4 h-4" style={{ color: icon === icn.value ? '#0F7B4D' : '#6B7280' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius slider */}
                <div>
                  <label className="block text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-1.5">
                    Radius — {radius}m
                  </label>
                  <div className="flex items-center gap-3">
                    <Sliders className="w-4 h-4 text-safenet-text-3 flex-shrink-0" />
                    <input
                      type="range"
                      min={50}
                      max={2000}
                      step={50}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="flex-1 h-2 bg-safenet-surface rounded-full appearance-none cursor-pointer accent-safenet-primary"
                    />
                    <span className="text-xs font-medium text-safenet-text-2 w-14 text-right">{radius}m</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-safenet-text-3 mt-1 px-1">
                    <span>50m</span>
                    <span>1km</span>
                    <span>2km</span>
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-1.5">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ZONE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c.value ? 'border-safenet-text scale-110 shadow-safenet-sm' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Coordinates */}
                <div>
                  <label className="block text-xs font-semibold text-safenet-text-2 uppercase tracking-wider mb-1.5">
                    Coordinates
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-safenet-text-3 mb-0.5">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={lat}
                        onChange={(e) => setLat(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-safenet-text-3 mb-0.5">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={lng}
                        onChange={(e) => setLng(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-safenet-surface border border-safenet-border rounded-input text-sm text-safenet-text focus:outline-none focus:ring-2 focus:ring-safenet-primary/40 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-safenet-border flex items-center justify-between">
                <div>
                  {isEditing && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-safenet-danger hover:bg-red-50 rounded-btn transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-safenet-primary text-white rounded-btn text-sm font-medium hover:bg-safenet-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Save Changes' : 'Add Zone'}
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-card-lg"
                  >
                    <div className="text-center p-8">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-6 h-6 text-safenet-danger" />
                      </div>
                      <h4 className="font-display text-heading-sm text-safenet-text mb-2">Delete Safe Zone?</h4>
                      <p className="text-sm text-safenet-text-2 mb-6 max-w-xs mx-auto">
                        Are you sure you want to delete "{editZone?.name}"? This action cannot be undone.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 text-sm font-medium text-safenet-text-2 hover:text-safenet-text transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          className="px-5 py-2 bg-safenet-danger text-white rounded-btn text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
