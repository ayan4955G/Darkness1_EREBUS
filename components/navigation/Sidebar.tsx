'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Server,
  Activity,
  HardDrive,
  Cloud,
  SlidersHorizontal,
  Terminal,
  LogOut,
} from 'lucide-react'
import Brand from './Brand'

interface SidebarProps {
  machinesCount?: number
  activeSection?: string
  onSelectSection?: (section: string) => void
  onLogout?: () => void
}

export default function Sidebar({
  machinesCount = 0,
  activeSection,
  onSelectSection,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', path: '/', section: 'Home', icon: LayoutDashboard },
    {
      label: 'Infrastructure',
      path: '/infrastructure',
      section: 'Infrastructure',
      icon: Server,
      badge: machinesCount,
    },
    {
      label: 'Telemetry & Analytics',
      path: '/telemetry',
      section: 'Telemetry',
      icon: Activity,
    },
    {
      label: 'Mission Operations',
      path: '/operations',
      section: 'Operations',
      icon: Terminal,
    },
    {
      label: 'Cloud Storage',
      path: '/storage',
      section: 'Cloud Storage',
      icon: HardDrive,
    },
  ]

  const otherItems = [
    {
      label: 'Cloud Regions',
      path: '/regions',
      section: 'Cloud regions',
      icon: Cloud,
    },
    {
      label: 'Settings',
      path: '/settings',
      section: 'Settings',
      icon: SlidersHorizontal,
    },
  ]

  const isItemActive = (itemPath: string, itemSection: string) => {
    if (activeSection) return activeSection === itemSection
    if (itemPath === '/') return pathname === '/'
    return pathname.startsWith(itemPath)
  }

  const renderNavButton = (item: (typeof navItems)[0]) => {
    const active = isItemActive(item.path, item.section)
    const Icon = item.icon

    if (onSelectSection) {
      return (
        <button
          key={item.section}
          className={`nav-item ${active ? 'active' : ''}`}
          onClick={() => onSelectSection(item.section)}
          type="button"
        >
          <Icon /> <span>{item.label}</span>
          {typeof item.badge === 'number' && item.badge > 0 && (
            <span className="nav-count">{item.badge}</span>
          )}
        </button>
      )
    }

    return (
      <Link
        key={item.path}
        href={item.path}
        className={`nav-item ${active ? 'active' : ''}`}
        style={{ textDecoration: 'none' }}
      >
        <Icon /> <span>{item.label}</span>
        {typeof item.badge === 'number' && item.badge > 0 && (
          <span className="nav-count">{item.badge}</span>
        )}
      </Link>
    )
  }

  return (
    <aside className="sidebar">
      <Brand />

      <nav aria-label="Main Navigation" style={{ marginTop: '2rem' }}>
        <span className="nav-label">MAIN MENU</span>
        {navItems.map(renderNavButton)}

        <span className="nav-label second">OTHER</span>
        {otherItems.map(renderNavButton)}
      </nav>

      <div className="sidebar-bottom">
        <div
          className="profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar">OP</div>
            <div>
              <strong>Alex Drake</strong>
              <span>operator@erebus.space</span>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              title="Log out of Space Control Plane"
              onClick={onLogout}
              className="dots-btn"
              style={{ color: '#ef4444', marginLeft: 4 }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
