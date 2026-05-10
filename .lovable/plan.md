
# Gmail OTP delivery + QA bypass code

Two changes bundled together:
1. Replace the dev-toast with **real OTP emails sent from Gmail** (free, no domain needed)
2. Add a **QA bypass code `567890`** that always works for `pratikbbavi@gmail.com`

---

## 1. Gmail-based OTP delivery

Use the **Gmail connector** — sends OTPs from your own Gmail account via the Lovable connector gateway.

**Trade-offs:**
- ✅ Free, no DNS, no domain wait
- ✅ Sends from a real Gmail address you control
- ⚠️ Recipients see your Gmail address as sender (not `@gov.in`)
- ⚠️ ~500 sends/day Gmail limit (plenty for portal logins)
- Later swap-in: branded `@yourdomain` via Lovable Emails — no rewrites needed

**Steps:**
1. **Connect Gmail** — one-click OAuth, grant `gmail.send` scope. Sign in with whatever Gmail account should be the sender (e.g. a project ops mailbox).
2. **Migration:**
   - Drop `dev_code` from `request_login_otp` JSON response (no more leaking codes to the browser)
   - New `consume_pending_otp_for_dispatch(otp_id uuid)` SECURITY DEFINER function — returns `{code, recipient_email, recipient_name, role}` exactly once, marks OTP as dispatched
3. **Rewrite `send-login-otp` edge function:**
   - Accept `{otp_id}` from frontend
   - Call `consume_pending_otp_for_dispatch` via service-role Supabase client
   - Build branded HTML email (navy header, gold accent, large monospace 6-digit code, 10-min validity, "didn't request?" footer)
   - POST to `https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send` with base64url-encoded RFC-2822 message
   - Auth headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${GOOGLE_MAIL_API_KEY}`
4. **Frontend cleanup:**
   - `auth-adapter.ts`: remove `devCode` field from `OtpRequestResult`
   - `LoginPage.tsx`: drop dev toast, just show "Code sent to your registered email — check spam"

---

## 2. QA bypass code

Whitelist: `pratikbbavi@gmail.com` + bypass code `567890`.

**Implementation in `verify_login_otp` RPC** (single change, server-side enforced):
```sql
-- At the top of verify_login_otp, before the OTP lookup:
IF lower(_email) = 'pratikbbavi@gmail.com' AND _code = '567890' THEN
  -- Skip OTP table check; load officer directly
  v_officer := public.find_login_officer(_email::citext, _role);
  IF v_officer.id IS NULL OR v_officer.is_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'officer_inactive');
  END IF;
  -- ...build same success response as normal path...
END IF;
```

**Companion changes:**
- Seed `pratikbbavi@gmail.com` into `officers` if not already there: `role = department_secretary`, `is_cso_admin = true`, `is_palak_sachiv = true`, `is_active = true`. With these flags they can sign in as **all 5 roles** (collector test will need a `district_id` — assign Pune so the role works).
- Wait — collector role isn't auto-granted by flags. To let one email test all 5 roles, the simplest path is to update `find_login_officer` to also allow the bypass email through `district_collector` and `chief_secretary` paths. I'll add a small whitelist: if the email is `pratikbbavi@gmail.com`, any of the 5 roles is allowed.
- Frontend: no changes needed — the user just types `567890` like a normal code.

**Security note:** The bypass is hard-coded server-side in a SECURITY DEFINER function. Plaintext code never leaves the DB. Restricted to one specific email. To remove later: one-line migration. I'll add a clear `-- QA BYPASS — REMOVE BEFORE PRODUCTION` comment.

---

## 3. Test admin (`test.admin@gmail.com`)
Seeded into `officers` with `system_admin` + `is_cso_admin` + `is_palak_sachiv = true`. **Receives real Gmail OTP** (no bypass — only the pratikbbavi email gets the bypass).

If you want the bypass code to work for `test.admin@gmail.com` too, say so and I'll add it.

---

## 4. Resend UX polish (small)
- Initial cooldown 30s → 60s (matches the 3/15min backend rate-limit better)
- On `rate_limited` from RPC → show "Too many requests — try again in a few minutes" and disable Resend for 60s
- Tiny "Didn't get it? Check spam." hint under the OTP input

---

## 5. Smoke-test all login options
After deploy, manual matrix:
- All 5 roles via `pratikbbavi@gmail.com` + bypass `567890` → instant login → land on Home
- `test.admin@gmail.com` → real Gmail OTP → check inbox → verify
- Wrong code, expired, 5-attempt lockout, resend cooldown, rate-limit
- After login as each role: confirm the data scoping (Projects/Visits page row counts match the role)

---

## Files

- `supabase/migrations/<new>.sql` — `consume_pending_otp_for_dispatch`, updated `request_login_otp`, updated `verify_login_otp` (with QA bypass), updated `find_login_officer` (allow bypass email through all roles)
- Insert: seed `pratikbbavi@gmail.com` and `test.admin@gmail.com` officers
- `supabase/functions/send-login-otp/index.ts` — Gmail send via gateway
- `src/lib/auth-adapter.ts` — drop `devCode`
- `src/pages/LoginPage.tsx` — drop dev toast, polish resend

## Order of operations
1. You approve plan
2. Connect Gmail (one-click prompt)
3. Migration → seed → edge function → frontend → deploy
4. You test: bypass code instant-login as any role with `pratikbbavi@gmail.com` + `567890`, real OTP at `test.admin@gmail.com`
