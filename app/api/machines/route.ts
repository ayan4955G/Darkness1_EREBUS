import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const region = searchParams.get('region')
  const search = searchParams.get('q')

  let vms = db.getMachines()

  if (region) {
    vms = vms.filter((v) => v.region.toLowerCase() === region.toLowerCase())
  }

  if (search) {
    const q = search.toLowerCase()
    vms = vms.filter((v) => v.name.toLowerCase().includes(q) || v.mission.toLowerCase().includes(q) || v.ip.includes(q))
  }

  return NextResponse.json({
    success: true,
    count: vms.length,
    data: vms,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, region, cpu, memory, image, mission } = body

    if (!name || !region) {
      return NextResponse.json({ success: false, error: 'Name and Region are required' }, { status: 400 })
    }

    const randomIpPart = Math.floor(Math.random() * 200 + 10)
    const randomHost = Math.floor(Math.random() * 200 + 10)

    const newMachine = db.addMachine({
      name: name.toUpperCase().replace(/\s+/g, '-'),
      region: region || 'EREBUS-CORE',
      status: 'Running',
      cpu: cpu || '32 vCPU',
      memory: memory || '256 GB',
      image: image || 'Orbital OS 24.04',
      ip: `10.${randomIpPart}.4.${randomHost}`,
      mission: mission || 'General purpose orbital compute workloads',
    })

    return NextResponse.json({ success: true, data: newMachine }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
