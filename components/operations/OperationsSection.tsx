'use client'

import React, { FormEvent, useEffect, useState, useMemo } from 'react'
import {
  Activity,
  ArrowLeft,
  Compass,
  Cpu,
  Expand,
  Gauge,
  LockKeyhole,
  MapPin,
  Radio,
  Rotate3d,
  Signal,
  Terminal,
  Thermometer,
  X,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react'
import { RocketMachine, TelemetryData, ReceiverStatus, TelemetryHistoryItem } from '@/lib/types'
import Attitude3DViewer from './Attitude3DViewer'

interface OperationsSectionProps {
  machines: RocketMachine[]
  telemetry: TelemetryData | null
  telemetryStatus?: ReceiverStatus | null
  telemetryHistory?: TelemetryHistoryItem[]
}

const makeMfaCode = () => {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return String(10_000_000 + (values[0] % 90_000_000))
}

const numberFromId = (id: string) =>
  Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)

function PanelHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="mission-panel-heading">
      <span>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function SystemMetric({
  label,
  value,
  percentage,
}: {
  label: string
  value: string
  percentage: number
}) {
  return (
    <div className="mission-system-metric">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="mission-progress">
        <i style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
      </div>
    </div>
  )
}

type RocketParameter = {
  id: string
  label: string
  source: string
  value: number | null
  unit: string
  min: number | null
  max: number | null
  icon: React.ElementType
  history: number[]
  isStale?: boolean
  isOffline?: boolean
  isSimulated?: boolean
}

