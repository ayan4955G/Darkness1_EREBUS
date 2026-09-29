'use client'

import React, { FormEvent, useEffect, useState } from 'react'
import { Activity, ArrowLeft, Compass, Cpu, Expand, Gauge, LockKeyhole, MapPin, Radio, Rotate3d, Signal, Terminal, Thermometer, X } from 'lucide-react'
import { RocketMachine, TelemetryData } from '@/lib/types'

interface OperationsSectionProps {
  machines: RocketMachine[]
  telemetry: TelemetryData | null
}

const makeMfaCode = () => {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return String(10_000_000 + (values[0] % 90_000_000))
}

const numberFromId = (id: string) => Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)

function PanelHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className="mission-panel-heading"><span>{icon}</span><div><h3>{title}</h3><p>{subtitle}</p></div></div>
}

function SystemMetric({ label, value, percentage }: { label: string; value: string; percentage: number }) {
  return <div className="mission-system-metric"><div><span>{label}</span><strong>{value}</strong></div><div className="mission-progress"><i style={{ width: `${percentage}%` }} /></div></div>
}

type RocketParameter = {
  id: string
  label: string
  source: string
  value: number
  unit: string
  min: number
  max: number
  icon: React.ElementType
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function RocketParameterCard({ parameter, seed }: { parameter: RocketParameter; seed: number }) {
  const Icon = parameter.icon
  const inRange = parameter.value >= parameter.min && parameter.value <= parameter.max
  const accent = inRange ? 'normal' : 'warning'
  const range = parameter.max - parameter.min
  const points = Array.from({ length: 6 }, (_, index) => {
    const variation = index === 5 ? 0 : (((seed + index * 17) % 19) - 9) / 100
    const sample = clamp(parameter.value * (1 + variation), parameter.min - range * 0.18, parameter.max + range * 0.18)
    const normalized = clamp((sample - parameter.min) / range, 0.04, 0.96)
    return `${index * 36},${66 - normalized * 58}`
  }).join(' ')
  const trend = (((seed % 17) - 8) / 10).toFixed(1)
  const formattedValue = parameter.value.toLocaleString(undefined, { maximumFractionDigits: parameter.value < 10 ? 2 : 0 })

  return <article className={`rocket-parameter-card rocket-parameter-card--${accent}`}>
    <div className="rocket-parameter-heading"><div><span className="rocket-parameter-icon"><Icon size={18} /></span><div><h3>{parameter.label}</h3><p>{parameter.source}</p></div></div><span className="rocket-parameter-live">Live</span></div>
    <div className="rocket-parameter-value-row"><div><strong>{formattedValue}</strong><span>{parameter.unit}</span></div><div className="rocket-parameter-threshold"><span>Threshold</span><strong>{parameter.min} – {parameter.max} {parameter.unit}</strong></div></div>
    <p className="rocket-parameter-status"><strong>{inRange ? 'Nominal' : 'Warning'}</strong><span className={Number(trend) >= 0 ? 'trend-up' : 'trend-down'}>{Number(trend) >= 0 ? '+' : ''}{trend}% from avg</span></p>
    <svg className="rocket-parameter-sparkline" viewBox="0 0 180 70" preserveAspectRatio="none" role="img" aria-label={`${parameter.label} trend`}><polygon points={`0,70 ${points} 180,70`} /><polyline points={points} /></svg>
    <div className="rocket-parameter-footer"><span>Updated live</span><span>{parameter.id}</span></div>
  </article>
}

function MissionDashboard({ machine, telemetry, onBack }: { machine: RocketMachine; telemetry: TelemetryData | null; onBack: () => void }) {
  const seed = numberFromId(machine.id)
  const fallbackLocation = { latitude: (seed % 14000) / 100 - 70, longitude: ((seed * 13) % 34000) / 100 - 170 }
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsMapOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const mapLocation = currentLocation ?? fallbackLocation
  const latitude = mapLocation.latitude.toFixed(4)
  const longitude = mapLocation.longitude.toFixed(4)
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=15&output=embed`
  const bearing = seed % 360
  const velocity = telemetry?.orbitalPhysics.velocityKmS ?? 7.68
  const altitude = telemetry?.orbitalPhysics.altitudeKm ?? 412
  const temperature = telemetry?.powerAndThermal.thermalCoreTempC ?? 32.4
  const downlink = telemetry?.networkTopology.earthDownlinkGbps ?? 10.24
  const connectionStrength = Math.min(100, Math.round((downlink / 12) * 100))
  const gForce = Number((velocity / 3.5).toFixed(2))
  const speed = Math.round(velocity * 3600)
  const rollAxis = Number((((seed % 30) - 15) / 10).toFixed(1))
  const rocketParameters: RocketParameter[] = [
    { id: 'THERM-CORE', label: 'Core temperature', source: 'Thermal sensor', value: temperature, unit: '°C', min: 18, max: 40, icon: Thermometer },
    { id: 'ALT-ORBIT', label: 'Altitude', source: 'Orbital position', value: altitude, unit: 'km', min: 350, max: 550, icon: MapPin },
    { id: 'LINK-DOWN', label: 'Connection strength', source: 'Earth downlink', value: connectionStrength, unit: '%', min: 75, max: 100, icon: Signal },
    { id: 'G-LOAD', label: 'G-force', source: 'Inertial measurement', value: gForce, unit: 'g', min: 1.5, max: 3.5, icon: Gauge },
    { id: 'VEL-TRACK', label: 'Speed', source: 'Ground track', value: speed, unit: 'km/h', min: 25000, max: 29000, icon: Activity },
    { id: 'ROLL-AXIS', label: 'Roll axis', source: 'Attitude control', value: rollAxis, unit: '°', min: -15, max: 15, icon: Rotate3d },
  ]

  return <section className="mission-dashboard">
    <div className="mission-dashboard-header"><div><button className="mission-back-button" onClick={onBack} type="button"><ArrowLeft size={16} /> All mission nodes</button><div className="mission-title-row"><h2>{machine.name} mission dashboard</h2><span className="mission-live-badge"><span /> Live telemetry</span></div><p>{machine.mission}</p></div><span className="mission-node-id">Node ID · {machine.id}</span></div>
    <div className="rocket-parameters-grid">{rocketParameters.map((parameter, index) => <RocketParameterCard key={parameter.id} parameter={parameter} seed={seed + index * 29} />)}</div>
    <div className="mission-monitor-grid">
      <article className="mission-panel mission-orbit-panel"><PanelHeading icon={<Activity size={17} />} title="Orbital profile" subtitle="Altitude and velocity over the current pass" /><svg className="mission-line-chart" viewBox="0 0 560 190" role="img" aria-label="Orbital profile chart"><defs><linearGradient id="orbit-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#526b88" stopOpacity=".2" /><stop offset="100%" stopColor="#526b88" stopOpacity="0" /></linearGradient></defs><path className="mission-chart-grid" d="M0 35H560M0 95H560M0 155H560" /><path className="mission-chart-area" d="M0 143 C48 129 72 85 118 102 S182 151 225 106 S294 39 338 71 S404 132 447 91 S510 38 560 54 V190 H0Z" /><path className="mission-chart-line" d="M0 143 C48 129 72 85 118 102 S182 151 225 106 S294 39 338 71 S404 132 447 91 S510 38 560 54" /><circle className="mission-chart-point" cx="447" cy="91" r="5" /></svg><div className="mission-chart-legend"><span><i className="legend-dot green" /> Current altitude {altitude} km</span><span>Pass duration 92 min</span></div></article>
      <article className="mission-panel mission-location-panel"><PanelHeading icon={<MapPin size={17} />} title="GPS position" subtitle={currentLocation ? 'Your current device location' : 'Requesting your current location'} /><div className="mission-map" aria-label={`GPS latitude ${latitude}, longitude ${longitude}`}><iframe className="mission-google-map" src={googleMapsEmbedUrl} title={`${machine.name} GPS position preview`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><button className="mission-map-open-button" onClick={() => setIsMapOpen(true)} type="button" aria-label="Open interactive GPS map"><span className="mission-map-open-label"><Expand size={14} /> Open interactive map</span></button></div><div className="mission-coordinates"><span>LAT {latitude}°</span><span>LON {longitude}°</span></div></article>
      <article className="mission-panel mission-system-panel"><PanelHeading icon={<Cpu size={17} />} title="Payload systems" subtitle="Live resource and communications health" /><div className="mission-system-list"><SystemMetric label="CPU allocation" value={machine.cpu} percentage={machine.cpuUsage ?? 42} /><SystemMetric label="Memory allocation" value={machine.memory} percentage={machine.memUsage ?? 58} /><SystemMetric label="Thermal core" value={`${temperature} °C`} percentage={Math.min(100, temperature * 2)} /></div><div className="mission-downlink"><span><Radio size={15} /> Earth downlink</span><strong>{downlink} Gbps</strong></div></article>
      <article className="mission-panel mission-compass-panel"><PanelHeading icon={<Compass size={17} />} title="Heading" subtitle="Current attitude bearing" /><div className="mission-compass" style={{ '--bearing': `${bearing}deg` } as React.CSSProperties}><span className="compass-north">N</span><span className="compass-east">E</span><span className="compass-south">S</span><span className="compass-west">W</span><i className="compass-needle" /><b>{bearing}°</b></div><p className="mission-compass-caption">Attitude lock confirmed · {machine.region}</p></article>
    </div>
    {isMapOpen && <div className="mission-map-overlay" role="presentation" onMouseDown={() => setIsMapOpen(false)}><div className="mission-map-modal" role="dialog" aria-modal="true" aria-labelledby="interactive-map-title" onMouseDown={(event) => event.stopPropagation()}><div className="mission-map-modal-header"><div><h2 id="interactive-map-title">GPS position</h2><p>Pan, zoom, and explore the surrounding area.</p></div><button className="mission-mfa-close" onClick={() => setIsMapOpen(false)} type="button" aria-label="Close interactive map"><X size={18} /></button></div><iframe className="mission-google-map mission-google-map--expanded" src={googleMapsEmbedUrl} title={`${machine.name} interactive GPS map`} referrerPolicy="no-referrer-when-downgrade" /></div></div>}
  </section>
}

export default function OperationsSection({ machines, telemetry }: OperationsSectionProps) {
  const [selectedMachine, setSelectedMachine] = useState<RocketMachine | null>(null)
  const [mfaMachine, setMfaMachine] = useState<RocketMachine | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [mfaError, setMfaError] = useState(false)
  const requestMissionAccess = (machine: RocketMachine) => { setMfaMachine(machine); setMfaCode(makeMfaCode()); setEnteredCode(''); setMfaError(false) }
  const verifyMfa = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (enteredCode === mfaCode) { setSelectedMachine(mfaMachine); setMfaMachine(null); return }; setMfaError(true) }

  if (selectedMachine) return <MissionDashboard machine={selectedMachine} telemetry={telemetry} onBack={() => setSelectedMachine(null)} />

  return <>
    <div className="view-header"><div><h2>Mission Operations</h2><p>Review mission-ready nodes and open their protected monitoring dashboards.</p></div></div>
    <div className="operations-node-table-wrap"><div className="operations-node-table-title"><div><h3>Mission nodes</h3><p>{machines.length} nodes available for monitored operations</p></div><span className="mission-live-badge"><span /> Network synchronized</span></div><table className="operations-node-table"><thead><tr><th>Node</th><th>Mission</th><th>Region</th><th>Compute</th><th>Status</th><th>Action</th></tr></thead><tbody>{machines.map((machine) => <tr key={machine.id}><td data-label="Node"><div className="operations-node-name"><span><Terminal size={16} /></span><div><strong>{machine.name}</strong><small>{machine.image}</small></div></div></td><td data-label="Mission" className="operations-node-mission">{machine.mission}</td><td data-label="Region">{machine.region}</td><td data-label="Compute">{machine.cpu} <span className="operations-memory">· {machine.memory}</span></td><td data-label="Status"><span className={`operations-status operations-status--${machine.status.toLowerCase()}`}>{machine.status}</span></td><td className="operations-action"><button onClick={() => requestMissionAccess(machine)} type="button">View mission</button></td></tr>)}</tbody></table>{machines.length === 0 && <p className="operations-empty-state">No mission nodes are available yet.</p>}</div>
    {mfaMachine && <div className="mission-mfa-overlay" role="presentation"><div className="mission-mfa-modal" role="dialog" aria-modal="true" aria-labelledby="mfa-title"><button className="mission-mfa-close" onClick={() => setMfaMachine(null)} type="button" aria-label="Close MFA verification"><X size={18} /></button><span className="mission-mfa-icon"><LockKeyhole size={22} /></span><h2 id="mfa-title">Verify mission access</h2><p>Enter the eight-digit MFA code issued for <strong>{mfaMachine.name}</strong>.</p><p className="mission-mfa-demo-code">Demo challenge code: <code>{mfaCode}</code></p><form onSubmit={verifyMfa}><label htmlFor="mission-mfa-code">One-time code</label><input id="mission-mfa-code" inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={enteredCode} onChange={(event) => { setEnteredCode(event.target.value.replace(/\D/g, '')); setMfaError(false) }} autoFocus placeholder="00000000" />{mfaError && <p className="mission-mfa-error">That code does not match this mission access request.</p>}<button type="submit">Verify and open dashboard</button></form></div></div>}
  </>
}
