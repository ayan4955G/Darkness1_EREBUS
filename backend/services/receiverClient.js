import WebSocket from 'ws'
import { EventEmitter } from 'node:events'
import { validateEnvelope, normalizeTelemetry } from './telemetryParser.js'

/**
 * ReceiverClient manages a resilient, persistent WebSocket connection
 * to the DARKNESS-1 ESP32 LoRa receiver.
 */
export class ReceiverClient extends EventEmitter {
  constructor(options = {}) {
    super()
    this.wsUrl = options.wsUrl || process.env.RECEIVER_WS_URL || 'ws://192.168.1.100/ws'
    this.httpUrl = options.httpUrl || process.env.RECEIVER_HTTP_URL || 'http://192.168.1.100'
    this.apiKey = options.apiKey || process.env.RECEIVER_API_KEY || ''
    this.staleAfterMs = Number(options.staleAfterMs || process.env.RECEIVER_STALE_AFTER_MS || 15000)
    this.maxReconnectDelayMs = Number(options.maxReconnectDelayMs || process.env.RECEIVER_RECONNECT_MAX_MS || 30000)
    this.pool = options.pool || null // PostgreSQL pool for history persistence

    // Connection state
    this.ws = null
    this.isConnected = false
    this.isConnecting = false
    this.isShuttingDown = false
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.pingTimer = null
    this.connectionState = 'disconnected' // 'disconnected' | 'connecting' | 'connected'

    // Telemetry state
    this.lastPacketTime = null
    this.lastPacketId = null
    this.packetCount = 0
    this.latestRssi = null
    this.latestSnr = null
    this.latestEnvelope = null
    this.latestNormalized = null
    this.recentReadingsBuffer = [] // In-memory ring buffer of recent readings (up to 100)
    this.maxBufferSize = 100

    // Deduplication
    this.lastProcessedPacketId = null
  }

  start() {
    if (this.isShuttingDown) return
    this.connect()
  }

  connect() {
    if (this.isShuttingDown || this.isConnected || this.isConnecting) return

    this.clearReconnectTimer()
    this.isConnecting = true
    this.connectionState = 'connecting'

    const sanitizedUrl = this.sanitizeUrl(this.wsUrl)
    console.log(`[RECEIVER] Initiating connection to ${sanitizedUrl} (Attempt ${this.reconnectAttempts + 1})...`)

    const headers = {}
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    try {
      this.ws = new WebSocket(this.wsUrl, {
        headers,
        handshakeTimeout: 7000,
        maxPayload: 1024 * 64, // 64 KB safety limit
      })

      this.ws.on('open', () => this.handleOpen())
      this.ws.on('message', (data) => this.handleMessage(data))
      this.ws.on('error', (err) => this.handleError(err))
      this.ws.on('close', (code, reason) => this.handleClose(code, reason))
      this.ws.on('pong', () => {
        // Heartbeat confirmed
      })
    } catch (err) {
      this.handleError(err)
    }
  }

  handleOpen() {
    this.isConnecting = false
    this.isConnected = true
    this.connectionState = 'connected'
    this.reconnectAttempts = 0
    this.clearReconnectTimer()

    console.log(`[RECEIVER] Successfully connected to ${this.sanitizeUrl(this.wsUrl)}`)

    // Start heartbeat ping
    this.startHeartbeat()
  }

  handleMessage(raw) {
    if (this.isShuttingDown) return

    try {
      const text = typeof raw === 'string' ? raw : raw.toString('utf8')
      const validation = validateEnvelope(text)

      if (!validation.valid) {
        console.warn(`[RECEIVER] Rejected malformed frame: ${validation.error}`)
        return
      }

      const envelope = validation.envelope
      const now = new Date().toISOString()
      const normalized = normalizeTelemetry(envelope, now)

      this.lastPacketTime = Date.now()
      this.lastPacketId = envelope.packet_id
      this.packetCount++
      this.latestRssi = envelope.rssi
      this.latestSnr = envelope.snr
      this.latestEnvelope = envelope
      this.latestNormalized = normalized

      console.log(`[RECEIVER] Ingested packet #${envelope.packet_id} (RSSI: ${envelope.rssi} dBm, SNR: ${envelope.snr} dB)`)

      this.emit('packet', {
        envelope,
        normalized,
        now,
      })

      // Store in memory ring buffer
      this.recentReadingsBuffer.push({
        id: this.packetCount,
        packetId: envelope.packet_id,
        timestamp: now,
        rssi: envelope.rssi,
        snr: envelope.snr,
        normalized: normalized.sensorReadings,
      })
      if (this.recentReadingsBuffer.length > this.maxBufferSize) {
        this.recentReadingsBuffer.shift()
      }

      // Persist to PostgreSQL if pool is available
      if (this.pool) {
        this.persistTelemetry(envelope, normalized, now).catch((err) => {
          console.error(`[RECEIVER] Failed to persist telemetry to DB: ${err.message}`)
        })
      }
    } catch (err) {
      console.error(`[RECEIVER] Unexpected error processing message: ${err.message}`)
    }
  }

