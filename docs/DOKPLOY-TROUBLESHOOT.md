# Dokploy Troubleshooting

## Migrations hang / `url: ''` error

**Symptoms**
```
Error  Please provide required params for Postgres driver:
[x] url: ''
...
[⣷] applying migrations...
```

**Cause**
`DATABASE_URL` is empty inside the container. Dokploy compose substitutes `${DATABASE_URL}` from UI env vars. If the variable is not set, the URL is empty and `drizzle-kit` fails.

**Fix**
Set environment variables in Dokploy → Application → Environment:

Copy-paste block:
```
POSTGRES_USER=emergency
POSTGRES_PASSWORD=emergencyPostgres2026
POSTGRES_DB=emergency_contacts
SESSION_SECRET=12d7dce3d5a84e39399d76b6ba94b6dd55c8f88a32019f09a7d4150438836f05
DATABASE_URL=postgresql://emergency:emergencyPostgres2026@db:5432/emergency_contacts
```

Replace `SESSION_SECRET` with your own `openssl rand -hex 32` if you prefer.

`docker-compose.dokploy.yml` now falls back to building `DATABASE_URL` from Postgres vars if `DATABASE_URL` is not set:
```yaml
DATABASE_URL: ${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}}
```

Redeploy after saving.

## Migrations loop / hanging applying migrations

**Symptoms**
Logs repeatedly show:
```
Using 'pg' driver for database querying
[⣷] applying migrations...
```
No completion.

**Cause**
Postgres password contains characters that break the URL, e.g. `/`, `+`, `=`. In
`postgresql://user:pass@host/db` the `/` terminates the user-info and `+` is parsed literally, so the driver connects with a wrong host/password.

Example bad password: `/z3DH3lMWyQRTw+/Epi9DZZA/yot9w3i`

**Fix**
Use an URL-safe alphanumeric password or URL-encode it.

Option A – alphanumeric password + reset DB:
1. Change `POSTGRES_PASSWORD` to alphanumeric only, e.g. `emergencyPostgres2026`
2. Update `DATABASE_URL` accordingly
3. Delete the named volume `postgres_data` in Dokploy → Volumes so Postgres re-initialises with the new password
4. Redeploy

Option B – keep password but URL-encode:
Set `DATABASE_URL` manually in Dokploy UI:
```
postgresql://emergency:%2Fz3DH3lMWyQRTw%2B%2FEpi9DZZA%2Fyot9w3i@db:5432/emergency_contacts
```
`/` → `%2F`, `+` → `%2B`, `=` → `%3D`

## Compose file not found

Set Dokploy → Application → General → Compose File Path to `docker-compose.dokploy.yml` and ensure the file is pushed to the Git branch Dokploy is watching.

## Domain setup

Dokploy → Application → Domains → Add Domain `contacts.yourdomain.com`
Traefik will route to service `app:3000`. No ports need to be published.
Optional env:
```
NEXT_PUBLIC_APP_URL=https://contacts.yourdomain.com
```

## First run seeding

Migrations run automatically on container start. Admin users are not seeded automatically.
Run once after first successful deploy:
```
docker compose exec app npx prisma db seed
```
The seed prints random admin passwords.
