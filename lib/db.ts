export type RocketMachine = {
  id: string
  name: string
  region: 'EREBUS-CORE' | 'ORBITAL-01' | 'ORBITAL-02' | 'LUNAR-01' | 'MARS-RELAY'
  status: 'Running' | 'Stopped' | 'Maintenance' | 'Deploying'
  cpu: string
  memory: string
  image: string
  ip: string
  mission: string
  createdAt: string
  cpuUsage: number
  memUsage: number
  tempC: number
}

export type StorageBucket = {
  id: string
  name: string
  region: string
  sizeGb: number
  objectCount: number
  tier: 'Zero-G Cold' | 'High-Radiation NVMe' | 'Deep Space Vault'
  redundancy: string
  createdAt: string
}

export type EventLog = {
  id: string
  title: string
  timestamp: string
  type: 'info' | 'warning' | 'success' | 'danger'
}

class SpaceDataStore {
  private vms: RocketMachine[] = [
    {
      id: 'vm-0',
      name: 'DARKNESS 1',
      region: 'EREBUS-CORE',
      status: 'Running',
      cpu: '128 vCPU',
      memory: '1024 GB',
      image: 'Darkness Orbital OS v4.2',
      ip: '10.24.1.01',
      mission: 'Primary space payload & high-altitude rocket compute vanguard',
      createdAt: new Date().toISOString(),
      cpuUsage: 24.5,
      memUsage: 48.2,
      tempC: 32.1,
    },
    {
      id: 'vm-1',
      name: 'ODYSSEY-7',
      region: 'EREBUS-CORE',
      status: 'Running',
      cpu: '64 vCPU',
      memory: '512 GB',
      image: 'Orbital OS 24.04',
      ip: '10.24.0.17',
      mission: 'Deep-space relay coordinator & telemetry processor',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      cpuUsage: 42.8,
      memUsage: 31.4,
      tempC: 38.6,
    },
    {
      id: 'vm-2',
      name: 'HELIOS-03',
      region: 'ORBITAL-01',
      status: 'Running',
      cpu: '32 vCPU',
      memory: '256 GB',
      image: 'Alpine Space 3.20',
      ip: '10.11.4.92',
      mission: 'Solar observation payload & radiation monitor',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      cpuUsage: 68.2,
      memUsage: 54.1,
      tempC: 44.1,
    },
    {
      id: 'vm-3',
      name: 'LUNA-GATE',
      region: 'LUNAR-01',
      status: 'Maintenance',
      cpu: '16 vCPU',
      memory: '128 GB',
      image: 'Debian Quantum 12',
      ip: '10.88.2.41',
      mission: 'Lunar communications bridge & surface downlink',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      cpuUsage: 12.0,
      memUsage: 22.8,
      tempC: 31.5,
    },
    {
      id: 'vm-4',
      name: 'ATLAS-12',
      region: 'ORBITAL-02',
      status: 'Running',
      cpu: '48 vCPU',
      memory: '384 GB',
      image: 'Orbital OS 24.04',
      ip: '10.42.8.63',
      mission: 'Orbital navigation model inference & collision avoidance',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      cpuUsage: 89.4,
      memUsage: 76.2,
      tempC: 49.3,
    },
    {
      id: 'vm-5',
      name: 'ARES-INITIATIVE',
      region: 'MARS-RELAY',
      status: 'Running',
      cpu: '128 vCPU',
      memory: '1024 GB',
      image: 'Debian Quantum 12',
      ip: '10.199.1.5',
      mission: 'Deep interplanetary telemetry buffer & autonomous compute',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      cpuUsage: 35.6,
      memUsage: 48.0,
      tempC: 28.4,
    },
  ]

