import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Target, Navigation, Clock, Circle as CircleIcon, Plus, Trash2, Users, Edit3 } from 'lucide-react'
import SEO from '../components/seo/SEO'
import DashboardShell from '../components/layout/DashboardShell'
import GeofenceEditor from '../components/dashboard/GeofenceEditor'
import { useApp } from '../context/AppContext'

const iconMap = {
  Home: 'Home',
  GraduationCap: 'GraduationCap',
}

// Custom green pulsing marker icon
const createPulseIcon = (isSelected = false) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:28px;height:28px">
      <div style="
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:28px;height:28px;border-radius:50%;
        background:rgba(15,123,77,0.3);
        animation:pulse-ring 2s infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:16px;height:16px;border-radius:50%;
        background:#0F7B4D;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Default icon fix for Leaflet with webpack/vite
const defaultIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#0F7B4D;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

// Component to fly to a location when selected child changes
function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 })
    }
  }, [center, map])
  return null
}

const locationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SafeNet SA - Real-Time GPS Location Tracking',
  description: 'Track your children\'s real-time GPS location. View location history, set safe zones (geofences), and receive arrival and departure alerts.',
  url: 'https://safenet-sa.co.za/location',
  isPartOf: {
    '@type': 'Organization',
    name: 'SafeNet SA',
    url: 'https://safenet-sa.co.za',
  },
  about: {
    '@type': 'Thing',
    name: 'Real-time GPS child location tracking and geofencing',
  },
}

export default function Location() {
  const { children, zones, removeZone } = useApp()
  const [selectedChild, setSelectedChild] = useState(children[0]?.id || '1')
  const [showGeofencePanel, setShowGeofencePanel] = useState(false)
  const [geofenceModalOpen, setGeofenceModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const mapRef = useRef(null)

  const child = children.find(c => c.id === selectedChild) || children[0]
  const mapCenter = child ? [child.lat, child.lng] : [-26.2041, 28.0473]

  return (
    <DashboardShell>
      <SEO
        title="SafeNet SA - Real-Time GPS Location Tracking"
        description="Track your children's real-time GPS location. View location history, set safe zones (geofences), and receive arrival and departure alerts."
        canonicalPath="/location"
        jsonLd={locationSchema}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-safenet-primary" />
            <h1 className="font-display text-display-sm text-safenet-text">Location Tracking</h1>
          </div>
          <p className="text-sm text-safenet-text-2">Real-time GPS location for your children</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Interactive Map */}
          <div className="flex-1 min-h-[520px] rounded-card-lg border border-safenet-border overflow-hidden relative shadow-safenet-sm">
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '520px', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              {/* CartoDB Positron tiles */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              />

              <MapController center={mapCenter} />

              {/* Location history polyline */}
              <Polyline
                positions={locationHistory}
                pathOptions={{
                  color: '#0F7B4D',
                  weight: 3,
                  opacity: 0.6,
                  dashArray: '8 4',
                }}
              />

              {/* Geofence circles */}
              {zones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.08,
                    weight: 2,
                    opacity: 0.4,
                  }}
                />
              ))}

              {/* Child markers */}
              {children.map((c) => (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  icon={c.id === selectedChild ? createPulseIcon(true) : defaultIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold text-safenet-text">{c.name}</div>
                      <div className="text-xs text-safenet-text-2 mt-0.5">{c.address}</div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-[10px] text-safenet-text-3">{c.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Floating live tracking badge */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-card-lg px-3 py-2 shadow-safenet-md border border-safenet-border flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2.5 h-2.5 rounded-full bg-green-500"
              />
              <div>
                <div className="text-xs font-semibold text-safenet-text">Live</div>
                <div className="text-[9px] text-safenet-text-3">Tracking • 30s ago</div>
              </div>
            </div>

            {/* Map attribution */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[9px] text-safenet-text-3 border border-safenet-border">
              CartoDB Positron • OpenStreetMap
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Child selector */}
            <div className="bg-white rounded-card-lg p-4 border border-safenet-border shadow-safenet-sm">
              <h3 className="text-sm font-semibold text-safenet-text mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-safenet-primary" />
                Select Child
              </h3>
              <div className="space-y-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChild(c.id)}
                    className={`
                      w-full text-left flex items-center gap-3 p-3 rounded-card-lg transition-all
                      ${selectedChild === c.id
                        ? 'bg-safenet-primary-light border border-safenet-primary/30 shadow-safenet-sm'
                        : 'bg-safenet-surface border border-transparent hover:border-safenet-border hover:shadow-safenet-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm
                      ${selectedChild === c.id ? 'bg-safenet-primary' : 'bg-safenet-text-3'}
                    `}>
                      {c.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-safenet-text">{c.name}</div>
                      <div className="text-xs text-safenet-text-3">{c.address}</div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-2 h-2 rounded-full ${c.isOnline ? 'bg-green-500' : 'bg-safenet-text-3'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Current location info */}
            <div className="bg-white rounded-card-lg p-4 border border-safenet-border shadow-safenet-sm">
              <h3 className="text-sm font-semibold text-safenet-text mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-safenet-primary" />
                Current Location
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-safenet-primary flex-shrink-0" />
                  <span className="text-sm text-safenet-text-2">{child.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-safenet-text-3 flex-shrink-0" />
                  <span className="text-xs text-safenet-text-3">Last updated 2 minutes ago</span>
                </div>
                <div className="bg-safenet-surface rounded-lg p-2.5 mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-safenet-text-3 font-medium uppercase tracking-wider">Coordinates</span>
                    <span className="text-[9px] text-safenet-text-3">Live</span>
                  </div>
                  <div className="text-[11px] text-safenet-text-2 font-mono">
                    {child.lat.toFixed(6)}, {child.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>

            {/* Geofence / Safe Zones */}
            <div className="bg-white rounded-card-lg p-4 border border-safenet-border shadow-safenet-sm">
              <button
                onClick={() => setShowGeofencePanel(!showGeofencePanel)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-semibold text-safenet-text flex items-center gap-2">
                  <CircleIcon className="w-4 h-4 text-safenet-primary" />
                  Safe Zones ({zones.length})
                </h3>
                <span className="text-xs text-safenet-text-3 transition-transform duration-200" style={{ transform: showGeofencePanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>

              <AnimatePresence>
                {showGeofencePanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-3 pt-3 border-t border-safenet-border">
                      {zones.map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-2.5 bg-safenet-surface rounded-card-lg">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                            <div>
                              <div className="text-xs font-medium text-safenet-text">{zone.name}</div>
                              <div className="text-[10px] text-safenet-text-3">{zone.radius}m radius</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingZone(zone)
                                setGeofenceModalOpen(true)
                              }}
                              className="p-1 rounded hover:bg-safenet-surface-2 transition-colors"
                              title="Edit zone"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-safenet-text-3 hover:text-safenet-primary transition-colors" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete safe zone "${zone.name}"?`)) {
                                  removeZone(zone.id)
                                }
                              }}
                              className="p-1 rounded hover:bg-safenet-surface-2 transition-colors"
                              title="Delete zone"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-safenet-text-3 hover:text-safenet-danger transition-colors" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setEditingZone(null)
                          setGeofenceModalOpen(true)
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-safenet-primary-light text-safenet-primary rounded-card-lg text-xs font-medium hover:bg-safenet-primary/20 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add safe zone
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Editor Modal */}
      <GeofenceEditor
        open={geofenceModalOpen}
        onClose={() => {
          setGeofenceModalOpen(false)
          setEditingZone(null)
        }}
        editZone={editingZone}
      />
    </DashboardShell>
  )
}
