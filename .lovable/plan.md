## Goal

You're seeing "Authentication service unavailable" because `VITE_CSO_AUTH_URL` isn't set on the deployed server, so the frontend has no auth backend to call. You want the two admin emails to just work — no external server required.

I'll add a **client-side admin fallback** directly in the frontend code so `bavipratik@gmail.com` and `rishishirke65@gmail.com` can sign in immediately, with no auth server, no env vars, no SMTP. You'll just replace one file in your repo and redeploy.

## Trade-off (please read)

Putting admin credentials in the frontend means anyone who downloads your JS bundle can see the password hashes and attempt offline cracking. For 2 admins on an internal portal this is usually acceptable, but it is **less secure** than the Node auth server. If you ever want stronger security, deploy the `cso-auth-server` from the previous step and set `VITE_CSO_AUTH_URL`.

## What changes

**One file:** `src/lib/cso-auth-client.ts` — rewrite it to:

1. Keep an in-file allow-list of the 2 admin emails with **bcrypt hashes** of their passwords (default: `Admin@2026`, you can change later).
2. `csoLogin(email, password)` — first try the local allow-list; if it matches, return a success payload identical to the server's. Only fall back to the remote `VITE_CSO_AUTH_URL` server if the email is not in the local list AND the URL is configured.
3. `csoForgotPassword` — for the 2 hard-coded admins, show a toast saying "Contact the developer to reset" (since there's no email server). For others, fall through to remote if configured.
4. `csoResetPassword` — kept for the remote flow; for hard-coded admins it returns a friendly "not supported in offline mode" message.

**No other files change.** `LoginPage.tsx`, `auth-adapter.ts`, `App.tsx`, and `ResetPasswordPage.tsx` keep working as-is because the function signatures and return shapes stay identical.

## Initial credentials

| Email | Password |
|---|---|
| `bavipratik@gmail.com` | `Admin@2026` |
| `rishishirke65@gmail.com` | `Admin@2026` |

Both log in as `system_admin` with full CSO admin access (same role payload the server returned).

To **change a password later**, run locally:
```
cd cso-auth-server
node hash.js 'YourNewPassword'
```
…then paste the resulting `$2b$12$…` hash into the `ADMIN_USERS` array in `src/lib/cso-auth-client.ts` and redeploy.

## How you deploy the fix

1. I rewrite `src/lib/cso-auth-client.ts` in this project.
2. You pull the file (or download it) and replace it in your deployed repo.
3. Rebuild & redeploy the frontend — no server, no env vars needed.
4. Sign in with either admin email + `Admin@2026`.

## Technical notes

- Uses `bcryptjs` (already pulled in via the auth-server folder; for the browser bundle I'll add it as a frontend dependency — pure-JS, ~30 KB gzipped, works in Vite).
- Constant-time email comparison and a dummy bcrypt compare on miss to avoid trivial timing leaks.
- No localStorage admin flag — the role comes from the matched record, same as before, so the existing role-based routing keeps working.

Approve and I'll make the change.