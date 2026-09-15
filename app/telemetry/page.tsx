'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import TelemetrySection from '@/components/telemetry/TelemetrySection'
import { useSpaceData } from '@/lib/useSpaceData'

export default function TelemetryPage() {
  const { machines, telemetry, refresh } = useSpaceData()

  return (
    <AppShell title="Telemetry & Space Analytics" machinesCount={machines.length}>
      <TelemetrySection telemetry={telemetry} onRefresh={refresh} />
    </AppShell>
  )
}
