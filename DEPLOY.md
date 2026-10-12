# Dokploy Deployment Guide

This repo deploys to a VPS running [Dokploy](https://dokploy.com) using
`dokploy-compose.yml` and the existing `Dockerfile`.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build: deps → build → non-root runner. Applies Drizzle migrations on boot. |
| `dokploy-compose.yml` | Dokploy service definition (app + db + optional cloudflared). |
| `.env.example` | Template for the environment variables Dokploy needs. |

## Step-by-step

### 1. Push this branch to your git remote

```bash
git add -A
git commit -m "Security hardening: CSRF, rate limiting, standardized responses, tests"
git push
```

### 2. Create the application in Dokploy

1. Dashboard → **Projects** → **Create** → **Application** (or **Docker Compose** if you prefer stack semantics — then point it at `dokploy-compose.yml`).
2. Connect the git provider and select this repository/branch.
3. Build type: **Dockerfile**, path `./Dockerfile`, context `.`.

### 3. Environment variables

Add these in Dokploy → Application → **Environment** (copy values from `.env.example`):

```
DATABASE_URL=postgresql://emergency:<password>@db:5432/emergency_contacts
SESSION_SECRET=<openssl rand -hex 32>
NODE_ENV=production
PORT=3000
POSTGRES_USER=emergency
POSTGRES_PASSWORD=<same password as in DATABASE_URL>
POSTGRES_DB=emergency_contacts
```

### 4. Database

Two options:

- **Bundled (recommended for a single VPS):** keep the `db` service from
  `dokploy-compose.yml`. Attach a Dokploy **volume** to
  `/var/lib/postgresql/data` so data survives redeploys. Keep the service on
  internal networking — never expose Postgres publicly.
- **External DB:** drop the `db` service and point `DATABASE_URL` at your
  existing server (e.g. the NAS Postgres). Remove the `depends_on` block.

### 5. Health check

Set the container health check path to `/api/auth/me`. It returns 200 without
requiring auth, so it verifies the app is actually serving requests.
Migrations run before the server starts (see the Dockerfile `CMD`), so a
healthy container also means the schema is current.

### 6. Domain & TLS

- Use Dokploy's built-in proxy: add your domain → target `app` service,
  port `3000`, enable **Let's Encrypt**.
- Or keep the Cloudflare Tunnel: set `CLOUDFLARED_TOKEN` and let the
  `cloudflared` service join your remotely-managed tunnel (ingress rules live
  in the Cloudflare Zero Trust dashboard).

### 7. First deploy

1. Deploy once; Dokploy builds the image and starts the services.
2. Check logs for `drizzle-kit migrate` output, then `next start`.
3. Visit the domain → you should see the public contacts page.
4. Create the first admin via the seed script if needed:
   `docker exec -it <app-container> npx tsx scripts/seed.ts` (adjust to your
   seed entry point).

## What's new in this branch (security hardening)

- **Security headers** — CSP, HSTS, Permissions-Policy, etc. in `next.config.ts`.
- **CSRF protection** — double-submit token on all POST/PATCH/DELETE routes
  (`lib/csrf.ts`), tokens issued via `/api/csrf`, clients use `useCsrfFetch`.
- **Rate limiting** — 5 attempts/min on login and register, with `Retry-After`.
- **Standardized responses** — `{ success, data, error, meta }` everywhere
  (`lib/api-response.ts`).
- **Constant-time token verification** — CSRF signature check uses
  `timingSafeEqual` (this fixed a real bug where issued tokens wouldn't verify).
- **Image hardening** — pre-decode size rejection + post-compression size check.
- **Error boundaries & skeletons** — graceful failure UI, better loading states.
- **Tests** — 41 Vitest tests covering rate limiter, API responses, and CSRF
  (`pnpm test` / `npm test`).

## Troubleshooting

- **App restarts on boot** → check `SESSION_SECRET` is set; missing secret
  breaks cookie signing.
- **403 on save/delete** → client is missing the CSRF token. Hard-refresh the
  page so `/api/csrf` issues a fresh token.
- **429 on login** → rate limit hit; wait for the window to clear (60s).
- **DB connection refused** → ensure `DATABASE_URL` host matches the compose
  service name (`db`) and the db service is healthy.
