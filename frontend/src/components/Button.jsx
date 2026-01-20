import React from 'react'

export const Badge = ({ children, variant = 'default', style, ...props }) => {
  const variants = {
    default: { bg: 'var(--neutral-100)', color: 'var(--neutral-700)' },
    green: { bg: 'var(--success-50)', color: 'var(--success-main)' },
    blue: { bg: 'var(--primary-50)', color: 'var(--primary-main)' },
    red: { bg: 'var(--danger-50)', color: 'var(--danger-main)' },
    warning: { bg: 'var(--warning-50)', color: 'var(--warning-main)' }
  }

  const variantStyle = variants[variant] || variants.default

  return (
    <span
      style={{
        display: 'inline-block',
        padding: 'var(--spacing-xs) var(--spacing-md)',
        background: variantStyle.bg,
        color: variantStyle.color,
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...style
      }}
      {...props}
    >
      {children}
    </span>
  )
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  style,
  ...props 
}) => {
  const variants = {
    primary: {
      bg: 'var(--primary-main)',
      color: 'white',
      hover: 'var(--primary-dark)'
    },
    secondary: {
      bg: 'var(--neutral-200)',
      color: 'var(--neutral-900)',
      hover: 'var(--neutral-300)'
    }
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '0.75rem' },
    md: { padding: '8px 16px', fontSize: '0.875rem' },
    lg: { padding: '12px 20px', fontSize: '1rem' }
  }

  const variantStyle = variants[variant] || variants.primary
  const sizeStyle = sizes[size] || sizes.md

  return (
    <button
      style={{
        background: variantStyle.bg,
        color: variantStyle.color,
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        ...sizeStyle,
        ...style
      }}
      onMouseEnter={(e) => e.target.style.background = variantStyle.hover}
      onMouseLeave={(e) => e.target.style.background = variantStyle.bg}
      {...props}
    >
      {children}
    </button>
  )
}
