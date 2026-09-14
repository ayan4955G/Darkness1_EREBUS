import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const machines = db.getMachines()
  const runningCount = machines.filter((m) => m.status === 'Running').length
  const totalCount = machines.length

  return NextResponse.json({
    status: 'healthy',
    application: 'EREBUS Space Cloud Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    node: {
      dataCenter: process.env.EREBUS_DATA_CENTER_NAME || 'EREBUS-CORE-01',
      altitudeKm: parseInt(process.env.ORBITAL_ALTITUDE_KM || '420', 10),
      orbitalSpeedKmS: 7.66,
      radiationShieldStatus: 'NOMINAL',
    },
    cluster: {
      totalComputeNodes: totalCount,
      runningNodes: runningCount,
      clusterHealthPercent: Math.round((runningCount / totalCount) * 100),
    },
    memory: process.memoryUsage(),
  })
}
