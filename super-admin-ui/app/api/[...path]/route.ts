import { NextRequest, NextResponse } from 'next/server'

const API_ORIGIN = (process.env.API_ORIGIN || process.env.API_INTERNAL_URL || 'http://localhost:1000').replace(/\/$/, '')

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

async function proxyRequest(request: NextRequest, { path }: { path: string[] }) {
  const pathname = `/api/${path.join('/')}`
  const search = request.nextUrl.search || ''
  const targetUrl = `${API_ORIGIN}${pathname}${search}`

  // Forward body for mutating methods
  let body: BodyInit | undefined
  const method = request.method
  if (!['GET', 'HEAD'].includes(method)) {
    body = await request.arrayBuffer().then(b => b.byteLength > 0 ? b : undefined)
  }

  // Forward relevant headers
  const headers: Record<string, string> = {}
  const cookie = request.headers.get('cookie')
  const contentType = request.headers.get('content-type')
  const authorization = request.headers.get('authorization')
  if (cookie) headers['cookie'] = cookie
  if (contentType) headers['content-type'] = contentType
  if (authorization) headers['authorization'] = authorization

  try {
    const upstream = await fetch(targetUrl, { method, headers, body })

    // Build response headers – forward set-cookie
    const responseHeaders = new Headers()
    const upstreamContentType = upstream.headers.get('content-type')
    if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType)

    // Forward all set-cookie headers
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        responseHeaders.append('set-cookie', value)
      }
    })

    const responseBody = await upstream.arrayBuffer()
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API Proxy] Failed to reach ${targetUrl}:`, message)
    return NextResponse.json(
      { success: false, error: 'The API service is temporarily unavailable. Please retry.' },
      { status: 502 }
    )
  }
}
