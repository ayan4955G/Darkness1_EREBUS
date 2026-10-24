import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EREBUS | Super Admin Control Plane',
  description: 'Unified Super Administrator console for EREBUS Orbital Space Cloud Platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#070c14" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛰️</text></svg>" />
      </head>
      <body>
        <div className="orbital-bg" />
        <div className="radar-grid" />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
