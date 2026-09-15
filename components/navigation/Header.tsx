'use client'

import React from 'react'
import { Search, Bell } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export default function Header({ title = 'Overview' }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="greeting-text">{title}</div>

      <div className="top-actions">
        <div className="top-search-pill">
          <Search style={{ width: 15, height: 15 }} />
          <input placeholder="Search ⌘K..." aria-label="Search across space cloud" />
        </div>
        <button className="dots-btn" title="Notifications" type="button">
          <Bell style={{ width: 15, height: 15 }} />
        </button>
        <div className="avatar" style={{ width: 34, height: 34 }}>
          AD
        </div>
      </div>
    </header>
  )
}
