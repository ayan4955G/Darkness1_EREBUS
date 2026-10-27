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
            VELOCITY <Rocket style={{ width: 16, color: '#2563eb' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.sensorReadings?.speedKmh !== null && telemetry?.sensorReadings?.speedKmh !== undefined
              ? `${telemetry.sensorReadings.speedKmh} km/h`
              : telemetry?.orbitalPhysics?.velocityKmS !== null && telemetry?.orbitalPhysics?.velocityKmS !== undefined
              ? `${telemetry.orbitalPhysics.velocityKmS} km/s`
              : 'Unavailable'}
          </div>
          <div className="stat-card-sub">
            {telemetry?.sensorReadings?.speedKmh !== null && telemetry?.sensorReadings?.speedKmh !== undefined
              ? 'GPS ground speed'
              : 'Telemetry track'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            ALTITUDE <Globe2 style={{ width: 16, color: '#0284c7' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.sensorReadings?.altitudeMeters !== null && telemetry?.sensorReadings?.altitudeMeters !== undefined
              ? `${telemetry.sensorReadings.altitudeMeters} m`
              : telemetry?.orbitalPhysics?.altitudeKm !== null && telemetry?.orbitalPhysics?.altitudeKm !== undefined
              ? `${telemetry.orbitalPhysics.altitudeKm} km`
              : 'Unavailable'}
          </div>
          <div className="stat-card-sub">
            {telemetry?.sensorReadings?.altitudeMeters !== null ? 'BMP280 Barometric formula' : 'Orbital altitude'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            LORA SIGNAL <Zap style={{ width: 16, color: '#d97706' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.rssi !== null && telemetry?.rssi !== undefined ? `${telemetry.rssi} dBm` : 'Unavailable'}
          </div>
          <div className="stat-card-sub">
            {telemetry?.snr !== null && telemetry?.snr !== undefined ? `SNR: ${telemetry.snr} dB` : 'LoRa 433 MHz link'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">
            SHIELD & ACCEL <ShieldCheck style={{ width: 16, color: '#10b981' }} />
          </div>
          <div className="stat-card-val">
            {telemetry?.sensorReadings?.gForce !== null && telemetry?.sensorReadings?.gForce !== undefined
              ? `${telemetry.sensorReadings.gForce} g`
              : telemetry?.environmentalShielding?.shieldIntegrityPercent !== null && telemetry?.environmentalShielding?.shieldIntegrityPercent !== undefined
              ? `${telemetry.environmentalShielding.shieldIntegrityPercent}%`
              : 'Unavailable'}
          </div>
          <div className="stat-card-sub">
            {telemetry?.sensorReadings?.gForce !== null ? 'MPU6050 total g-load' : 'Cosmic Shield'}
          </div>
        </div>
      </div>

      <div className="zentra-hero-grid" style={{ marginTop: 24 }}>
        <div className="card-panel">
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>
            Thermal & Environmental Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="capacity-progress-item">
              <div className="capacity-progress-label">
                <span>Humidity (DHT22)</span>
                <strong>
                  {telemetry?.sensorReadings?.humidity !== null && telemetry?.sensorReadings?.humidity !== undefined
                    ? `${telemetry.sensorReadings.humidity} %`
                    : 'Unavailable'}
                </strong>
              </div>
              <div className="striped-progress-bar">
                <div
                  className="striped-bar-fill striped-green"
                  style={{ width: `${Math.min(100, telemetry?.sensorReadings?.humidity ?? 0)}%` }}
                />
              </div>
            </div>
            <div className="capacity-progress-item">
              <div className="capacity-progress-label">
                <span>Core Temperature (BMP280 / DHT22)</span>
                <strong>
                  {telemetry?.sensorReadings?.temperature !== null && telemetry?.sensorReadings?.temperature !== undefined
                    ? `${telemetry.sensorReadings.temperature} °C`
                    : telemetry?.powerAndThermal?.thermalCoreTempC !== null && telemetry?.powerAndThermal?.thermalCoreTempC !== undefined
                    ? `${telemetry.powerAndThermal.thermalCoreTempC} °C`
                    : 'Unavailable'}
                </strong>
              </div>
              <div className="striped-progress-bar">
                <div
                  className="striped-bar-fill striped-blue"
                  style={{
                    width: `${Math.min(100, Math.max(0, (telemetry?.sensorReadings?.temperature ?? telemetry?.powerAndThermal?.thermalCoreTempC ?? 0) * 2))}%`,
                  }}
                />
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
