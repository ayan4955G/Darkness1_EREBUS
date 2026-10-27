'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RocketMachine, StorageBucket, TelemetryData, ReceiverStatus, TelemetryHistoryItem } from './types'

export function useSpaceData() {
  const [machines, setMachines] = useState<RocketMachine[]>([])
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [telemetryStatus, setTelemetryStatus] = useState<ReceiverStatus | null>(null)
  const [telemetrySource, setTelemetrySource] = useState<'receiver' | 'simulated' | 'none'>('none')
  const [isSimulated, setIsSimulated] = useState<boolean>(false)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryItem[]>([])
  const [buckets, setBuckets] = useState<StorageBucket[]>([])
  const [loading, setLoading] = useState(true)

  const isMountedRef = useRef(true)

  const fetchTelemetry = useCallback(async () => {
    try {
      const telemRes = await fetch('/api/telemetry')
      if (!telemRes.ok) return
      const telemData = await telemRes.json()

      if (isMountedRef.current && telemData.success) {
        setTelemetry(telemData.telemetry || null)
        setTelemetryStatus(telemData.status || null)
        setTelemetrySource(telemData.source || 'none')
        setIsSimulated(Boolean(telemData.isSimulated))
      }
    } catch (err) {
      console.warn('Telemetry sync error:', err)
    }
  }, [])

  const fetchHistory = useCallback(async (limit = 30) => {
    try {
      const res = await fetch(`/api/telemetry/history?limit=${limit}`)
      if (!res.ok) return
      const data = await res.json()
      if (isMountedRef.current && data.success && Array.isArray(data.data)) {
        setTelemetryHistory(data.data)
      }
    } catch {
      // Ignore
    }
  }, [])

  const fetchGeneralData = useCallback(async () => {
    try {
      const [machRes, bucketRes] = await Promise.all([
        fetch('/api/machines'),
        fetch('/api/storage'),
      ])

      const machData = await machRes.json().catch(() => ({}))
      const bucketData = await bucketRes.json().catch(() => ({}))

      if (isMountedRef.current) {
        if (machData.success) setMachines(machData.data)
        if (bucketData.success) setBuckets(bucketData.data)
      }
    } catch (err) {
      console.error('Failed to sync space machines/storage:', err)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTelemetry(), fetchGeneralData(), fetchHistory()])
  }, [fetchTelemetry, fetchGeneralData, fetchHistory])

  useEffect(() => {
    isMountedRef.current = true
    refreshAll()

    let eventSource: EventSource | null = null

    // 1. Instant Real-time Push via Server-Sent Events (SSE)
    try {
      eventSource = new EventSource('/api/telemetry/stream')

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return
        try {
          const telemData = JSON.parse(event.data)
          if (telemData.success) {
            setTelemetry(telemData.telemetry || null)
            setTelemetryStatus(telemData.status || null)
            setTelemetrySource(telemData.source || 'none')
            setIsSimulated(Boolean(telemData.isSimulated))
          }
        } catch {}
      }

      eventSource.onerror = () => {
        // Fallback polling will handle updates while SSE reconnects
      }
    } catch {
      // EventSource not supported in environment
    }

    // 2. High-Frequency Fallback Polling (400ms) for ultra-fast telemetry updates
    const telemInterval = setInterval(() => {
      fetchTelemetry()
    }, 400)

    // 3. Decoupled History Polling (4s) so database queries don't slow down telemetry
    const historyInterval = setInterval(() => {
      fetchHistory()
    }, 4000)

    // 4. General infrastructure polling (8s)
    const generalInterval = setInterval(fetchGeneralData, 8000)

    return () => {
      isMountedRef.current = false
      if (eventSource) {
        eventSource.close()
      }
      clearInterval(telemInterval)
      clearInterval(historyInterval)
      clearInterval(generalInterval)
    }
  }, [refreshAll, fetchTelemetry, fetchGeneralData, fetchHistory])

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
    telemetryStatus,
    telemetrySource,
    isSimulated,
    telemetryHistory,
    buckets,
    loading,
    refresh: refreshAll,
    refreshTelemetry: fetchTelemetry,
    addMachine,
    addBucket,
    toggleMachinePower,
  }
}
