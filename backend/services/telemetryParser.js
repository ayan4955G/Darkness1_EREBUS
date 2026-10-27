/**
 * DARKNESS-1 Telemetry Parser & Normalizer
 * Validates incoming LoRa receiver envelopes and maps raw ESP32 sensor readings
 * to canonical frontend telemetry structures.
 */

function isFiniteNumber(val) {
  return typeof val === 'number' && Number.isFinite(val)
}

function parseNumberInRange(val, min, max) {
  if (val === undefined || val === null) return null
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (!isFiniteNumber(num)) return null
  if (num < min || num > max) return null
  return num
}

/**
 * Attempts to repair JSON envelopes that were truncated due to LoRa/UART buffer limits.
 * Recovers all complete key-value pairs without requiring hardware firmware changes.
 */
export function tryRepairTruncatedEnvelope(raw) {
  if (typeof raw !== 'string') return raw
  const str = raw.trim()

  try {
    return JSON.parse(str)
  } catch (initialErr) {
    let body = str
    if (body.endsWith('}')) {
      body = body.slice(0, -1)
    }

    body = body.replace(/[,.:\s]+$/, '')

    const quotes = (body.match(/"/g) || []).length
    if (quotes % 2 !== 0) {
      body += '"'
    }

    const openBraces = (body.match(/{/g) || []).length
    const closeBraces = (body.match(/}/g) || []).length
    const neededCloses = openBraces - closeBraces

    if (neededCloses > 0) {
      body += '}'.repeat(neededCloses)
    }

    try {
      return JSON.parse(body)
    } catch {
      const lastCleanIndex = Math.max(body.lastIndexOf(','), body.lastIndexOf('{'))
      if (lastCleanIndex > 0) {
        let trimmedBody = body.slice(0, lastCleanIndex)
        trimmedBody = trimmedBody.replace(/[,.:\s]+$/, '')
        const openB = (trimmedBody.match(/{/g) || []).length
        const closeB = (trimmedBody.match(/}/g) || []).length
        if (openB > closeB) {
          trimmedBody += '}'.repeat(openB - closeB)
        }
        try {
          return JSON.parse(trimmedBody)
        } catch {}
      }
      throw initialErr
    }
  }
}

/**
 * Validates raw payload from WebSocket or HTTP.
 * Accepts string or pre-parsed object.
 * Returns { valid: boolean, error?: string, envelope?: object }
 */
export function validateEnvelope(raw) {
  let envelope = raw
  if (typeof raw === 'string') {
    try {
      envelope = JSON.parse(raw)
    } catch (err) {
      try {
        envelope = tryRepairTruncatedEnvelope(raw)
      } catch {
        return { valid: false, error: `Invalid JSON syntax: ${err.message}` }
      }
    }
  }

  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return { valid: false, error: 'Payload must be a non-null JSON object' }
  }

  // packet_id validation
  const rawId = envelope.packet_id ?? envelope.packetId ?? envelope.id
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
    return { valid: false, error: 'Missing or empty packet_id' }
  }
  const packetId = String(rawId).trim()

  // rssi validation
  const rawRssi = envelope.rssi
  if (!isFiniteNumber(rawRssi) && isNaN(parseFloat(rawRssi))) {
    return { valid: false, error: 'Missing or non-numeric rssi' }
  }
  const rssi = typeof rawRssi === 'number' ? Math.round(rawRssi) : parseInt(rawRssi, 10)

  // snr validation
  const rawSnr = envelope.snr
  if (!isFiniteNumber(rawSnr) && isNaN(parseFloat(rawSnr))) {
    return { valid: false, error: 'Missing or non-numeric snr' }
  }
  const snr = typeof rawSnr === 'number' ? rawSnr : parseFloat(rawSnr)

  // telemetry object validation
  let telemetry = envelope.telemetry
  if (typeof telemetry === 'string') {
    try {
      telemetry = JSON.parse(telemetry)
    } catch (err) {
      try {
        telemetry = tryRepairTruncatedEnvelope(telemetry)
      } catch {
        return { valid: false, error: `Invalid telemetry JSON string: ${err.message}` }
      }
    }
  }

  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) {
    return { valid: false, error: 'telemetry field must be a valid JSON object' }
  }

  return {
    valid: true,
    envelope: {
      packet_id: packetId,
      rssi,
      snr: Math.round(snr * 100) / 100,
      telemetry,
      raw_source: envelope,
    },
  }
}

