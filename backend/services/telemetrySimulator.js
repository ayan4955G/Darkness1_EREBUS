/**
 * Telemetry Simulator
 * Explicit development-only simulated data provider.
 * Activated strictly when SIMULATION_MODE=true is configured in the environment.
 */

export function generateSimulatedTelemetry() {
  const now = new Date().toISOString()
  const wave = Math.sin(Date.now() / 10000)
  const cosWave = Math.cos(Date.now() / 8000)

  // Simulated physical sensor readings
  const bmpTemp = +(24.5 + wave * 2.8).toFixed(2)
  const pressure = +(1013.25 + wave * 5.4).toFixed(2)
  const altitude = +(418.5 + wave * 2.1).toFixed(1)
  const ax = +(0.01 + wave * 0.05).toFixed(3)
  const ay = +(0.02 + cosWave * 0.04).toFixed(3)
  const az = +(0.98 + wave * 0.02).toFixed(3)
  const gForce = +(Math.sqrt(ax * ax + ay * ay + az * az)).toFixed(3)
  const gx = +(wave * 1.5).toFixed(2)
  const gy = +(cosWave * 1.2).toFixed(2)
  const gz = +(wave * 0.8).toFixed(2)

  return {
    source: 'simulated',
    isSimulated: true,
    packetId: `SIM-${Math.floor(Date.now() / 1000) % 10000}`,
    receivedAt: now,
    rssi: -72,
    snr: 9.2,
    sensorReadings: {
      temperature: bmpTemp,
      bmpTemperature: bmpTemp,
      dhtTemperature: +(bmpTemp + 0.5).toFixed(2),
      pressureHpa: pressure,
      altitudeMeters: Math.round(altitude * 1000),
      altitudeKm: altitude,
      humidity: +(52.0 + wave * 4.0).toFixed(1),
      gForce,
      accel: { x: ax, y: ay, z: az },
      gyro: { x: gx, y: gy, z: gz },
      speedKmh: +(27600 + wave * 50).toFixed(1),
      rollDegPerSec: gx,
      gps: {
        valid: false,
        hasLock: false,
        latitude: null,
        longitude: null,
        altitude: null,
        speedKmh: null,
        satellites: 0,
      },
    },
    // Backward-compatible envelope structure for existing orbital views
    orbitalPhysics: {
      velocityKmS: +(7.66 + wave * 0.02).toFixed(3),
      altitudeKm: altitude,
      inclinationDeg: 51.64,
      orbitalPeriodMin: 92.68,
    },
    powerAndThermal: {
      solarPowerOutputMw: +(84.6 + wave * 4.2).toFixed(1),
      batteryChargePercent: +(96.4 + wave * 1.5).toFixed(1),
      thermalCoreTempC: bmpTemp,
      radiatorDissipationKw: +(310.4 + wave * 12).toFixed(1),
    },
    environmentalShielding: {
      cosmicRadiationFluxMsv: +(0.14 + Math.abs(wave) * 0.05).toFixed(3),
      geomagneticFieldStrengthUt: +(48.2 + wave * 3.1).toFixed(1),
      shieldIntegrityPercent: 99.98,
    },
    networkTopology: {
      laserCrosslinksActive: 16,
      earthDownlinkGbps: +(18.6 + wave * 1.2).toFixed(2),
      interplanetaryLatencyMs: {
        'EREBUS-CORE': 4,
        'ORBITAL-01': 12,
        'ORBITAL-02': 18,
        'LUNAR-01': 1280,
        'MARS-RELAY': 420000,
      },
    },
  }
}
