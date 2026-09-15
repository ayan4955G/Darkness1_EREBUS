'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import RegionsSection from '@/components/regions/RegionsSection'
import { useSpaceData } from '@/lib/useSpaceData'

export default function RegionsPage() {
  const { machines } = useSpaceData()

  return (
    <AppShell title="Cloud Regions Topology" machinesCount={machines.length}>
      <RegionsSection />
    </AppShell>
  )
}
