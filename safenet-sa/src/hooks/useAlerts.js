import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAlerts(familyId, childId, alertLimit = 20) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId || !childId) {
      setAlerts([])
      setLoading(false)
      return
    }
    const ref = collection(db, 'safenet_families', familyId, 'children', childId, 'alerts')
    const q = query(ref, orderBy('timestamp', 'desc'), limit(alertLimit))
    const unsub = onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [familyId, childId, alertLimit])

  const markAsRead = async (alertId) => {
    if (!familyId || !childId || !alertId) return
    const ref = doc(db, 'safenet_families', familyId, 'children', childId, 'alerts', alertId)
    await updateDoc(ref, { isRead: true })
  }

  const unreadCount = alerts.filter(a => !a.isRead).length

  return { alerts, loading, unreadCount, markAsRead }
}

export default useAlerts
