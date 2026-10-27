/**
 * EREBUS Super Admin UI – Custom Server
 *
 * Boots the Next.js standalone server and proxies /api/* requests to the
 * backend API at runtime so that API_ORIGIN can be set via an environment
 * variable without needing to rebuild the image.
 */
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import NextServer from './.next/standalone/node_modules/next/dist/server/next-server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiOrigin = (process.env.API_ORIGIN || process.env.API_INTERNAL_URL || 'http://localhost:1000').replace(/\/$/, '')
const port = Number(process.env.PORT || 3001)
const hostname = process.env.HOSTNAME || '0.0.0.0'

// ---------------------------------------------------------------------------
// API Proxy – forwards /api/* to the backend, forwarding cookies both ways
// ---------------------------------------------------------------------------
async function proxyApi(req, res) {
  const targetUrl = `${apiOrigin}${req.url}`
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
        ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] } : {}),
        ...(req.headers['authorization'] ? { authorization: req.headers['authorization'] } : {}),
      },
      ...(body.length && !['GET', 'HEAD'].includes(req.method) ? { body } : {}),
    })

    res.statusCode = upstream.status
    const contentType = upstream.headers.get('content-type')
    const setCookies = upstream.headers.getSetCookie?.() || []
    if (contentType) res.setHeader('content-type', contentType)
    if (setCookies.length) res.setHeader('set-cookie', setCookies)
    res.end(Buffer.from(await upstream.arrayBuffer()))
  } catch (error) {
    console.error(`[Proxy] Failed to reach ${targetUrl}:`, error.message)
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'The API service is temporarily unavailable. Please retry.' }))
  }
}

// ---------------------------------------------------------------------------
// Next.js Standalone Server
// ---------------------------------------------------------------------------
const app = new NextServer.default({
  dir: path.join(__dirname, '.next/standalone'),
  dev: false,
  hostname,
  port,
})

const handle = app.getRequestHandler()

await app.prepare()

const server = createServer(async (req, res) => {
  // Proxy all /api/* requests to the backend at runtime
  if (req.url?.startsWith('/api/')) {
    return proxyApi(req, res)
  }
  // All other requests handled by Next.js
  await handle(req, res)
})

server.listen(port, hostname, () => {
  console.log(`[Super Admin UI] Listening on http://${hostname}:${port}`)
  console.log(`[Super Admin UI] API proxying to: ${apiOrigin}`)
})

process.on('SIGTERM', () => { server.close(); process.exit(0) })
process.on('SIGINT', () => { server.close(); process.exit(0) })
