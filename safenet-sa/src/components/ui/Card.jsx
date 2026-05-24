import React from 'react'
import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  as: Component = 'div',
  ...props
}) {
  const base = 'rounded-card-lg bg-white border border-safenet-border overflow-hidden'
  const variants = {
    default: 'shadow-safenet-sm',
    elevated: 'shadow-safenet-md',
    surface: 'bg-safenet-surface shadow-none',
    primary: 'bg-safenet-primary text-white border-safenet-primary-dark',
  }

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${base} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
