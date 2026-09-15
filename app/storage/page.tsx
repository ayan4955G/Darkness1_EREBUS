'use client'

import React, { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import StorageSection from '@/components/storage/StorageSection'
import CreateBucketModal from '@/components/storage/CreateBucketModal'
import { useSpaceData } from '@/lib/useSpaceData'

export default function StoragePage() {
  const { machines, buckets, addBucket } = useSpaceData()
  const [showBucketModal, setShowBucketModal] = useState(false)

  return (
    <AppShell title="Orbital Cloud Storage" machinesCount={machines.length}>
      <StorageSection
        buckets={buckets}
        onOpenCreateBucketModal={() => setShowBucketModal(true)}
      />

      <CreateBucketModal
        isOpen={showBucketModal}
        onClose={() => setShowBucketModal(false)}
        onCreate={addBucket}
      />
    </AppShell>
  )
}
