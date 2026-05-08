## Goal

Replace Parichay SSO + CSO password login with a single **passwordless OTP login** for all 5 roles. OTP is a 6-digit code, valid 10 minutes, sent to the officer's email (SMS hook stubbed for later).

## The 5 roles (login dropdown)

1. **District Collector** (`collector`)
2. **Department Secretary** (`department_secretary`)
3. **Palak Sachiv / Guardian Secretary** (`guardian_secretary`) — note: every Palak Sachiv is also a Department Secretary, but not vice versa
4. **Chief Secretary** (`chief_secretary`)
5. **Chief Secretary's Office** (`system_admin`) — replaces the existing CSO password login

## Login UX (`/login`)

```
┌────────────────────────────────┐
│ Sign in to GS Portal           │
│ Role:   [▼ Select role     ]   │
│ Email:  [ name@gov.in       ]  │
│         [ Send OTP          ]  │
└────────────────────────────────┘
       ↓ after Send OTP
┌────────────────────────────────┐
│ Enter the 6-digit code we      │
│ emailed to n***@gov.in         │
│ [ _ _ _ _ _ _ ]                │
│ [ Verify & sign in ]           │
│ Resend in 30s                  │
└────────────────────────────────┘
```

- Role + email are validated together — the email must belong to an officer with that role (or the Palak-Sachiv mapping below).
- Phone field on form: **none** (we'll send to whatever phone is on file once SMS is wired).
- Generic message on failure ("If that email matches an active officer, a code has been sent") — no enumeration.

## Database changes (Supabase migration)

1. `**officers.phone**` — add `text` column, nullable. Seed left empty; populated later.
2. `**officers.is_palak_sachiv**` — add `boolean default false`. A Department Secretary row with this true also appears as a Palak Sachiv at login.
3. `**login_otps**` table:
  - `id uuid pk`, `officer_id uuid`, `email citext`, `role text`, `code_hash text`, `expires_at timestamptz`, `consumed_at timestamptz`, `attempts int default 0`, `created_at timestamptz default now()`
  - RLS on, **no policies** (only RPCs touch it)
4. `**pgcrypto**` + `**citext**` extensions
5. **RPC `request_login_otp(_email, _role)**` — `SECURITY DEFINER`:
  - Looks up active officer matching email + role (special case: role=`guardian_secretary` matches officers where `role='department_secretary' AND is_palak_sachiv=true`, or guardian_secretaries table)
  - Rate limit: max 3 active OTPs / email / 15 min
  - Generates 6-digit code, stores **bcrypt hash** (`crypt(code, gen_salt('bf'))`), 10 min TTL, invalidates prior OTPs for that email
  - Returns `{ sent: true, otp_id, dev_code }` — `dev_code` only returned in non-prod (gated by app setting); prod returns just `{ sent: true }`
  - Calls `pg_notify('login_otp', json)` so an edge function can pick it up and send the email
6. **RPC `verify_login_otp(_email, _role, _code)**` — `SECURITY DEFINER`:
  - Finds latest unconsumed OTP for email/role, increments attempts, locks after 5 wrong tries
  - On match: marks consumed, returns officer row `(id, name, email, role, designation, district_id, department_id, is_cso_admin)`
7. Drop `cso_admins` table + `verify_cso_admin` / `set_cso_admin_password` functions (from previous plan).

## Email delivery (OTP email)

- Use **Lovable Cloud transactional email** (built-in, no Resend/SMTP setup).
- New edge function `**send-login-otp**`:
  - Called by frontend right after `request_login_otp` succeeds (passes `otp_id`).
  - Re-fetches the OTP row + officer (service role) and sends a branded email: subject "Welcome, Your GS Portal login code: 123456", body with code, 10-min validity, "didn't request this - ignore".
  - Returns `{ success: true }`.
- One scaffold step: set up email infra (`setup_email_infra` + `scaffold_transactional_email`) on the project's existing email domain. If no domain configured yet, the build step will surface the email-domain setup dialog.
- **SMS later**: leave a `// TODO: dispatch SMS via Twilio` block in `send-login-otp` so wiring it up later is one connector + a few lines.

## Frontend changes

- `**src/pages/LoginPage.tsx**` — full rewrite:
  - Role `<Select>` with 5 options
  - Step 1 form: email + role → calls `supabase.rpc('request_login_otp')` → calls `supabase.functions.invoke('send-login-otp')`
  - Step 2: 6-digit OTP via `<InputOTP>` → calls `supabase.rpc('verify_login_otp')` → on success, hydrate auth context and navigate to `/`
  - Resend cooldown timer, error states, "Use a different email" link
- `**src/lib/auth-adapter.ts**` — replace `loginWithParichay` and `loginWithCSO` with a single `loginWithOtp(email, role, code)`. `loginAsOfficer` (CSO impersonation) stays.
- **Delete**:
  - `src/lib/cso-auth-client.ts`
  - `src/pages/ResetPasswordPage.tsx` (passwordless = no reset)
  - Routes/imports for `/reset-password` in `App.tsx`
  - `cso-auth-server/` folder (no longer used)
  - `supabase/functions/parichay-callback/` (no longer used)
- `**package.json**` — remove `bcryptjs` + `@types/bcryptjs` (frontend bcrypt no longer needed; hashing happens in Postgres).
- `**src/lib/auth-context.tsx**` — keep shape, just store the officer returned by `verify_login_otp`.

## Seed data

- Set `is_palak_sachiv = true` and `phone` on the two existing admin emails (`bavipratik@gmail.com`, `rishishirke65@gmail.com`) so they can sign in as `system_admin` immediately.
- Anyone else needs an officer row with their email + role first (existing Officer Directory page handles that).

## Security

- Codes never leave the DB in plaintext after `request_login_otp` returns (hashed with bcrypt cost 10).
- Rate limit per email; attempt limit per OTP.
- RLS denies all direct reads of `login_otps`; only `SECURITY DEFINER` RPCs touch it.
- Email enumeration prevented by uniform "if exists, code sent" response.
- Session: same auth-context behavior as today (30 min idle timeout per existing memory).

## Out of scope (called out so it's not forgotten)

- SMS delivery (stub only)
- Self-service phone-number update UI for officers (admin edits via Officer Directory)
- Hardware-token / WebAuthn — not requested

## Deliverables

1. One Supabase migration (extensions, columns, table, 2 RPCs, drop old admin objects)
2. Email infra scaffolded + `send-login-otp` edge function deployed
3. Rewritten `LoginPage.tsx`, slimmed `auth-adapter.ts`, updated `App.tsx`
4. Cleanup of dead Parichay / CSO-password / bcrypt code
5. Memory update: replace the "Parichay SSO + CSO edge function + mock" auth rule with "OTP-only, 5 roles, email now / SMS later"