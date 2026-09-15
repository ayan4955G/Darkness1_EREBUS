'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import OperationsSection from '@/components/operations/OperationsSection'
import { useSpaceData } from '@/lib/useSpaceData'

export default function OperationsPage() {
  const { machines, telemetry } = useSpaceData()

  return (
    <AppShell title="Mission Operations Terminal" machinesCount={machines.length}>
      <OperationsSection machines={machines} telemetry={telemetry} />
    </AppShell>
  )
}
