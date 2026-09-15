'use client'

import React, { useState } from 'react'

export default function SettingsSection() {
  const [apiKey, setApiKey] = useState('erebus_live_sk_94829471908472918471')
  const [threshold, setThreshold] = useState('0.15 mSv/h Trigger Auto-Safe Mode')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
          <label>Primary Laser API Secret Token</label>
          <input
            className="form-input"
            readOnly
            value={apiKey}
            style={{ fontFamily: 'monospace' }}
          />
        </div>
        <div className="form-group">
          <label>Radiation Auto-Shielding Threshold</label>
          <input
            className="form-input"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
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
