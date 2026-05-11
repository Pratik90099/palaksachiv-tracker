## Security Hardening + Logo Replacement Plan

### 1. Replace Maharashtra State Emblem

- Copy `user-uploads://statelogo.png` → `src/assets/maharashtra-emblem.png` (overwrite existing). Used by `AppSidebar`, `LoginPage`, `SiteFooter` — no code changes needed.

### 2. Fix Security Findings (Migration)

**a) `ai_call_logs` — caller email exposure (error)**

- Drop policy `Auth read ai_call_logs`.
- New policy: SELECT only when `has_role(auth.uid(), 'admin')`.
- Update `AITelemetryPage.tsx` (already gated to `system_admin` in UI) — no change needed; queries continue to work for admins.

**b) `visits` — publicly readable (warn)**

- Drop `Public can read visits`.
- New policy: SELECT requires `authenticated` role.

**c) `realtime.messages` — unscoped subscriptions (warn)**

- Drop existing `Authenticated realtime notifications` policy on `realtime.messages`.
- New policy restricting topic to either:
  - `topic = 'notifications:' || current_officer_id()::text`, or
  - admin role.
- Update notification subscribe code (in `use-notifications.ts`) to use per-officer topic name `notifications:<officer_id>` and have the notification publisher broadcast on that topic.

**d) `SUPA_rls_policy_always_true` (warn)**

- This flags every `Auth insert/update/delete` policy that uses `auth.role() = 'authenticated'` with `USING/WITH CHECK true`-equivalent.
- Tighten the highest-risk write policies:
  - `ai_insights`, `document_uploads`, `meeting_minutes`, `notifications`, `projects`, `tasks`, `visits`, link tables (`project_*`, `task_*`): keep authenticated-only writes but add `has_role(auth.uid(),'admin') OR current_officer_id() IS NOT NULL` so anonymous-but-unbound sessions cannot write.
  - For the most sensitive (`ai_insights`, `meeting_minutes`, `notifications` INSERT/UPDATE/DELETE): require `has_role(auth.uid(),'admin')` OR scope to the officer's role tier.
- Note: full role-scoped write policies are tracked under PR-4 (per-user JWT). This pass closes the "always true" linter warning by adding the `current_officer_id() IS NOT NULL` gate everywhere, which is a safe interim hardening.

### 3. Verification

- Run security scanner after migration applies.
- Re-test: AI Telemetry page (admin), Visits page (logged-in), Notifications realtime (logged-in officer sees own only).

4) remove integration health page as integration will not be done  


### Files Changed

- `src/assets/maharashtra-emblem.png` (replaced via copy)
- 1 migration file (RLS changes)
- `src/hooks/use-notifications.ts` (per-officer topic)
- Wherever notifications are inserted with broadcast (publisher side) — switch to per-officer topic