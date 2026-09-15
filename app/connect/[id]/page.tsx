'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Cpu,
  HardDrive,
  Power,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Terminal as TerminalIcon,
  Wifi,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { RocketMachine, TerminalLog } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MachineConnectPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [machine, setMachine] = useState<RocketMachine | null>(null)
  const [loading, setLoading] = useState(true)
  const [sshInput, setSshInput] = useState('')
  const [sshLogs, setSshLogs] = useState<TerminalLog[]>([])

  useEffect(() => {
    async function loadMachine() {
      try {
        setLoading(true)
        const res = await fetch('/api/machines')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          const found = data.data.find(
            (m: RocketMachine) => m.id.toLowerCase() === id.toLowerCase()
          )
          if (found) {
            setMachine(found)
            setSshLogs([
              {
                id: 1,
                type: 'system',
                text: `[LASER UPLINK ESTABLISHED] Direct 10Gbps crosslink to ${found.name} (${found.ip})`,
              },
              {
                id: 2,
                type: 'system',
                text: `[SYSTEM] Authenticated operator@erebus.space with Space-Kernel 6.8.0-orbital`,
              },
              {
                id: 3,
                type: 'system',
                text: 'Available commands: health, top, reboot, clear, ping, ip, help',
              },
            ])
            return
          }
        }
        // Fallback default node if not found in mock array
        const defaultNode: RocketMachine = {
          id,
          name: id.toUpperCase(),
          region: 'EREBUS-CORE',
          status: 'Running',
          cpu: '64 vCPU',
          memory: '256 GB NVMe',
          image: 'Darkness Orbital OS v4.2',
          ip: '10.24.1.99',
          mission: 'Dedicated High-Speed Computing Vanguard',
          cpuUsage: 22.4,
          memUsage: 45.1,
          tempC: 31.8,
        }
        setMachine(defaultNode)
        setSshLogs([
          {
            id: 1,
            type: 'system',
            text: `[LASER UPLINK ESTABLISHED] Direct crosslink to ${defaultNode.name}`,
          },
          {
            id: 2,
            type: 'system',
            text: 'Available commands: health, top, reboot, clear, ping, ip, help',
          },
        ])
      } catch (err) {
        console.error('Failed to load rocket node', err)
      } finally {
        setLoading(false)
      }
    }

    loadMachine()
  }, [id])

  const handleSshSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = sshInput.trim().toLowerCase()
    if (!cmd || !machine) return

    const userLog: TerminalLog = { id: Date.now(), type: 'user', text: `$ ${sshInput}` }
    let sysReply = ''

    if (cmd === 'health' || cmd === 'status') {
      sysReply = `ROCKET TELEMETRY: Hull: 99.8% | Propellant: 94.0% | Core Temp: ${
        machine.tempC || 32.1
      }°C | Radiation Shield: ACTIVE`
    } else if (cmd === 'top') {
      sysReply = `CPU USAGE: ${machine.cpuUsage || 24.5}% | MEMORY: ${
        machine.memUsage || 48.2
      }% [vCPUs: ${machine.cpu}]`
    } else if (cmd === 'ping') {
      sysReply = 'PING 10.24.0.1 (Ground Gateway): 56 bytes, latency=0.38ms RTT.'
    } else if (cmd === 'ip') {
      sysReply = `INTERFACE eth0: inet ${machine.ip}/24 brd 10.24.255.255 laser-tx`
    } else if (cmd === 'reboot') {
      sysReply = `[REBOOTING] Flight computer on ${machine.name} executing cold reboot cycle... Systems Nominal!`
    } else if (cmd === 'help') {
      sysReply = 'Supported commands: health, top, ping, ip, reboot, clear'
    } else if (cmd === 'clear') {
      setSshLogs([])
      setSshInput('')
      return
    } else {
      sysReply = `bash: command not found: ${cmd}. Type "help" for available commands.`
    }

    setSshLogs((prev) => [
      ...prev,
      userLog,
      { id: Date.now() + 1, type: 'system', text: sysReply },
    ])
    setSshInput('')
  }

  const handleTogglePower = () => {
    if (!machine) return
    setMachine((prev) =>
      prev
        ? {
            ...prev,
            status: prev.status === 'Running' ? 'Stopped' : 'Running',
          }
        : null
    )
  }

  if (loading || !machine) {
    return (
      <AppShell title="Connecting to Orbital Payload...">
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          Establishing Laser Quantum Tunnel...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={`Console: ${machine.name}`}>
      <div>
        <Link
          href="/infrastructure"
          className="date-pill-control"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 18,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft style={{ width: 14 }} /> Back to Fleet Infrastructure
        </Link>

        {/* MACHINE HEADER ROW */}
        <div className="view-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              className="brand-mark"
              style={{ width: 48, height: 48, borderRadius: 14 }}
            >
              <Rocket style={{ width: 24, color: '#38bdf8' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>{machine.name}</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <span className="table-status-pill status-success">{machine.status}</span>
                <span className="peak-pill">{machine.region}</span>
                <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                  {machine.ip}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="secondary-btn"
              onClick={handleTogglePower}
              type="button"
            >
              <Power style={{ width: 14 }} />{' '}
              {machine.status === 'Running' ? 'Halt Instance' : 'Power On'}
            </button>
            <button
              className="primary-btn"
              onClick={() => {
                navigator.clipboard?.writeText(`ssh operator@${machine.ip} -p 2201`)
                alert(`Copied SSH Command: ssh operator@${machine.ip} -p 2201`)
              }}
              type="button"
            >
              Copy SSH Command
            </button>
          </div>
        </div>

        {/* HEALTH METRICS */}
        <div className="health-grid" style={{ marginTop: 20 }}>
          <div className="health-card">
            <div className="health-card-label">HULL INTEGRITY</div>
            <div className="health-card-val" style={{ color: '#059669' }}>
              99.8%
            </div>
          </div>
          <div className="health-card">
            <div className="health-card-label">PROPELLANT RESERVE</div>
            <div className="health-card-val" style={{ color: '#2563eb' }}>
              94.0%
            </div>
          </div>
          <div className="health-card">
            <div className="health-card-label">HARDWARE ALLOCATION</div>
            <div className="health-card-val" style={{ color: '#6366f1', fontSize: 16 }}>
              {machine.cpu} / {machine.memory}
            </div>
          </div>
          <div className="health-card">
            <div className="health-card-label">PAYLOAD CORE TEMP</div>
            <div className="health-card-val" style={{ color: '#d97706' }}>
              {machine.tempC || 32.1} °C
            </div>
          </div>
        </div>

        {/* DEDICATED FULL-SCALE SSH TERMINAL */}
        <div className="terminal-card" style={{ marginTop: 24, padding: 24, borderRadius: 16 }}>
          <div className="terminal-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TerminalIcon style={{ width: 16, color: '#38bdf8' }} />
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                ssh operator@{machine.name.toLowerCase().replace(/\s+/g, '')}.erebus.space -p 2201
              </span>
            </div>
            <span className="table-status-pill status-success">Laser Uplink Active</span>
          </div>

          <div
            className="terminal-logs"
            style={{ minHeight: 280, maxHeight: 420, fontSize: 13 }}
          >
            {sshLogs.map((log) => (
              <div className={`log-entry ${log.type}`} key={log.id}>
                {log.text}
              </div>
            ))}
          </div>

          <form
            className="terminal-input-row"
            onSubmit={handleSshSubmit}
            style={{ marginTop: 12, paddingTop: 10 }}
          >
            <span className="terminal-prompt-symbol">
              root@{machine.name.toLowerCase().replace(/\s+/g, '')}:~#
            </span>
            <input
              type="text"
              className="terminal-input"
              placeholder="Type SSH command (e.g. health, top, ping, ip, reboot, clear)..."
              value={sshInput}
              onChange={(e) => setSshInput(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      </div>
    </AppShell>
  )
}
