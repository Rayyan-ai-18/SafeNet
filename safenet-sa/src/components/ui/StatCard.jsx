import React, { useRef, useEffect, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

export default function StatCard({
  value,
  label,
  description,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const sectionRef = useRef(null)
  const valueRef = useRef(null)
  const [displayValue, setDisplayValue] = useState(prefix + '0' + suffix)

  useEffect(() => {
    const el = valueRef.current
    if (!el) return

    const isNumeric = !isNaN(Number(value))
    if (!isNumeric) {
      setDisplayValue(prefix + value + suffix)
      return
    }

    const targetNum = parseFloat(value)
    const ctx = gsap.context(() => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: targetNum,
        duration: 1.5,
        snap: { val: 1 },
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
        onUpdate: () => {
          const rounded = Math.round(obj.val)
          const display = targetNum % 1 !== 0 ? obj.val.toFixed(1) : rounded.toString()
          setDisplayValue(prefix + display + suffix)
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [value, prefix, suffix])

  return (
    <div
      ref={sectionRef}
      className={`bg-white rounded-card-lg shadow-safenet-sm border border-safenet-border p-6 text-center ${className}`}
    >
      <div
        ref={valueRef}
        className="font-display text-display-sm text-safenet-primary mb-2 count-up-number"
      >
        {displayValue}
      </div>
      <div className="text-sm font-semibold text-safenet-text mb-1">{label}</div>
      <div className="text-xs text-safenet-text-3 leading-relaxed">{description}</div>
    </div>
  )
}
