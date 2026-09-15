'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { RocketMachine, RocketRegion } from '@/lib/types'

interface DeployRocketModalProps {
  isOpen: boolean
  onClose: () => void
  onLaunch: (newMachine: RocketMachine) => void
}

export default function DeployRocketModal({
  isOpen,
  onClose,
  onLaunch,
}: DeployRocketModalProps) {
  const [name, setName] = useState('')
  const [region, setRegion] = useState<RocketRegion>('EREBUS-CORE')
  const [cpu, setCpu] = useState('16 vCPU')
  const [memory, setMemory] = useState('64 GB NVMe')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newVm: RocketMachine = {
      id: `vm-${Date.now().toString().slice(-4)}`,
      name: name.trim().toUpperCase(),
      region,
      status: 'Running',
      cpu,
      memory,
      image: 'Ubuntu 24.04 Space-Kernel',
      ip: `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      mission: 'Orbital Workload',
      cpuUsage: 12,
      memUsage: 24,
      tempC: 34,
    }

    onLaunch(newVm)
    setName('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Launch New Rocket Machine</h3>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X style={{ width: 14 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Machine Name</label>
            <input
              className="form-input"
              placeholder="e.g. ORBITAL-ANALYSIS-01"
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
              onChange={(e) => setRegion(e.target.value as RocketRegion)}
            >
              <option value="EREBUS-CORE">EREBUS-CORE (LEO)</option>
              <option value="ORBITAL-01">ORBITAL-01 (GEO)</option>
              <option value="ORBITAL-02">ORBITAL-02 (GEO)</option>
              <option value="LUNAR-01">LUNAR-01 (Moon)</option>
              <option value="MARS-RELAY">MARS-RELAY (Mars)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Compute Configuration</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select className="form-input" value={cpu} onChange={(e) => setCpu(e.target.value)}>
                <option value="8 vCPU">8 vCPU</option>
                <option value="16 vCPU">16 vCPU</option>
                <option value="32 vCPU">32 vCPU</option>
                <option value="64 vCPU">64 vCPU</option>
                <option value="128 vCPU">128 vCPU</option>
              </select>
              <select className="form-input" value={memory} onChange={(e) => setMemory(e.target.value)}>
                <option value="32 GB NVMe">32 GB NVMe</option>
                <option value="64 GB NVMe">64 GB NVMe</option>
                <option value="128 GB NVMe">128 GB NVMe</option>
                <option value="512 GB NVMe">512 GB NVMe</option>
                <option value="1024 GB NVMe">1024 GB NVMe</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="submit"
              className="primary-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Launch Instance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
