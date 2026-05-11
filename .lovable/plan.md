## Scope

Thirteen items spanning bug-fixes, feature additions, security/architecture, and content. I'll group them into 5 workstreams and sequence them so blockers (JWT refactor, dynamic roles) land before features that depend on them.

---

## Workstream A — Insights bug-fix & AI telemetry (items 1, 12, 13)

**Diagnose item 1 ("Edge Function returned non-2xx")**
- Edge function logs show only boot/shutdown — function isn't actually being hit, or crashes before logging. Suspect: `GEMINI_API_KEY` env read inside `Deno.serve` throws synchronously; or auth header missing because Insights page is called from a CSO admin session that has no `auth.users` JWT (only `x-cso-email`), so `userClient.auth.getClaims(token)` rejects → 401 with no body the client surfaces.
- Fix: drop the `getClaims` requirement for app-level CSO sessions. Replace with anon-key bearer + mandatory `x-cso-email` validated against `officers` (already done lower in the file). Return descriptive JSON for every failure path.
- Add a `?health=1` GET returning `{ok:true, gemini:!!key}` for one-shot smoke testing from the UI.

**Item 12 — End-to-end test**
- After fix, click "Generate Insights" → verify either Gemini or fallback path persists `ai_insights` and `ai_call_logs` row, and toast shows provider suffix on fallback.

**Item 13 — `/admin/ai-telemetry` page**
- New route gated to `is_cso_admin` only.
- Charts: calls/day stacked by provider, avg latency line, error-rate %, table of last 100 rows.
- Uses `recharts` (already a dep). Reads from `ai_call_logs` directly via RLS (already authenticated-readable).

---

## Workstream B — Manage Officer + dynamic Roles/Agencies (items 4, 11)

**New tables**
- `roles` (`key` text PK, `label_en`, `label_mr`, `is_system` bool, `created_at`). Seed with the 7 existing role keys, all `is_system=true`.
- `agencies` (`id`, `name`, `short_name`, `type` text, `parent_department_id` FK→departments null, `is_active`, timestamps). Replaces free-text `tasks.agency`.
- RLS: public SELECT; admin-only INSERT/UPDATE/DELETE.

**Edge function `manage-officer`**
- Service-role bypasses the anonymous-session gap.
- Header `x-cso-email` → look up officer → require `is_cso_admin=true` (or `chief_secretary`).
- Actions: `create | update | deactivate | set_role`. **Role changes accepted only from this function** (item 4) — UI hides the role dropdown for non-admins; backend rejects non-admin role mutations.
- Logs every action to `ai_call_logs`-style audit table `officer_audit_logs`.

**UI**
- `UserManagementPage` rewritten to invoke `manage-officer` instead of direct table writes.
- "Manage Roles" and "Manage Agencies" dialogs (admin-only) for CRUD.
- `OfficerFormDialog`: role dropdown driven by `roles` table; agency multiselect filtered by selected department.
- Refresh `useData` officer cache after each successful action.

---

## Workstream C — Per-user JWT refactor scoping (item 10)

**Goal:** every officer login produces a real Supabase auth user (anon-disabled), so `auth.uid()` is meaningful and we can lock `officers.email/phone` to admins via column-level RLS without breaking joins (joins move to `officers_directory` view exposing only safe cols).

**Approach (scoped — implementation in a follow-up PR)**
1. Extend `verify_login_otp` to call an internal edge function that mints a Supabase magic-link / signs in via service role (`admin.createUser` once, then `admin.generateLink('magiclink')` and exchange).
2. Replace `bind_session_officer` with a deterministic mapping: `auth.users.email = officers.email`; insert into `user_roles` based on officer role (admin / authenticated). Trigger on first login.
3. Migrate every edge function that currently reads `x-cso-email` to use `auth.getUser(token)` → look up officer by `email`. Header becomes a fallback for legacy clients during rollout.
4. Tighten `officers` SELECT policy: split into two policies (admin → all cols; authenticated → safe cols via `officers_directory` view). Drop `Authenticated read officers safe columns` blanket policy.
5. Frontend: `auth-adapter.ts` stores the real session; `useAuth` exposes `supabase.auth.getSession()` instead of localStorage user.

**Risk register:** OTP UX must not regress; QA bypass account (`pratikbbavi@gmail.com`) needs a real auth.users row pre-seeded; realtime channels must rebind on token refresh.

This workstream ships as a separate PR after B is verified in production.

---

## Workstream D — Collaboration features (items 2, 3, 5, 6)

**Item 2 — Profile pictures**
- New storage bucket `avatars` (public), folder per officer id.
- `officers.avatar_url` text column.
- `ProfilePage`: upload widget (≤2 MB, jpg/png/webp), client-side crop to square, write to bucket, update officer row via `manage-officer`.
- Sidebar + header show avatar with initials fallback.

**Item 3 — Confirmatory dialogs on critical updates**
- New `<ConfirmDialog>` primitive wrapping `AlertDialog`.
- Wrap: officer create/update/deactivate, role change, project/task delete, marking issue critical, GoI-pending toggle, closure sign-off, CS Remarks deadline change.
- All confirmations log a row to `audit_logs` with before/after JSON (extend existing audit table or create one).

