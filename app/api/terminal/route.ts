import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { command } = body

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ success: false, output: 'Error: empty command string' })
    }

    const trimmed = command.trim()
    const parts = trimmed.split(/\s+/)
    const cmd = parts[0].toLowerCase()

    let output = ''

    switch (cmd) {
      case 'help':
        output = `
AVAILABLE EREBUS ORBITAL COMMANDS:
  erebus status        - Display space data center core operational status
  erebus list          - List all deployed rocket compute instances
  erebus launch        - Deploy a new rocket machine (usage: erebus launch <name> <region>)
  ping <region>        - Test laser telemetry latency to space cloud region
  telemetry            - Get instant orbital telemetry snapshot
  clear                - Clear terminal output
  help                 - Show this help manual
`
        break

      case 'erebus':
        const sub = parts[1]?.toLowerCase()
        if (sub === 'status') {
          output = `
[EREBUS SPACE CLOUD CONTROL PLANE]
  Region: EREBUS-CORE-01 (Low Earth Orbit 420km)
  Telemetry Link: NOMINAL (Laser Crosslink 18.6 Gbps)
  Active Compute Nodes: ${db.getMachines().length} nodes running
  Power Envelope: 84.6 MW (Solar Array Alignment 100%)
  System Availability: 99.998%
`
        } else if (sub === 'list') {
          const machines = db.getMachines()
          output = `NAME\t\tREGION\t\tSTATUS\t\tvCPU\tIP\n`
          machines.forEach((m) => {
            output += `${m.name}\t${m.region}\t${m.status}\t${m.cpu}\t${m.ip}\n`
          })
        } else if (sub === 'launch') {
          const name = parts[2] || `STAR-NODE-${Math.floor(Math.random() * 900 + 100)}`
          const region = (parts[3] || 'EREBUS-CORE').toUpperCase()
          const newVm = db.addMachine({
            name,
            region: region as any,
            status: 'Running',
            cpu: '32 vCPU',
            memory: '256 GB',
            image: 'Orbital OS 24.04',
            ip: `10.44.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
            mission: 'Terminal initiated compute deployment',
          })
          output = `SUCCESS: Launched rocket machine ${newVm.name} in region ${newVm.region} with IP ${newVm.ip}`
        } else {
          output = `Unknown subcommand '${sub}'. Type 'help' for available commands.`
        }
        break

      case 'ping':
        const target = (parts[1] || 'EREBUS-CORE').toUpperCase()
        const latencies: Record<string, string> = {
          'EREBUS-CORE': '4.2 ms',
          'ORBITAL-01': '11.8 ms',
          'ORBITAL-02': '16.4 ms',
          'LUNAR-01': '1,280.5 ms (1.28s)',
          'MARS-RELAY': '420,000.0 ms (7.0 min)',
        }
        const delay = latencies[target] || '14.5 ms'
        output = `PING ${target} (optical laser relay): 64 bytes sequence 1 ttl=128 time=${delay}`
        break

      case 'telemetry':
        output = `
ORBITAL TELEMETRY SNAPSHOT:
  Speed: 7.66 km/s | Altitude: 420.2 km
  Radiation Flux: 0.14 mSv/h (Shield Integrity: 99.98%)
  Solar Power: 84.6 MW | Thermal Core: 38.6°C
  Active Crosslinks: 16 mesh lasers operational
`
        break

      default:
        output = `command not found: ${trimmed}. Type 'help' for command list.`
        break
    }

    return NextResponse.json({ success: true, output })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Execution error'
    return NextResponse.json({ success: false, output: `Execution error: ${message}` })
  }
}
