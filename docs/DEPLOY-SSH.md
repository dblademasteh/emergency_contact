# 🚀 Emergency Contacts — SSH + GitHub Deployment

> **Goal:** deploy the app to the NAS by pulling the code from GitHub over SSH,
> then building with Docker Compose — no more File Station tarball uploads.
>
> **Repo:** `github.com/dblademasteh/emergency_contact` (private, branch `main`)
> **App (LAN):** `http://192.168.0.148:18081/` · **Cloudflare tunnel:** via `cloudflared`
>
> This runbook is **interactive** — paste each block into your NAS SSH terminal
> and send me any error output.

---

## ✅ 0 · Prerequisites on the NAS

Enable SSH on DSM if not already on:

**Control Panel → Terminal & SNMP → Enable SSH service** (port 22 by default).

Then from your PC, connect:

```bash
ssh admin@192.168.0.148
```

> Replace `admin` / `192.168.0.148` with your actual DSM user + NAS IP.
> If you use a non-default port: `ssh -p <port> admin@192.168.0.148`.

Once connected, confirm Docker is available:

```bash
docker --version
docker compose version
```

---

## 🔑 1 · Give the NAS a GitHub SSH key (one-time)

The repo is **private**, so the NAS needs an SSH key registered with GitHub.

### 1a · Generate a key on the NAS

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "nas-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Copy the printed `ssh-ed25519 AAAA... nas-deploy` line.

### 1b · Add it to GitHub as a **deploy key**

1. Open **GitHub → your repo → Settings → Deploy keys → Add deploy key**
2. Title: `NAS deploy`
3. Paste the key from step 1a
4. **Allow write access:** leave **unchecked** (read-only is enough to pull)
5. Save

### 1c · Test the SSH connection to GitHub

```bash
ssh -o StrictHostKeyChecking=accept-new -T git@github.com
```

You should see:

```
Hi dblademasteh! You've successfully authenticated, but GitHub does not
provide shell access.
```

> If you see `Permission denied (publickey)`, the key wasn't added correctly —
> send me the output.

---

## 📂 2 · Clone the repo (one-time)

```bash
sudo mkdir -p /volume1/docker/emergency_contact
sudo chown "$USER" /volume1/docker/emergency_contact
cd /volume1/docker
git clone git@github.com:dblademasteh/emergency_contact.git emergency_contact
cd emergency_contact
```

> If the folder already exists from the old File Station method, skip the clone
> and instead point the existing folder at GitHub:
>
> ```bash
> cd /volume1/docker/emergency_contact
> git init
> git remote add origin git@github.com:dblademasteh/emergency_contact.git
> git fetch origin
> git checkout -b main origin/main
> ```

---

## 🔐 3 · Create `.env` (one-time)

The repo does **not** contain `.env` (it's gitignored). Create it on the NAS:

```bash
cd /volume1/docker/emergency_contact
cat > .env <<'EOF'
POSTGRES_USER=emergency
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=emergency_contacts
SESSION_SECRET=CHANGE_ME_LONG_RANDOM_STRING
CLOUDFLARED_TOKEN=CHANGE_ME_TUNNEL_TOKEN
EOF
```

> - `POSTGRES_PASSWORD` — pick a strong password (used by the DB + app).
> - `SESSION_SECRET` — a long random string (e.g. `openssl rand -hex 32`).
> - `CLOUDFLARED_TOKEN` — from **Zero Trust → Networks → Tunnels → your tunnel →
>   Configure → Docker** (the `--token eyJ...` value). If you don't use the
>   tunnel yet, leave it blank for now.

Generate a random secret if you like:

```bash
openssl rand -hex 32
```

---

## 🚀 4 · Build & start (first deploy)

```bash
cd /volume1/docker/emergency_contact
docker compose up -d --build
```

Watch the build (a few minutes). Then check status:

```bash
docker compose ps
```

You should see three containers: `db`, `app`, `cloudflared` — all `Up`.

---

## 🔁 5 · Update the app (every future deploy)

```bash
cd /volume1/docker/emergency_contact
git pull
docker compose up -d --build
```

That's it — migrations run automatically on container start.

---

## 🩺 6 · Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Permission denied (publickey)` on `git clone` | Deploy key not added / wrong key | Re-check step 1b; run `ssh -T git@github.com` again |
| `Host key verification failed` | First-time GitHub host key | Use `ssh -o StrictHostKeyChecking=accept-new -T git@github.com` once |
| `docker: permission denied` | User not in `docker` group | Run with `sudo`, or add user: `sudo synogroup --add docker $USER` |
| `Database is uninitialized and superuser password is not specified` | Empty `POSTGRES_PASSWORD` | Set a non-empty password in `.env`, then `docker compose down -v` (wipes DB) and `up -d --build` |
| Can't sign in as admin after fresh DB | Admin accounts come from `prisma/seed.ts` (random passwords), not auto-run | Run `npx prisma db seed` on the NAS, or add admins manually |
| Cloudflare URL not loading | `cloudflared` down / token expired | `docker compose up -d cloudflared`; refresh `CLOUDFLARED_TOKEN` in `.env` if `token has expired` |
| Port 18081 already in use | Old container from File Station method | `docker compose down` first, or change the host port in `docker-compose.yml` |

---

## 📌 Quick reference

| Task | Command |
|---|---|
| Connect | `ssh admin@192.168.0.148` |
| Update | `cd /volume1/docker/emergency_contact && git pull && docker compose up -d --build` |
| Logs (app) | `docker compose logs -f app` |
| Logs (tunnel) | `docker compose logs -f cloudflared` |
| App (LAN) | `http://192.168.0.148:18081` |
| Source | `github.com/dblademasteh/emergency_contact` (branch `main`) |
