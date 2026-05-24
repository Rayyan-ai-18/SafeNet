import React from 'react'

const variants = {
  default: 'bg-safenet-surface text-safenet-text-2 border-safenet-border',
  primary: 'bg-safenet-primary-light text-safenet-primary border-safenet-primary/20',
  accent: 'bg-safenet-accent-light text-safenet-accent border-safenet-accent/20',
  danger: 'bg-safenet-danger-light text-safenet-danger border-safenet-danger/20',
  success: 'bg-green-50 text-green-700 border-green-200',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function Badge({ children, variant = 'default', size = 'sm', className = '', dot = false }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'primary' ? 'bg-safenet-primary' :
          variant === 'accent' ? 'bg-safenet-accent' :
          variant === 'danger' ? 'bg-safenet-danger' :
          variant === 'success' ? 'bg-green-500' :
          'bg-safenet-text-3'
        }`} />
      )}
      {children}
    </span>
  )
}
