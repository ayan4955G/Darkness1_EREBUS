'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  Cloud,
  Cpu,
  Database,
  Globe2,
  HardDrive,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  Plus,
  Radio,
  Rocket,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
  Zap,
  Trash2,
  Power,
  RefreshCw,
  Gauge,
  Wifi,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Calendar,
  Bell,
  MoreHorizontal,
} from 'lucide-react'

type Section = 'Home' | 'Infrastructure' | 'Telemetry' | 'Operations' | 'Cloud Storage' | 'Cloud regions' | 'Settings'

type RocketMachine = {
  id: string
  name: string
  region: 'EREBUS-CORE' | 'ORBITAL-01' | 'ORBITAL-02' | 'LUNAR-01' | 'MARS-RELAY'
  status: 'Running' | 'Stopped' | 'Maintenance' | 'Deploying'
  cpu: string
  memory: string
  image: string
  ip: string
  mission: string
  cpuUsage?: number
  memUsage?: number
  tempC?: number
}

type StorageBucket = {
  id: string
  name: string
  region: string
  sizeGb: number
  objectCount: number
  tier: string
  redundancy: string
}

type TelemetryData = {
  orbitalPhysics: {
    velocityKmS: number
    altitudeKm: number
    inclinationDeg: number
    orbitalPeriodMin: number
  }
  powerAndThermal: {
    solarPowerOutputMw: number
    batteryChargePercent: number
    thermalCoreTempC: number
    radiatorDissipationKw: number
  }
  environmentalShielding: {
    cosmicRadiationFluxMsv: number
    geomagneticFieldStrengthUt: number
    shieldIntegrityPercent: number
  }
  networkTopology: {
    laserCrosslinksActive: number
    earthDownlinkGbps: number
    interplanetaryLatencyMs: Record<string, number>
  }
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        {/* <Sparkles /> */}
        <Image
            src="/logo.png"
            alt="EREBUS"
            fill
            className="object-contain"
          />
      </div>
      <div>
        <strong>erebus</strong>
        <span>SPACE DATA CENTER</span>
      </div>
    </div>
  )
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('operator@erebus.space')
  const [password, setPassword] = useState('••••••••••••')

  return (
    <main className="voyager-login-wrap">
      <div className="voyager-card">
        {/* LEFT SPATIAL VISUAL SECTION */}
        <section className="voyager-visual-side">
          <video
            className="voyager-space-video"
            src="/panel_video.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="pixelize-filter-overlay" />
          <div className="voyager-overlay-gradient" />
        </section>

        {/* RIGHT FORM SECTION */}
        <section className="voyager-form-side">
          <div className="voyager-brand">
            <div className="voyager-logo-mark">
               <Image
            src="/logo.png"
            alt="EREBUS"
            fill
            className="object-contain"
          />  
            </div>
            <span className="voyager-logo-text">erebus</span>
          </div>

          <h1 className="voyager-heading">
            {isSignUp ? 'Start your space mission' : 'Command your space cloud'}
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              onLogin()
            }}
            className="voyager-form"
          >
            {isSignUp && (
              <div className="input-pill-wrap">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="voyager-input-pill"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="input-pill-wrap">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="voyager-input-pill"
                required
              />
            </div>

            <div className="input-pill-wrap password-pill-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="voyager-input-pill"
                required
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>

            <button type="submit" className="voyager-submit-pill">
              {isSignUp ? 'Create Account & Start' : 'Start'}
            </button>
          </form>

          <div className="voyager-footer-toggle">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsSignUp(false)} className="toggle-mode-btn">
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsSignUp(true)} className="toggle-mode-btn">
                  Sign up
                </button>
              </span>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [active, setActive] = useState<Section>('Home')
  const [selectedVm, setSelectedVm] = useState<RocketMachine | null>(null)

  // Modals & Interactive States
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [showBucketModal, setShowBucketModal] = useState(false)
  const [newMachName, setNewMachName] = useState('')
  const [newMachRegion, setNewMachRegion] = useState<'EREBUS-CORE' | 'ORBITAL-01' | 'ORBITAL-02' | 'LUNAR-01' | 'MARS-RELAY'>('EREBUS-CORE')
  const [newMachCpu, setNewMachCpu] = useState('16 vCPU')
  const [newMachMem, setNewMachMem] = useState('64 GB NVMe')
  
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketRegion, setNewBucketRegion] = useState('EREBUS-CORE')
  const [newBucketTier, setNewBucketTier] = useState('Hot NVMe')

  // Operations CLI Terminal State
  const [termInput, setTermInput] = useState('')
  const [termLogs, setTermLogs] = useState<Array<{ id: number; type: 'system' | 'user' | 'error'; text: string }>>([
    { id: 1, type: 'system', text: 'EREBUS Space Data Center Terminal v2.4.0' },
    { id: 2, type: 'system', text: 'Connected to Orbital Payload [EREBUS-CORE-01] via 10Gbps Laser Crosslink.' },
    { id: 3, type: 'system', text: 'Type "help" for available orbital CLI commands.' },
  ])

  // SSH & Rocket Connect Modal State
  const [connectModalMachine, setConnectModalMachine] = useState<RocketMachine | null>(null)
  const [sshInput, setSshInput] = useState('')
  const [sshLogs, setSshLogs] = useState<Array<{ id: number; type: 'system' | 'user' | 'error'; text: string }>>([])

  const handleOpenConnectModal = (m: RocketMachine) => {
    setConnectModalMachine(m)
    setSshLogs([
      { id: 1, type: 'system', text: `[ESTABLISHING SSH] Tunneling to ${m.name} (${m.ip}) via LEO Laser Link...` },
      { id: 2, type: 'system', text: `[AUTHENTICATED] Welcome to ${m.name} (Erebus Space Kernel 6.8.0-orbital).` },
      { id: 3, type: 'system', text: `Type "health" to query propulsion status or "top" for CPU/Memory metrics.` },
    ])
  }

  const handleSshSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = sshInput.trim().toLowerCase()
    if (!cmd || !connectModalMachine) return

    const userLog = { id: Date.now(), type: 'user' as const, text: `$ ${sshInput}` }
    let sysReply = ''

    if (cmd === 'health' || cmd === 'status') {
      sysReply = `ROCKET TELEMETRY: Hull: 99.8% | Propellant: 94.0% | Core Temp: ${connectModalMachine.tempC || 32.1}°C | Downlink: 10.24Gbps`
    } else if (cmd === 'top') {
      sysReply = `CPU USAGE: ${connectModalMachine.cpuUsage || 24.5}% | MEMORY: ${connectModalMachine.memUsage || 48.2}% [vCPUs: ${connectModalMachine.cpu}]`
    } else if (cmd === 'reboot') {
      sysReply = `[REBOOTING] Flight computer on ${connectModalMachine.name} initializing cold reboot... Systems Nominal!`
    } else if (cmd === 'clear') {
      setSshLogs([])
      setSshInput('')
      return
    } else {
      sysReply = `bash: command not found: ${cmd}. Available: health, status, top, reboot, clear.`
    }

    setSshLogs((prev) => [...prev, userLog, { id: Date.now() + 1, type: 'system', text: sysReply }])
    setSshInput('')
  }

  // API state
  const [machines, setMachines] = useState<RocketMachine[]>([])
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [buckets, setBuckets] = useState<StorageBucket[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data
  const fetchData = async () => {
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
  }

  useEffect(() => {
    if (loggedIn) {
      fetchData()
      const interval = setInterval(fetchData, 8000)
      return () => clearInterval(interval)
    }
  }, [loggedIn])

  // Actions
  const handleTogglePower = (id: string) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'Running' ? 'Stopped' : 'Running' } : m
      )
    )
  }

  const handleDeleteMachine = (id: string) => {
    setMachines((prev) => prev.filter((m) => m.id !== id))
  }

  const handleLaunchMachine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMachName.trim()) return
    const newVm: RocketMachine = {
      id: `vm-${Date.now().toString().slice(-4)}`,
      name: newMachName,
      region: newMachRegion,
      status: 'Running',
      cpu: newMachCpu,
      memory: newMachMem,
      image: 'Ubuntu 24.04 Space-Kernel',
      ip: `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      mission: 'Orbital Workload',
      cpuUsage: 12,
      memUsage: 24,
      tempC: 34,
    }
    setMachines((prev) => [newVm, ...prev])
    setNewMachName('')
    setShowLaunchModal(false)
  }

  const handleCreateBucket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBucketName.trim()) return
    const newB: StorageBucket = {
      id: `bkt-${Date.now().toString().slice(-4)}`,
      name: newBucketName,
      region: newBucketRegion,
      sizeGb: 256,
      objectCount: 1420,
      tier: newBucketTier,
      redundancy: 'Triple Orbit Sync',
    }
    setBuckets((prev) => [newB, ...prev])
    setNewBucketName('')
    setShowBucketModal(false)
  }

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = termInput.trim().toLowerCase()
    if (!cmd) return

    const userLog = { id: Date.now(), type: 'user' as const, text: `$ ${termInput}` }
    let sysReply = ''

    if (cmd === 'help') {
      sysReply = 'Available commands: status, machines, telemetry, deploy, ping, clear'
    } else if (cmd === 'status') {
      sysReply = 'SYSTEM STATUS: All 5 Orbital Nodes Operational. Laser Downlink: 10.24 Gbps. Radiation Shielding: OPTIMAL.'
    } else if (cmd === 'machines') {
      sysReply = `INSTANCES (${machines.length}): ${machines.map((m) => `${m.name} [${m.status}]`).join(', ')}`
    } else if (cmd === 'telemetry') {
      sysReply = `TELEMETRY: Velocity: ${telemetry?.orbitalPhysics?.velocityKmS || 7.68}km/s | Altitude: ${telemetry?.orbitalPhysics?.altitudeKm || 412}km | Core Temp: ${telemetry?.powerAndThermal?.thermalCoreTempC || 32.4}°C`
    } else if (cmd === 'ping') {
      sysReply = 'PING orbital-core.erebus.space: 56 bytes, time=0.42ms RTT.'
    } else if (cmd === 'deploy') {
      sysReply = 'DEPLOYING new container payload to ORBITAL-01... Success! Container ID: c-9402'
    } else if (cmd === 'clear') {
      setTermLogs([])
      setTermInput('')
      return
    } else {
      sysReply = `Command not recognized: "${cmd}". Type "help" for command list.`
    }

    setTermLogs((prev) => [...prev, userLog, { id: Date.now() + 1, type: 'system', text: sysReply }])
    setTermInput('')
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <main className="erebus-app">
      <div className="zentra-shell">
        {/* SIDEBAR (FINPAY STYLE) */}
        <aside className="sidebar">
          <Brand />



          <nav aria-label="Main Navigation" style={{ marginTop: "2rem" }}>
            <span className="nav-label">MAIN MENU</span>
            <button className={`nav-item ${active === 'Home' ? 'active' : ''}`} onClick={() => setActive('Home')}>
              <LayoutDashboard /> <span>Dashboard</span>
            </button>
            <button className={`nav-item ${active === 'Infrastructure' ? 'active' : ''}`} onClick={() => setActive('Infrastructure')}>
              <Server /> <span>Infrastructure</span> <span className="nav-count">{machines.length}</span>
            </button>
            <button className={`nav-item ${active === 'Telemetry' ? 'active' : ''}`} onClick={() => setActive('Telemetry')}>
              <Activity /> <span>Telemetry & Analytics</span>
            </button>

            <button className={`nav-item ${active === 'Cloud Storage' ? 'active' : ''}`} onClick={() => setActive('Cloud Storage')}>
              <HardDrive /> <span>Cloud Storage</span>
            </button>

            <span className="nav-label second">OTHER</span>
            <button className={`nav-item ${active === 'Cloud regions' ? 'active' : ''}`} onClick={() => setActive('Cloud regions')}>
              <Cloud /> <span>Cloud Regions</span>
            </button>
            <button className={`nav-item ${active === 'Settings' ? 'active' : ''}`} onClick={() => setActive('Settings')}>
              <SlidersHorizontal /> <span>Settings</span>
            </button>
          </nav>

          <div className="sidebar-bottom">


            <div className="profile">
              <div className="avatar">OP</div>
              <div>
                <strong>Alex Drake</strong>
                <span>operator@erebus.space</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <section className="content">
          {/* TOPBAR */}
          <header className="topbar">
            <div className="greeting-text">
              {active === 'Home' && 'Overview'}
              {active === 'Infrastructure' && 'Infrastructure & Compute Instances'}
              {active === 'Telemetry' && 'Telemetry & Space Analytics'}
              {active === 'Operations' && 'Mission Operations Terminal'}
              {active === 'Cloud Storage' && 'Orbital Cloud Storage'}
              {active === 'Cloud regions' && 'Cloud Regions Topology'}
              {active === 'Settings' && 'System Settings & Security'}
            </div>

            <div className="top-actions">
              <div className="top-search-pill">
                <Search />
                <input placeholder="Search ⌘K..." />
              </div>
              <button className="dots-btn" title="Notifications">
                <Bell style={{ width: 15 }} />
              </button>
              <div className="avatar" style={{ width: 34, height: 34 }}>AD</div>
            </div>
          </header>

          <div className="page-wrap">
            {/* 1. DASHBOARD / HOME VIEW */}
            {active === 'Home' && (
              <>
                {/* OVERVIEW TITLE ROW (ZENTRA STYLE) */}
                <div className="zentra-overview-head">
                  <div className="zentra-title-row">
                    <h1>Overview</h1>
                    <div className="link-badge">
                      <LinkIcon />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="date-pill-control">
                      <Calendar /> Jan 01 – July 31 <ChevronDown style={{ width: 12 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>compared to</span>
                    <div className="date-pill-control">
                      <Calendar /> Aug 01 – Dec 31 <ChevronDown style={{ width: 12 }} />
                    </div>
                  </div>
                </div>

                {/* HERO GRID SECTION (ZENTRA STYLE) */}
                <div className="zentra-hero-grid">
                  {/* LEFT CARD: PAYMENTS / COMPUTE HERO CARD */}
                  <div className="zentra-card">
                    <div className="zentra-card-head">
                      <h2>Payments & Workload Telemetry</h2>
                      <button className="dots-btn"><MoreHorizontal style={{ width: 16 }} /></button>
                    </div>

                    {/* 5 Metric Columns */}
                    <div className="metric-cols-row">
                      <div className="metric-col-item">
                        <span className="metric-col-label">Initiated Payments</span>
                        <strong className="metric-col-value">65.2k</strong>
                      </div>
                      <div className="metric-col-item">
                        <span className="metric-col-label">Authorized Payments</span>
                        <strong className="metric-col-value">54.8k</strong>
                      </div>
                      <div className="metric-col-item highlighted">
                        <span className="metric-col-label" style={{ fontWeight: 700, color: '#0f172a' }}>Successful Payments</span>
                        <strong className="metric-col-value" style={{ color: '#0f172a' }}>48.6k</strong>
                      </div>
                      <div className="metric-col-item">
                        <span className="metric-col-label">Payouts to Merchants</span>
                        <strong className="metric-col-value">38.3k</strong>
                      </div>
                      <div className="metric-col-item">
                        <span className="metric-col-label">Completed Transactions</span>
                        <strong className="metric-col-value">32.9k</strong>
                      </div>
                    </div>

                    {/* 3D Extruded Bar Chart SVG matching Zentra */}
                    <div className="zentra-chart-wrap">
                      <svg width="100%" height="100%" viewBox="0 0 600 180" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="blueGrad1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                          </linearGradient>
                          <linearGradient id="blueGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.6" />
                          </linearGradient>
                          <pattern id="stripe" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.3" />
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
                        <strong>48.6k</strong> transactions | Conversion: <strong>89%</strong> | Drop-off: <span style={{ color: '#dc2626' }}>-11%</span>
                      </div>
                    </div>

                    {/* AI Exploration Strip */}
                    <div className="zentra-ai-strip">
                      <div className="ai-strip-head">
                        <Sparkles /> What would you like to explore next?
                      </div>
                      <div className="ai-input-box">
                        I want to know what caused the drop-off from authorized to
                        <span className="ai-tag-highlight">/successful payments</span>
                        <span style={{ animation: 'pulse 1s infinite' }}>|</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT CARD: GROSS VOLUME */}
                  <div className="capacity-card">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Gross Volume</h3>
                      <div className="big-stat-number">$41,580.00</div>
                    </div>

                    <div className="capacity-progress-item">
                      <div className="capacity-progress-label">
                        <span>Online Payments</span>
                        <strong>84%</strong>
                      </div>
                      <div className="striped-progress-bar">
                        <div className="striped-bar-fill striped-green" style={{ width: '84%' }} />
                      </div>
                    </div>

                    <div className="capacity-progress-item">
                      <div className="capacity-progress-label">
                        <span>Subscriptions</span>
                        <strong>68%</strong>
                      </div>
                      <div className="striped-progress-bar">
                        <div className="striped-bar-fill striped-blue" style={{ width: '68%' }} />
                      </div>
                    </div>

                    <div className="capacity-progress-item">
                      <div className="capacity-progress-label">
                        <span>In-Store Sales</span>
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
                  {/* CARD 1: RETENTION */}
                  <div className="pink-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Retention</h3>
                      <button className="dots-btn"><MoreHorizontal style={{ width: 14 }} /></button>
                    </div>

                    <div className="badge-percent-pink">42%</div>

                    <div style={{ height: 110, marginTop: 'auto' }}>
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

                  {/* CARD 2: TRANSACTIONS */}
                  <div className="matrix-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Transactions</h3>
                      <button className="dots-btn"><MoreHorizontal style={{ width: 14 }} /></button>
                    </div>

                    <div className="matrix-stat-row">
                      <div>
                        <span className="peak-pill">Peak: Wed</span>
                        <div className="matrix-big-num">106k</div>
                      </div>

                      <div className="matrix-dots-grid">
                        {[3, 5, 8, 12, 16, 10, 6, 4, 8, 5, 3].map((h, i) => (
                          <div className="dot-col" key={i}>
                            {Array.from({ length: Math.min(h, 6) }).map((_, j) => (
                              <div className={`dot-unit ${i >= 3 && i <= 6 ? 'green' : ''}`} key={j} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <span>vs last period</span>
                      <strong style={{ color: '#059669' }}>+34,002</strong>
                    </div>
                  </div>

                  {/* CARD 3: INSIGHTS */}
                  <div className="gradient-insights-card">
                    <div className="insights-badge">💡 Insights</div>
                    <div className="insights-big-percent">75%</div>
                  </div>
                </div>

                {/* FINPAY RECENT TRANSACTIONS TABLE CARD */}
                <div className="finpay-table-card">
                  <div className="table-head-row">
                    <h3>Recent Transactions & Orbital Workloads</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="date-pill-control"><FilterIcon /> Filter</button>
                      <button className="date-pill-control">Export CSV</button>
                    </div>
                  </div>

                  <table className="finpay-table">
                    <thead>
                      <tr>
                        <th>MACHINE / TRANSACTION</th>
                        <th>REGION / DATE</th>
                        <th>COMPUTE ALLOCATION</th>
                        <th>DOWNLINK RATE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machines.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.name}</td>
                          <td>{m.region}</td>
                          <td>{m.cpu} ({m.memory})</td>
                          <td>{m.ip}</td>
                          <td>
                            <span className={`table-status-pill ${m.status === 'Running' ? 'status-success' : 'status-pending'}`}>
                              {m.status === 'Running' ? 'Successful' : m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 2. INFRASTRUCTURE VIEW */}
            {active === 'Infrastructure' && (
              <>
                <div className="view-header">
                  <div>
                    <h2>Infrastructure & Orbital Machines</h2>
                    <p>Manage space microservers, compute nodes, and payload instances.</p>
                  </div>
                  <button className="primary-btn" onClick={() => setShowLaunchModal(true)}>
                    <Plus style={{ width: 16 }} /> Launch Instance
                  </button>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div className="table-head-row">
                    <h3>Active Rocket Instances ({machines.length})</h3>
                    <button className="secondary-btn" onClick={fetchData}><RefreshCw style={{ width: 14 }} /> Refresh</button>
                  </div>

                  <div className="rocket-cards-grid">
                    {machines.map((m) => {
                      const isDarkness1 = m.name.toUpperCase().includes('DARKNESS')
                      return (
                        <div className="rocket-card" key={m.id}>
                          <div className="rocket-card-visual">
                            <div className="rocket-card-tags">
                              <span className="rocket-tag-pill">{m.region}</span>
                              {isDarkness1 && <span className="rocket-tag-pill" style={{ background: '#2563eb' }}>Vanguard</span>}
                            </div>
                            <div className="rocket-card-rating">
                              ★ {isDarkness1 ? '4.9' : '4.8'}
                            </div>
                            <img
                              src="/rocket.png"
                              alt={m.name}
                              className="rocket-card-img"
                            />
                          </div>

                          <div className="rocket-card-body">
                            <div className="rocket-card-header">
                              <h3 className="rocket-card-name">{m.name}</h3>
                              <span className="rocket-status-badge">
                                {isDarkness1 ? 'Top Rated' : m.status}
                              </span>
                            </div>

                            <p className="rocket-card-desc">
                              {isDarkness1
                                ? 'Flagship suborbital high-altitude compute payload. Radiation-shielded NVMe array with quantum laser uplink.'
                                : m.mission}
                            </p>

                            <div className="rocket-specs-row">
                              <span>{m.cpu}</span>
                              <span>•</span>
                              <span>{m.memory}</span>
                              <span>•</span>
                              <span style={{ fontFamily: 'monospace' }}>{m.ip}</span>
                            </div>

                            <button
                              className="rocket-card-connect-btn"
                              onClick={() => handleOpenConnectModal(m)}
                            >
                              <Terminal style={{ width: 15 }} /> Connect to {m.name}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 3. TELEMETRY & ANALYTICS VIEW */}
            {active === 'Telemetry' && (
              <>
                <div className="view-header">
                  <div>
                    <h2>Telemetry & Orbital Analytics</h2>
                    <p>Real-time physical telemetry, thermal core dissipation, and laser crosslinks.</p>
                  </div>
                  <button className="secondary-btn" onClick={fetchData}><RefreshCw style={{ width: 14 }} /> Sync Telemetry</button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-label">ORBITAL VELOCITY <Rocket style={{ width: 16, color: '#2563eb' }} /></div>
                    <div className="stat-card-val">{telemetry?.orbitalPhysics?.velocityKmS || 7.68} km/s</div>
                    <div className="stat-card-sub">27,600 km/h ground track</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">ALTITUDE <Globe2 style={{ width: 16, color: '#0284c7' }} /></div>
                    <div className="stat-card-val">{telemetry?.orbitalPhysics?.altitudeKm || 412} km</div>
                    <div className="stat-card-sub">Low Earth Orbit (LEO)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">SOLAR GENERATION <Zap style={{ width: 16, color: '#d97706' }} /></div>
                    <div className="stat-card-val">{telemetry?.powerAndThermal?.solarPowerOutputMw || 14.2} MW</div>
                    <div className="stat-card-sub">Gallium Arsenide Arrays</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">SHIELD INTEGRITY <ShieldCheck style={{ width: 16, color: '#10b981' }} /></div>
                    <div className="stat-card-val">{telemetry?.environmentalShielding?.shieldIntegrityPercent || 99.4}%</div>
                    <div className="stat-card-sub">Cosmic Radiation Nominal</div>
                  </div>
                </div>

                <div className="zentra-hero-grid">
                  <div className="card-panel">
                    <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>Power & Thermal Core Telemetry</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="capacity-progress-item">
                        <div className="capacity-progress-label"><span>Battery Charge (Li-Ion Space Grade)</span><strong>98%</strong></div>
                        <div className="striped-progress-bar"><div className="striped-bar-fill striped-green" style={{ width: '98%' }} /></div>
                      </div>
                      <div className="capacity-progress-item">
                        <div className="capacity-progress-label"><span>Thermal Dissipation (420 kW)</span><strong>32.4 °C</strong></div>
                        <div className="striped-progress-bar"><div className="striped-bar-fill striped-blue" style={{ width: '65%' }} /></div>
                      </div>
                    </div>
                  </div>

                  <div className="card-panel">
                    <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>Laser Crosslink Latencies</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span>EREBUS-CORE ➔ ORBITAL-01</span><strong style={{ color: '#059669' }}>0.42 ms</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span>EREBUS-CORE ➔ LUNAR-01</span><strong style={{ color: '#2563eb' }}>1.28 s</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span>EREBUS-CORE ➔ MARS-RELAY</span><strong style={{ color: '#d97706' }}>4.2 min</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

         

            {/* 5. CLOUD STORAGE VIEW */}
            {active === 'Cloud Storage' && (
              <>
                <div className="view-header">
                  <div>
                    <h2>Orbital Cloud Storage</h2>
                    <p>High-capacity space-grade NVMe bucket arrays with zero-gravity redundancy.</p>
                  </div>
                  <button className="primary-btn" onClick={() => setShowBucketModal(true)}>
                    <Plus style={{ width: 16 }} /> Create Bucket
                  </button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-label">ACTIVE BUCKETS <HardDrive style={{ width: 16, color: '#2563eb' }} /></div>
                    <div className="stat-card-val">{buckets.length}</div>
                    <div className="stat-card-sub">NVMe Storage Pools</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">TOTAL SIZE <Database style={{ width: 16, color: '#10b981' }} /></div>
                    <div className="stat-card-val">{buckets.reduce((acc, b) => acc + b.sizeGb, 0)} GB</div>
                    <div className="stat-card-sub">Replicated across orbit</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">TOTAL OBJECTS <Box style={{ width: 16, color: '#6366f1' }} /></div>
                    <div className="stat-card-val">{buckets.reduce((acc, b) => acc + b.objectCount, 0).toLocaleString()}</div>
                    <div className="stat-card-sub">Telemetry & datasets</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">ENCRYPTION <LockKeyhole style={{ width: 16, color: '#0284c7' }} /></div>
                    <div className="stat-card-val" style={{ fontSize: 20 }}>AES-256-GCM</div>
                    <div className="stat-card-sub">Quantum-Safe Keys</div>
                  </div>
                </div>

                <div className="card-panel">
                  <div className="table-head-row">
                    <h3>Storage Buckets ({buckets.length})</h3>
                  </div>

                  <table className="finpay-table">
                    <thead>
                      <tr>
                        <th>BUCKET NAME</th>
                        <th>REGION</th>
                        <th>SIZE (GB)</th>
                        <th>OBJECT COUNT</th>
                        <th>STORAGE TIER</th>
                        <th>REDUNDANCY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buckets.map((b) => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{b.name}</td>
                          <td><span className="peak-pill">{b.region}</span></td>
                          <td>{b.sizeGb} GB</td>
                          <td>{b.objectCount.toLocaleString()}</td>
                          <td><span className="table-status-pill status-success">{b.tier}</span></td>
                          <td>{b.redundancy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 6. CLOUD REGIONS TOPOLOGY VIEW */}
            {active === 'Cloud regions' && (
              <>
                <div className="view-header">
                  <div>
                    <h2>Cloud Regions & Space Data Center Topology</h2>
                    <p>Space-to-ground edge compute regions powered by laser mesh networks.</p>
                  </div>
                </div>

                <div className="regions-grid">
                  {[
                    { name: 'EREBUS-CORE', code: 'LEO-PRIMARY', ping: '0.4 ms', nodes: 12, orbit: 'Low Earth Orbit (412 km)' },
                    { name: 'ORBITAL-01', code: 'GEO-ALPHA', ping: '1.2 ms', nodes: 8, orbit: 'Geostationary Equatorial Orbit' },
                    { name: 'ORBITAL-02', code: 'GEO-BETA', ping: '1.8 ms', nodes: 6, orbit: 'Geostationary Polar Orbit' },
                    { name: 'LUNAR-01', code: 'MOON-SOUTH', ping: '1.28 s', nodes: 4, orbit: 'Lunar South Pole Gateway' },
                    { name: 'MARS-RELAY', code: 'AREO-RELAY', ping: '4.20 min', nodes: 2, orbit: 'Areostationary Relay Node' },
                  ].map((reg) => (
                    <div className="region-card" key={reg.name}>
                      <div className="region-card-top">
                        <span className="region-title">{reg.name}</span>
                        <span className="region-badge-active">Operational</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        <div>Code: <strong>{reg.code}</strong></div>
                        <div style={{ marginTop: 4 }}>Orbit: {reg.orbit}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                        <span>Ping Latency: <strong style={{ color: '#2563eb' }}>{reg.ping}</strong></span>
                        <span>Nodes: <strong>{reg.nodes}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 7. SETTINGS VIEW */}
            {active === 'Settings' && (
              <>
                <div className="view-header">
                  <div>
                    <h2>Settings & System Configurations</h2>
                    <p>Manage security protocols, radiation shielding triggers, and API keys.</p>
                  </div>
                </div>

                <div className="card-panel">
                  <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#0f172a' }}>Orbital Security & API Credentials</h3>
                  <div className="form-group">
                    <label>Primary Laser API Secret Token</label>
                    <input className="form-input" readOnly value="erebus_live_sk_94829471908472918471" style={{ fontFamily: 'monospace' }} />
                  </div>
                  <div className="form-group">
                    <label>Radiation Auto-Shielding Threshold</label>
                    <input className="form-input" defaultValue="0.15 mSv/h Trigger Auto-Safe Mode" />
                  </div>
                  <button className="primary-btn" onClick={() => alert('Settings saved successfully!')}>Save Configurations</button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* LAUNCH MACHINE MODAL */}
      {showLaunchModal && (
        <div className="modal-overlay" onClick={() => setShowLaunchModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Launch New Rocket Machine</h3>
              <button className="modal-close-btn" onClick={() => setShowLaunchModal(false)}><X style={{ width: 14 }} /></button>
            </div>
            <form onSubmit={handleLaunchMachine}>
              <div className="form-group">
                <label>Machine Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. ORBITAL-ANALYSIS-01"
                  value={newMachName}
                  onChange={(e) => setNewMachName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <select
                  className="form-input"
                  value={newMachRegion}
                  onChange={(e) => setNewMachRegion(e.target.value as any)}
                >
                  <option value="EREBUS-CORE">EREBUS-CORE (LEO)</option>
                  <option value="ORBITAL-01">ORBITAL-01 (GEO)</option>
                  <option value="ORBITAL-02">ORBITAL-02 (GEO)</option>
                  <option value="LUNAR-01">LUNAR-01 (Moon)</option>
                  <option value="MARS-RELAY">MARS-RELAY (Mars)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>Launch Instance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BUCKET MODAL */}
      {showBucketModal && (
        <div className="modal-overlay" onClick={() => setShowBucketModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Storage Bucket</h3>
              <button className="modal-close-btn" onClick={() => setShowBucketModal(false)}><X style={{ width: 14 }} /></button>
            </div>
            <form onSubmit={handleCreateBucket}>
              <div className="form-group">
                <label>Bucket Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. telemetry-raw-logs"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <select className="form-input" value={newBucketRegion} onChange={(e) => setNewBucketRegion(e.target.value)}>
                  <option value="EREBUS-CORE">EREBUS-CORE</option>
                  <option value="ORBITAL-01">ORBITAL-01</option>
                  <option value="LUNAR-01">LUNAR-01</option>
                </select>
              </div>
              <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>Create Bucket</button>
            </form>
          </div>
        </div>
      )}

      {/* ROCKET HEALTH & SSH CONNECT MODAL */}
      {connectModalMachine && (
        <div className="modal-overlay" onClick={() => setConnectModalMachine(null)}>
          <div className="ssh-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="brand-mark" style={{ width: 38, height: 38, borderRadius: 12 }}>
                  <Rocket style={{ width: 20 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{connectModalMachine.name}</h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    IP: {connectModalMachine.ip} | Region: {connectModalMachine.region}
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setConnectModalMachine(null)}>
                <X style={{ width: 14 }} />
              </button>
            </div>

            {/* ROCKET DATA HEALTH */}
            <h4 style={{ margin: '14px 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
              🚀 Rocket Data Health & Telemetry
            </h4>
            <div className="health-grid">
              <div className="health-card">
                <div className="health-card-label">HULL INTEGRITY</div>
                <div className="health-card-val" style={{ color: '#059669' }}>99.8%</div>
              </div>
              <div className="health-card">
                <div className="health-card-label">PROPELLANT</div>
                <div className="health-card-val" style={{ color: '#2563eb' }}>94.0%</div>
              </div>
              <div className="health-card">
                <div className="health-card-label">COMPUTER LATENCY</div>
                <div className="health-card-val" style={{ color: '#6366f1' }}>0.2 ms</div>
              </div>
              <div className="health-card">
                <div className="health-card-label">CORE TEMP</div>
                <div className="health-card-val" style={{ color: '#d97706' }}>{connectModalMachine.tempC || 32.1} °C</div>
              </div>
            </div>

            {/* INTERACTIVE LIVE SSH TERMINAL */}
            <h4 style={{ margin: '16px 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
              💻 Live SSH Console (Zero-Trust Laser Tunnel)
            </h4>
            <div className="terminal-card" style={{ padding: 18, borderRadius: 16 }}>
              <div className="terminal-header" style={{ marginBottom: 10, paddingBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  ssh operator@{connectModalMachine.name.toLowerCase().replace(/\s+/g, '')}.erebus.space -p 2201
                </span>
                <span className="table-status-pill status-success" style={{ fontSize: 10 }}>Connected</span>
              </div>

              <div className="terminal-logs" style={{ minHeight: 160, maxHeight: 220, fontSize: 12 }}>
                {sshLogs.map((log) => (
                  <div className={`log-entry ${log.type}`} key={log.id}>
                    {log.text}
                  </div>
                ))}
              </div>

              <form className="terminal-input-row" onSubmit={handleSshSubmit} style={{ marginTop: 10, paddingTop: 8 }}>
                <span className="terminal-prompt-symbol">root@{connectModalMachine.name.toLowerCase().replace(/\s+/g, '')}:~#</span>
                <input
                  type="text"
                  className="terminal-input"
                  placeholder="Type SSH command (e.g. 'health', 'status', 'top', 'reboot', 'clear')..."
                  value={sshInput}
                  onChange={(e) => setSshInput(e.target.value)}
                />
              </form>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                className="secondary-btn"
                onClick={() => alert(`SSH Command Copied: ssh operator@${connectModalMachine.ip} -p 2201`)}
              >
                Copy SSH Command
              </button>
              <button className="primary-btn" onClick={() => setConnectModalMachine(null)}>
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

