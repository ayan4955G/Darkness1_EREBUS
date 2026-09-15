'use client'

import React from 'react'

export default function RegionsSection() {
  const regions = [
    {
      name: 'EREBUS-CORE',
      code: 'LEO-PRIMARY',
      ping: '0.4 ms',
      nodes: 12,
      orbit: 'Low Earth Orbit (412 km)',
    },
    {
      name: 'ORBITAL-01',
      code: 'GEO-ALPHA',
      ping: '1.2 ms',
      nodes: 8,
      orbit: 'Geostationary Equatorial Orbit',
    },
    {
      name: 'ORBITAL-02',
      code: 'GEO-BETA',
      ping: '1.8 ms',
      nodes: 6,
      orbit: 'Geostationary Polar Orbit',
    },
    {
      name: 'LUNAR-01',
      code: 'MOON-SOUTH',
      ping: '1.28 s',
      nodes: 4,
      orbit: 'Lunar South Pole Gateway',
    },
    {
      name: 'MARS-RELAY',
      code: 'AREO-RELAY',
      ping: '4.20 min',
      nodes: 2,
      orbit: 'Areostationary Relay Node',
    },
  ]

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Cloud Regions & Space Data Center Topology</h2>
          <p>Space-to-ground edge compute regions powered by laser mesh networks.</p>
        </div>
      </div>

      <div className="regions-grid" style={{ marginTop: 24 }}>
        {regions.map((reg) => (
          <div className="region-card" key={reg.name}>
            <div className="region-card-top">
              <span className="region-title">{reg.name}</span>
              <span className="region-badge-active">Operational</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <div>
                Code: <strong>{reg.code}</strong>
              </div>
              <div style={{ marginTop: 4 }}>Orbit: {reg.orbit}</div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                borderTop: '1px solid #f1f5f9',
                paddingTop: 10,
                marginTop: 12,
              }}
            >
              <span>
                Ping Latency: <strong style={{ color: '#2563eb' }}>{reg.ping}</strong>
              </span>
              <span>
                Nodes: <strong>{reg.nodes}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
