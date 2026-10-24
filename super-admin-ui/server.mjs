import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')
const apiOrigin = process.env.API_ORIGIN || 'http://localhost:1000'
const port = Number(process.env.PORT || 3001)
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
}

async function proxyApi(req, res) {
  const requestUrl = new URL(req.url, apiOrigin)
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)
  try {
    const upstream = await fetch(requestUrl, {
      method: req.method,
      headers: {
        ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
        ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] } : {}),
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
    console.error('API proxy failed:', error.message)
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'The API service is unavailable' }))
  }
}

createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) return proxyApi(req, res)
  const asset = assets[new URL(req.url, 'http://localhost').pathname]
  if (!asset) { res.writeHead(404); return res.end('Not found') }
  try {
    const content = await readFile(path.join(publicDir, asset[0]))
    res.writeHead(200, { 'content-type': asset[1], 'cache-control': 'no-store' })
    res.end(content)
  } catch {
    res.writeHead(500)
    res.end('Unable to load admin console')
  }
}).listen(port, '0.0.0.0', () => console.log(`EREBUS Super Admin UI listening on ${port}`))
