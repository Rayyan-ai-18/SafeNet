import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, ArrowRight, Home, GraduationCap, Building2, Heart, Star, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const iconMap = {
  Home, GraduationCap, Building2, Heart, Star, MapPin,
}

export default function SafeZoneStatus() {
  const { zones, children, zoneAlerts } = useApp()

  // Derive zone-based child status
  const getZoneChildren = (zone) => {
    return children.map(child => {
      // Simple proximity simulation based on lat/lng proximity
      const dist = Math.sqrt(
        Math.pow((child.lat || 0) - zone.lat, 2) +
        Math.pow((child.lng || 0) - zone.lng, 2)
      ) * 111000 // rough meters
      const status = dist < zone.radius ? 'inside' : 'outside'
      return {
        name: child.name,
        childId: child.id,
        status,
        lastSeen: child.lastSeen,
      }
    })
  }

  if (!zones.length) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-heading-md text-safenet-text flex items-center gap-2">
            <Navigation className="w-5 h-5 text-safenet-primary" />
            Safe Zones
          </h2>
          <Link to="/location" className="text-sm text-safenet-primary font-medium hover:underline flex items-center gap-1">
            Set up zones
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-white rounded-card-lg p-8 border border-safenet-border shadow-safenet-sm text-center">
          <MapPin className="w-10 h-10 text-safenet-text-3 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-safenet-text mb-1">No safe zones configured</h3>
          <p className="text-xs text-safenet-text-2 mb-4">Add geofences to get notified when your child arrives or leaves home, school, or other trusted places.</p>
          <Link to="/location" className="inline-flex items-center gap-1 text-sm text-safenet-primary font-medium hover:underline">
            Go to Location
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-heading-md text-safenet-text flex items-center gap-2">
          <Navigation className="w-5 h-5 text-safenet-primary" />
          Safe Zones
        </h2>
        <Link to="/location" className="text-sm text-safenet-primary font-medium hover:underline flex items-center gap-1">
          Manage zones
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zone cards */}
        {zones.map((zone) => {
          const ZoneIcon = iconMap[zone.icon] || MapPin
          const zoneChildren = getZoneChildren(zone)
          const allInside = zoneChildren.every((c) => c.status === 'inside')

          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-card-lg border border-safenet-border shadow-safenet-sm overflow-hidden"
            >
              {/* Zone header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-safenet-border">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${zone.color}15` }}
                >
                  <ZoneIcon className="w-5 h-5" style={{ color: zone.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-safenet-text">{zone.name}</div>
                  <div className="text-xs text-safenet-text-3">{zone.lat?.toFixed(4)}, {zone.lng?.toFixed(4)}</div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                  allInside
                    ? 'bg-safenet-primary-light text-safenet-primary'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {allInside ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {allInside ? 'All safe' : 'Attention'}
                </div>
              </div>

              {/* Zone details */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 text-[11px] text-safenet-text-3">
                  <MapPin className="w-3 h-3" />
                  <span>{zone.radius}m radius · Geofence active</span>
                </div>

                {/* Children in zone */}
                <div className="space-y-2">
                  {zoneChildren.map((child) => (
                    <div
                      key={`${zone.id}-${child.name}`}
                      className="flex items-center justify-between p-2.5 bg-safenet-surface rounded-card-lg"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            child.status === 'inside' ? 'bg-safenet-primary' : 'bg-amber-500'
                          }`}
                        />
                        <div>
                          <div className="text-xs font-medium text-safenet-text">{child.name}</div>
                          <div className="text-[10px] text-safenet-text-3">{child.lastSeen}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium ${
                        child.status === 'inside' ? 'text-safenet-primary' : 'text-amber-600'
                      }`}>
                        {child.status === 'inside' ? 'Inside ✓' : 'Outside'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Zone radius indicator */}
                <div className="mt-3 pt-3 border-t border-safenet-border">
                  <div className="flex items-center gap-2 text-[10px] text-safenet-text-3">
                    <div className="flex-1 h-1.5 bg-safenet-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(zone.radius / 2000 * 100, 100)}%`,
                          backgroundColor: zone.color,
                        }}
                      />
                    </div>
                    <span>{zone.radius}m radius</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Recent zone alerts */}
      {zoneAlerts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-card-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            {zoneAlerts.map((alert, ai) => (
              <span key={ai} className="text-xs text-amber-800">
                <strong>{alert.child}</strong> {alert.type === 'departure' ? 'left' : 'entered'}{' '}
                <strong>{alert.zone}</strong>. {alert.time}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
