'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Rocket, X, ExternalLink } from 'lucide-react'
import { RocketMachine, TerminalLog } from '@/lib/types'

interface RocketConnectModalProps {
  machine: RocketMachine | null
  onClose: () => void
}

export default function RocketConnectModal({
  machine,
  onClose,
}: RocketConnectModalProps) {
  const [sshInput, setSshInput] = useState('')
  const [sshLogs, setSshLogs] = useState<TerminalLog[]>([
    {
      id: 1,
      type: 'system',
      text: `[ESTABLISHING SSH] Tunneling to ${machine?.name || 'NODE'} (${machine?.ip || '10.0.0.1'}) via LEO Laser Link...`,
    },
    {
      id: 2,
      type: 'system',
      text: `[AUTHENTICATED] Welcome to ${machine?.name || 'NODE'} (Erebus Space Kernel 6.8.0-orbital).`,
    },
    {
      id: 3,
      type: 'system',
      text: 'Type "health" to query propulsion status or "top" for CPU/Memory metrics.',
    },
  ])

  if (!machine) return null

  const handleSshSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = sshInput.trim().toLowerCase()
    if (!cmd) return

    const userLog: TerminalLog = { id: Date.now(), type: 'user', text: `$ ${sshInput}` }
    let sysReply = ''

    if (cmd === 'health' || cmd === 'status') {
      sysReply = `ROCKET TELEMETRY: Hull: 99.8% | Propellant: 94.0% | Core Temp: ${machine.tempC || 32.1}°C | Downlink: 10.24Gbps`
    } else if (cmd === 'top') {
      sysReply = `CPU USAGE: ${machine.cpuUsage || 24.5}% | MEMORY: ${machine.memUsage || 48.2}% [vCPUs: ${machine.cpu}]`
    } else if (cmd === 'reboot') {
      sysReply = `[REBOOTING] Flight computer on ${machine.name} initializing cold reboot... Systems Nominal!`
    } else if (cmd === 'clear') {
      setSshLogs([])
      setSshInput('')
      return
    } else {
      sysReply = `bash: command not found: ${cmd}. Available: health, status, top, reboot, clear.`
    }

    setSshLogs((prev) => [...prev, userLog, { id: Date.now() + 1, type: 'system', text: sysReply }])
    setSshInput('')
  }

  const handleCopySsh = () => {
    const cmd = `ssh operator@${machine.ip} -p 2201`
    navigator.clipboard?.writeText(cmd)
    alert(`SSH Command Copied: ${cmd}`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ssh-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-mark" style={{ width: 38, height: 38, borderRadius: 12 }}>
              <Rocket style={{ width: 20 }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{machine.name}</h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                IP: {machine.ip} | Region: {machine.region}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X style={{ width: 14 }} />
          </button>
        </div>

        {/* ROCKET DATA HEALTH */}
        <h4
          style={{
            margin: '14px 0 8px',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            fontWeight: 700,
          }}
        >
          🚀 Rocket Data Health & Telemetry
        </h4>
        <div className="health-grid">
          <div className="health-card">
            <div className="health-card-label">HULL INTEGRITY</div>
            <div className="health-card-val" style={{ color: '#059669' }}>
              99.8%
            </div>
          </div>
          <div className="health-card">
            <div className="health-card-label">PROPELLANT</div>
            <div className="health-card-val" style={{ color: '#2563eb' }}>
              94.0%
            </div>
          </div>
          <div className="health-card">
            <div className="health-card-label">COMPUTER LATENCY</div>
            <div className="health-card-val" style={{ color: '#6366f1' }}>
              0.2 ms
            </div>
          </div>
          <div className="health-card">
            <div className="health-card-label">CORE TEMP</div>
            <div className="health-card-val" style={{ color: '#d97706' }}>
              {machine.tempC || 32.1} °C
            </div>
          </div>
        </div>

        {/* INTERACTIVE LIVE SSH TERMINAL */}
        <h4
          style={{
            margin: '16px 0 8px',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            fontWeight: 700,
          }}
        >
          💻 Live SSH Console (Zero-Trust Laser Tunnel)
        </h4>
        <div className="terminal-card" style={{ padding: 18, borderRadius: 16 }}>
          <div className="terminal-header" style={{ marginBottom: 10, paddingBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              ssh operator@{machine.name.toLowerCase().replace(/\s+/g, '')}.erebus.space -p 2201
            </span>
            <span className="table-status-pill status-success" style={{ fontSize: 10 }}>
              Connected
            </span>
          </div>

          <div className="terminal-logs" style={{ minHeight: 160, maxHeight: 220, fontSize: 12 }}>
            {sshLogs.map((log) => (
              <div className={`log-entry ${log.type}`} key={log.id}>
                {log.text}
              </div>
            ))}
          </div>

          <form
            className="terminal-input-row"
            onSubmit={handleSshSubmit}
            style={{ marginTop: 10, paddingTop: 8 }}
          >
            <span className="terminal-prompt-symbol">
              root@{machine.name.toLowerCase().replace(/\s+/g, '')}:~#
            </span>
            <input
              type="text"
              className="terminal-input"
              placeholder="Type SSH command (e.g. 'health', 'status', 'top', 'reboot', 'clear')..."
              value={sshInput}
              onChange={(e) => setSshInput(e.target.value)}
            />
          </form>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'space-between' }}>
          <Link
            href={`/connect/${machine.id}`}
            className="secondary-btn"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ExternalLink style={{ width: 14 }} /> Open Dedicated Page
          </Link>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="secondary-btn" onClick={handleCopySsh} type="button">
              Copy SSH Command
            </button>
            <button className="primary-btn" onClick={onClose} type="button">
              Close Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
