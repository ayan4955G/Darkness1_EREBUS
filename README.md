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
| `/api/telemetry` | GET | Current simulated telemetry snapshot |
| `/api/regions` | GET | Region machine counts |
| `/api/missions` | GET, POST | List mission operations; super admins can create them |
| `/api/settings` | GET, PUT | Read and save the user's radiation threshold |
| `/api/events` | GET | Recent event log |
| `/api/terminal` | POST | Execute supported orbital CLI commands |

The database schema and initial dashboard records are defined by `backend/migrations/001_initial_schema.sql`. `002_default_account.sql` creates the default account from the three `DEFAULT_ACCOUNT_*` environment variables; the password is scrypt-hashed and an existing email is left unchanged. Add subsequent numbered SQL migrations rather than editing a migration that has already been applied in a deployed database.

The Super Admin UI is a dedicated Next.js application in `super-admin-ui/`, exposed on port 3001. It includes full authentication, default superadmin bootstrapping, session management, real-time operator directory filtering, and role-based provisioning (`mission_operations`, `infrastructure_admin`, `super_admin`, and `user`).
