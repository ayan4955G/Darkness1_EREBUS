'use client'

import React, { useEffect } from 'react'
import { Shield, ExternalLink, ArrowRight } from 'lucide-react'

export default function SuperAdminPortalPage() {
  const superAdminUrl = 'http://localhost:3001'

  useEffect(() => {
    // Optionally redirect if on localhost
    const timer = setTimeout(() => {
      window.location.href = superAdminUrl
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 500,
          width: '100%',
          padding: 36,
          borderRadius: 20,
          background: 'rgba(16, 25, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(86, 224, 194, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #56e0c2 0%, #2a686b 100%)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 0 24px rgba(86, 224, 194, 0.4)',
          }}
        >
          <Shield className="w-8 h-8 text-slate-900" style={{ color: '#06131c' }} />
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          Connecting to Super Admin
        </h1>

        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
          The EREBUS Super Admin Control Plane runs as a dedicated Next.js application on{' '}
          <strong style={{ color: '#56e0c2' }}>Port 3001</strong>. Redirecting you to the secure portal...
        </p>

        <a
          href={superAdminUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            height: 46,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #56e0c2 0%, #38bdf8 100%)',
            color: '#07161f',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(86, 224, 194, 0.3)',
          }}
        >
          Open Super Admin Console <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
