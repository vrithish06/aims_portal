import React from 'react'
import { ChevronRight } from 'lucide-react'

export const Breadcrumb = ({ items = [] }) => (
  <nav style={{
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-lg)',
    fontSize: '0.875rem'
  }}>
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && <ChevronRight size={16} style={{color: 'var(--neutral-400)'}} />}
        {item.current ? (
          <span style={{color: 'var(--neutral-600)', fontWeight: 500}}>
            {item.label}
          </span>
        ) : (
          <a
            href={item.href}
            style={{
              color: 'var(--primary-main)',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            {item.label}
          </a>
        )}
      </React.Fragment>
    ))}
  </nav>
)
