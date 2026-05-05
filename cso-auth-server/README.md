# CSO Auth Server

Self-hosted Node.js authentication server for the GS Portal Chief Secretary's Office login.
Replaces the Supabase `authenticate-cso` edge function so the portal can run on any host.

Provides:
- `POST /api/cso/login` — email + password
- `POST /api/cso/forgot-password` — sends a one-time reset link via SMTP
- `POST /api/cso/reset-password` — token + new password
- `GET  /api/cso/health` — liveness check

## 1. Install

Requires **Node.js 18+**.

```bash
cd cso-auth-server
npm install
cp .env.example .env
```

Edit `.env`:

| Var | What it is |
|---|---|
| `PORT` | Port to listen on (default 8787) |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins (e.g. `https://portal.example.com`) |
| `APP_URL` | Public URL of the frontend (used to build reset links) |
| `JWT_SECRET` | Random secret. A working default is provided — rotate it. |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` / `FROM` | Your SMTP credentials. Gmail app-passwords work: https://myaccount.google.com/apppasswords |

## 2. Pre-seeded admins

`users.json` ships with two admin accounts:

| Email | Initial password |
|---|---|
| `bavipratik@gmail.com` | `ChangeMe@2026` |
| `rishishirke65@gmail.com` | `ChangeMe@2026` |

**Log in once and immediately use "Forgot password" to rotate.**

## 3. Run

```bash
node server.js
# or with PM2
npm i -g pm2
pm2 start server.js --name cso-auth
pm2 save && pm2 startup
```

## 4. Put it behind HTTPS (nginx example)

```nginx
server {
  listen 443 ssl http2;
  server_name auth.yourdomain.com;
  ssl_certificate     /etc/letsencrypt/live/auth.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/auth.yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 5. Wire the frontend

In your frontend `.env` (or build-time config), set:

```
VITE_CSO_AUTH_URL=https://auth.yourdomain.com
```

Then rebuild and redeploy the frontend.

## 6. Operations

- **Add a new admin:** `node add-admin.js admin@example.com "Full Name" 'TempPassword!'`
- **Generate a hash for manual editing:** `node hash.js 'MyPassword'`
- **View users:** `cat users.json` (passwords are bcrypt hashes — safe to back up)
- **Logs:** stdout (capture via PM2 / systemd / nginx as you prefer)

## 7. Security notes

- Passwords stored as **bcrypt** (cost 12).
- Reset tokens stored as **sha256 hashes** with 60-minute TTL, single-use.
- Login rate-limit: 5 attempts / 15 min / IP.
- Forgot-password rate-limit: 3 / hour / email.
- No user enumeration on `/forgot-password` (always returns 200).
- Atomic writes to `users.json` to avoid corruption on crash.
- **Always serve over HTTPS in production.**
