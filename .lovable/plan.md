## Goals

1. Note that you'll be wiring email delivery through your own external cloud provider — not Lovable's managed email infra — so I won't scaffold any Lovable email domain.
2. Confirm email-based authentication is already active (the existing OTP login). No code changes needed for the auth flow itself.
3. Seed 38 District Collector records into `officers` so they can sign in.

---

## 1. Email delivery (external cloud)

Today, OTP emails go out via the `send-login-otp` edge function using the connected Gmail account. You said you'll plug in an external cloud-based email provider yourself.

Action items:

- I'll **leave** the current `send-login-otp` edge function and Gmail relay in place so login keeps working until you swap it.
- I'll **add a short comment block** at the top of `send-login-otp/index.ts` documenting the swap-in point: replace the Gmail fetch call with your provider's API (SES, SendGrid via your account, Postmark, etc.), keeping the same input contract (`{ otp_id, code }`) and the same DB lookup so the email-relay abuse protection stays intact.
- No domain config is touched in Lovable. No Lovable Email infra scaffolded.

If you later want me to wire a specific provider (you supply API key as a secret), tell me which one and I'll do that change.

## 2. Email-based authentication

The portal already runs on **passwordless email OTP** — that is email-based authentication. Login flow:

```text
Login page → enter email + role → request_login_otp RPC →
send-login-otp edge fn emails 6-digit code →
user enters code → verify_login_otp RPC → session created
```

Confirming nothing to change here. The QA bypass (`pratikbbavi@gmail.com` / `567890`) stays until you ask me to remove it before production.

## 3. Seed District Collectors

Insert 38 rows into `public.officers` with `role = 'district_collector'`, `is_active = true`, mapped to the correct `district_id`.

District-name mapping (your list → DB name):

- "Chhatrapati Sambhaji Nagar" → **Chhatrapati Sambhajinagar**
- All others match exactly.

Special cases:

- **Palghar** collector  Dr. Indurani Jakhar) `role = 'district_collector'`
- **Ahilyanagar** Dr. Pankaj Ashiya — Collector `role = 'district_collector'`. Same caveat.
- **Mumbai Suburban** (Saurabh Katiyar) has no email in your sheet — using `collector.mumbaisuburb@maharashtra.gov.in` as you specified.

Insert strategy:

- Use a single SQL `INSERT ... SELECT` against `districts` for clean district_id resolution.
- Skip rows whose email already exists in `officers` (idempotent — safe to re-run).
- Set `designation = 'District Collector'` for all 
- Store `phone` as provided.

After insert, total expected: **36** new collector records (+0 if any duplicates already present).

You'll be able to verify in **User Management** and they can log in immediately by selecting "District Collector" role on the login page once email delivery is wired through your provider.

---

## Files / changes

- `supabase/functions/send-login-otp/index.ts` — small comment block documenting the external-provider swap point. No behavior change.
- One **data insert** (not a schema migration) into `public.officers` with the 38 collectors.
- No frontend changes.
- No new tables, RLS, or migrations.

## Out of scope

- Wiring a specific external email provider (waiting on your choice + API key).
- Removing the QA bypass account.
- Any change to the OTP flow itself.
- Collectors need not have visit report option it is only for guardian secretary