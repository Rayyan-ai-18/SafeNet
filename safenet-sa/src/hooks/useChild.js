import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useChild(familyId, childId) {
  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId || !childId) {
      setChild(null)
      setLoading(false)
      return
    }
    const ref = doc(db, 'safenet_families', familyId, 'children', childId)
    const unsub = onSnapshot(ref, (snap) => {
      setChild(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
    return unsub
  }, [familyId, childId])

  const updateChild = async (data) => {
    if (!familyId || !childId) return
    const ref = doc(db, 'safenet_families', familyId, 'children', childId)
    await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() })
  }

  return { child, loading, updateChild }
}

export function useChildren(familyId) {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId) {
      setChildren([])
      setLoading(false)
      return
    }
    const ref = collection(db, 'safenet_families', familyId, 'children')
    const unsub = onSnapshot(ref, (snap) => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [familyId])

  const addChild = async (data) => {
    if (!familyId) return
    const ref = collection(db, 'safenet_families', familyId, 'children')
    return addDoc(ref, { ...data, isOnline: false, createdAt: new Date().toISOString() })
  }

  return { children, loading, addChild }
}

export default useChild
