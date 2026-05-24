import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useLocations(familyId, childId) {
  const [locations, setLocations] = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId || !childId) {
      setLocations([])
      setCurrentLocation(null)
      setLoading(false)
      return
    }
    const ref = collection(db, 'safenet_families', familyId, 'children', childId, 'location')
    const q = query(ref, orderBy('timestamp', 'desc'), limit(50))
    const unsub = onSnapshot(q, (snap) => {
      const locs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLocations(locs)
      setCurrentLocation(locs[0] || null)
      setLoading(false)
    })
    return unsub
  }, [familyId, childId])

  return { locations, currentLocation, loading }
}

export default useLocations
