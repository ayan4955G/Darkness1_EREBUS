# 🚀 EREBUS - Space Data Center Cloud Platform (Fully Dockerized)

**EREBUS** is a fullstack cloud provider application built on a simulated Space Data Center infrastructure. It manages high-performance compute nodes ("Rocket Machines"), zero-gravity storage buckets, real-time satellite telemetry, laser crosslink topology, and interactive space CLI commands across orbital regions (Low Earth Orbit, Lunar Gateway, Mars Relay).

---

## 🛠️ Architecture Highlights

- **Frontend & UI**: Next.js 16 (App Router) with custom futuristic dark-mode styling, responsive navigation, real-time live telemetry widgets, interactive modals, and an embedded terminal emulator.
- **Backend & APIs**:
  - `GET /api/health` - Container health and readiness probe (uptime, memory, shield status).
  - `GET / POST / DELETE / PATCH /api/machines` - Rocket machine CRUD operations.
  - `GET /api/telemetry` - Live real-time satellite physics stream (speed, altitude, radiation, solar power).
  - `GET / POST /api/storage` - Zero-g storage bucket manager.
  - `POST /api/terminal` - Orbital CLI command handler (`erebus status`, `erebus launch`, `ping`, `telemetry`, `help`).
- **Containerization**:
  - Multi-stage `Dockerfile` (`deps`, `builder`, `runner`) based on `node:20-alpine` with `standalone` output mode.
  - Non-root `nextjs` user execution for enhanced security.
  - Built-in container health check command.
  - `docker-compose.yml` orchestrating the EREBUS cloud app alongside Redis cache on an isolated bridge network.

---

## 🐳 How to Run with Docker

### Option 1: Docker Compose (Recommended)

Run the entire fullstack cloud provider and caching service in one command:

```bash
docker-compose up --build -d
```

Access the application in your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

To view logs:
```bash
docker-compose logs -f
```

To stop containers:
```bash
docker-compose down
```

---

### Option 2: Docker CLI Direct Build

Build the standalone production container:

```bash
docker build -t erebus-space-cloud .
```

Run the container:

```bash
docker run -d -p 3000:3000 --name erebus-space-cloud-app erebus-space-cloud
```

---

## 💻 Local Development (Without Docker)

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Build for production locally:

```bash
npm run build
npm start
```

---

## 📡 API Reference Quickstart

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Container health, system memory, shield integrity |
| `/api/machines` | `GET / POST` | List or deploy rocket compute instances |
| `/api/machines/[id]` | `PATCH / DELETE` | Power toggle or terminate compute machine |
| `/api/telemetry` | `GET` | Live satellite telemetry data stream |
| `/api/storage` | `GET / POST` | Storage bucket management |
| `/api/terminal` | `POST` | Execute space CLI commands |

---

## 🛡️ License

Private & Proprietary - **EREBUS Space Cloud Infrastructure**
