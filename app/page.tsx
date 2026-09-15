'use client'

import React, { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import OverviewSection from '@/components/dashboard/OverviewSection'
import InfrastructureSection from '@/components/infrastructure/InfrastructureSection'
import TelemetrySection from '@/components/telemetry/TelemetrySection'
import OperationsSection from '@/components/operations/OperationsSection'
import StorageSection from '@/components/storage/StorageSection'
import RegionsSection from '@/components/regions/RegionsSection'
import SettingsSection from '@/components/settings/SettingsSection'
import DeployRocketModal from '@/components/infrastructure/DeployRocketModal'
import RocketConnectModal from '@/components/infrastructure/RocketConnectModal'
import CreateBucketModal from '@/components/storage/CreateBucketModal'
import { useSpaceData } from '@/lib/useSpaceData'
import { RocketMachine, Section } from '@/lib/types'

export default function Dashboard() {
  const {
    machines,
    telemetry,
    buckets,
    refresh,
    addMachine,
    addBucket,
  } = useSpaceData()

  const [activeSection, setActiveSection] = useState<Section>('Home')
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [showBucketModal, setShowBucketModal] = useState(false)
  const [connectModalMachine, setConnectModalMachine] = useState<RocketMachine | null>(null)

  const sectionTitles: Record<Section, string> = {
    Home: 'Overview',
    Infrastructure: 'Infrastructure & Compute Instances',
    Telemetry: 'Telemetry & Space Analytics',
    Operations: 'Mission Operations Terminal',
    'Cloud Storage': 'Orbital Cloud Storage',
    'Cloud regions': 'Cloud Regions Topology',
    Settings: 'System Settings & Security',
  }

  return (
    <AppShell
      title={sectionTitles[activeSection]}
      machinesCount={machines.length}
      activeSection={activeSection}
      onSelectSection={(sec) => setActiveSection(sec as Section)}
    >
      {activeSection === 'Home' && <OverviewSection machines={machines} />}

      {activeSection === 'Infrastructure' && (
        <InfrastructureSection
          machines={machines}
          onOpenLaunchModal={() => setShowLaunchModal(true)}
          onRefresh={refresh}
          onConnectMachine={(m) => setConnectModalMachine(m)}
        />
      )}

      {activeSection === 'Telemetry' && (
        <TelemetrySection telemetry={telemetry} onRefresh={refresh} />
      )}

      {activeSection === 'Operations' && (
        <OperationsSection machines={machines} telemetry={telemetry} />
      )}

      {activeSection === 'Cloud Storage' && (
        <StorageSection
          buckets={buckets}
          onOpenCreateBucketModal={() => setShowBucketModal(true)}
        />
      )}

      {activeSection === 'Cloud regions' && <RegionsSection />}

      {activeSection === 'Settings' && <SettingsSection />}

      {/* Global Modals */}
      <DeployRocketModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onLaunch={addMachine}
      />

      <RocketConnectModal
        machine={connectModalMachine}
        onClose={() => setConnectModalMachine(null)}
      />

      <CreateBucketModal
        isOpen={showBucketModal}
        onClose={() => setShowBucketModal(false)}
        onCreate={addBucket}
      />
    </AppShell>
  )
}
