'use client'

import React, { useEffect, useState } from 'react'

export default function SettingsSection() {
  const [threshold, setThreshold] = useState('0.15')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings').then((response) => response.json()).then((result) => {
      if (result.success) setThreshold(String(result.data.radiationThreshold))
    }).catch(() => setError('Unable to load settings'))
  }, [])

  const handleSave = async () => {
    setError('')
    const response = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ radiationThreshold: Number(threshold) }) })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to save settings'); return }
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Settings & System Configurations</h2>
          <p>Manage security protocols, radiation shielding triggers, and API keys.</p>
        </div>
      </div>

      <div className="card-panel" style={{ marginTop: 24, maxWidth: 650 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>
          Orbital Security & API Credentials
        </h3>
        <div className="form-group">
          <label>Session security</label>
          <p>Dashboard API requests require your authenticated, HTTP-only session.</p>
        </div>
        <div className="form-group">
          <label>Radiation Auto-Shielding Threshold</label>
          <input
            className="form-input"
            type="number" min="0.0001" step="0.0001" value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
        {error && <p role="alert" style={{ color: '#ef4444' }}>{error}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="primary-btn" onClick={handleSave} type="button">
            {saved ? '✓ Configurations Saved' : 'Save Configurations'}
          </button>
          {saved && (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              Updated space control plane settings!
            </span>
          )}
        </div>
      </div>
    </>
  )
}
