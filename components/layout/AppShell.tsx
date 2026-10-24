'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/navigation/Sidebar'
import Header from '@/components/navigation/Header'
import LoginView from '@/components/auth/LoginView'

interface AppShellProps {
  title?: string
  machinesCount?: number
  activeSection?: string
  onSelectSection?: (section: string) => void
  children: React.ReactNode
}

type SessionUser = { fullName: string; email: string; role: string }
let cachedUser: SessionUser | null = null
let authChecked = false

export default function AppShell({
  title = 'Overview',
  machinesCount = 0,
  activeSection,
  onSelectSection,
  children,
}: AppShellProps) {
  const [loggedIn, setLoggedIn] = useState(Boolean(cachedUser))
  const [mounted, setMounted] = useState(authChecked)
  const [user, setUser] = useState<SessionUser | null>(cachedUser)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          cachedUser = null
          setUser(null)
          setLoggedIn(false)
          return
        }
        const result = await response.json()
        cachedUser = result.user
        setUser(result.user)
        setLoggedIn(true)
      })
      .catch(() => {
        if (!cachedUser) setLoggedIn(false)
      })
      .finally(() => {
        authChecked = true
        setMounted(true)
      })
  }, [])

  const handleLogin = async () => {
    const response = await fetch('/api/auth/me', { credentials: 'include' })
    if (!response.ok) return
    const result = await response.json()
    cachedUser = result.user
    authChecked = true
    setUser(result.user)
    setMounted(true)
    setLoggedIn(true)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    cachedUser = null
    authChecked = true
    setLoggedIn(false)
    setUser(null)
  }

  // Before client hydration or if not logged in, render the login page
  if (!mounted || !loggedIn) {
    return <LoginView onLoginSuccess={handleLogin} />
  }

  return (
    <main className="erebus-app">
      <div className="zentra-shell">
        <Sidebar
          machinesCount={machinesCount}
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          onLogout={handleLogout}
          userRole={user?.role}
          userName={user?.fullName}
          userEmail={user?.email}
        />
        <section className="content">
          <Header title={title} />
          <div className="page-wrap">{children}</div>
        </section>
      </div>
    </main>
  )
}
