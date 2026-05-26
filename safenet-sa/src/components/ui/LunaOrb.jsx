import React, { useRef, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { gsap } from '../../lib/gsap'

const orbGradients = {
  idle: 'radial-gradient(circle at 35% 35%, #1aff8c 0%, #0F7B4D 100%)',
  listening: 'radial-gradient(circle at 35% 35%, #22ff99 0%, #0F7B4D 100%)',
  thinking: 'radial-gradient(circle at 35% 35%, #1aff8c 0%, #0a5c38 100%)',
  speaking: 'radial-gradient(circle at 35% 35%, #22ff99 0%, #0F7B4D 100%)',
  alert: 'radial-gradient(circle at 35% 35%, #F59E0B 0%, #DC6B00 100%)',
}

const orbShadows = {
  idle: '0 0 20px rgba(15,123,77,0.25)',
  listening: '0 0 32px rgba(15,123,77,0.5), 0 0 64px rgba(15,123,77,0.2)',
  thinking: '0 0 24px rgba(15,123,77,0.3)',
  speaking: '0 0 40px rgba(15,123,77,0.45), 0 0 80px rgba(15,123,77,0.15)',
  alert: '0 0 32px rgba(245,158,11,0.5), 0 0 64px rgba(220,107,0,0.25)',
}

const orbBorderColors = {
  idle: 'rgba(15,123,77,0.3)',
  listening: 'rgba(15,123,77,1)',
  thinking: 'rgba(10,92,56,0.6)',
  speaking: 'rgba(15,123,77,0.8)',
  alert: 'rgba(245,158,11,0.8)',
}

export default function LunaOrb({ state = 'idle', size = 120 }) {
  const controls = useAnimation()
  const orbRef = useRef(null)
  const outerRingRef = useRef(null)
  const gradientRef = useRef(null)
  const prevStateRef = useRef(state)

  // Breathe keyframes
  useEffect(() => {
    if (!orbRef.current) return

    let alertTimer = null

    if (state === 'idle') {
      controls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      })
    } else if (state === 'listening') {
      controls.start({
        scale: 1.06,
        transition: { type: 'spring', stiffness: 200, damping: 15 },
      })
    } else if (state === 'thinking') {
      controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      })
    } else if (state === 'speaking') {
      controls.start({
        scale: 1,
        transition: { duration: 0.15 },
      })
    } else if (state === 'alert') {
      controls.start({
        scale: 1.08,
        transition: { type: 'spring', stiffness: 300, damping: 12 },
      })
      // Return to green after 3s
      alertTimer = setTimeout(() => {
        controls.start({
          scale: 1,
          transition: { duration: 0.6, ease: 'easeOut' },
        })
      }, 3000)
    }

    prevStateRef.current = state

    return () => {
      if (alertTimer) clearTimeout(alertTimer)
    }
  }, [state, controls])

  // Rotate outer ring for thinking state (1.2s per spec)
  useEffect(() => {
    if (!outerRingRef.current) return
    if (state === 'thinking') {
      gsap.to(outerRingRef.current, {
        rotation: 360,
        duration: 1.2,
        repeat: -1,
        ease: 'none',
      })
    } else {
      gsap.killTweensOf(outerRingRef.current)
      gsap.set(outerRingRef.current, { rotation: 0 })
    }
    return () => gsap.killTweensOf(outerRingRef.current)
  }, [state])

  // Speaking word-boundary pulse
  useEffect(() => {
    if (state !== 'speaking' || !orbRef.current) return

    const handleBoundary = () => {
      controls.start({
        scale: 1.05,
        transition: { type: 'spring', stiffness: 400, duration: 0.1 },
      })
      setTimeout(() => {
        controls.start({
          scale: 1,
          transition: { type: 'spring', stiffness: 400, duration: 0.1 },
        })
      }, 100)
    }

    window.addEventListener('luna-word-boundary', handleBoundary)
    return () => window.removeEventListener('luna-word-boundary', handleBoundary)
  }, [state, controls])

  const mobileSize = typeof window !== 'undefined' && window.innerWidth < 640 ? Math.min(size, 96) : size
  const isAlert = state === 'alert'

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: mobileSize + 20, height: mobileSize + 20 }}
    >
      {/* Ripple rings for listening state */}
      {state === 'listening' && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-safenet-primary/40"
              style={{
                width: mobileSize,
                height: mobileSize,
                animation: `ripple 1.5s ${i * 0.5}s infinite ease-out`,
              }}
            />
          ))}
        </>
      )}

      {/* Ripple rings for alert state */}
      {isAlert && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={`alert-ripple-${i}`}
              className="absolute rounded-full border-2 border-safenet-accent/50"
              style={{
                width: mobileSize,
                height: mobileSize,
                animation: `ripple 1.2s ${i * 0.4}s infinite ease-out`,
              }}
            />
          ))}
        </>
      )}

      {/* Outer ring */}
      <div
        ref={outerRingRef}
        className="absolute rounded-full"
        style={{
          width: mobileSize + 8,
          height: mobileSize + 8,
          border: `2px solid ${orbBorderColors[state] || orbBorderColors.idle}`,
          borderStyle: state === 'thinking' ? 'dashed' : 'solid',
          borderRadius: '50%',
        }}
      />

      {/* Orb */}
      <motion.div
        ref={orbRef}
        animate={controls}
        className="relative rounded-full overflow-hidden"
        style={{
          width: mobileSize,
          height: mobileSize,
          background: orbGradients[state] || orbGradients.idle,
          boxShadow: orbShadows[state] || orbShadows.idle,
        }}
      >
        {/* Rotating gradient inner glow */}
        <div
          ref={gradientRef}
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)',
            animation: state === 'idle' || state === 'thinking' ? 'rotate-gradient 8s linear infinite' : 'none',
          }}
        />
      </motion.div>
    </div>
  )
}
