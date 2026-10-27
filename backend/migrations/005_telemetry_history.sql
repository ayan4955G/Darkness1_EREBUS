CREATE TABLE IF NOT EXISTS telemetry_history (
  id BIGSERIAL PRIMARY KEY,
  packet_id TEXT,
  rssi INTEGER,
  snr DOUBLE PRECISION,
  payload JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'receiver',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telemetry_history_created_at_idx ON telemetry_history(created_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_history_packet_id_idx ON telemetry_history(packet_id);