function RocketParameterCard({ parameter }: { parameter: RocketParameter }) {
  const Icon = parameter.icon
  const hasValue = parameter.value !== null && Number.isFinite(parameter.value)

  // Status computation
  let statusText = 'Nominal'
  let accent = 'normal'

  if (!hasValue) {
    statusText = 'Unavailable'
    accent = 'warning'
  } else if (parameter.isOffline) {
    statusText = 'Offline'
    accent = 'warning'
  } else if (parameter.isStale) {
    statusText = 'Stale'
    accent = 'warning'
  } else if (parameter.min !== null && parameter.max !== null) {
    const inRange = parameter.value! >= parameter.min && parameter.value! <= parameter.max
    statusText = inRange ? 'Nominal' : 'Warning'
    accent = inRange ? 'normal' : 'warning'
  }

  // Calculate real historical sparkline
  const history = parameter.history.filter((n) => typeof n === 'number' && Number.isFinite(n))
  let points = ''
  let trendText = '—'
  let isTrendUp = true

  if (history.length >= 2) {
    const minVal = parameter.min !== null ? Math.min(parameter.min, ...history) : Math.min(...history)
    const maxVal = parameter.max !== null ? Math.max(parameter.max, ...history) : Math.max(...history)
    const span = maxVal - minVal || 1

    const width = 180
    const height = 70
    const step = width / (history.length - 1)

    const coords = history.map((val, idx) => {
      const x = Math.round(idx * step)
      const normalized = Math.max(0.05, Math.min(0.95, (val - minVal) / span))
      const y = Math.round(height - normalized * (height - 12) - 6)
      return `${x},${y}`
    })

    points = coords.join(' ')

    // Honest trend: percentage change between latest and first in history
    const first = history[0]
    const latest = history[history.length - 1]
    if (first !== 0) {
      const pct = (((latest - first) / Math.abs(first)) * 100).toFixed(1)
      trendText = `${Number(pct) >= 0 ? '+' : ''}${pct}% trend`
      isTrendUp = Number(pct) >= 0
    }
  } else if (history.length === 1 && hasValue) {
    // Single point: flat line
    points = `0,35 180,35`
    trendText = 'Initial reading'
  }

  const formattedValue = hasValue
    ? parameter.value!.toLocaleString(undefined, {
        maximumFractionDigits: Math.abs(parameter.value!) < 10 ? 2 : 1,
      })
    : '—'

  return (
    <article className={`rocket-parameter-card rocket-parameter-card--${accent}`}>
      <div className="rocket-parameter-heading">
        <div>
          <span className="rocket-parameter-icon">
            <Icon size={18} />
          </span>
          <div>
            <h3>{parameter.label}</h3>
            <p>{parameter.source}</p>
          </div>
        </div>
        <span
          className="rocket-parameter-live"
          style={{
            color: parameter.isSimulated
              ? '#2563eb'
              : parameter.isOffline
              ? '#dc2626'
              : parameter.isStale
              ? '#d97706'
              : hasValue
              ? '#16a34a'
              : '#94a3b8',
            fontWeight: 700,
          }}
        >
          {parameter.isSimulated
            ? 'Simulated'
            : parameter.isOffline
            ? 'Offline'
            : parameter.isStale
            ? 'Stale'
            : hasValue
            ? 'Live'
            : '—'}
        </span>
      </div>

      <div className="rocket-parameter-value-row">
        <div>
          <strong>{formattedValue}</strong>
          {hasValue && <span>{parameter.unit}</span>}
        </div>
        <div className="rocket-parameter-threshold">
          <span>Threshold</span>
          <strong>
            {parameter.min !== null && parameter.max !== null
              ? `${parameter.min} – ${parameter.max} ${parameter.unit}`
              : 'Dynamic / Sensor'}
          </strong>
        </div>
      </div>

      <p className="rocket-parameter-status">
        <strong style={{ color: statusText === 'Nominal' ? '#16a34a' : statusText === 'Warning' ? '#ea580c' : '#64748b' }}>
          {statusText}
        </strong>
        <span className={isTrendUp ? 'trend-up' : 'trend-down'} style={{ color: isTrendUp ? '#16a34a' : '#d45a5a' }}>
          {trendText}
        </span>
      </p>

      <svg
        className="rocket-parameter-sparkline"
        viewBox="0 0 180 70"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${parameter.label} trend`}
      >
        {points ? (
          <>
            <polygon points={`0,70 ${points} 180,70`} />
            <polyline points={points} />
          </>
        ) : (
          <line x1="0" y1="35" x2="180" y2="35" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1.5" />
        )}
      </svg>

      <div className="rocket-parameter-footer">
        <span>{hasValue ? 'Verified sensor source' : 'Awaiting sensor stream'}</span>
        <span>{parameter.id}</span>
      </div>
    </article>
  )
}

function MissionDashboard({
  machine,
  telemetry,
  telemetryStatus,
  telemetryHistory = [],
  onBack,
}: {
  machine: RocketMachine
  telemetry: TelemetryData | null
  telemetryStatus?: ReceiverStatus | null
  telemetryHistory?: TelemetryHistoryItem[]
  onBack: () => void
}) {
  const seed = numberFromId(machine.id)
  const [isMapOpen, setIsMapOpen] = useState(false)

  // Extract real sensor data and status
  const sensors = telemetry?.sensorReadings
  const status = telemetryStatus

  const isSimulated = Boolean(status?.simulated)
  const isStale = Boolean(status?.stale)
  const isOffline = Boolean(status?.offline)
  const isReceiving = Boolean(status?.receiving)
  const isConnected = Boolean(status?.connected)

  // Status label
  let statusBadgeLabel = 'Offline'
  let statusBadgeStyle: React.CSSProperties = { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
  if (isSimulated) {
    statusBadgeLabel = 'Simulated Telemetry'
    statusBadgeStyle = { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
  } else if (isReceiving && !isStale && !isOffline) {
    statusBadgeLabel = 'Live LoRa Telemetry'
    statusBadgeStyle = { background: '#effaf3', color: '#15803d', border: '1px solid #bbf7d0' }
  } else if (isStale && !isOffline) {
    statusBadgeLabel = `Stale Telemetry (${status?.lastPacketAgeMs ? Math.round(status.lastPacketAgeMs / 1000) : '?'}s ago)`
    statusBadgeStyle = { background: '#fefce8', color: '#a16207', border: '1px solid #fef08a' }
  }

  // Extract historical series from real history for sparklines
  const historySeries = useMemo(() => {
    const temps: number[] = []
    const alts: number[] = []
    const rssis: number[] = []
    const gforces: number[] = []
    const speeds: number[] = []
    const rolls: number[] = []

    for (const item of telemetryHistory) {
      const readings = item.normalized || item.payload?.sensorReadings
      if (readings) {
        if (typeof readings.temperature === 'number') temps.push(readings.temperature)
        if (typeof readings.altitudeMeters === 'number') alts.push(readings.altitudeMeters)
        if (typeof readings.gForce === 'number') gforces.push(readings.gForce)
        if (readings.gps?.valid && typeof readings.gps.speedKmh === 'number') speeds.push(readings.gps.speedKmh)
        if (typeof readings.rollDegPerSec === 'number') rolls.push(readings.rollDegPerSec)
      }
      if (typeof item.rssi === 'number') rssis.push(item.rssi)
    }

    return { temps, alts, rssis, gforces, speeds, rolls }
  }, [telemetryHistory])

  // Extract GPS
  const gps = sensors?.gps
  const hasValidGps = Boolean(gps?.valid && gps?.latitude !== null && gps?.longitude !== null)
  const gpsLatitude = hasValidGps ? gps!.latitude!.toFixed(5) : null
  const gpsLongitude = hasValidGps ? gps!.longitude!.toFixed(5) : null
  const googleMapsEmbedUrl = hasValidGps
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${gpsLatitude},${gpsLongitude}`)}&z=15&output=embed`
    : ''

  // Attitude / Compass bearing from gyro or heading if available
  const bearing = seed % 360

  // 6 Primary Dashboard Parameters mapped to REAL sensor fields:
  const rocketParameters: RocketParameter[] = [
    {
      id: 'THERM-CORE',
      label: 'Core temperature',
      source: 'BMP280 / DHT22 Sensor',
      value: sensors?.temperature ?? null,
      unit: '°C',
      min: 15,
      max: 45,
      icon: Thermometer,
      history: historySeries.temps,
      isStale,
      isOffline,
      isSimulated,
    },
    {
      id: 'ALT-LORA',
      label: 'Altitude',
      source: 'BMP280 Barometer',
      value: sensors?.altitudeMeters ?? null,
      unit: 'm',
      min: 0,
      max: 3000,
      icon: MapPin,
      history: historySeries.alts,
      isStale,
      isOffline,
      isSimulated,
    },
    {
      id: 'LORA-LINK',
      label: 'Connection strength',
      source: 'LoRa 433 MHz RF Link',
      value: status?.rssi ?? telemetry?.rssi ?? null,
      unit: 'dBm',
      min: -120,
      max: -40,
      icon: Signal,
      history: historySeries.rssis,
      isStale,
      isOffline,
      isSimulated,
    },
    {
      id: 'G-LOAD',
      label: 'G-force',
      source: 'MPU6050 3-Axis Accel',
      value: sensors?.gForce ?? null,
      unit: 'g',
      min: 0.8,
      max: 2.0,
      icon: Gauge,
      history: historySeries.gforces,
      isStale,
      isOffline,
      isSimulated,
    },
    {
      id: 'VEL-TRACK',
      label: 'Speed',
      source: hasValidGps ? 'GPS Ground Track' : 'GPS (No Lock)',
      value: hasValidGps ? gps?.speedKmh ?? 0 : null,
      unit: 'km/h',
      min: 0,
      max: 120,
      icon: Activity,
      history: historySeries.speeds,
      isStale,
      isOffline,
      isSimulated,
    },
    {
      id: 'ROLL-AXIS',
      label: 'Roll axis',
      source: 'MPU6050 Gyro X (Roll rate)',
      value: sensors?.rollDegPerSec ?? null,
      unit: '°/s',
      min: -45,
      max: 45,
      icon: Rotate3d,
      history: historySeries.rolls,
      isStale,
      isOffline,
      isSimulated,
    },
  ]

  // Real Altitude line chart from historical telemetry
  const altitudeChartData = useMemo(() => {
    if (historySeries.alts.length < 2) return null
    const min = Math.min(...historySeries.alts)
    const max = Math.max(...historySeries.alts)
    const span = max - min || 1
    const width = 560
    const height = 190
    const step = width / (historySeries.alts.length - 1)

    const coords = historySeries.alts.map((val, idx) => {
      const x = Math.round(idx * step)
      const norm = (val - min) / span
      const y = Math.round(height - norm * 130 - 30)
      return { x, y }
    })

    const pathD = coords.reduce((acc, pt, i) => (i === 0 ? `M${pt.x} ${pt.y}` : `${acc} L${pt.x} ${pt.y}`), '')
    const areaD = `${pathD} V${height} H0Z`
    const lastPoint = coords[coords.length - 1]

    return { pathD, areaD, lastPoint, currentAlt: historySeries.alts[historySeries.alts.length - 1] }
  }, [historySeries.alts])

  return (
    <section className="mission-dashboard">
      {/* Dashboard Top Header */}
      <div className="mission-dashboard-header">
        <div>
          <button className="mission-back-button" onClick={onBack} type="button">
            <ArrowLeft size={16} /> All mission nodes
          </button>
          <div className="mission-title-row">
            <h2>{machine.name} mission dashboard</h2>
            <span
              className="mission-live-badge"
              style={{ ...statusBadgeStyle, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {statusBadgeLabel}
            </span>
          </div>
          <p>{machine.mission}</p>
        </div>
        <span className="mission-node-id">Node ID · {machine.id}</span>
      </div>

      {/* Receiver Connection & LoRa Status Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '12px 20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isConnected ? <Wifi size={15} style={{ color: '#16a34a' }} /> : <WifiOff size={15} style={{ color: '#dc2626' }} />}
            <span style={{ color: '#64748b' }}>ESP32 Receiver:</span>
            <strong style={{ color: isConnected ? '#15803d' : '#b91c1c' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} style={{ color: '#475569' }} />
            <span style={{ color: '#64748b' }}>Packet ID:</span>
            <strong style={{ fontFamily: 'monospace' }}>{status?.lastPacketId ?? '—'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Radio size={15} style={{ color: '#0284c7' }} />
            <span style={{ color: '#64748b' }}>LoRa RSSI:</span>
            <strong>{status?.rssi !== null && status?.rssi !== undefined ? `${status.rssi} dBm` : '—'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Signal size={15} style={{ color: '#9333ea' }} />
            <span style={{ color: '#64748b' }}>SNR:</span>
            <strong>{status?.snr !== null && status?.snr !== undefined ? `${status.snr} dB` : '—'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#64748b' }}>Total Packets:</span>
            <strong>{status?.packetCount ?? 0}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
          <Clock size={13} />
          <span>
            {status?.lastPacketTime
              ? `Last Packet: ${new Date(status.lastPacketTime).toLocaleTimeString()} (${Math.round((status.lastPacketAgeMs || 0) / 1000)}s ago)`
              : 'No LoRa packets received yet'}
          </span>
        </div>
      </div>

      {/* 6 Core Parameter Cards */}
      <div className="rocket-parameters-grid">
        {rocketParameters.map((parameter) => (
          <RocketParameterCard key={parameter.id} parameter={parameter} />
        ))}
      </div>

      {/* Monitoring Grid: Altitude/Profile, GPS Map, Payload Systems, Attitude */}
      <div className="mission-monitor-grid">
        {/* Real Altitude Profile */}
        <article className="mission-panel mission-orbit-panel">
          <PanelHeading
            icon={<Activity size={17} />}
            title="Telemetry Altitude Profile"
            subtitle="Real barometric altitude readings recorded from payload"
          />
          {altitudeChartData ? (
            <svg className="mission-line-chart" viewBox="0 0 560 190" role="img" aria-label="Altitude profile chart">
              <defs>
                <linearGradient id="orbit-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity=".2" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="mission-chart-grid" d="M0 35H560M0 95H560M0 155H560" />
              <path className="mission-chart-area" d={altitudeChartData.areaD} fill="url(#orbit-fill)" />
              <path className="mission-chart-line" d={altitudeChartData.pathD} stroke="#0284c7" strokeWidth="2.5" />
              <circle
                className="mission-chart-point"
                cx={altitudeChartData.lastPoint.x}
                cy={altitudeChartData.lastPoint.y}
                r="5"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="3"
              />
            </svg>
          ) : (
            <div
              style={{
                height: 190,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                borderRadius: 12,
                marginTop: 20,
                color: '#94a3b8',
                fontSize: 13,
              }}
            >
              Waiting for historical telemetry data to plot altitude curve...
            </div>
          )}
          <div className="mission-chart-legend">
            <span>
              <i className="legend-dot green" /> Current altitude:{' '}
              {sensors?.altitudeMeters !== null && sensors?.altitudeMeters !== undefined
                ? `${sensors.altitudeMeters} m`
                : 'Unavailable'}
            </span>
            <span>History samples: {historySeries.alts.length}</span>
          </div>
        </article>

        {/* GPS Location Panel (Strictly Real GPS, No Fake Geolocation) */}
        <article className="mission-panel mission-location-panel">
          <PanelHeading
            icon={<MapPin size={17} />}
            title="Payload GPS Position"
            subtitle={hasValidGps ? `GPS Lock Confirmed · ${gps?.satellites ?? 0} Satellites` : 'Payload GPS Lock Status'}
          />
          {hasValidGps ? (
            <>
              <div className="mission-map" aria-label={`GPS latitude ${gpsLatitude}, longitude ${gpsLongitude}`}>
                <iframe
                  className="mission-google-map"
                  src={googleMapsEmbedUrl}
                  title={`${machine.name} GPS position`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <button
                  className="mission-map-open-button"
                  onClick={() => setIsMapOpen(true)}
                  type="button"
                  aria-label="Open interactive GPS map"
                >
                  <span className="mission-map-open-label">
                    <Expand size={14} /> Open map
                  </span>
                </button>
              </div>
              <div className="mission-coordinates">
                <span>LAT {gpsLatitude}°</span>
                <span>LON {gpsLongitude}°</span>
                {gps?.altitude !== null && <span>ALT {gps?.altitude} m</span>}
              </div>
            </>
          ) : (
            <div
              style={{
                height: 190,
                margin: '18px 0 10px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <AlertTriangle size={24} style={{ color: '#d97706', marginBottom: 8 }} />
              <strong style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}>
                GPS Unavailable
              </strong>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, maxWidth: 280 }}>
                {gps?.hasLock === false
                  ? 'Hardware GPS module has no active satellite lock yet. Awaiting valid NMEA fix.'
                  : 'No valid GPS telemetry received over LoRa connection.'}
              </p>
            </div>
          )}
        </article>

        {/* Payload Sensors & Environmental Panel */}
        <article className="mission-panel mission-system-panel">
          <PanelHeading
            icon={<Cpu size={17} />}
            title="Hardware Sensors Status"
            subtitle="Raw physical sensors telemetry"
          />
          <div className="mission-system-list">
            <SystemMetric
              label="BMP280 Temperature"
              value={sensors?.bmpTemperature !== null && sensors?.bmpTemperature !== undefined ? `${sensors.bmpTemperature} °C` : 'Unavailable'}
              percentage={sensors?.bmpTemperature ? Math.min(100, Math.max(0, sensors.bmpTemperature * 2)) : 0}
            />
            <SystemMetric
              label="DHT22 Humidity"
              value={sensors?.humidity !== null && sensors?.humidity !== undefined ? `${sensors.humidity} %` : 'Unavailable'}
              percentage={sensors?.humidity ?? 0}
            />
            <SystemMetric
              label="Barometric Pressure"
              value={sensors?.pressureHpa !== null && sensors?.pressureHpa !== undefined ? `${sensors.pressureHpa} hPa` : 'Unavailable'}
              percentage={sensors?.pressureHpa ? Math.min(100, ((sensors.pressureHpa - 900) / 200) * 100) : 50}
            />
          </div>
          <div className="mission-downlink" style={{ marginTop: 14 }}>
            <span>
              <Radio size={15} /> LoRa Signal-to-Noise
            </span>
            <strong>{status?.snr !== null && status?.snr !== undefined ? `${status.snr} dB` : '—'}</strong>
          </div>
        </article>

        {/* 3D Attitude & Spacecraft Rotation Panel (X, Y, Z Axes) */}
        <article className="mission-panel mission-compass-panel" style={{ padding: 0, overflow: 'hidden', background: '#090d16', border: '1px solid #1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <Attitude3DViewer
            accel={sensors?.accel}
            gyro={sensors?.gyro}
            isLive={isReceiving && !isStale && !isOffline}
          />
        </article>
      </div>

      {/* Expanded Map Modal */}
      {isMapOpen && hasValidGps && (
        <div
          className="mission-map-overlay"
          role="presentation"
          onMouseDown={() => setIsMapOpen(false)}
        >
          <div
            className="mission-map-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interactive-map-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mission-map-modal-header">
              <div>
                <h2 id="interactive-map-title">Payload Real GPS Position</h2>
                <p>Coordinates: {gpsLatitude}°, {gpsLongitude}°</p>
              </div>
              <button
                className="mission-mfa-close"
                onClick={() => setIsMapOpen(false)}
                type="button"
                aria-label="Close interactive map"
              >
                <X size={18} />
              </button>
            </div>
            <iframe
              className="mission-google-map mission-google-map--expanded"
              src={googleMapsEmbedUrl}
              title={`${machine.name} interactive GPS map`}
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default function OperationsSection({
  machines,
  telemetry,
  telemetryStatus,
  telemetryHistory,
}: OperationsSectionProps) {
  const [selectedMachine, setSelectedMachine] = useState<RocketMachine | null>(null)
  const [mfaMachine, setMfaMachine] = useState<RocketMachine | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [mfaError, setMfaError] = useState(false)

  const requestMissionAccess = (machine: RocketMachine) => {
    setMfaMachine(machine)
    setMfaCode(makeMfaCode())
    setEnteredCode('')
    setMfaError(false)
  }

  const verifyMfa = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (enteredCode === mfaCode) {
      setSelectedMachine(mfaMachine)
      setMfaMachine(null)
      return
    }
    setMfaError(true)
  }

  if (selectedMachine) {
    return (
      <MissionDashboard
        machine={selectedMachine}
        telemetry={telemetry}
        telemetryStatus={telemetryStatus}
        telemetryHistory={telemetryHistory}
        onBack={() => setSelectedMachine(null)}
      />
    )
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Mission Operations</h2>
          <p>Review mission-ready nodes and open their protected monitoring dashboards.</p>
        </div>
      </div>

      <div className="operations-node-table-wrap">
        <div className="operations-node-table-title">
          <div>
            <h3>Mission nodes</h3>
            <p>{machines.length} nodes available for monitored operations</p>
          </div>
          <span className="mission-live-badge">
            <span /> Network synchronized
          </span>
        </div>
        <table className="operations-node-table">
          <thead>
            <tr>
              <th>Node</th>
              <th>Mission</th>
              <th>Region</th>
              <th>Compute</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id}>
                <td data-label="Node">
                  <div className="operations-node-name">
                    <span>
                      <Terminal size={16} />
                    </span>
                    <div>
                      <strong>{machine.name}</strong>
                      <small>{machine.image}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Mission" className="operations-node-mission">
                  {machine.mission}
                </td>
                <td data-label="Region">{machine.region}</td>
                <td data-label="Compute">
                  {machine.cpu} <span className="operations-memory">· {machine.memory}</span>
                </td>
                <td data-label="Status">
                  <span className={`operations-status operations-status--${machine.status.toLowerCase()}`}>
                    {machine.status}
                  </span>
                </td>
                <td className="operations-action">
                  <button onClick={() => requestMissionAccess(machine)} type="button">
                    View mission
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {machines.length === 0 && (
          <p className="operations-empty-state">No mission nodes are available yet.</p>
        )}
      </div>

      {mfaMachine && (
        <div className="mission-mfa-overlay" role="presentation">
          <div className="mission-mfa-modal" role="dialog" aria-modal="true" aria-labelledby="mfa-title">
            <button
              className="mission-mfa-close"
              onClick={() => setMfaMachine(null)}
              type="button"
              aria-label="Close MFA verification"
            >
              <X size={18} />
            </button>
            <span className="mission-mfa-icon">
              <LockKeyhole size={22} />
            </span>
            <h2 id="mfa-title">Verify mission access</h2>
            <p>
              Enter the eight-digit MFA code issued for <strong>{mfaMachine.name}</strong>.
            </p>
            <p className="mission-mfa-demo-code">
              Demo challenge code: <code>{mfaCode}</code>
            </p>
            <form onSubmit={verifyMfa}>
              <label htmlFor="mission-mfa-code">One-time code</label>
              <input
                id="mission-mfa-code"
                inputMode="numeric"
                maxLength={8}
                pattern="[0-9]{8}"
                value={enteredCode}
                onChange={(event) => {
                  setEnteredCode(event.target.value.replace(/\D/g, ''))
                  setMfaError(false)
                }}
                autoFocus
                placeholder="00000000"
              />
              {mfaError && (
                <p className="mission-mfa-error">That code does not match this mission access request.</p>
              )}
              <button type="submit">Verify and open dashboard</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
