'use client'

import React, { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import InfrastructureSection from '@/components/infrastructure/InfrastructureSection'
import DeployRocketModal from '@/components/infrastructure/DeployRocketModal'
import RocketConnectModal from '@/components/infrastructure/RocketConnectModal'
import { useSpaceData } from '@/lib/useSpaceData'
import { RocketMachine } from '@/lib/types'

export default function InfrastructurePage() {
  const { machines, refresh, addMachine } = useSpaceData()
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [connectModalMachine, setConnectModalMachine] = useState<RocketMachine | null>(null)

  return (
    <AppShell
      title="Infrastructure & Compute Instances"
      machinesCount={machines.length}
    >
      <InfrastructureSection
        machines={machines}
        onOpenLaunchModal={() => setShowLaunchModal(true)}
        onRefresh={refresh}
        onConnectMachine={(m) => setConnectModalMachine(m)}
      />

      <DeployRocketModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onLaunch={addMachine}
      />

      <RocketConnectModal
        machine={connectModalMachine}
        onClose={() => setConnectModalMachine(null)}
      />
    </AppShell>
  )
}