  async persistTelemetry(envelope, normalized, timestamp) {
    try {
      await this.pool.query(
        'INSERT INTO telemetry_history(packet_id, rssi, snr, payload, source, created_at) VALUES($1, $2, $3, $4, $5, $6)',
        [
          envelope.packet_id,
          envelope.rssi,
          envelope.snr,
          JSON.stringify(normalized),
          'receiver',
          timestamp,
        ]
      )
    } catch (err) {
      // Don't crash on DB insertion issues
      console.warn(`[RECEIVER] Database persist error: ${err.message}`)
    }
  }

  handleError(err) {
    if (this.isShuttingDown) return
    console.warn(`[RECEIVER] WebSocket error on ${this.sanitizeUrl(this.wsUrl)}: ${err.message}`)
  }

  handleClose(code, reason) {
    this.isConnected = false
    this.isConnecting = false
    this.connectionState = 'disconnected'
    this.stopHeartbeat()

    if (this.isShuttingDown) return

    const reasonText = reason ? reason.toString('utf8') : 'connection lost'
    console.log(`[RECEIVER] Connection closed (${code}: ${reasonText}). Scheduling reconnect...`)

    this.scheduleReconnect()
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.isShuttingDown) return

    this.reconnectAttempts++
    // Exponential backoff: min 1000ms, max maxReconnectDelayMs
    const delay = Math.min(
      Math.floor(1000 * Math.pow(1.5, Math.min(this.reconnectAttempts - 1, 10))),
      this.maxReconnectDelayMs
    )

    console.log(`[RECEIVER] Reconnecting in ${(delay / 1000).toFixed(1)}s (Attempt #${this.reconnectAttempts})...`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.pingTimer = setInterval(() => {
      if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.ping()
        } catch {
          // Ignore ping errors
        }
      }
    }, 15000)
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  getStatus() {
    const now = Date.now()
    const lastPacketAgeMs = this.lastPacketTime ? now - this.lastPacketTime : null
    const hasPackets = this.packetCount > 0 && this.lastPacketTime !== null
    const isStale = hasPackets && lastPacketAgeMs > this.staleAfterMs
    const isReceiving = hasPackets && !isStale && this.isConnected
    const isOffline = !this.isConnected || !hasPackets || (lastPacketAgeMs !== null && lastPacketAgeMs > this.staleAfterMs * 4)

    return {
      connected: this.isConnected,
      connectionState: this.connectionState,
      receiving: isReceiving,
      stale: isStale,
      offline: isOffline,
      lastPacketTime: this.lastPacketTime ? new Date(this.lastPacketTime).toISOString() : null,
      lastPacketAgeMs,
      packetCount: this.packetCount,
      lastPacketId: this.lastPacketId,
      rssi: this.latestRssi,
      snr: this.latestSnr,
      endpoint: this.sanitizeUrl(this.wsUrl),
      staleThresholdMs: this.staleAfterMs,
    }
  }

  getLatestData() {
    const status = this.getStatus()
    return {
      status,
      latestEnvelope: this.latestEnvelope,
      normalized: this.latestNormalized,
    }
  }

  getRecentReadings(limit = 50) {
    const count = Math.min(Math.max(1, limit), this.maxBufferSize)
    return this.recentReadingsBuffer.slice(-count)
  }

  sanitizeUrl(url) {
    try {
      const parsed = new URL(url)
      parsed.password = ''
      parsed.username = ''
      return parsed.toString()
    } catch {
      return url.replace(/\/\/.*@/, '//')
    }
  }

  close() {
    this.isShuttingDown = true
    this.clearReconnectTimer()
    this.stopHeartbeat()

    if (this.ws) {
      try {
        this.ws.removeAllListeners()
        this.ws.close(1000, 'Backend shutdown')
      } catch {
        // Ignore close error
      }
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
    this.connectionState = 'disconnected'
    console.log('[RECEIVER] Receiver client cleanly shut down.')
  }
}
