export type Section =
  | 'Home'
  | 'Infrastructure'
  | 'Telemetry'
  | 'Operations'
  | 'Cloud Storage'
  | 'Cloud regions'
  | 'Settings'

export type RocketRegion = 'EREBUS-CORE' | 'ORBITAL-01' | 'ORBITAL-02' | 'LUNAR-01' | 'MARS-RELAY'

export type RocketMachine = {
  id: string
  name: string
  region: RocketRegion
  status: 'Running' | 'Stopped' | 'Maintenance' | 'Deploying'
  cpu: string
  memory: string
  image: string
  ip: string
  mission: string
  cpuUsage?: number
  memUsage?: number
  tempC?: number
}

export type StorageBucket = {
  id: string
  name: string
  region: string
  sizeGb: number
  objectCount: number
  tier: string
  redundancy: string
}

export type ReceiverStatus = {
  connected: boolean
  connectionState: 'connected' | 'connecting' | 'disconnected'
  receiving: boolean
  stale: boolean
  offline: boolean
  lastPacketTime: string | null
  lastPacketAgeMs: number | null
  packetCount: number
  lastPacketId: string | null
  rssi: number | null
  snr: number | null
  endpoint: string
  staleThresholdMs: number
  simulated?: boolean
}

export type SensorGps = {
  valid: boolean
  hasLock: boolean
  latitude: number | null
  longitude: number | null
  altitude: number | null
  speedKmh: number | null
  satellites: number
}

export type SensorReadings = {
  temperature: number | null
  bmpTemperature: number | null
  dhtTemperature: number | null
  pressureHpa: number | null
  altitudeMeters: number | null
  altitudeKm: number | null
  humidity: number | null
  gForce: number | null
  accel: {
    x: number | null
    y: number | null
    z: number | null
  }
  gyro: {
    x: number | null
    y: number | null
    z: number | null
  }
  speedKmh: number | null
  rollDegPerSec: number | null
  gps: SensorGps
  unknownFields?: Record<string, unknown>
}

export type TelemetryData = {
  timestamp?: string
  packetId?: string
  receivedAt?: string
  rssi?: number | null
  snr?: number | null
  sensorReadings?: SensorReadings
  orbitalPhysics?: {
    velocityKmS: number | null
    altitudeKm: number | null
    inclinationDeg?: number
    orbitalPeriodMin?: number
  }
  powerAndThermal?: {
    solarPowerOutputMw?: number | null
    batteryChargePercent?: number | null
    thermalCoreTempC?: number | null
    radiatorDissipationKw?: number | null
  }
  environmentalShielding?: {
    cosmicRadiationFluxMsv?: number | null
    geomagneticFieldStrengthUt?: number | null
    shieldIntegrityPercent?: number
  }
  networkTopology?: {
    laserCrosslinksActive?: number
    earthDownlinkGbps?: number | null
    interplanetaryLatencyMs?: Record<string, number>
  }
}

export type TelemetryResponse = {
  success: boolean
  source: 'receiver' | 'simulated'
  isSimulated: boolean
  status: ReceiverStatus
  telemetry: TelemetryData | null
  raw?: unknown
}

export type TelemetryHistoryItem = {
  id: number | string
  packetId: string
  timestamp?: string
  createdAt?: string
  rssi: number | null
  snr: number | null
  normalized?: SensorReadings
  payload?: {
    sensorReadings?: SensorReadings
  }
}

export type TerminalLog = {
  id: number
  type: 'system' | 'user' | 'error'
  text: string
}