**Item 5 — @mention by designation/role**
- New RPC `search_mention_targets(_q text)` returning officers + virtual handles like `@collector.mumbai_city`, `@palak.pune`, `@deptsec.health`.
- Reusable `<MentionTextarea>` (uses `@tiptap/extension-mention` or lightweight popover) plugged into `TaskFormDialog` description, Minutes editor, Remarks composer.
- Mentions stored as `[{handle, officer_id, scope}]` JSONB array on the parent record; rendered as chips; trigger notification to each resolved officer (uses `notifications.recipient_officer_id` from prior PR).

**Item 6 — "Message admin" escape hatch**
- Floating "Report a problem" button (footer + global error boundary) → opens dialog capturing message, current route, last console error.
- Edge function `report-issue` writes to new `support_tickets` table and emails the CSO admin via the existing `send-login-otp` Gmail connector (reuse transport).
- Admin sees tickets at `/admin/support`.

---

## Workstream E — Branding, GIGW pages, and user manual (items 7, 8, 9)

**Item 8 — Logo swap**
- User must upload the official Maharashtra State Emblem (Ashoka pillar + "महाराष्ट्र शासन") — I'll add a placeholder slot now (`src/assets/maharashtra-emblem.svg`) and ask for the asset in the next step.
- Replace blue GS logo across `AppSidebar`, `LoginPage`, `SiteFooter`, favicon, OG image.
- Keep the existing wordmark "Guardian Secretary Portal" beside the emblem.

**Item 9 — GIGW static pages**
Create routes + content for:
- `/accessibility-statement` (WCAG 2.1 AA conformance, contact for accessibility issues, font-size A- A A+ tested, skip-link present)
- `/privacy-policy` (data classes, retention 10y, lawful basis, grievance officer)
- `/terms-of-use`
- `/copyright-policy`
- `/hyperlinking-policy`
- `/sitemap` (auto-generated from route registry)
- `/contact-us` (CSO address, helpline, support email — wired to item-6 form)
- `/help` (links to user manual below)

Footer (`SiteFooter.tsx`) gets all GIGW-required elements: emblem, "Content owned by Chief Secretary's Office, Government of Maharashtra", "Last Updated: <build date>", visitor counter (already added), accessibility toolbar (A- A A+ + high-contrast), language switch (EN/MR scaffold), STQC logo placeholder, link block for the 8 pages above. Add `<a href="#main-content" class="skip-link">` at top of `AppLayout`.

**Item 7 — User manual (digital, end-users only)**
- `/help/user-manual` route serving an MDX-rendered manual broken by role:
  - Common: login & OTP, navigation, search, notifications, raising support
  - District Collector: critical issues, GoI-pending, visits
  - Department Secretary / Palak Sachiv: tasks, minutes, compliance scoring
  - Chief Secretary: scorecard, remarks, escalation matrix
- Provide a "Download PDF" button that fetches a pre-generated `/public/docs/user-manual-v1.pdf` (I'll generate via puppeteer-like script post-approval).
- Admin manual deliberately excluded as requested.

---

## Sequencing (4 PRs)

1. **PR-1 (this batch)** — Workstream A (Insights fix + telemetry page) and Workstream E item 8 + 9 + 7. Low-risk, user-visible wins.
2. **PR-2** — Workstream B (Manage Officer + dynamic roles/agencies + role-change lock).
3. **PR-3** — Workstream D (avatars, confirm dialogs, mentions, support tickets).
4. **PR-4** — Workstream C (per-user JWT refactor) + tighten officer column RLS.

---

## Out of scope / deferred

- SMS OTP, full Marathi i18n translations of every page (scaffold only), Parichay SSO production wiring, mobile app.

---

## Verification checklist

- [ ] Insights "Generate" returns 200 with provider field; on forced 429 falls back; on missing key returns descriptive 502.
- [ ] `/admin/ai-telemetry` shows recent rows and renders charts.
- [ ] Non-admin officer cannot change own or others' role (UI hidden + backend rejects).
- [ ] Role and agency CRUD reflected in officer form dropdowns immediately.
- [ ] Avatar upload appears in sidebar within 1s.
- [ ] Critical updates show confirm dialog before persisting.
- [ ] `@collector.mumbai_city` resolves and notifies the right officer.
- [ ] "Report a problem" creates a ticket and emails admin.
- [ ] Maharashtra emblem visible everywhere; old blue GS logo removed.
- [ ] All 8 GIGW pages reachable from footer; skip-link works; A-/A/A+ controls resize body text.
- [ ] User manual PDF downloads and matches in-app content.

---

## Open question before I start PR-1

1. **Maharashtra emblem asset (item 8)** — do you have the official SVG/PNG you want me to use, or should I generate a faithful rendering and let you replace it later?
2. **User manual depth (item 7)** — short reference (≈10 pages, screenshots optional) or full walkthrough (≈30+ pages with annotated screenshots)?
