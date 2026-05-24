import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useFamily(userId) {
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setFamily(null)
      setLoading(false)
      return
    }
    const ref = doc(db, 'safenet_families', userId)
    const unsub = onSnapshot(ref, (snap) => {
      setFamily(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
    return unsub
  }, [userId])

  const createFamily = async (data) => {
    if (!userId) return
    await setDoc(doc(db, 'safenet_families', userId), {
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  return { family, loading, createFamily }
}

export default useFamily
