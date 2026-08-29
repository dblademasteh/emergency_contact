# 🚨 Emergency Contacts — Deploy Runbook (WORKING method)

> **Why this method?** SSH to the NAS does **not** work from outside the LAN
> (QuickConnect relays DSM web, not SSH). The method below uses **DSM File
> Station + Task Scheduler** — no SSH needed — and has been verified working.
>
> **Critical:** the NAS has **no `unzip`** command. Always ship a **`.tar.gz`**
> (extracted with `tar`), **never** a `.zip`.

---

## 📦 1 · On your PC — package the app

Commit and push first, then create the tarball from `HEAD`:

```powershell
cd C:\Users\itcub\Desktop\emergency-contacts
git add -A
git commit -m "describe your change"
git push

git archive --format=tar.gz --output="$env:USERPROFILE\Desktop\emergency-contacts-deploy.tar.gz" HEAD
```

Sanity-check it (optional): `git archive` excludes `node_modules`, `.next`, and
anything gitignored — so real secrets (`.env`, `cloudflared/`) are **not** included.
The NAS's existing `.env` (Postgres passwords, `SESSION_SECRET`, the Cloudflare
tunnel token) is preserved because the tarball never touches it.

---

## ☁️ 2 · On the NAS — upload the tarball

Open **DSM → File Station** and upload `emergency-contacts-deploy.tar.gz`
(from your Desktop) into the `docker` shared folder, so it lands at:

```
/volume1/docker/emergency-contacts-deploy.tar.gz
```

---

## ⚙️ 3 · On the NAS — create/update the Task Scheduler script

**Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script**

- **General tab:** name it (e.g. "Deploy emergency contacts"); set **User** = **root**
  (a non-root user gets Docker socket "permission denied")
- **Schedule tab:** any (you'll press **Run** manually)
- **Task Settings tab → User-defined script:** paste:

```bash
#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
LOG="/volume1/docker/ec-deploy.log"
TARBALL="/volume1/docker/emergency-contacts-deploy.tar.gz"
TARGET="/volume1/docker/emergency_contact"

# Redirect ALL output (incl. errors) to a log we can read
exec > "$LOG" 2>&1
echo "=== Deploy started: $(date) ==="

if [ ! -f "$TARBALL" ]; then
  echo "ERROR: tarball not found at $TARBALL"
  ls -la /volume1/docker
  exit 1
fi

echo "--> Extracting over $TARGET"
tar -xzf "$TARBALL" -C "$TARGET"

cd "$TARGET"
echo "--> docker compose down"
docker compose down

echo "--> Rebuilding (takes a few minutes)..."
docker compose up -d --build

echo "--> Containers:"
docker compose ps
echo "=== Deploy finished: $(date) ==="
```

Click **OK** (this actually saves it). Then select the task and press **Run**.

---

## 📋 4 · Verify

1. Wait a few minutes for the build to finish.
2. Open **File Station → `/volume1/docker/ec-deploy.log`** — the last line should be
   `=== Deploy finished: ... ===` followed by the container list.
3. Open the app: **http://192.168.0.148:8080/** (login: `/login`).
   - Database migrations run automatically on container start — no manual step.

---

## 🩺 5 · Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `unzip: command not found` | NAS has no `unzip` | Use `.tar.gz` + `tar -xzf` (this runbook). Never ship a `.zip`. |
| Postgres log: `Database is uninitialized and superuser password is not specified` | `.env` on NAS has empty `POSTGRES_PASSWORD`, or the DB volume was wiped/re-created | In `/volume1/docker/emergency_contact/.env` set a **non-empty** `POSTGRES_PASSWORD` and a long `SESSION_SECRET`, then run the task again. |
| Task "runs" but nothing changes | Script failed silently / wrong archive | Check `/volume1/docker/ec-deploy.log` — it captures every command's output. |
| Can't sign in as admin after a fresh DB | DB re-initialized; admin accounts come from `prisma/seed.ts` (random passwords) which does **not** auto-run on boot | Recreate admins: on the NAS run `npx prisma db seed` (prints the random admin passwords) or add admins manually. The **8 category types** and **10 tutorial FAQs** come back automatically via migrations. |
| Cloudflare tunnel URL not loading | `cloudflared` container down | In the Task Scheduler runbook use `docker compose up -d` (starts all services incl. `cloudflared`). |
| Tunnel token expired (log: `token has expired` / tunnel "Inactive" in dashboard but container is up) | The remotely-managed tunnel token rotated/expired | Get a fresh token: **Zero Trust → Networks → Tunnels → `<tunnel>` → Overview → Configure → Docker**, copy the `--token eyJ...` value into `CLOUDFLARED_TOKEN` in `/volume1/docker/emergency_contact/.env`, then run the deploy task again (or `docker compose up -d cloudflared`). Ingress rules live on Cloudflare's side — no repo change needed. |
| "no space left on device" during build | Docker build cache filled the system partition | Clear Docker caches first: run `docker system prune -a -f` and delete `/volume1/@docker/buildkit/metadata_v2.db` before redeploying. Alternatively, decrease image layers or use multi-stage builds with smaller base images. |

---

## 🔁 Quick reference

| Task | Command / action |
|---|---|
| Package on PC | `git archive --format=tar.gz --output="$env:USERPROFILE\Desktop\emergency-contacts-deploy.tar.gz" HEAD` |
| Upload | File Station → `/volume1/docker/` |
| Deploy | Task Scheduler task (as root) → **Run** |
| Deploy log | `/volume1/docker/ec-deploy.log` |
| App (LAN) | `http://192.168.0.148:8080` |
| Source | `github.com/dblademasteh/emergency_contact` (branch `main`) |
