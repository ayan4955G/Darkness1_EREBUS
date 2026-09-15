'use client'

import { useState, useEffect, useCallback } from 'react'
import { RocketMachine, StorageBucket, TelemetryData } from './types'

export function useSpaceData() {
  const [machines, setMachines] = useState<RocketMachine[]>([])
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [buckets, setBuckets] = useState<StorageBucket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [machRes, telemRes, bucketRes] = await Promise.all([
        fetch('/api/machines'),
        fetch('/api/telemetry'),
        fetch('/api/storage'),
      ])

      const machData = await machRes.json()
      const telemData = await telemRes.json()
      const bucketData = await bucketRes.json()

      if (machData.success) setMachines(machData.data)
      if (telemData.success) setTelemetry(telemData.telemetry)
      if (bucketData.success) setBuckets(bucketData.data)
    } catch (err) {
      console.error('Failed to sync with space backend', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [fetchData])

  const addMachine = (newMachine: RocketMachine) => {
    setMachines((prev) => [newMachine, ...prev])
  }

  const addBucket = (newBucket: StorageBucket) => {
    setBuckets((prev) => [newBucket, ...prev])
  }

  const toggleMachinePower = (id: string) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'Running' ? 'Stopped' : 'Running' } : m
      )
    )
  }

  return {
    machines,
    telemetry,
    buckets,
    loading,
    refresh: fetchData,
    addMachine,
    addBucket,
    toggleMachinePower,
  }
}
