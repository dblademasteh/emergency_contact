# Dokploy Deployment Guide

This project is ready for Dokploy (Docker Compose or Git auto-deploy).

## Prerequisites

* Dokploy instance with Docker socket access.
* A domain managed in Dokploy for SSL/TLS via Traefik.

## Recommended deployment

### 1. Prepare files

The repo includes:

* `Dockerfile` – multi-stage Next.js build, runs `drizzle-kit migrate` on boot.
* `docker-compose.dokploy.yml` – clean compose without external networks or Cloudflare tunnel.
* `.env.dokploy.example` – required environment variables.

Do **not** use the original `docker-compose.yml` on Dokploy – it references an external network `emergency-network` and a Cloudflare tunnel service. Use `docker-compose.dokploy.yml` instead.

### 2. Dokploy UI steps

1. **New Application → Docker Compose**
   * Source: Git repo `dblademasteh/emergency_contact` branch `main`.
   * Compose file path: `docker-compose.dokploy.yml`
2. **Environment**
   * Set the following variables in Dokploy UI → Environment. No `.env` file is required – the compose file uses `${VAR}` substitution directly.
     * `POSTGRES_USER` – e.g. `emergency`
     * `POSTGRES_PASSWORD` – strong random
     * `POSTGRES_DB` – e.g. `emergency_contacts`
     * `DATABASE_URL` – `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
     * `SESSION_SECRET` – `openssl rand -hex 32`
   * The compose file does **not** use `env_file` to avoid “file not found” errors when `.env` is gitignored.
3. **Domains**
   * Add your domain in Dokploy → Application → Domains.
   * Traefik will route `https://yourdomain.com` to the `app` service on port 3000.
4. **Volumes**
   * `postgres_data` is a named volume. Enable Dokploy Volume Backups for automated S3 backups.
5. **Deploy**
   * Click Deploy. Dokploy will build the image from `Dockerfile`, start `db` and `app`, and run migrations on container start.

### 3. External DB option

If you already have a managed Postgres:

* In Dokploy, create a Database service or use external.
* Set `DATABASE_URL` directly in Environment variables.
* Deploy `app` only, without the `db` service. Remove `depends_on` or use a compose with only `app`.

Example minimal compose for external DB:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
      NODE_ENV: production
```

### 4. First run notes

* Migrations run automatically via `CMD ["sh","-c","npx drizzle-kit migrate && npm run start"]`.
* Admin users are **not** seeded automatically on boot. After first deploy, run once:
  ```bash
  docker compose exec app npx prisma db seed
  ```
  or seed manually via the DB console. The seed script prints random admin passwords.
* The app listens on `0.0.0.0:3000`. No ports need to be published; Dokploy handles routing.

### 5. Updates

Push to `main` → Dokploy Auto Deploy triggers a new build. The named volume persists DB data. Logs are available in Dokploy → Logs per service.

### 6. Troubleshooting

* **Compose file not found**: In Dokploy → Application → General, set **Compose File Path** to `docker-compose.dokploy.yml`. Dokploy defaults to `docker-compose.yml`. Ensure the file exists at repo root.
* **Build fails on `network: host`**: `docker-compose.dokploy.yml` removes the `network: host` build option.
* **Container can't connect to DB**: Ensure `POSTGRES_PASSWORD` is set and not empty, and `db` healthcheck passes.
* **External network error**: You are using the old `docker-compose.yml`. Switch to `docker-compose.dokploy.yml`.
* **Cloudflare tunnel not needed**: Dokploy provides SSL termination; remove `cloudflared` service.
* **Environment variable substitution error**: All variables are required in Dokploy UI. `DATABASE_URL` must be set explicitly – do not rely on `.env` file.

## File overview

* `docker-compose.yml` – original NAS deployment with external network + Cloudflare tunnel.
* `docker-compose.dokploy.yml` – Dokploy-ready compose.
* `docker-compose.local.yaml` – local dev DB only.
* `.env.docker.example` – NAS example.
* `.env.dokploy.example` – Dokploy example.

For NAS deployment see `docs/DEPLOY.md`.
