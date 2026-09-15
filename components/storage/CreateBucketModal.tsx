'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { StorageBucket } from '@/lib/types'

interface CreateBucketModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (newBucket: StorageBucket) => void
}

export default function CreateBucketModal({
  isOpen,
  onClose,
  onCreate,
}: CreateBucketModalProps) {
  const [name, setName] = useState('')
  const [region, setRegion] = useState('EREBUS-CORE')
  const [tier, setTier] = useState('High-Radiation NVMe')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newBucket: StorageBucket = {
      id: `bkt-${Date.now().toString().slice(-4)}`,
      name: name.trim().toLowerCase(),
      region,
      sizeGb: 256,
      objectCount: 1420,
      tier,
      redundancy: 'Triple Orbit Sync',
    }

    onCreate(newBucket)
    setName('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Storage Bucket</h3>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X style={{ width: 14 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bucket Name</label>
            <input
              className="form-input"
              placeholder="e.g. telemetry-raw-logs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Region</label>
            <select
              className="form-input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="EREBUS-CORE">EREBUS-CORE</option>
              <option value="ORBITAL-01">ORBITAL-01</option>
              <option value="LUNAR-01">LUNAR-01</option>
            </select>
          </div>
          <div className="form-group">
            <label>Storage Tier</label>
            <select
              className="form-input"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="High-Radiation NVMe">High-Radiation NVMe</option>
              <option value="Zero-G Cold">Zero-G Cold</option>
              <option value="Deep Space Vault">Deep Space Vault</option>
            </select>
          </div>
          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
          >
            Create Bucket
          </button>
        </form>
      </div>
    </div>
  )
}
