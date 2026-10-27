import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import WebSocket, { WebSocketServer } from 'ws'
import { validateEnvelope, normalizeTelemetry } from '../services/telemetryParser.js'
import { ReceiverClient } from '../services/receiverClient.js'
import { generateSimulatedTelemetry } from '../services/telemetrySimulator.js'

describe('DARKNESS-1 Telemetry Parser & Validator', () => {
  it('successfully validates a canonical ESP32 receiver envelope', () => {
    const raw = JSON.stringify({
      packet_id: 'PKT-1024',
      rssi: -65,
      snr: 9.25,
      telemetry: {
        ax: 0.012,
        ay: 0.045,
        az: 0.998,
        gx: 1.25,
        gy: -0.42,
        gz: 0.05,
        bmpTemperature: 24.5,
        pressure_hPa: 1013.25,
        altitude: 18.5,
        dhtTemperature: 25.1,
        dhtHumidity: 55.4,
        latitude: 19.076,
        longitude: 72.8777,
        gpsAltitude: 16.2,
        gpsSpeed: 4.5,
        satellites: 7,
        gpsValid: true,
      },
    })

    const result = validateEnvelope(raw)
    assert.equal(result.valid, true)
    assert.equal(result.envelope.packet_id, 'PKT-1024')
    assert.equal(result.envelope.rssi, -65)
    assert.equal(result.envelope.snr, 9.25)
    assert.equal(typeof result.envelope.telemetry, 'object')
  })

  it('rejects malformed JSON syntax gracefully without throwing', () => {
    const result = validateEnvelope('{ packet_id: "corrupted", invalid_json ')
    assert.equal(result.valid, false)
    assert.match(result.error, /Invalid JSON syntax/)
  })

  it('successfully recovers truncated envelopes caused by LoRa 255-byte FIFO limit', () => {
    const truncatedPayloads = [
      '{"packet_id":"5025","rssi":-113,"snr":-4.25,"telemetry":{"ax":-0.042,"ay":0.006,"az":0.987,"gx":-1.82,"gy":0.71,"gz":-0.07,"bmpTemperature":31.19,"pressure_hPa":1010.15,"altitude":1.30,"dhtTemperature":30.60,"dhtHumidity":59.10,"latitude":0.000000,"longitude":0.000000,"gpsAltitude":0.00,"gpsSpeed":0.00}',
      '{"packet_id":"5033","rssi":-113,"snr":-4.00,"telemetry":{"ax":-0.039,"ay":0.009,"az":0.996,"gx":-1.79,"gy":0.62,"gz":0.19,"bmpTemperature":31.19,"pressure_hPa":1010.18,"altitude":0.37,"dhtTemperature":30.60,"dhtHumidity":59.20,"latitude":0.000000,"longitude":0.000000,"gpsAltitude":0.00,"gpsSpeed":0.00,}',
      '{"packet_id":"5037","rssi":-113,"snr":-5.00,"telemetry":{"ax":-0.046,"ay":0.006,"az":0.991,"gx":-1.94,"gy":0.76,"gz":0.07,"bmpTemperature":31.19,"pressure_hPa":1010.15,"altitude":1.30,"dhtTemperature":30.60,"dhtHumidity":59.20,"latitude":0.000000,"longitude":0.000000,"gpsAltitude":0.00,"gpsSpeed":0.00.}',
    ]

    for (const raw of truncatedPayloads) {
      const res = validateEnvelope(raw)
      assert.equal(res.valid, true)
      assert.ok(res.envelope.packet_id)
      assert.equal(typeof res.envelope.telemetry, 'object')
      assert.equal(typeof res.envelope.telemetry.ax, 'number')
      assert.equal(typeof res.envelope.telemetry.bmpTemperature, 'number')
    }
  })

  it('rejects envelope missing packet_id', () => {
    const result = validateEnvelope({
      rssi: -70,
      snr: 8.0,
      telemetry: { ax: 1.0 },
    })
    assert.equal(result.valid, false)
    assert.match(result.error, /Missing or empty packet_id/)
  })

  it('rejects non-numeric RSSI and SNR', () => {
    const badRssi = validateEnvelope({
      packet_id: '1',
      rssi: 'invalid_rssi',
      snr: 5.0,
      telemetry: {},
    })
    assert.equal(badRssi.valid, false)

    const badSnr = validateEnvelope({
      packet_id: '1',
      rssi: -50,
      snr: 'not_a_number',
      telemetry: {},
    })
    assert.equal(badSnr.valid, false)
  })

  it('rejects non-object telemetry payload', () => {
    const result = validateEnvelope({
      packet_id: '1',
      rssi: -50,
      snr: 5.0,
      telemetry: 'string_not_json',
    })
    assert.equal(result.valid, false)
  })

  it('correctly normalizes sensor fields and computes G-force magnitude', () => {
    const envelope = {
      packet_id: '42',
      rssi: -55,
      snr: 10.0,
      telemetry: {
        ax: 0.0,
        ay: 0.0,
        az: 1.0,
        gx: -4.5,
        bmpTemperature: 26.2,
        altitude: 120.0,
        gpsValid: false,
      },
    }

    const norm = normalizeTelemetry(envelope, '2026-10-24T12:00:00Z')
    assert.equal(norm.packetId, '42')
    assert.equal(norm.sensorReadings.gForce, 1.0)
    assert.equal(norm.sensorReadings.temperature, 26.2)
    assert.equal(norm.sensorReadings.altitudeMeters, 120.0)
    assert.equal(norm.sensorReadings.altitudeKm, 0.12)
    assert.equal(norm.sensorReadings.rollDegPerSec, -4.5)
    assert.equal(norm.sensorReadings.gps.valid, false)
    assert.equal(norm.sensorReadings.gps.latitude, null)
    assert.equal(norm.sensorReadings.gps.longitude, null)
  })

  it('preserves unknown sensor fields safely without discarding them', () => {
    const envelope = {
      packet_id: '43',
      rssi: -60,
      snr: 8.5,
      telemetry: {
        bmpTemperature: 22.0,
        customRadiationFlux: 0.085,
        solarPanelVoltage: 3.32,
      },
    }

    const norm = normalizeTelemetry(envelope)
    assert.equal(norm.sensorReadings.unknownFields.customRadiationFlux, 0.085)
    assert.equal(norm.sensorReadings.unknownFields.solarPanelVoltage, 3.32)
  })

  it('handles missing sensor fields by assigning null instead of fabricating numbers', () => {
    const envelope = {
      packet_id: '44',
      rssi: -80,
      snr: 6.0,
      telemetry: {},
    }

    const norm = normalizeTelemetry(envelope)
    assert.equal(norm.sensorReadings.temperature, null)
    assert.equal(norm.sensorReadings.altitudeMeters, null)
    assert.equal(norm.sensorReadings.altitudeKm, null)
    assert.equal(norm.sensorReadings.gForce, null)
    assert.equal(norm.sensorReadings.humidity, null)
    assert.equal(norm.sensorReadings.gps.valid, false)
  })
})

