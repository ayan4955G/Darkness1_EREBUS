'use client'

import React from 'react'
import { Box, Database, HardDrive, LockKeyhole, Plus } from 'lucide-react'
import { StorageBucket } from '@/lib/types'

interface StorageSectionProps {
  buckets: StorageBucket[]
  onOpenCreateBucketModal: () => void
}

export default function StorageSection({
  buckets,
  onOpenCreateBucketModal,
}: StorageSectionProps) {
  const totalSizeGb = buckets.reduce((acc, b) => acc + (b.sizeGb || 0), 0)
  const totalObjects = buckets.reduce((acc, b) => acc + (b.objectCount || 0), 0)

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Orbital Cloud Storage</h2>
          <p>High-capacity space-grade NVMe bucket arrays with zero-gravity redundancy.</p>
        </div>
        <button className="primary-btn" onClick={onOpenCreateBucketModal} type="button">
          <Plus style={{ width: 16 }} /> Create Bucket
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            ACTIVE BUCKETS <HardDrive style={{ width: 16, color: '#2563eb' }} />
          </div>
          <div className="stat-card-val">{buckets.length}</div>
          <div className="stat-card-sub">NVMe Storage Pools</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            TOTAL SIZE <Database style={{ width: 16, color: '#10b981' }} />
          </div>
          <div className="stat-card-val">{totalSizeGb} GB</div>
          <div className="stat-card-sub">Replicated across orbit</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            TOTAL OBJECTS <Box style={{ width: 16, color: '#6366f1' }} />
          </div>
          <div className="stat-card-val">{totalObjects.toLocaleString()}</div>
          <div className="stat-card-sub">Telemetry & datasets</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            ENCRYPTION <LockKeyhole style={{ width: 16, color: '#0284c7' }} />
          </div>
          <div className="stat-card-val" style={{ fontSize: 20 }}>
            AES-256-GCM
          </div>
          <div className="stat-card-sub">Quantum-Safe Keys</div>
        </div>
      </div>

      <div className="card-panel" style={{ marginTop: 24 }}>
        <div className="table-head-row">
          <h3>Storage Buckets ({buckets.length})</h3>
        </div>

        <table className="finpay-table">
          <thead>
            <tr>
              <th>BUCKET NAME</th>
              <th>REGION</th>
              <th>SIZE (GB)</th>
              <th>OBJECT COUNT</th>
              <th>STORAGE TIER</th>
              <th>REDUNDANCY</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{b.name}</td>
                <td>
                  <span className="peak-pill">{b.region}</span>
                </td>
                <td>{b.sizeGb} GB</td>
                <td>{b.objectCount.toLocaleString()}</td>
                <td>
                  <span className="table-status-pill status-success">{b.tier}</span>
                </td>
                <td>{b.redundancy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