  private buckets: StorageBucket[] = [
    {
      id: 'sb-1',
      name: 'orbital-telemetry-archive',
      region: 'EREBUS-CORE',
      sizeGb: 1420,
      objectCount: 489200,
      tier: 'Zero-G Cold',
      redundancy: '3x Orbital Mirroring',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'sb-2',
      name: 'lunar-surface-imagery',
      region: 'LUNAR-01',
      sizeGb: 890,
      objectCount: 120450,
      tier: 'High-Radiation NVMe',
      redundancy: 'Triple Parity Shard',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'sb-3',
      name: 'deep-space-quantum-vault',
      region: 'MARS-RELAY',
      sizeGb: 3400,
      objectCount: 94000,
      tier: 'Deep Space Vault',
      redundancy: 'Interplanetary Sync',
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    },
  ]

  private logs: EventLog[] = [
    { id: 'l-1', title: 'ODYSSEY-7 telemetry stream lock acquired', timestamp: '2 mins ago', type: 'success' },
    { id: 'l-2', title: 'Solar array alignment optimized for LUNAR-01', timestamp: '5 mins ago', type: 'info' },
    { id: 'l-3', title: 'LUNA-GATE node entered scheduled maintenance', timestamp: '14 mins ago', type: 'warning' },
    { id: 'l-4', title: 'Laser crosslink established between ORBITAL-01 & MARS-RELAY', timestamp: '28 mins ago', type: 'success' },
  ]

  public getMachines(): RocketMachine[] {
    return this.vms
  }

  public getMachine(id: string): RocketMachine | undefined {
    return this.vms.find((v) => v.id === id || v.name === id)
  }

  public addMachine(data: Omit<RocketMachine, 'id' | 'createdAt' | 'cpuUsage' | 'memUsage' | 'tempC'>): RocketMachine {
    const newVm: RocketMachine = {
      ...data,
      id: `vm-${Date.now()}`,
      createdAt: new Date().toISOString(),
      cpuUsage: Math.floor(Math.random() * 30 + 10),
      memUsage: Math.floor(Math.random() * 40 + 20),
      tempC: Math.floor(Math.random() * 15 + 30),
    }
    this.vms.unshift(newVm)
    this.addLog(`Deployed new rocket machine ${newVm.name} in ${newVm.region}`, 'success')
    return newVm
  }

  public updateMachineStatus(id: string, status: RocketMachine['status']): RocketMachine | null {
    const vm = this.getMachine(id)
    if (!vm) return null
    vm.status = status
    this.addLog(`Rocket machine ${vm.name} status updated to ${status}`, status === 'Running' ? 'success' : 'warning')
    return vm
  }

  public deleteMachine(id: string): boolean {
    const idx = this.vms.findIndex((v) => v.id === id || v.name === id)
    if (idx === -1) return false
    const removed = this.vms.splice(idx, 1)[0]
    this.addLog(`Terminated rocket machine ${removed.name}`, 'danger')
    return true
  }

  public getBuckets(): StorageBucket[] {
    return this.buckets
  }

  public addBucket(data: Omit<StorageBucket, 'id' | 'createdAt' | 'sizeGb' | 'objectCount'>): StorageBucket {
    const bucket: StorageBucket = {
      ...data,
      id: `sb-${Date.now()}`,
      sizeGb: 0,
      objectCount: 0,
      createdAt: new Date().toISOString(),
    }
    this.buckets.unshift(bucket)
    this.addLog(`Created space storage bucket '${bucket.name}'`, 'info')
    return bucket
  }

  public getLogs(): EventLog[] {
    return this.logs
  }

  public addLog(title: string, type: EventLog['type'] = 'info') {
    this.logs.unshift({
      id: `log-${Date.now()}`,
      title,
      timestamp: 'Just now',
      type,
    })
    if (this.logs.length > 20) this.logs.pop()
  }
}

// Global singleton for Next.js hot reload safety
const globalStore = global as unknown as { spaceStore?: SpaceDataStore }
export const db = globalStore.spaceStore || new SpaceDataStore()
if (process.env.NODE_ENV !== 'production') globalStore.spaceStore = db
