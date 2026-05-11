## Go-Live Readiness Plan

### 1. Fix OTP login (blocker)
**Root cause**: `pgcrypto` is installed in the `extensions` schema, but `request_login_otp` and `verify_login_otp` run with `SET search_path = 'public'`, so unqualified calls to `gen_salt(...)` and `crypt(...)` fail with `function gen_salt(unknown, integer) does not exist`.

**Fix (migration)**: Recreate both functions with `SET search_path = public, extensions` (and qualify the calls as `extensions.gen_salt` / `extensions.crypt` defensively). No behavior change otherwise — QA bypass (`pratikbbavi@gmail.com` / `567890`) is preserved as the user requested for the auditor.

### 2. End-to-end OTP smoke test
After the migration:
- Real flow: request OTP for a seeded officer → confirm `send-login-otp` edge function dispatches via Gmail → verify code logs the user in.
- QA bypass: confirm `pratikbbavi@gmail.com` + code `567890` still grants instant login for all 5 roles.
- Rate limiting (3/15min) and 5-attempt lockout still enforced.

### 3. Backend wiring audit
- **Edge functions** (`send-login-otp`, `generate-insights`, `process-document`): redeploy and curl-test each. Confirm CORS, auth header validation, and that secrets (`LOVABLE_API_KEY`, `GOOGLE_MAIL_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are present.
- **RLS sanity sweep** via `supabase--linter`: fix any new warnings introduced since the last security pass.
- **Triggers**: confirm `audit_logs` triggers on `tasks` and `meeting_minutes` fire (insert a test row, check `audit_logs`).
- **Storage**: confirm `documents` bucket policies still gate uploads correctly.

### 4. Cleanup of unwanted / stale files
Sweep the repo for:
- Orphan migrations or `.bak` files in `supabase/migrations/`
- Unused pages/components not referenced from `App.tsx` or `AppSidebar.tsx`
- Dev-only console logs and TODOs in production paths
- Stale entries in `.lovable/plan.md`

Only delete files confirmed unreferenced by `rg`.

### 5. Production hardening checklist
- Confirm Lovable Auth settings: signup disabled (OTP only), no anonymous users.
- Confirm session timeout (30m) and concurrent-session cap (2) are wired.
- Confirm all 5 login roles resolve to a seeded officer.
- Verify Help/Contact: `cs@maharashtra.gov.in` (CC `bavipratik@gmail.com`, `rishishirke65@gmail.com`), helpdesk `022 22025042`, no NIC references.
- Verify `/admin/audit-trail` access gating.
- Run `security--run_security_scan`; address any high/critical findings.

### 6. Publish
Once 1–5 pass, prompt the user to click **Publish** to push the frontend live. Backend (migrations + edge functions) deploys automatically.

### Out of scope (per your instructions)
- Removing the QA bypass — kept intentionally for the auditor. Will flag clearly so it can be removed later in one migration.

---

**Technical detail — exact migration for step 1:**
```sql
CREATE OR REPLACE FUNCTION public.request_login_otp(_email text, _role text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$ ... existing body, with crypt(...) and gen_salt(...) unchanged ... $$;

CREATE OR REPLACE FUNCTION public.verify_login_otp(_email text, _role text, _code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$ ... existing body unchanged ... $$;
```
