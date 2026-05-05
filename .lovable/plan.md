# Plan: Self-Hosted CSO Auth Server (Node/Express + SMTP Reset)

Replace the Supabase `authenticate-cso` edge function with a small Node/Express server you upload to your own host. The frontend talks to it directly. Passwords are stored as bcrypt hashes in `users.json` next to the server file. Password reset is via emailed one-time link.

## What you upload to your server

A single self-contained folder `cso-auth-server/` with:

```
cso-auth-server/
├── server.js          # Express app (login, forgot, reset, admin reset)
├── users.json         # Bcrypt-hashed admin accounts (pre-seeded)
├── reset-tokens.json  # Auto-managed; do not edit
├── .env.example       # Template for SMTP + APP config
├── package.json
└── README.md          # Deploy + ops instructions
```

Run with: `npm install && node server.js` (or PM2/systemd). Listens on `PORT` (default 8787).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/cso/login` | Email + password → `{ success, user }` |
| `POST` | `/api/cso/forgot-password` | Email → sends reset link (always returns 200, no enumeration) |
| `POST` | `/api/cso/reset-password` | Token + new password → updates `users.json` |
| `GET`  | `/api/cso/health` | Liveness probe |

CORS allow-list driven by `ALLOWED_ORIGINS` env var (comma-separated). Rate limiting: 5 login attempts / 15 min / IP, 3 forgot-password / hour / email. Tokens are 32-byte hex, single-use, 60-min TTL, stored hashed in `reset-tokens.json`.

## Pre-seeded admins (in `users.json`)

```json
[
  { "id": "admin-bavi",  "name": "Bavi Pratik",   "email": "bavipratik@gmail.com",   "password_hash": "<bcrypt>", "role": "system_admin" },
  { "id": "admin-rishi", "name": "Rishi Shirke",  "email": "rishishirke65@gmail.com","password_hash": "<bcrypt>", "role": "system_admin" }
]
```

Initial password for both: **`ChangeMe@2026`** (you will be forced to reset on first login — both via "Forgot password" or by editing `users.json` after generating a new hash with the bundled `node hash.js <password>` helper).

## SMTP config (`.env`)

```
PORT=8787
ALLOWED_ORIGINS=https://your-frontend-domain.com
APP_URL=https://your-frontend-domain.com
JWT_SECRET=<random-64-char-string>          # generated for you in README
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASS=<gmail-app-password>              # https://myaccount.google.com/apppasswords
SMTP_FROM="GS Portal <noreply@yourdomain.com>"
```

Gmail app-password works out of the box; SendGrid/Mailgun SMTP also drop in.

## Frontend changes (in this repo)

1. **`.env`** — add `VITE_CSO_AUTH_URL=https://your-server.com` (you fill in after deploying).
2. **`src/lib/auth-adapter.ts`** — `loginWithCSO` switches from `supabase.functions.invoke('authenticate-cso', …)` to `fetch(\`${VITE_CSO_AUTH_URL}/api/cso/login\`, …)`. Same return shape, no other call-sites change.
3. **`src/pages/LoginPage.tsx`** — same swap (it currently invokes the edge function inline). Add a **"Forgot password?"** link below the password field that opens an inline panel:
   - Step 1: email input → POST `/forgot-password` → toast "If that email exists, a reset link was sent."
   - Step 2 (separate route): new page **`/reset-password`** reads `?token=…` from URL, shows new-password + confirm fields → POST `/reset-password`. On success, redirects to `/login` with a success toast.
4. **`src/App.tsx`** — register the new public route `/reset-password`.
5. **Optional cleanup**: leave `supabase/functions/authenticate-cso/` in the repo (harmless) or delete it — your call. Plan deletes it to avoid confusion.

## How password reset works end-to-end

```text
User clicks "Forgot password" on /login
        │
        ▼
POST /api/cso/forgot-password { email }
        │
        ├─ email not in users.json → return 200 silently
        └─ email exists:
              ├─ generate 32-byte token
              ├─ store sha256(token) + expiry in reset-tokens.json
              └─ SMTP send: "Reset link: {APP_URL}/reset-password?token={token}"
        ▼
User clicks link → /reset-password page
        ▼
POST /api/cso/reset-password { token, newPassword }
        ├─ hash token, look up, check not used + not expired
        ├─ bcrypt-hash newPassword, update users.json
        ├─ mark token used
        └─ return 200 → frontend redirects to /login
```

## Security notes

- Passwords: bcrypt cost factor 12.
- Tokens: stored hashed (sha256), single-use, 60-min TTL, cleaned up on each forgot-password call.
- No user enumeration on `/forgot-password`.
- Constant-time email compare on `/login`; dummy bcrypt compare on missing user (prevents timing leak).
- HTTPS required in production — put server behind nginx/Caddy with TLS, OR use Node's `https` module if you have certs locally. README covers both.
- File writes to `users.json` are atomic (`writeFile` to temp + rename) so a crash mid-reset can't corrupt it.
- `reset-tokens.json` is auto-pruned of expired entries on every request.

## Deploy steps you'll follow (in README)

1. Copy the `cso-auth-server/` folder to your server (scp/rsync).
2. `cd cso-auth-server && npm install`
3. `cp .env.example .env` and fill in SMTP + ALLOWED_ORIGINS + APP_URL.
4. `node server.js` (or `pm2 start server.js --name cso-auth`).
5. Put it behind nginx on `https://auth.yourdomain.com` (sample nginx block included).
6. In your frontend deployment, set `VITE_CSO_AUTH_URL=https://auth.yourdomain.com` and rebuild.
7. Log in with `bavipratik@gmail.com` / `ChangeMe@2026`, immediately use "Forgot password" to rotate.

## Operator helper scripts (bundled)

- `node hash.js <plaintext>` → prints bcrypt hash you can paste into `users.json`.
- `node add-admin.js <email> <name> <plaintext>` → appends a new admin entry safely.

## What I will NOT change

- Parichay SSO flow, role-based data isolation, RLS, AI/Gemini layer, or any other portal feature.
- Other edge functions (`parichay-callback`, `generate-insights`, `process-document`) stay as-is.

## After approval I will

1. Create the `cso-auth-server/` folder in this repo (so you can download/zip it).
2. Generate the bcrypt hashes for the seed password and bake them into `users.json`.
3. Generate a random `JWT_SECRET` and write it into `.env.example` as a working default.
4. Update `auth-adapter.ts`, `LoginPage.tsx`, add `ResetPasswordPage.tsx`, and register the route.
5. Update `.env` with a `VITE_CSO_AUTH_URL` placeholder.
6. Write the README with copy-paste deploy + nginx + PM2 instructions.

Then you download the `cso-auth-server/` folder, upload to your server, fill in `.env`, and run it.