describe('DARKNESS-1 Receiver Client State & Connection Management', () => {
  it('reports offline when not connected and no packets received', () => {
    const client = new ReceiverClient({ wsUrl: 'ws://127.0.0.1:59999/ws', staleAfterMs: 500 })
    const status = client.getStatus()
    assert.equal(status.connected, false)
    assert.equal(status.offline, true)
    assert.equal(status.packetCount, 0)
    assert.equal(status.lastPacketTime, null)
  })

  it('marks data as stale when packet age exceeds staleAfterMs', async () => {
    const client = new ReceiverClient({ wsUrl: 'ws://127.0.0.1:59999/ws', staleAfterMs: 50 })

    // Ingest a valid packet
    client.handleMessage(
      JSON.stringify({
        packet_id: 'TEST-1',
        rssi: -50,
        snr: 9.0,
        telemetry: { bmpTemperature: 25.0, altitude: 10.0 },
      })
    )

    let status = client.getStatus()
    assert.equal(status.packetCount, 1)
    assert.equal(status.stale, false)

    // Wait past stale threshold
    await new Promise((resolve) => setTimeout(resolve, 80))

    status = client.getStatus()
    assert.equal(status.stale, true)
    assert.ok(status.lastPacketAgeMs >= 50)
  })

  it('maintains an in-memory buffer of recent readings', () => {
    const client = new ReceiverClient({ wsUrl: 'ws://127.0.0.1:59999/ws' })

    for (let i = 1; i <= 5; i++) {
      client.handleMessage(
        JSON.stringify({
          packet_id: `PKT-${i}`,
          rssi: -60 + i,
          snr: 8.0,
          telemetry: { bmpTemperature: 20 + i },
        })
      )
    }

    const readings = client.getRecentReadings(3)
    assert.equal(readings.length, 3)
    assert.equal(readings[readings.length - 1].packetId, 'PKT-5')
    assert.equal(readings[readings.length - 1].normalized.temperature, 25)
  })

  it('connects to an active WebSocket server, ingests packet, and closes cleanly', async () => {
    // Spin up a mock ESP32 receiver WebSocket server on local ephemeral port
    const server = createServer()
    const wss = new WebSocketServer({ server })

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = server.address().port
    const mockWsUrl = `ws://127.0.0.1:${port}/ws`

    let clientReceived = false
    const client = new ReceiverClient({
      wsUrl: mockWsUrl,
      staleAfterMs: 5000,
    })

    wss.on('connection', (ws) => {
      // Simulate receiver broadcasting packet
      ws.send(
        JSON.stringify({
          packet_id: 'LORA-888',
          rssi: -62,
          snr: 9.8,
          telemetry: {
            bmpTemperature: 27.5,
            pressure_hPa: 1012.0,
            altitude: 45.0,
            ax: 0.05,
            ay: -0.02,
            az: 0.98,
            gpsValid: false,
          },
        })
      )
    })

    client.start()

    // Wait for packet to be ingested
    for (let i = 0; i < 20; i++) {
      if (client.packetCount > 0) {
        clientReceived = true
        break
      }
      await new Promise((r) => setTimeout(r, 100))
    }

    assert.equal(clientReceived, true)
    const latest = client.getLatestData()
    assert.equal(latest.status.lastPacketId, 'LORA-888')
    assert.equal(latest.status.rssi, -62)
    assert.equal(latest.normalized.sensorReadings.temperature, 27.5)
    assert.equal(latest.normalized.sensorReadings.altitudeMeters, 45.0)

    // Clean shutdown
    client.close()
    assert.equal(client.isConnected, false)

    await new Promise((resolve) => wss.close(resolve))
    await new Promise((resolve) => server.close(resolve))
  })
})

describe('Telemetry Simulator Fallback', () => {
  it('generates clearly tagged simulated telemetry with realistic values', () => {
    const sim = generateSimulatedTelemetry()
    assert.equal(sim.source, 'simulated')
    assert.equal(sim.isSimulated, true)
    assert.ok(sim.packetId.startsWith('SIM-'))
    assert.ok(typeof sim.sensorReadings.temperature === 'number')
    assert.ok(typeof sim.sensorReadings.altitudeMeters === 'number')
    assert.ok(typeof sim.sensorReadings.gForce === 'number')
    assert.equal(sim.sensorReadings.gps.valid, false)
  })
})
