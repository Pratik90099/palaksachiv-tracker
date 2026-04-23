# Backend production readiness assessment

_Last reviewed: 2026-04-23 (rechecked after latest repo update)_

## Verdict

**Not fully production-ready yet.**

The backend has strong foundations (schema migrations, edge functions, basic input validation), but several parts are explicitly marked demo/stub and require completion before a secure production launch.

## What is ready

- Database migrations and portable schema exist under `supabase/migrations/` and `docs/db/full_schema.sql`.
- Edge functions are implemented for `authenticate-cso`, `process-document`, and `generate-insights`.
- Basic validation and error handling are present in document and insights flows.

## What is not ready (must-fix)

1. **Parichay SSO is still a stub**
   - `supabase/functions/parichay-callback/index.ts` always returns `501` and explicitly says OAuth credentials are pending.

2. **Default CSO credentials are hard-coded fallback values**
   - `supabase/functions/authenticate-cso/index.ts` includes default users and plaintext passwords as fallback when `CSO_USERS_JSON` is missing.

3. **Demo auth path is still enabled in development and can be enabled via env**
   - `src/lib/auth-adapter.ts` includes mock role login and demo mode behavior.
   - `src/lib/auth-context.tsx` auto-bootstraps anonymous Supabase sessions for demo compatibility.

4. **RLS posture is permissive for reads in current policy pattern**
   - Migrations include policies granting broad read access to `anon` and `authenticated`.

## Go-live checklist

- Implement full OAuth callback exchange and token/user verification for Parichay SSO.
- Remove hard-coded fallback credentials; require rotated secrets only.
- Disable demo login paths (`VITE_DEMO_MODE=false`) and remove mock accounts from production bundle.
- Tighten RLS by role and row ownership; remove public-read where sensitive.
- Add backend integration tests for auth, RLS, and edge functions.
- Add secret scanning and credential rotation process.


## Recheck notes

- Re-ran a repository scan after the latest commits and the same production blockers are still present (SSO stub, fallback credentials, demo auth path, permissive read policies).
