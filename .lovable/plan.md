

# Plan: Resolve All Security Findings

The portal uses anonymous Supabase sessions (no per-user `auth.users`) — all login is app-level via `authenticate-cso` and the planned Parichay edge function. Fixes below close the seven open findings without breaking that model.

## 1. `external_identities` — remove anon read access (migration)

Drop the public SELECT policy and restrict reads to authenticated only. Since the app reads identities only inside the `parichay-callback` and `authenticate-cso` edge functions (which use the service role and bypass RLS), removing anon read has zero UI impact.

```sql
DROP POLICY "Public can read external_identities" ON public.external_identities;
CREATE POLICY "Authenticated can read external_identities"
  ON public.external_identities FOR SELECT
  TO authenticated USING (true);
```

## 2. `notifications` — restrict reads + add Realtime channel policy (migration)

Drop the `Allow all access` (anon+auth, true) policy. Add:
- SELECT to `authenticated` only (no `anon`).
- INSERT/UPDATE/DELETE to `authenticated` only.
- An RLS policy on `realtime.messages` so only authenticated subscribers receive notification stream events.

```sql
DROP POLICY "Allow all access" ON public.notifications;
DROP POLICY "Public can read notifications" ON public.notifications;

CREATE POLICY "Authenticated can read notifications"
  ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write notifications"
  ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated realtime notifications"
  ON realtime.messages FOR SELECT TO authenticated USING (true);
```

The app already calls `supabase.auth.signInAnonymously()` on mount (see `auth-context.tsx`), so every browser session is "authenticated" from RLS's perspective — no UI break. Anonymous-from-the-internet readers are blocked.

## 3. Storage `documents` bucket — drop legacy public-role policies (migration)

Migration `…103709…` already added `authenticated`-scoped policies but the original `public`-role policies from `…060845…` were never dropped. Add explicit drops:

```sql
DROP POLICY "Allow document uploads" ON storage.objects;
DROP POLICY "Allow document reads"   ON storage.objects;
```

The `authenticated`-only policies remain, matching the bucket's `private` flag.

## 4. `generate-insights` edge function — require auth + CSO admin role

Currently any anonymous caller can spend AI credits. Add at the top of the handler:

- Read `Authorization: Bearer <jwt>` header; return 401 if missing.
- Verify the JWT with `supabase.auth.getClaims(token)`; return 401 on failure.
- Look up the caller in `officers` by email and require `is_cso_admin = true` OR role in (`chief_secretary`, `system_admin`); return 403 otherwise.
- Add a simple in-memory per-IP rate limit (mirrors `authenticate-cso`): max 10 generations per 15 min.

The frontend already uses `supabase.functions.invoke` which forwards the anon-session JWT, so the call continues to work for signed-in CSO users.

## 5. `authenticate-cso` — remove hardcoded plaintext credentials

- Delete the `DEFAULT_USERS` array entirely.
- If `CSO_USERS_JSON` is unset, return a clear 503 config error instead of falling back.
- Update `loadUsers()` accordingly; no behavioural change when the secret is properly set.
- Add a one-line note in the response explaining how to configure the secret.

After deploy I'll instruct the user (in the implementation message, not here) to:
1. Rotate the now-public `cso@2026` password.
2. Set `CSO_USERS_JSON` with bcrypt-hashed passwords (we'll add bcrypt verification too: import `https://deno.land/x/bcrypt@v0.4.1/mod.ts` and switch `timingSafeEqual` on the password to `bcrypt.compare`). Email comparison stays constant-time.
3. Treat the two leaked emails as compromised for this service.

## 6. Mark findings resolved

After the migrations and edge-function deploys land, call `security--manage_security_finding` with `mark_as_fixed` for all seven findings, with explanations referencing each change.

## Files changed

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Items 1, 2, 3 — RLS tightening + storage cleanup + realtime policy |
| `supabase/functions/generate-insights/index.ts` | Auth + CSO-role gate + rate limit |
| `supabase/functions/authenticate-cso/index.ts` | Remove `DEFAULT_USERS`; require `CSO_USERS_JSON`; bcrypt password compare |

## What this delivers

- No anonymous reads of identity data, notifications, or storage objects.
- Realtime notification stream restricted to authenticated subscribers.
- AI Insights generator can no longer be triggered or bill credits anonymously — only CSO admins.
- No real names, emails, or passwords remain in source code; the function fails closed without proper configuration.
- All seven Security Hub findings move from open → fixed.

## Operator follow-up (after deploy)

- Set `CSO_USERS_JSON` with bcrypt-hashed passwords (format: `[{"id","name","email","password_hash"}]`).
- Rotate the previously-hardcoded `cso@2026` password.
- Confirm CSO sign-in still works end-to-end, then verify the Security Hub view is clean.

