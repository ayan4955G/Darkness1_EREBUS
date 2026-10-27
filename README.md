# EREBUS Space Cloud

EREBUS is a Next.js dashboard backed by an Express API and PostgreSQL. The dashboard uses same-origin `/api/*` URLs; Next.js rewrites them to the API service. PostgreSQL is the source of truth for accounts, sessions, machines, buckets, event logs, and user settings.

## Run with Docker Compose

1. Copy `.env.example` to `.env` and set unique long random values for `POSTGRES_PASSWORD` and `DEFAULT_ACCOUNT_PASSWORD`. Set the default account name and email too. Compose refuses to start without these values. Use `EREBUS_DB_USER` to customize the PostgreSQL username.
2. Run `docker compose up --build -d`.
3. Open `http://localhost:3000` and sign in with `DEFAULT_ACCOUNT_EMAIL` and `DEFAULT_ACCOUNT_PASSWORD`. The separate Super Admin console runs at `http://localhost:3001`.

The API runs on port 1000 inside the Compose network. The database is exposed on port 5432 for development. The API applies pending SQL files in `backend/migrations/` at startup and records each applied filename in `schema_migrations`.

To start the API locally, install dependencies in `backend`, set `DATABASE_URL` to a PostgreSQL database, then run `npm start`. To use the Next.js development server with it, set `API_INTERNAL_URL=http://localhost:1000` in the root environment.

## Authentication

`POST /api/auth/signup` creates an account and starts a session. `POST /api/auth/login` validates credentials. Both set an HTTP-only, SameSite=Lax session cookie. Passwords are salted and hashed with Node's scrypt; only hashes of session tokens are stored. `GET /api/auth/me` checks the session and `POST /api/auth/logout` revokes it. All other API endpoints require a valid session.

## API

| Endpoint | Methods | Description |
| --- | --- | --- |
| `/api/health` | GET | API and PostgreSQL readiness |
| `/api/auth/signup`, `/api/auth/login` | POST | Account creation and login |
| `/api/auth/me`, `/api/auth/logout` | GET, POST | Session status and logout |
| `/api/admin/accounts` | GET, POST | Super-admin account listing and account creation |
| `/api/machines` | GET, POST | Search/list and create compute instances |
| `/api/machines/:id` | GET, PATCH, DELETE | Read, update status, or terminate an instance |
| `/api/storage` | GET, POST | List and create storage buckets |
| `/api/telemetry` | GET | Normalized real LoRa receiver telemetry, connection status, and backward-compatible envelope |
| `/api/telemetry/latest` | GET | Latest raw envelope (`packet_id`, `rssi`, `snr`, `telemetry`) |
| `/api/telemetry/status` | GET | Receiver WebSocket connection health, packet count, age, and stale flags |
| `/api/telemetry/history` | GET | Chronological historical telemetry readings for charts |
| `/api/regions` | GET | Region machine counts |
| `/api/missions` | GET, POST | List mission operations; super admins can create them |
| `/api/settings` | GET, PUT | Read and save the user's radiation threshold |
| `/api/events` | GET | Recent event log |
| `/api/terminal` | POST | Execute supported orbital CLI commands |

The database schema and initial dashboard records are defined by `backend/migrations/001_initial_schema.sql`. `002_default_account.sql` creates the default account from the three `DEFAULT_ACCOUNT_*` environment variables; the password is scrypt-hashed and an existing email is left unchanged. Add subsequent numbered SQL migrations rather than editing a migration that has already been applied in a deployed database. `005_telemetry_history.sql` stores incoming LoRa receiver readings.

The Super Admin UI is a dedicated Next.js application in `super-admin-ui/`, exposed on port 3001. It includes full authentication, default superadmin bootstrapping, session management, real-time operator directory filtering, and role-based provisioning (`mission_operations`, `infrastructure_admin`, `super_admin`, and `user`).

## DARKNESS-1 ESP32 LoRa Receiver Integration

The backend features a persistent WebSocket client that connects to the DARKNESS-1 ESP32 LoRa gateway on `RECEIVER_WS_URL`. The backend owns the receiver connection; the browser never connects directly to the ESP32 or receives receiver credentials.

### Configuration (.env)

```env
# Receiver WebSocket and HTTP URLs
RECEIVER_WS_URL=ws://192.168.1.100/ws
RECEIVER_HTTP_URL=http://192.168.1.100

# Optional API Key for authenticated receiver firmware
RECEIVER_API_KEY=

# Stale timeout: marks telemetry as stale if no packet arrives in this window (ms)
RECEIVER_STALE_AFTER_MS=15000

# Maximum reconnect backoff delay (ms)
RECEIVER_RECONNECT_MAX_MS=30000

# Set to true only for development-mode mock data when no receiver is available
SIMULATION_MODE=false
```

### Packet Format & Sensor Mapping

The receiver firmware broadcasts packets received over 433 MHz LoRa:
```json
{
  "packet_id": "42",
  "rssi": -65,
  "snr": 9.5,
  "telemetry": {
    "ax": -0.012, "ay": 0.045, "az": 1.002,
    "gx": 0.12, "gy": -0.05, "gz": 0.01,
    "bmpTemperature": 24.5, "pressure_hPa": 1013.25, "altitude": 14.5,
    "dhtTemperature": 25.1, "dhtHumidity": 55.4,
    "latitude": 19.076, "longitude": 72.8777,
    "gpsAltitude": 12.3, "gpsSpeed": 0.0,
    "satellites": 6, "gpsValid": true
  }
}
```

- **Core Temperature**: Derived from `bmpTemperature` (BMP280) or `dhtTemperature` (DHT22).
- **Altitude**: Barometric altitude in meters calculated by BMP280.
- **Connection Strength**: Actual LoRa `rssi` (dBm) and `snr` (dB).
- **G-Force**: Magnitude $\sqrt{ax^2 + ay^2 + az^2}$ calculated from MPU6050 accelerometer axes.
- **Speed**: GPS ground track speed (`gpsSpeed` km/h) only when `gpsValid` is true; otherwise displayed as `Unavailable`.
- **Roll Axis**: MPU6050 gyroscope X angular velocity (`gx` °/s).
- **GPS Coordinates**: Embedded Google Maps view only rendered when `gpsValid` is true and coordinates are non-zero. Never uses browser geolocation as rocket position.

### Connection States

- **Live LoRa**: Receiver connected and packets arriving within `RECEIVER_STALE_AFTER_MS`.
- **Stale**: Connection open or retained last packet, but last reading is older than `RECEIVER_STALE_AFTER_MS`.
- **Offline**: Receiver is unreachable, disconnected, or no packets have arrived.
- **Simulated**: Explicitly tagged `SIMULATED` only when `SIMULATION_MODE=true` is set.

### Receiver Security & Firmware Notes

The supplied ESP32 receiver firmware (`sensors_interface/basic_TX_&_RX/receiver/receiver.ino`) exposes an unauthenticated AsyncWebSocket on `/ws`. Therefore, the receiver must be operated on a trusted private LAN. If operating on an untrusted network, deploy an HTTP reverse proxy with TLS/token authorization or modify the ESP32 firmware to validate the `X-API-Key` or `Authorization` header sent by `receiverClient.js`.

### Running Automated Tests

Run backend unit and integration tests:
```powershell
cd backend
npm test
```
