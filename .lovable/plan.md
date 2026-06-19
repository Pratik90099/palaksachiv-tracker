## Goal

Harden the new password login path before it ships to the external server:

1. Rate-limit and audit-log every password reset request.
2. Restrict password sign-in to authorized officer roles (CSO admin, system_admin, and officers explicitly allowed).
3. Smoke-test password login + "Forgot password" on the deployed instance.

## 1. Rate limit + audit log for password resets

Mirror the existing OTP pattern (3 requests per 15 min, per email + per IP), reusing `audit_logs`.

### DB migration

- New table `public.password_reset_requests`
  - Fields: `email citext`, `ip inet`, `requested_at timestamptz default now()`, `success bool`, `reason text`
  - Indexes on `(email, requested_at)` and `(ip, requested_at)`
  - GRANTs: `service_role` only (writes happen from edge function); RLS enabled with admin-read policy via `has_role(auth.uid(),'admin')`
- New RPC `public.request_password_reset_check(_email text, _ip inet) returns jsonb`
  - Security-definer. Returns `{ allowed: bool, reason: text }`.
  - Rejects if `>= 3` requests for that email in last 15 min, or `>= 10` from that IP in last 15 min.
  - On allow: inserts a pending row, returns `allowed: true` + the resolved officer's email if one exists (so we don't leak existence — always return `allowed:true` to client when within limits, even if no officer matches; only the audit row records the real outcome).
  - Also verifies the email belongs to an officer whose role is in the **password-login allow-list** (see §2). If not, records `reason='role_not_allowed'` and still returns `allowed:true` to the client (no enumeration).
- Trigger logs every reset attempt into `audit_logs` (`entity_type='auth'`, `action='password_reset_request'`, `actor_email`, `diff = { ip, reason }`).

### Edge function `password-reset-request`

New edge function (so we get the client IP from request headers, which the browser cannot supply):

- Input: `{ email }`.
- Reads `x-forwarded-for` for IP, calls `request_password_reset_check`.
- If `allowed`, calls `supabase.auth.admin.generateLink({ type: 'recovery', email, redirectTo: '<origin>/reset-password' })` and emails it via the existing `send-login-otp` Gmail transport (renamed internally to reuse the SMTP client) — or, if simpler, just calls `supabase.auth.resetPasswordForEmail` server-side using the service role.
- Always returns `{ ok: true }` so the UI message is identical whether or not the email exists.

### Client changes

- `requestPasswordReset(email)` in `src/lib/auth-adapter.ts` switches from calling `supabase.auth.resetPasswordForEmail` directly to invoking the new `password-reset-request` edge function.
- `LoginPage.tsx` already shows a generic toast — no copy change needed.

## 2. Restrict password login to authorized roles

Single source of truth in DB, enforced server-side. Default allow-list:

- `system_admin`
- `chief_secretary`
- Any officer with `is_cso_admin = true`
- `department_secretary`, `district_collector`, `guardian_secretary`, `divisional_commissioner` — **allowed**, but only if `officers.password_login_enabled = true` (new boolean column, default `true` for admins / `false` for the rest, configurable from User Management later).

### DB migration

- `alter table public.officers add column password_login_enabled boolean not null default false;`
- Backfill: set `true` where `is_cso_admin = true OR role IN ('system_admin','chief_secretary')`.
- Update `find_login_officer_public(_email, _role)` to also return `password_login_enabled` and `is_cso_admin`.

### Adapter change

`signInWithPasswordAndBindOfficer` (in `src/lib/auth-adapter.ts`):

- After the existing `find_login_officer_public` call, also check the returned `password_login_enabled` flag. If false → `signOut()` and throw "Password login is not enabled for this account. Use one-time code instead."
- Audit-log the attempt (success + failure) via a new RPC `log_password_login_attempt(_email, _role, _success, _reason)` that inserts into `audit_logs` with `entity_type='auth'`, `action='password_login'`.

### UI change

`LoginPage.tsx` (Password tab): show a small inline note under the role select — "Password login is only available for accounts enabled by CSO. If your account isn't enabled, use the One-time code tab."

## 3. Test plan (external server)

Manual checks performed by the user against the deployed instance (`https://palaksachiv-tracker.lovable.app` or external host):

1. **Forgot password (allowed account)** — admin email → click "Forgot password" → receive email within 1 min → land on `/reset-password` → set new password → redirected to `/login` → password login works → sidebar shows admin nav.
2. **Forgot password (rate limit)** — fire 4 reset requests in a row for the same email → first 3 return success, 4th returns success in UI but `audit_logs` shows `reason='rate_limited'`.
3. **Forgot password (unknown email)** — submit a junk email → UI shows the same success toast → `audit_logs` shows `reason='unknown_email'` and no email is sent.
4. **Password login (disabled officer)** — try password tab with a `district_collector` whose `password_login_enabled = false` → error toast "Password login is not enabled…", session cleared, OTP tab still works for the same officer.
5. **Password login (wrong role)** — admin email, wrong role in dropdown → "No officer registered with this email for the selected role." Audit log records the failure.
6. **OTP tab unchanged** — request OTP, verify, land on dashboard.

Acceptance: all 6 cases pass on the external server; `audit_logs` contains one row per attempt with the correct `reason`.

## Files touched


| File                                                    | Change                                                                                                                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/<ts>_password_login_hardening.sql` | `password_reset_requests` table + RLS + GRANTs, `password_login_enabled` column on `officers`, `request_password_reset_check` RPC, `log_password_login_attempt` RPC, updated `find_login_officer_public` |
| `supabase/functions/password-reset-request/index.ts`    | New edge function (IP-aware rate check + recovery email dispatch)                                                                                                                                        |
| `supabase/config.toml`                                  | Register the new function (verify-jwt = false)                                                                                                                                                           |
| `src/lib/auth-adapter.ts`                               | `requestPasswordReset` → call edge function; `signInWithPasswordAndBindOfficer` → enforce `password_login_enabled`; audit-log attempts                                                                   |
| `src/pages/LoginPage.tsx`                               | Add the inline "enabled by CSO" note on the Password tab                                                                                                                                                 |


## Out of scope

- UI toggle in User Management for `password_login_enabled` (follow-up — for now flip it via SQL).
- IP allow-listing / geofencing.
- MFA on password login.
- Switching to Supabase Auth Hooks for rate limiting (our edge-function check is sufficient and self-contained).
- Ensure no external API to lovable, etc. 

Approve and I'll switch to build mode and apply the migration + code changes.