import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

const variants = {
  primary: 'bg-safenet-primary text-white hover:bg-safenet-primary-dark shadow-safenet-md',
  secondary: 'bg-white text-safenet-text border-2 border-safenet-border hover:border-safenet-border-strong',
  ghost: 'bg-transparent text-safenet-text-2 hover:text-safenet-text',
  danger: 'bg-safenet-danger text-white hover:bg-red-700',
  outline: 'bg-transparent text-safenet-primary border-2 border-safenet-primary hover:bg-safenet-primary-light',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  magnetic = false,
  as: Component = 'button',
  ...props
}) {
  const btnRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!magnetic || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    gsap.to(btnRef.current, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  const handleMouseLeave = () => {
    if (!btnRef.current) return
    gsap.to(btnRef.current, {
      x: 0,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  return (
    <Component
      ref={btnRef}
      onMouseMove={magnetic ? handleMouseMove : undefined}
      onMouseLeave={magnetic ? handleMouseLeave : undefined}
      className={`
        inline-flex items-center justify-center gap-2
        font-body font-medium rounded-btn
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-safenet-primary/40
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  )
}
