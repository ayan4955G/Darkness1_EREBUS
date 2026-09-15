'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import SettingsSection from '@/components/settings/SettingsSection'
import { useSpaceData } from '@/lib/useSpaceData'

export default function SettingsPage() {
  const { machines } = useSpaceData()

  return (
    <AppShell title="System Settings & Security" machinesCount={machines.length}>
      <SettingsSection />
    </AppShell>
  )
}
