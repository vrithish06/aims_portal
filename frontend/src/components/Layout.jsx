import React from 'react'

export const Container = ({ children, style, ...props }) => (
  <div
    style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: 'var(--spacing-lg)',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)

export const Layout = ({ children, style, ...props }) => (
  <div
    style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--neutral-50)',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)

export const Sidebar = ({ children, style, ...props }) => (
  <aside
    style={{
      width: '250px',
      background: 'white',
      borderRight: '1px solid var(--neutral-200)',
      padding: 'var(--spacing-lg)',
      overflowY: 'auto',
      ...style
    }}
    {...props}
  >
    <style>{`
      aside a {
        color: var(--neutral-700);
        text-decoration: none;
        transition: color 0.2s;
      }
      aside a:hover {
        color: var(--primary-main);
      }
    `}</style>
    {children}
  </aside>
)

export const MainContent = ({ children, style, ...props }) => (
  <main
    style={{
      flex: 1,
      overflowY: 'auto',
      ...style
    }}
    {...props}
  >
    {children}
  </main>
)
