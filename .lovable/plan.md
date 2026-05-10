
# Fix OTP Email + Validate Role Isolation

## 1. Real email delivery (replace dev toast)

The portal currently returns the OTP in the API response and shows it as a "Dev code" toast because no email infrastructure was configured. To deliver real emails we need a verified sender domain.

**Step 1 — Set up Lovable Emails (one-time):**
You'll be prompted to add and verify a sender subdomain (e.g. `notify.yourdomain.gov.in`). DNS verification can take up to 72 hours, but scaffolding and code changes proceed immediately.

**Step 2 — Scaffold transactional email infrastructure:**
- Provisions the email queue, suppression list, send log, unsubscribe handler
- Creates the `send-transactional-email` edge function

**Step 3 — Create a branded `login-otp` template:**
- React Email component matching the portal's navy/gold/Plus Jakarta Sans branding
- Shows the 6-digit code, 10-minute validity warning, role being signed in to, and a "didn't request this?" notice
- Registered in the templates registry

**Step 4 — Rewrite `send-login-otp` edge function:**
- Look up the OTP record + officer
- Re-issue the plaintext code (the current RPC already returns it once at request time; we'll pass it through to the dispatcher instead of storing it)
- Invoke `send-transactional-email` with `templateName: 'login-otp'`, recipient = officer email, idempotency key = `otp-{otp_id}`

**Step 5 — Stop leaking `dev_code` to the client:**
- `request_login_otp` RPC: remove `dev_code` from the JSON response
- `send-login-otp`: accept the plaintext code via the RPC call chain (the simplest path — have the frontend continue to receive `otp_id`, but the RPC also writes the code to a short-lived signed payload that only the edge function can read; or, simpler, generate the code inside the edge function and have the RPC accept a pre-hashed code)
- Frontend: drop the dev toast, only show "Code sent to your registered email"

> Implementation choice: simplest is to keep the RPC generating the code and pass it to the edge function via a short SECURITY DEFINER helper `consume_pending_otp_for_dispatch(otp_id)` that returns plaintext exactly once and only to the service-role caller. This keeps the code from ever reaching the browser.

## 2. Resend code UX

The current `LoginPage` already has a 30s countdown + disabled state — it works but doesn't surface backend rate-limit responses well.

Improvements:
- When the RPC returns `rate_limited`, show "Too many attempts. Try again in ~15 minutes." and disable Resend for 60s
- Add a small "Code didn't arrive? Check spam, or resend in {Ns}" hint
- Increase initial cooldown to 60s (matches the 3-OTP-per-15-min backend cap better)

## 3. Test admin account

Add `test.admin@gmail.com` to the officers table with:
- `role = 'system_admin'`
- `is_cso_admin = true`
- `is_palak_sachiv = true` (so it can also test the Guardian Secretary path)
- `is_active = true`

Since login is **passwordless OTP** (per the prior plan you approved), there is no password. The shared password "TestGSPortal@2026" cannot be used — that contradicts the OTP-only architecture. Instead this test account will receive OTP codes by email like every other officer.

> If you actually want a password fallback for QA, that's a separate decision — say the word and I'll add a "QA bypass code" path gated to a single seeded account. Otherwise we keep OTP-only.

## 4. Role-based data isolation tests

Add a Playwright test suite (`tests/role-isolation.spec.ts`) that, for each of the 5 roles:
1. Requests an OTP for a seeded officer
2. Reads the code from the `login_otps` table directly (test-only Supabase service-role client)
3. Verifies login → lands on `/dashboard`
4. Visits Projects, Visits, Issues, Compliance pages and asserts the row counts / district filters match expectations:
   - **District Collector** → only their district's rows
   - **Department Secretary** → only their department's rows (all districts)
   - **Palak Sachiv** → only assigned districts
   - **Chief Secretary / CSO** → state-wide (all rows visible)

Seeds 1 officer per role in `tests/fixtures/seed-officers.sql`.

## 5. Smoke-test all login options

Manual matrix walked through after deploy:
- Each of the 5 dropdown roles with a seeded email
- Wrong code → "Incorrect code"
- Expired code → "Code expired"
- 5 wrong attempts → lockout
- Resend before/after countdown
- Rate-limit (4th request in 15 min) → friendly error

## Technical Details

**Files changed:**
- `supabase/migrations/<new>.sql` — `request_login_otp` no longer returns `dev_code`; new `consume_pending_otp_for_dispatch` SECURITY DEFINER function; seed `test.admin@gmail.com`
- `supabase/functions/send-login-otp/index.ts` — fetch plaintext code via dispatch RPC, invoke `send-transactional-email`
- `supabase/functions/_shared/transactional-email-templates/login-otp.tsx` — new template
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register template
- `src/pages/LoginPage.tsx` — drop dev toast, longer cooldown, better rate-limit messaging
- `src/lib/auth-adapter.ts` — drop `devCode` field
- `tests/role-isolation.spec.ts` + `tests/fixtures/seed-officers.sql` — new

**Deploy order:** migration → setup_email_infra → scaffold_transactional_email → write template + edit send-login-otp → deploy edge functions → frontend changes → run Playwright suite.

**Out of scope:** SMS delivery (per earlier decision), Resend/SendGrid (Lovable Emails is the default).

---

To proceed, please:
1. **Confirm we should set up the email sender domain now** (you'll get a setup dialog with DNS instructions).
2. **Confirm OTP-only for the test admin** (no password), or tell me you want a QA password bypass instead.