/**
 * Normalizes validated envelope into standard frontend data contract.
 */
export function normalizeTelemetry(envelope, receivedAt = new Date().toISOString()) {
  const { packet_id, rssi, snr, telemetry } = envelope

  // MPU6050 Accelerometer (g)
  const ax = parseNumberInRange(telemetry.ax, -20, 20)
  const ay = parseNumberInRange(telemetry.ay, -20, 20)
  const az = parseNumberInRange(telemetry.az, -20, 20)

  let gForce = null
  if (ax !== null && ay !== null && az !== null) {
    gForce = Math.round(Math.sqrt(ax * ax + ay * ay + az * az) * 1000) / 1000
  }

  // MPU6050 Gyroscope (deg/s)
  const gx = parseNumberInRange(telemetry.gx, -2500, 2500)
  const gy = parseNumberInRange(telemetry.gy, -2500, 2500)
  const gz = parseNumberInRange(telemetry.gz, -2500, 2500)

  // Temperatures (°C)
  const bmpTemperature = parseNumberInRange(telemetry.bmpTemperature, -50, 100)
  const dhtTemperature = parseNumberInRange(telemetry.dhtTemperature, -50, 100)
  const coreTemperature = bmpTemperature ?? dhtTemperature ?? null

  // Barometric Pressure (hPa)
  const pressureHpa = parseNumberInRange(telemetry.pressure_hPa ?? telemetry.pressure, 200, 1300)

  // Altitude (meters)
  const altitudeMeters = parseNumberInRange(telemetry.altitude, -500, 60000)
  const altitudeKm = altitudeMeters !== null ? Math.round((altitudeMeters / 1000) * 1000) / 1000 : null

  // Humidity (% RH)
  const dhtHumidity = parseNumberInRange(telemetry.dhtHumidity ?? telemetry.humidity, 0, 100)

  // GPS
  const isGpsValid = Boolean(telemetry.gpsValid === true || telemetry.gpsValid === 'true')
  const rawLat = parseNumberInRange(telemetry.latitude, -90, 90)
  const rawLon = parseNumberInRange(telemetry.longitude, -180, 180)
  const hasCoordinates = isGpsValid && rawLat !== null && rawLon !== null && !(rawLat === 0 && rawLon === 0)

  const gpsSpeed = parseNumberInRange(telemetry.gpsSpeed, 0, 50000)
  const gpsAltitude = parseNumberInRange(telemetry.gpsAltitude, -500, 60000)
  const satellites = typeof telemetry.satellites === 'number' ? Math.max(0, Math.floor(telemetry.satellites)) : 0

  const gps = {
    valid: hasCoordinates,
    hasLock: isGpsValid,
    latitude: hasCoordinates ? rawLat : null,
    longitude: hasCoordinates ? rawLon : null,
    altitude: gpsAltitude,
    speedKmh: gpsSpeed,
    satellites,
  }

  // Preserve unknown fields for safety
  const knownKeys = new Set([
    'ax', 'ay', 'az', 'gx', 'gy', 'gz',
    'bmpTemperature', 'dhtTemperature', 'pressure_hPa', 'pressure',
    'altitude', 'dhtHumidity', 'humidity',
    'latitude', 'longitude', 'gpsAltitude', 'gpsSpeed', 'satellites', 'gpsValid'
  ])
  const unknownFields = {}
  for (const [key, value] of Object.entries(telemetry)) {
    if (!knownKeys.has(key)) {
      unknownFields[key] = value
    }
  }

  return {
    packetId: packet_id,
    receivedAt,
    rssi,
    snr,
    sensorReadings: {
      temperature: coreTemperature,
      bmpTemperature,
      dhtTemperature,
      pressureHpa,
      altitudeMeters,
      altitudeKm,
      humidity: dhtHumidity,
      gForce,
      accel: {
        x: ax,
        y: ay,
        z: az,
      },
      gyro: {
        x: gx,
        y: gy,
        z: gz,
      },
      speedKmh: gpsSpeed,
      rollDegPerSec: gx,
      gps,
      unknownFields,
    },
    raw: telemetry,
  }
}
