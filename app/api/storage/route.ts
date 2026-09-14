import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const buckets = db.getBuckets()
  return NextResponse.json({
    success: true,
    count: buckets.length,
    data: buckets,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, region, tier } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Bucket name is required' }, { status: 400 })
    }

    const bucket = db.addBucket({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      region: region || 'EREBUS-CORE',
      tier: tier || 'Zero-G Cold',
      redundancy: '3x Orbital Mirroring',
    })

    return NextResponse.json({ success: true, data: bucket }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
