## Why data is empty on the live site

You don't need to replace any file. Your `.env` is committed (not gitignored) and `src/integrations/supabase/client.ts` correctly reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`, so the published build can reach the database.

The real cause is almost certainly that **the live (published) build is older than your current preview**. Recent work introduced critical pieces that the published bundle doesn't have yet:

- `bind_session_officer(officer_id)` RPC + `session_officer_map` table — used to map your auth session to an `officers` row.
- `current_officer_id()` security-definer function — every scoped RLS policy on `tasks`, `projects`, `visits`, `visit_attachments`, `visit_comments`, `notifications`, etc. depends on it.
- `auth-adapter.ts` / `auth-context.tsx` changes that call `bindOfficerSession(officerId)` right after OTP verify.

Without that binding step, when you log in on the live site:
- `current_officer_id()` returns `NULL`
- All scoped `SELECT` policies (visits, notifications, scoped tasks) return zero rows
- `officers` SELECT works (policy is `true`) but most dashboards/tables that join through scoped tables look empty
- Writes (creating a visit, comment, attachment) fail with RLS errors

That matches "districts/departments/users not visible after I log in" — districts and departments tables are public-readable, so if even those look empty in the live UI, the live JS bundle is also failing earlier (stale code referencing renamed hooks/types) and React is not rendering the lists at all.

## Recommended action (no code change)

1. **Open the editor → Publish → click "Update"** to republish the current preview to your live URL. This is the single fix for "live is behind preview". Frontend changes only go live after Update; backend (RLS, RPCs) is already live.
2. Hard-refresh the live URL (Ctrl/Cmd-Shift-R) to drop the cached old bundle.
3. Log in again with OTP and reopen the dashboard.

## If data is still empty after republishing

Then the issue is RLS scoping, not deployment. We would need to check:

- That `bind_session_officer` is being called successfully after OTP verify (look at network tab → `/rest/v1/rpc/bind_session_officer` returns 204).
- That a row exists in `session_officer_map` for your `auth.uid()`.
- That your logged-in email actually matches an `officers.email` row whose `district_id` / `department_id` is set — otherwise scoped reads correctly return empty.
- Edge function logs for `send-login-otp` for the live request.

If after Update + hard refresh the live site is still empty, reply and I'll switch to debug mode and check `session_officer_map`, the officer row for your test email, and the network calls on the live URL.

## Files involved (for reference, no replacement needed)

- `src/integrations/supabase/client.ts` — auto-generated, reads env vars correctly
- `.env` — already committed, contains correct URL + publishable key
- `src/lib/auth-adapter.ts`, `src/lib/auth-context.tsx` — must be in the published bundle (republish ensures this)
- DB functions `bind_session_officer`, `current_officer_id`, `can_see_visit` — already live in the database
