import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Brand() {
  return (
    <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
      <div className="brand-mark">
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
    </Link>
  )
}
