'use client'

import React from 'react'
import { Plus, RefreshCw, Terminal } from 'lucide-react'
import { RocketMachine } from '@/lib/types'

interface InfrastructureSectionProps {
  machines: RocketMachine[]
  onOpenLaunchModal: () => void
  onRefresh: () => void
  onConnectMachine: (machine: RocketMachine) => void
}

export default function InfrastructureSection({
  machines,
  onOpenLaunchModal,
  onRefresh,
  onConnectMachine,
}: InfrastructureSectionProps) {
  return (
    <>
      <div className="view-header">
        <div>
          <h2>Infrastructure & Orbital Machines</h2>
          <p>Manage space microservers, compute nodes, and payload instances.</p>
        </div>
        <button className="primary-btn" onClick={onOpenLaunchModal} type="button">
          <Plus style={{ width: 16 }} /> Launch Instance
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="table-head-row">
          <h3>Active Rocket Instances ({machines.length})</h3>
          <button className="secondary-btn" onClick={onRefresh} type="button">
            <RefreshCw style={{ width: 14 }} /> Refresh
          </button>
        </div>

        <div className="rocket-cards-grid">
          {machines.map((m) => {
            const isDarkness1 = m.name.toUpperCase().includes('DARKNESS')
            return (
              <div className="rocket-card" key={m.id}>
                <div className="rocket-card-visual">
                  <div className="rocket-card-tags">
                    <span className="rocket-tag-pill">{m.region}</span>
                    {isDarkness1 && (
                      <span className="rocket-tag-pill" style={{ background: '#2563eb' }}>
                        Vanguard
                      </span>
                    )}
                  </div>
                  <div className="rocket-card-rating">★ {isDarkness1 ? '4.9' : '4.8'}</div>
                  <img src="/rocket.png" alt={m.name} className="rocket-card-img" />
                </div>

                <div className="rocket-card-body">
                  <div className="rocket-card-header">
                    <h3 className="rocket-card-name">{m.name}</h3>
                    <span className="rocket-status-badge">
                      {isDarkness1 ? 'Top Rated' : m.status}
                    </span>
                  </div>

                  <p className="rocket-card-desc">
                    {isDarkness1
                      ? 'Flagship suborbital high-altitude compute payload. Radiation-shielded NVMe array with quantum laser uplink.'
                      : m.mission}
                  </p>

                  <div className="rocket-specs-row">
                    <span>{m.cpu}</span>
                    <span>•</span>
                    <span>{m.memory}</span>
                    <span>•</span>
                    <span style={{ fontFamily: 'monospace' }}>{m.ip}</span>
                  </div>

                  <button
                    className="rocket-card-connect-btn"
                    onClick={() => onConnectMachine(m)}
                    type="button"
                  >
                    <Terminal style={{ width: 15 }} /> Connect to {m.name}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
