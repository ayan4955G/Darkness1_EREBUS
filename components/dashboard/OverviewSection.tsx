'use client'

import React from 'react'
import {
  Calendar,
  ChevronDown,
  Link as LinkIcon,
  MoreHorizontal,
  Sparkles,
  Server,
  Activity,
  Cpu,
  Radio,
  ShieldCheck,
} from 'lucide-react'
import { RocketMachine } from '@/lib/types'

interface OverviewSectionProps {
  machines: RocketMachine[]
}

export default function OverviewSection({ machines }: OverviewSectionProps) {
  return (
    <>
      {/* OVERVIEW TITLE ROW */}
      <div className="zentra-overview-head">
        <div className="zentra-title-row">
          <h1>Cloud Fleet Overview</h1>
          <div className="link-badge" title="Orbital Laser Uplink Active">
            <LinkIcon style={{ width: 14, height: 14 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="date-pill-control">
            <Calendar style={{ width: 13 }} /> Jan 01 – July 31{' '}
            <ChevronDown style={{ width: 12 }} />
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>compared to</span>
          <div className="date-pill-control">
            <Calendar style={{ width: 13 }} /> Aug 01 – Dec 31{' '}
            <ChevronDown style={{ width: 12 }} />
          </div>
        </div>
      </div>

      {/* HERO GRID SECTION */}
      <div className="zentra-hero-grid">
        {/* LEFT CARD: COMPUTE & WORKLOAD TELEMETRY */}
        <div className="zentra-card">
          <div className="zentra-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server style={{ width: 18, color: '#38bdf8' }} />
              <h2>Cloud Compute & Workload Telemetry</h2>
            </div>
            <button className="dots-btn" type="button">
              <MoreHorizontal style={{ width: 16 }} />
            </button>
          </div>

          {/* 5 Cloud Metric Columns */}
          <div className="metric-cols-row">
            <div className="metric-col-item">
              <span className="metric-col-label">Provisioned vCPUs</span>
              <strong className="metric-col-value">2,048</strong>
            </div>
            <div className="metric-col-item">
              <span className="metric-col-label">Active Containers</span>
              <strong className="metric-col-value">548</strong>
            </div>
            <div className="metric-col-item highlighted">
              <span
                className="metric-col-label"
                style={{ fontWeight: 700, color: '#0f172a' }}
              >
                Orbital IOPS (Laser Mesh)
              </span>
              <strong className="metric-col-value" style={{ color: '#0f172a' }}>
                1.24M
              </strong>
            </div>
            <div className="metric-col-item">
              <span className="metric-col-label">Storage Egress</span>
              <strong className="metric-col-value">84.2 TB</strong>
            </div>
            <div className="metric-col-item">
              <span className="metric-col-label">Completed Jobs</span>
              <strong className="metric-col-value">32.9k</strong>
            </div>
          </div>

          {/* 3D Extruded Bar Chart SVG */}
          <div className="zentra-chart-wrap">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="blueGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="blueGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.6" />
                </linearGradient>
                <pattern
                  id="stripe"
                  width="10"
                  height="10"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                  />
                </pattern>
              </defs>

              <polygon points="10,40 100,40 120,60 120,180 10,180" fill="url(#blueGrad1)" />
              <polygon points="10,40 100,40 120,60 120,180 10,180" fill="url(#stripe)" />

              <polygon points="130,70 220,70 240,90 240,180 130,180" fill="url(#blueGrad1)" />
              <polygon points="130,70 220,70 240,90 240,180 130,180" fill="url(#stripe)" />

              <polygon points="250,100 340,100 360,120 360,180 250,180" fill="url(#blueGrad2)" />

              <polygon points="370,125 460,125 480,140 480,180 370,180" fill="url(#blueGrad1)" />
              <polygon points="370,125 460,125 480,140 480,180 370,180" fill="url(#stripe)" />

              <polygon points="490,145 580,145 595,155 595,180 490,180" fill="url(#blueGrad1)" />
              <polygon points="490,145 580,145 595,155 595,180 490,180" fill="url(#stripe)" />
            </svg>

            <div className="chart-tooltip-callout">
              <strong>1.24M IOPS</strong> throughput | Downlink: <strong>18.6 Gbps</strong> | Packet loss:{' '}
              <span style={{ color: '#059669' }}>0.001%</span>
            </div>
          </div>

          {/* AI Exploration Strip */}
          <div className="zentra-ai-strip">
            <div className="ai-strip-head">
              <Sparkles style={{ width: 14 }} /> What would you like to explore next?
            </div>
            <div className="ai-input-box">
              I want to analyze orbital payload utilization across
              <span className="ai-tag-highlight">/EREBUS-CORE and LEO clusters</span>
              <span style={{ animation: 'pulse 1s infinite' }}>|</span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: RESOURCE ALLOCATION & CAPACITY (Replaces Gross Volume) */}
        <div className="capacity-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Resource Capacity
              </h3>
              <Cpu style={{ width: 18, color: '#2563eb' }} />
            </div>
            <div className="big-stat-number">128.4 TFLOPS</div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Active Compute Cluster Output</span>
          </div>

          <div className="capacity-progress-item" style={{ marginTop: 16 }}>
            <div className="capacity-progress-label">
              <span>vCPU / GPU Core Allocation</span>
              <strong>84%</strong>
            </div>
            <div className="striped-progress-bar">
              <div className="striped-bar-fill striped-green" style={{ width: '84%' }} />
            </div>
          </div>

          <div className="capacity-progress-item">
            <div className="capacity-progress-label">
              <span>Zero-G NVMe Storage Pool</span>
              <strong>68%</strong>
            </div>
            <div className="striped-progress-bar">
              <div className="striped-bar-fill striped-blue" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="capacity-progress-item">
            <div className="capacity-progress-label">
              <span>Laser Interconnect Bandwidth</span>
              <strong>45%</strong>
            </div>
            <div className="striped-progress-bar">
              <div className="striped-bar-fill striped-pink" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID ROW */}
      <div className="zentra-bottom-grid">
        {/* CARD 1: FLEET SLA UPTIME (Replaces Retention) */}
        <div className="pink-chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Fleet SLA Uptime
            </h3>
            <button className="dots-btn" type="button">
              <MoreHorizontal style={{ width: 14 }} />
            </button>
          </div>

          <div className="badge-percent-pink">99.99%</div>
          <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>High-Availability Orbital SLA</span>

          <div style={{ height: 95, marginTop: 'auto' }}>
            <svg width="100%" height="100%" viewBox="0 0 200 80">
              <polyline
                fill="rgba(236, 72, 153, 0.15)"
                stroke="#ec4899"
                strokeWidth="2.5"
                points="10,60 30,60 30,40 60,40 60,20 80,20 80,45 110,45 110,30 140,30 140,55 170,55 170,75 190,75"
              />
            </svg>
          </div>
        </div>

        {/* CARD 2: NETWORK REQUESTS & IOPS (Replaces Transactions) */}
        <div className="matrix-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Network & IOPS Traffic
            </h3>
            <button className="dots-btn" type="button">
              <MoreHorizontal style={{ width: 14 }} />
            </button>
          </div>

          <div className="matrix-stat-row">
            <div>
              <span className="peak-pill">Peak: Orbit 4</span>
              <div className="matrix-big-num">106M</div>
              <span style={{ fontSize: 11, color: '#64748b' }}>req / sec</span>
            </div>

            <div className="matrix-dots-grid">
              {[3, 5, 8, 12, 16, 10, 6, 4, 8, 5, 3].map((h, i) => (
                <div className="dot-col" key={i}>
                  {Array.from({ length: Math.min(h, 6) }).map((_, j) => (
                    <div
                      className={`dot-unit ${i >= 3 && i <= 6 ? 'green' : ''}`}
                      key={j}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#64748b',
              marginTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Laser mesh throughput</span>
            <strong style={{ color: '#059669' }}>+34.2 Gbps</strong>
          </div>
        </div>

        {/* CARD 3: CLOUD EFFICIENCY & SHIELD STATUS (Replaces Insights) */}
        <div className="gradient-insights-card">
          <div className="insights-badge">⚡ Cloud Efficiency</div>
          <div className="insights-big-percent">98.4%</div>
          <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', marginTop: 8 }}>
            Cosmic Radiation Shield Nominal
          </div>
        </div>
      </div>

      {/* RECENT ORBITAL WORKLOADS TABLE */}
      <div className="finpay-table-card">
        <div className="table-head-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio style={{ width: 16, color: '#2563eb' }} />
            <h3>Active Workloads & Cloud Deployments</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="date-pill-control" type="button">
              Filter
            </button>
            <button className="date-pill-control" type="button">
              Export CSV
            </button>
          </div>
        </div>

        <table className="finpay-table">
          <thead>
            <tr>
              <th>MACHINE / PAYLOAD</th>
              <th>REGION / CLUSTER</th>
              <th>COMPUTE ALLOCATION</th>
              <th>DOWNLINK IP & RATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.name}</td>
                <td><span className="peak-pill">{m.region}</span></td>
                <td>
                  {m.cpu} ({m.memory})
                </td>
                <td style={{ fontFamily: 'monospace' }}>{m.ip} (10Gbps)</td>
                <td>
                  <span
                    className={`table-status-pill ${
                      m.status === 'Running' ? 'status-success' : 'status-pending'
                    }`}
                  >
                    {m.status === 'Running' ? 'Operational' : m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
