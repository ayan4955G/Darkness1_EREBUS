import { NextResponse } from 'next/server'

export async function GET() {
  const email = (process.env.DEFAULT_ACCOUNT_EMAIL || 'ayanshaikhdev@gmail.com').trim().toLowerCase()
  const name = (process.env.DEFAULT_ACCOUNT_NAME || 'EREBUS Administrator').trim()

  return NextResponse.json({
    success: true,
    email,
    name,
  })
}
