CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  region text NOT NULL,
  status text NOT NULL DEFAULT 'Running' CHECK (status IN ('Running','Stopped','Maintenance','Deploying')),
  cpu text NOT NULL,
  memory text NOT NULL,
  image text NOT NULL,
  ip inet NOT NULL,
  mission text NOT NULL DEFAULT '',
  cpu_usage numeric(5,2) NOT NULL DEFAULT 12,
  mem_usage numeric(5,2) NOT NULL DEFAULT 24,
  temp_c numeric(5,2) NOT NULL DEFAULT 34,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX machines_region_idx ON machines(region);

CREATE TABLE storage_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  region text NOT NULL,
  size_gb bigint NOT NULL DEFAULT 0 CHECK(size_gb >= 0),
  object_count bigint NOT NULL DEFAULT 0 CHECK(object_count >= 0),
  tier text NOT NULL,
  redundancy text NOT NULL DEFAULT '3x Orbital Mirroring',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_logs (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK(type IN ('info','warning','success','danger')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  radiation_threshold numeric(8,4) NOT NULL DEFAULT 0.15 CHECK(radiation_threshold > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO machines(name,region,status,cpu,memory,image,ip,mission,cpu_usage,mem_usage,temp_c) VALUES
('DARKNESS-1','EREBUS-CORE','Running','128 vCPU','1024 GB','Darkness Orbital OS v4.2','10.24.1.1','Primary space payload & high-altitude rocket compute vanguard',24.5,48.2,32.1),
('ODYSSEY-7','EREBUS-CORE','Running','64 vCPU','512 GB','Orbital OS 24.04','10.24.0.17','Deep-space relay coordinator & telemetry processor',42.8,31.4,38.6),
('HELIOS-03','ORBITAL-01','Running','32 vCPU','256 GB','Alpine Space 3.20','10.11.4.92','Solar observation payload & radiation monitor',68.2,54.1,44.1),
('LUNA-GATE','LUNAR-01','Maintenance','16 vCPU','128 GB','Debian Quantum 12','10.88.2.41','Lunar communications bridge & surface downlink',12,22.8,31.5),
('ATLAS-12','ORBITAL-02','Running','48 vCPU','384 GB','Orbital OS 24.04','10.42.8.63','Orbital navigation model inference & collision avoidance',89.4,76.2,49.3),
('ARES-INITIATIVE','MARS-RELAY','Running','128 vCPU','1024 GB','Debian Quantum 12','10.199.1.5','Deep interplanetary telemetry buffer & autonomous compute',35.6,48,28.4)
ON CONFLICT(name) DO NOTHING;

INSERT INTO storage_buckets(name,region,size_gb,object_count,tier,redundancy) VALUES
('orbital-telemetry-archive','EREBUS-CORE',1420,489200,'Zero-G Cold','3x Orbital Mirroring'),
('lunar-surface-imagery','LUNAR-01',890,120450,'High-Radiation NVMe','Triple Parity Shard'),
('deep-space-quantum-vault','MARS-RELAY',3400,94000,'Deep Space Vault','Interplanetary Sync')
ON CONFLICT(name) DO NOTHING;

INSERT INTO event_logs(title,type) VALUES
('ODYSSEY-7 telemetry stream lock acquired','success'),
('Solar array alignment optimized for LUNAR-01','info'),
('LUNA-GATE node entered scheduled maintenance','warning'),
('Laser crosslink established between ORBITAL-01 & MARS-RELAY','success');
