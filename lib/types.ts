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

export type TelemetryData = {
  orbitalPhysics: {
    velocityKmS: number
    altitudeKm: number
    inclinationDeg: number
    orbitalPeriodMin: number
  }
  powerAndThermal: {
    solarPowerOutputMw: number
    batteryChargePercent: number
    thermalCoreTempC: number
    radiatorDissipationKw: number
  }
  environmentalShielding: {
    cosmicRadiationFluxMsv: number
    geomagneticFieldStrengthUt: number
    shieldIntegrityPercent: number
  }
  networkTopology: {
    laserCrosslinksActive: number
    earthDownlinkGbps: number
    interplanetaryLatencyMs: Record<string, number>
  }
}

export type TerminalLog = {
  id: number
  type: 'system' | 'user' | 'error'
  text: string
}
