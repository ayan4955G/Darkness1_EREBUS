'use client'

import React from 'react'
import { Activity, Globe2, RefreshCw, Rocket, ShieldCheck, Zap } from 'lucide-react'
import { TelemetryData } from '@/lib/types'

interface TelemetrySectionProps {
  telemetry: TelemetryData | null
  onRefresh: () => void
}

export default function TelemetrySection({
  telemetry,
  onRefresh,
}: TelemetrySectionProps) {
  return (
    <>
      <div className="view-header">
        <div>
          <h2>Telemetry & Orbital Analytics</h2>
          <p>Real-time physical telemetry, thermal core dissipation, and laser crosslinks.</p>
        </div>
        <button className="secondary-btn" onClick={onRefresh} type="button">
          <RefreshCw style={{ width: 14 }} /> Sync Telemetry
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            ORBITAL VELOCITY <Rocket style={{ width: 16, color: '#2563eb' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.orbitalPhysics?.velocityKmS || 7.68} km/s
          </div>
          <div className="stat-card-sub">27,600 km/h ground track</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            ALTITUDE <Globe2 style={{ width: 16, color: '#0284c7' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.orbitalPhysics?.altitudeKm || 412} km
          </div>
          <div className="stat-card-sub">Low Earth Orbit (LEO)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            SOLAR GENERATION <Zap style={{ width: 16, color: '#d97706' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.powerAndThermal?.solarPowerOutputMw || 14.2} MW
          </div>
          <div className="stat-card-sub">Gallium Arsenide Arrays</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            SHIELD INTEGRITY <ShieldCheck style={{ width: 16, color: '#10b981' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.environmentalShielding?.shieldIntegrityPercent || 99.4}%
          </div>
          <div className="stat-card-sub">Cosmic Radiation Nominal</div>
        </div>
      </div>

      <div className="zentra-hero-grid" style={{ marginTop: 24 }}>
        <div className="card-panel">
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>
            Power & Thermal Core Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="capacity-progress-item">
              <div className="capacity-progress-label">
                <span>Battery Charge (Li-Ion Space Grade)</span>
                <strong>{telemetry?.powerAndThermal?.batteryChargePercent || 98}%</strong>
              </div>
              <div className="striped-progress-bar">
                <div
                  className="striped-bar-fill striped-green"
                  style={{ width: `${telemetry?.powerAndThermal?.batteryChargePercent || 98}%` }}
                />
              </div>
            </div>
            <div className="capacity-progress-item">
              <div className="capacity-progress-label">
                <span>Thermal Dissipation (420 kW)</span>
                <strong>{telemetry?.powerAndThermal?.thermalCoreTempC || 32.4} °C</strong>
              </div>
              <div className="striped-progress-bar">
                <div className="striped-bar-fill striped-blue" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card-panel">
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>
            Laser Crosslink Latencies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span>EREBUS-CORE ➔ ORBITAL-01</span>
              <strong style={{ color: '#059669' }}>
                {telemetry?.networkTopology?.interplanetaryLatencyMs?.['orbital-01'] || 0.42} ms
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span>EREBUS-CORE ➔ LUNAR-01</span>
              <strong style={{ color: '#2563eb' }}>
                {telemetry?.networkTopology?.interplanetaryLatencyMs?.['lunar-01'] || 1280} ms (1.28 s)
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>EREBUS-CORE ➔ MARS-RELAY</span>
              <strong style={{ color: '#d97706' }}>
                {((telemetry?.networkTopology?.interplanetaryLatencyMs?.['mars-relay'] || 252000) / 60000).toFixed(1)} min
              </strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
