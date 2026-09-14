import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vm = db.getMachine(id)

  if (!vm) {
    return NextResponse.json({ success: false, error: 'Machine not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: vm })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    const updated = db.updateMachineStatus(id, status)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Machine not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const success = db.deleteMachine(id)

  if (!success) {
    return NextResponse.json({ success: false, error: 'Machine not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: `Machine ${id} terminated` })
}
