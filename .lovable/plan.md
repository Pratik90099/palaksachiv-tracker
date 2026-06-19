# Plan: Generate Password-Login SQL Migration for External Supabase Studio

## What
Produce one standalone `.sql` file that contains every database schema change required for the password-based login feature, so it can be copied and run directly in your self-hosted Supabase Studio SQL Editor.

## SQL Contents (idempotent)
1. **Ensure `citext` extension** (required by the app).
2. **`password_reset_requests` table** — audit/rate-limit table with indexes, GRANTs, RLS, and admin-only SELECT policy.
3. **`officers` column addition** — `password_login_enabled boolean NOT NULL DEFAULT false`, plus a one-time UPDATE to enable it for CSO admins, system_admin, and chief_secretary roles.
4. **`find_login_officer_public` RPC** — returns officer ID, role, is_cso_admin, and password_login_enabled (used by the frontend password tab).
5. **`request_password_reset_check` RPC** — rate-limits resets (3 per email / 15 min, 10 per IP / 15 min), checks role eligibility, logs to `password_reset_requests` and `audit_logs`.
6. **`log_password_login_attempt` RPC** — writes every password sign-in attempt to `audit_logs`.
7. **All necessary GRANTs** for `service_role`, `authenticated`, and `anon` where applicable.

## Upload Instructions
1. Open your self-hosted Supabase Studio in the browser.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the entire contents of the generated `.sql` file.
5. Click **Run**.
6. Verify success: refresh the Table Editor — you should see the `password_reset_requests` table and the new `password_login_enabled` column on `officers`.

## Out of Scope
- The `password-reset-request` Edge Function (separate deployment, not a Studio SQL upload).
- Frontend React code (assumed already deployed to your external server or will be built separately).

## Deliverable
A single downloadable `.sql` file saved to `/mnt/documents/password_login_migration.sql` with inline comments.