'use client'

import React, { useState } from 'react'
import { Terminal as TerminalIcon } from 'lucide-react'
import { RocketMachine, TelemetryData, TerminalLog } from '@/lib/types'

interface OperationsSectionProps {
  machines: RocketMachine[]
  telemetry: TelemetryData | null
}

export default function OperationsSection({
  machines,
  telemetry,
}: OperationsSectionProps) {
  const [termInput, setTermInput] = useState('')
  const [termLogs, setTermLogs] = useState<TerminalLog[]>([
    { id: 1, type: 'system', text: 'EREBUS Space Data Center Terminal v2.4.0' },
    {
      id: 2,
      type: 'system',
      text: 'Connected to Orbital Payload [EREBUS-CORE-01] via 10Gbps Laser Crosslink.',
    },
    { id: 3, type: 'system', text: 'Type "help" for available orbital CLI commands.' },
  ])

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = termInput.trim().toLowerCase()
    if (!cmd) return

    const userLog: TerminalLog = { id: Date.now(), type: 'user', text: `$ ${termInput}` }
    let sysReply = ''

    if (cmd === 'help') {
      sysReply = 'Available commands: status, machines, telemetry, deploy, ping, clear'
    } else if (cmd === 'status') {
      sysReply =
        'SYSTEM STATUS: All Orbital Nodes Operational. Laser Downlink: 10.24 Gbps. Radiation Shielding: OPTIMAL.'
    } else if (cmd === 'machines') {
      sysReply = `INSTANCES (${machines.length}): ${machines
        .map((m) => `${m.name} [${m.status}]`)
        .join(', ')}`
    } else if (cmd === 'telemetry') {
      sysReply = `TELEMETRY: Velocity: ${
        telemetry?.orbitalPhysics?.velocityKmS || 7.68
      }km/s | Altitude: ${
        telemetry?.orbitalPhysics?.altitudeKm || 412
      }km | Core Temp: ${telemetry?.powerAndThermal?.thermalCoreTempC || 32.4}°C`
    } else if (cmd === 'ping') {
      sysReply = 'PING orbital-core.erebus.space: 56 bytes, time=0.42ms RTT.'
    } else if (cmd === 'deploy') {
      sysReply = 'DEPLOYING new container payload to ORBITAL-01... Success! Container ID: c-9402'
    } else if (cmd === 'clear') {
      setTermLogs([])
      setTermInput('')
      return
    } else {
      // Try hitting the space terminal API
      try {
        const res = await fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: termInput }),
        })
        const data = await res.json()
        sysReply = data.output || `Command not recognized: "${cmd}". Type "help" for command list.`
      } catch {
        sysReply = `Command not recognized: "${cmd}". Type "help" for command list.`
      }
    }

    setTermLogs((prev) => [...prev, userLog, { id: Date.now() + 1, type: 'system', text: sysReply }])
    setTermInput('')
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Mission Operations Terminal</h2>
          <p>Execute real-time flight commands and orbital infrastructure routines.</p>
        </div>
      </div>

      <div className="terminal-card" style={{ marginTop: 24, padding: 24, borderRadius: 16 }}>
        <div className="terminal-header" style={{ marginBottom: 16, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TerminalIcon style={{ width: 18, color: '#38bdf8' }} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              erebus-cli // root@orbital-gateway:~$
            </span>
          </div>
          <span className="table-status-pill status-success">Laser Uplink Active</span>
        </div>

        <div className="terminal-logs" style={{ minHeight: 320, maxHeight: 450, fontSize: 13 }}>
          {termLogs.map((log) => (
            <div className={`log-entry ${log.type}`} key={log.id}>
              {log.text}
            </div>
          ))}
        </div>

        <form
          className="terminal-input-row"
          onSubmit={handleTerminalSubmit}
          style={{ marginTop: 14, paddingTop: 12 }}
        >
          <span className="terminal-prompt-symbol">erebus@space-ops:~$</span>
          <input
            type="text"
            className="terminal-input"
            placeholder="Type command (e.g. status, machines, telemetry, ping, deploy, clear)..."
            value={termInput}
            onChange={(e) => setTermInput(e.target.value)}
            autoFocus
          />
        </form>
      </div>
    </>
  )
}
