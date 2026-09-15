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

export default function AppShell({
  title = 'Overview',
  machinesCount = 0,
  activeSection,
  onSelectSection,
  children,
}: AppShellProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isAuth = localStorage.getItem('erebus_authenticated') === 'true'
    setLoggedIn(isAuth)
  }, [])

  const handleLogin = () => {
    localStorage.setItem('erebus_authenticated', 'true')
    setLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('erebus_authenticated')
    setLoggedIn(false)
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
        />
        <section className="content">
          <Header title={title} />
          <div className="page-wrap">{children}</div>
        </section>
      </div>
    </main>
  )
}
