import React from 'react'

export const Card = ({ children, style, ...props }) => (
  <div
    style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, style, ...props }) => (
  <div
    style={{
      padding: 'var(--spacing-lg)',
      borderBottom: '1px solid var(--neutral-200)',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)

export const CardBody = ({ children, style, ...props }) => (
  <div
    style={{
      padding: 'var(--spacing-lg)',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)

export const CardFooter = ({ children, style, ...props }) => (
  <div
    style={{
      padding: 'var(--spacing-lg)',
      borderTop: '1px solid var(--neutral-200)',
      display: 'flex',
      gap: 'var(--spacing-md)',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)
