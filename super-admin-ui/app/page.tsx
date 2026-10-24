'use client'

import React, { useState, useEffect, useMemo, FormEvent } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  KeyRound,
  Lock,
  Mail,
  UserCheck,
} from 'lucide-react'

interface UserAccount {
  id: string
  email: string
  fullName: string
  role: 'super_admin' | 'mission_operations' | 'infrastructure_admin' | 'user'
  createdAt: string
  isDefault?: boolean
}

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
}

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  super_admin: {
    label: 'Super Admin',
    badgeClass: 'badge-super_admin',
    desc: 'Full administrative access across all clusters & operators',
  },
  mission_operations: {
    label: 'Mission Operations',
    badgeClass: 'badge-mission_operations',
    desc: 'Access to spacecraft missions, telemetry & payloads',
  },
  infrastructure_admin: {
    label: 'Infrastructure Admin',
    badgeClass: 'badge-infrastructure_admin',
    desc: 'Access to orbital compute nodes, clusters & machines',
  },
  user: {
    label: 'Standard Operator',
    badgeClass: 'badge-user',
    desc: 'Standard workspace access with monitored privileges',
  },
}

export default function SuperAdminPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Default superadmin credentials state (fetched from backend or fallback)
  const [defaultSuperAdminEmail, setDefaultSuperAdminEmail] = useState('ayanshaikhdev@gmail.com')
  const [defaultSuperAdminPassword] = useState('ayanshaikh@970219')

  // Dashboard data state
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')

  // Create operator state
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<'mission_operations' | 'infrastructure_admin' | 'user' | 'super_admin'>('mission_operations')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createMessage, setCreateMessage] = useState<{ text: string; isError?: boolean } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  // Fetch current session and superadmin info
  useEffect(() => {
    checkSession()
    fetchSuperAdminInfo()
  }, [])

  async function fetchSuperAdminInfo() {
    try {
      const res = await fetch('/api/auth/superadmin-info')
      if (res.ok) {
        const data = await res.json()
        if (data.email) setDefaultSuperAdminEmail(data.email)
      }
    } catch {
      // ignore
    }
  }

  async function checkSession() {
    setAuthLoading(true)
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.user && data.user.role === 'super_admin') {
          setCurrentUser(data.user)
          loadAccounts()
        } else {
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
    } catch {
      setCurrentUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginSubmitting(true)
    setLoginError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to authenticate')

      if (result.user.role !== 'super_admin') {
        // Sign them out immediately if they are not super admin
        await fetch('/api/auth/logout', { method: 'POST' })
        throw new Error('Access denied: This console requires the Super Administrator role.')
      }

      setCurrentUser(result.user)
      loadAccounts()
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoginSubmitting(false)
    }
  }

  function fillDefaultCredentials() {
    setLoginEmail(defaultSuperAdminEmail)
    setLoginPassword(defaultSuperAdminPassword)
    setLoginError('')
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // Ignore
    }
    setCurrentUser(null)
    setAccounts([])
    setLoginEmail('')
    setLoginPassword('')
  }

  async function loadAccounts() {
    setLoadingAccounts(true)
    try {
      const res = await fetch('/api/admin/accounts', { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setCurrentUser(null)
        }
        return
      }
      const data = await res.json()
      if (data.data) {
        setAccounts(data.data)
      }
    } catch {
      // Error loading accounts
    } finally {
      setLoadingAccounts(false)
    }
  }

  async function handleCreateOperator(e: FormEvent) {
    e.preventDefault()
    setCreateSubmitting(true)
    setCreateMessage(null)

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create operator account')

      setCreateMessage({
        text: `Operator account successfully created for ${data.data.email}`,
        isError: false,
      })
      setCreateName('')
      setCreateEmail('')
      setCreatePassword('')
      setCreateRole('mission_operations')
      loadAccounts()
    } catch (err: unknown) {
      setCreateMessage({
        text: err instanceof Error ? err.message : 'Creation failed',
        isError: true,
      })
    } finally {
      setCreateSubmitting(false)
    }
  }

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || '')
      .join('') || 'OP'
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedEmail(text)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  // Filtered accounts list
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = selectedRoleFilter === 'all' || acc.role === selectedRoleFilter
      return matchesSearch && matchesRole
    })
  }, [accounts, searchQuery, selectedRoleFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    return {
      total: accounts.length,
      superAdmin: accounts.filter((a) => a.role === 'super_admin').length,
      missionOps: accounts.filter((a) => a.role === 'mission_operations').length,
      infraAdmin: accounts.filter((a) => a.role === 'infrastructure_admin').length,
      users: accounts.filter((a) => a.role === 'user').length,
    }
  }, [accounts])

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="live-dot" style={{ width: 14, height: 14, marginBottom: 16 }} />
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            INITIALIZING SECURE EREBUS CONTROL PLANE...
          </p>
        </div>
      </div>
    )
  }

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          position: 'relative',
        }}
      >
        {/* Futuristic Card */}
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '36px 32px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Brand Mark */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--cyan) 0%, #2f7375 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 0 20px rgba(86, 224, 194, 0.4)',
                }}
              >
                <Shield className="w-6 h-6 text-slate-900" style={{ color: '#09151e' }} />
              </div>
              <div>
                <h1 className="font-heading" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  EREBUS
                </h1>
                <p className="font-mono" style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.12em' }}>
                  SUPER ADMIN CONSOLE
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(86, 224, 194, 0.08)',
                border: '1px solid rgba(86, 224, 194, 0.25)',
                fontSize: 10,
                fontFamily: 'DM Mono',
                color: 'var(--cyan)',
              }}
            >
              <span className="live-dot" /> PORT 3001
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h2 className="font-heading" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Root Clearance Sign In
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Authenticate with your Super Administrator credentials to manage orbital clusters and operator permissions.
            </p>
          </div>

          {/* Quick-Fill Default Account Banner */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(86, 224, 194, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%)',
              border: '1px solid rgba(86, 224, 194, 0.25)',
              marginBottom: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound className="w-3.5 h-3.5" /> DEFAULT SUPERADMIN ACCOUNT
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'DM Mono',
                  background: 'rgba(86, 224, 194, 0.2)',
                  color: 'var(--cyan)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                READY
              </span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-main)', marginBottom: 10 }}>
              Email: <strong className="font-mono" style={{ color: '#fff' }}>{defaultSuperAdminEmail}</strong>
            </p>

            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="btn-secondary"
              style={{
                width: '100%',
                fontSize: 12,
                padding: '7px 12px',
                borderColor: 'rgba(86, 224, 194, 0.3)',
                color: 'var(--cyan)',
                background: 'rgba(86, 224, 194, 0.06)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Quick Fill Default Credentials
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label
                htmlFor="login-email"
                style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}
              >
                ADMIN WORK EMAIL
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="admin@erebus.space"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="username"
                  style={{ paddingLeft: 38 }}
                />
                <Mail
                  className="w-4 h-4"
                  style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-faint)' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}
              >
                ENCRYPTED PASSPHRASE
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                />
                <Lock
                  className="w-4 h-4"
                  style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-faint)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-faint)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--rose-bg)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fecdd3',
                  fontSize: 12,
                }}
              >
                <AlertCircle className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1, color: '#f43f5e' }} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginSubmitting}
              className="btn-primary"
              style={{ width: '100%', height: 44, marginTop: 6 }}
            >
              {loginSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Clearance...
                </>
              ) : (
                <>
                  Authenticate Clearance <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Jump Link */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-faint)',
            }}
          >
            <span>EREBUS CONTROL PLANE</span>
            <a
              href="http://localhost:3000"
              style={{ color: 'var(--cyan)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Mission Cloud <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // LOGGED-IN SUPER ADMIN WORKSPACE
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 260,
          background: 'var(--bg-base)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '24px 18px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--cyan) 0%, #2f7375 100%)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 16px rgba(86, 224, 194, 0.3)',
            }}
          >
            <Shield className="w-5 h-5 text-slate-900" style={{ color: '#09151e' }} />
          </div>
          <div>
            <span className="font-heading" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
              erebus
            </span>
            <span className="font-mono" style={{ display: 'block', fontSize: 9, color: 'var(--cyan)' }}>
              SUPER ADMIN CORE
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 12, paddingLeft: 8 }}>
          NAVIGATION
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              justifyContent: 'flex-start',
              background: 'rgba(86, 224, 194, 0.1)',
              borderColor: 'rgba(86, 224, 194, 0.3)',
              color: 'var(--cyan)',
            }}
          >
            <Users className="w-4 h-4" /> Team Operators
          </button>

          <a
            href="http://localhost:3000"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', color: 'var(--text-muted)' }}
          >
            <Server className="w-4 h-4" /> Space Cloud (3000)
            <ExternalLink className="w-3 h-3" style={{ marginLeft: 'auto' }} />
          </a>

          <a
            href="http://localhost:3000/operations"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', color: 'var(--text-muted)' }}
          >
            <Terminal className="w-4 h-4" /> Mission Operations
          </a>
        </div>

        {/* System Pulse Card */}
        <div
          style={{
            marginTop: 'auto',
            marginBottom: 20,
            padding: '14px',
            borderRadius: 12,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="live-dot" />
            <strong style={{ fontSize: 12, fontWeight: 700 }}>Control Plane Active</strong>
          </div>
          <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            LEO Relay: Optical 18.6 Gbps
          </p>
          <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
            Encrypted scrypt-64 Auth
          </p>
        </div>

        {/* Profile Card */}
        <div
          style={{
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(86, 224, 194, 0.15)',
              color: 'var(--cyan)',
              border: '1px solid rgba(86, 224, 194, 0.3)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {getInitials(currentUser.fullName)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong
              style={{
                display: 'block',
                fontSize: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.fullName}
            </strong>
            <small
              style={{
                display: 'block',
                fontSize: 10,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.email}
            </small>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header
          style={{
            height: 64,
            background: 'var(--bg-base)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span className="font-mono" style={{ color: 'var(--text-faint)' }}>
              EREBUS CONTROL PLANE
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>/</span>
            <strong className="font-heading" style={{ fontSize: 13, color: 'var(--text-main)' }}>
              Operator Access Management
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(86, 224, 194, 0.08)',
                border: '1px solid rgba(86, 224, 194, 0.25)',
                fontSize: 11,
                fontFamily: 'DM Mono',
                color: 'var(--cyan)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> ROOT PRIVILEGES ACTIVE
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ padding: '32px 36px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {/* Page Title & Mark */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <p className="font-mono" style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 6 }}>
                ADMINISTRATION // CLUSTER ACCESS
              </p>
              <h1 className="font-heading" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Platform Operators Directory
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Provision mission accounts, assign granular role clearance, and supervise active operators.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAccounts}
              disabled={loadingAccounts}
              className="btn-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} /> Refresh Directory
            </button>
          </div>

          {/* Metric Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  TOTAL OPERATORS
                </span>
                <Users className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
              </div>
              <strong className="font-heading" style={{ fontSize: 32, fontWeight: 800 }}>
                {stats.total}
              </strong>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Registered accounts in cluster
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  SUPER ADMINS
                </span>
                <Shield className="w-4 h-4" style={{ color: '#56e0c2' }} />
              </div>
              <strong className="font-heading" style={{ fontSize: 32, fontWeight: 800, color: 'var(--cyan)' }}>
                {stats.superAdmin}
              </strong>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Root clearance accounts
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  MISSION OPS
                </span>
                <Terminal className="w-4 h-4" style={{ color: '#b598e2' }} />
              </div>
              <strong className="font-heading" style={{ fontSize: 32, fontWeight: 800, color: '#d8b4fe' }}>
                {stats.missionOps}
              </strong>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Flight &amp; orbital control access
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  INFRASTRUCTURE
                </span>
                <Server className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
              <strong className="font-heading" style={{ fontSize: 32, fontWeight: 800, color: '#fbbf24' }}>
                {stats.infraAdmin}
              </strong>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Orbital machines &amp; nodes
              </span>
            </div>
          </div>

          {/* TWO COLUMN GRID: CREATION PANEL & DIRECTORY PANEL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 24, alignItems: 'start' }}>
            {/* LEFT: PROVISION OPERATOR FORM */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--cyan)' }}>
                    NEW OPERATOR
                  </span>
                  <h2 className="font-heading" style={{ fontSize: 18, fontWeight: 800 }}>
                    Provision Account
                  </h2>
                </div>
                <UserPlus className="w-5 h-5 text-cyan-400" style={{ color: 'var(--cyan)' }} />
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                Create a new operator identity and grant immediate clearance to designated workspaces.
              </p>

              <form onSubmit={handleCreateOperator} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    OPERATOR FULL NAME
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Elena Rostova"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    WORK EMAIL
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="elena@erebus.space"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    TEMPORARY PASSPHRASE
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="At least 10 characters"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    minLength={10}
                    required
                  />
                  <small style={{ display: 'block', fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>
                    Must be at least 10 characters long
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    WORKSPACE ACCESS ROLE
                  </label>
                  <select
                    className="input-field"
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as any)}
                    required
                    style={{ background: 'var(--bg-base)' }}
                  >
                    <option value="mission_operations">Mission Operations (Flight &amp; Telemetry)</option>
                    <option value="infrastructure_admin">Infrastructure &amp; Orbital Machines</option>
                    <option value="user">Standard User / Monitored Access</option>
                    <option value="super_admin">Super Admin (Unrestricted Root Access)</option>
                  </select>
                  <small style={{ display: 'block', fontSize: 10, color: 'var(--cyan)', marginTop: 4 }}>
                    {ROLE_CONFIG[createRole]?.desc}
                  </small>
                </div>

                {createMessage && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: createMessage.isError ? 'var(--rose-bg)' : 'rgba(16, 185, 129, 0.12)',
                      border: `1px solid ${createMessage.isError ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      color: createMessage.isError ? '#fecdd3' : '#a7f3d0',
                      fontSize: 12,
                    }}
                  >
                    {createMessage.isError ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f43f5e', marginTop: 1 }} />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981', marginTop: 1 }} />
                    )}
                    <span>{createMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', height: 42, marginTop: 4 }}
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Provision Operator
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* RIGHT: PLATFORM ACCOUNTS DIRECTORY TABLE */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Directory Header & Filters */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                      CLUSTER REGISTRY
                    </span>
                    <h2 className="font-heading" style={{ fontSize: 18, fontWeight: 800 }}>
                      Active Operators ({filteredAccounts.length})
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="live-dot" />
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--cyan)' }}>
                      LIVE DIRECTORY
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Search operator name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, height: 38, fontSize: 12 }}
                    />
                    <Search
                      className="w-4 h-4"
                      style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-faint)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'super_admin', label: 'Super Admin' },
                      { key: 'mission_operations', label: 'Mission Ops' },
                      { key: 'infrastructure_admin', label: 'Infra' },
                      { key: 'user', label: 'Standard' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSelectedRoleFilter(tab.key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          background: selectedRoleFilter === tab.key ? 'var(--cyan)' : 'var(--bg-surface-elevated)',
                          color: selectedRoleFilter === tab.key ? '#07151a' : 'var(--text-muted)',
                          border: `1px solid ${selectedRoleFilter === tab.key ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Wrapper */}
              <div style={{ overflowX: 'auto', maxHeight: 520 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(11, 18, 30, 0.8)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="font-mono" style={{ padding: '12px 20px', fontSize: 10, color: 'var(--text-faint)' }}>
                        OPERATOR
                      </th>
                      <th className="font-mono" style={{ padding: '12px 20px', fontSize: 10, color: 'var(--text-faint)' }}>
                        WORKSPACE ACCESS
                      </th>
                      <th className="font-mono" style={{ padding: '12px 20px', fontSize: 10, color: 'var(--text-faint)' }}>
                        REGISTERED
                      </th>
                      <th className="font-mono" style={{ padding: '12px 20px', fontSize: 10, color: 'var(--text-faint)', textAlign: 'right' }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No operators match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => {
                        const roleMeta = ROLE_CONFIG[account.role] || {
                          label: account.role,
                          badgeClass: 'badge-user',
                        }
                        return (
                          <tr
                            key={account.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(21, 33, 50, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            {/* Operator Cell */}
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 9,
                                    background:
                                      account.role === 'super_admin'
                                        ? 'rgba(86, 224, 194, 0.15)'
                                        : 'var(--bg-surface-elevated)',
                                    color: account.role === 'super_admin' ? 'var(--cyan)' : 'var(--text-muted)',
                                    border: `1px solid ${
                                      account.role === 'super_admin'
                                        ? 'rgba(86, 224, 194, 0.3)'
                                        : 'var(--border-subtle)'
                                    }`,
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: 700,
                                    fontSize: 11,
                                    flexShrink: 0,
                                  }}
                                >
                                  {getInitials(account.fullName)}
                                </div>
                                <div>
                                  <strong style={{ display: 'block', fontSize: 13, color: '#fff' }}>
                                    {account.fullName}
                                  </strong>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {account.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Workspace Role Cell */}
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                                <span className={`badge ${roleMeta.badgeClass}`}>
                                  {roleMeta.label}
                                </span>
                                {account.isDefault && (
                                  <span
                                    className="font-mono"
                                    style={{
                                      fontSize: 9,
                                      color: 'var(--cyan)',
                                      letterSpacing: '0.05em',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Sparkles className="w-2.5 h-2.5" /> ENV DEFAULT ACCOUNT
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Registered Date */}
                            <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
                              {account.createdAt
                                ? new Date(account.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(account.email)}
                                title="Copy operator email"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  color: copiedEmail === account.email ? 'var(--cyan)' : 'var(--text-muted)',
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-subtle)',
                                  background: 'var(--bg-base)',
                                }}
                              >
                                {copiedEmail === account.email ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Privacy & Security Note */}
              <div
                style={{
                  padding: '14px 24px',
                  background: 'rgba(11, 18, 30, 0.6)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'var(--text-faint)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" style={{ color: 'var(--cyan)' }} /> Passwords are cryptographically salted scrypt-64 hashes.
                </span>
                <span className="font-mono">EREBUS SECURE ADMIN</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
