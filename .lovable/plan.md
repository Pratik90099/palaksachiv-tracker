# Plan: Security, AI Reliability, Admin Telemetry, GIGW & Extensibility

This is a large multi-area change. I've grouped it into 6 workstreams. Each ships a clear outcome.

---

## 1. Security hardening (database + realtime)

**Problem:** Sensitive PII (officer emails/phones, guardian secretary emails, external identities) is readable by every authenticated session — and because the app uses anonymous Supabase sessions, that's effectively every visitor. `has_role` allows arbitrary user-ID probing. Notifications realtime is unscoped.

**Changes (single migration):**

- `**officers` table** — replace `Authenticated read officers` with two policies:
  - Admins (`has_role(auth.uid(),'admin')`) and CSO/CS roles can read full rows.
  - Create a SECURITY INVOKER **view** `public.officers_directory` exposing only safe columns (`id, name, designation, role, district_id, department_id, is_active`) — used everywhere the UI just needs a name/title. Update `useData`/forms to read from the view by default.
- `**guardian_secretaries**` — restrict SELECT to `has_role(auth.uid(),'admin')`. Create `public.guardian_secretaries_public` view (id, name, designation, district_id) for general UI.
- `**external_identities**` — restrict SELECT to `has_role(auth.uid(),'admin')` only (drop the broad authenticated read).
- `**has_role(_user_id, _role)**` — add guard: `IF _user_id <> auth.uid() AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id=auth.uid() AND role='admin') THEN RETURN false; END IF;` so callers can only probe themselves unless they're already admin.
- `**notifications` realtime** — add `recipient_officer_id uuid` column (nullable for broadcast), then RLS policy `recipient_officer_id IS NULL OR recipient_officer_id = (SELECT officer_id FROM current session mapping)`. Since the app doesn't currently map auth.uid → officer, we'll add a `session_officer_map` table populated by the OTP verify flow and read by a SECURITY DEFINER helper `current_officer_id()`. Realtime publication policy uses that helper.

**Frontend touch-ups:**

- Update queries that hit `officers`/`guardian_secretaries` for directory display to use the new public views.
- Pages used by admins/CSO (UserManagement, OfficerFormDialog) keep using base tables — they'll still work because their callers satisfy the new admin policy (after we wire the JWT/officer mapping below).

---

## 2. AI reliability — Gemini + Lovable Gateway fallback + better errors

Both `process-document` and `generate-insights` currently call Gemini directly. If Gemini returns 429 or 403/RESOURCE_EXHAUSTED or 5xx, we fall back to the Lovable AI Gateway (`google/gemini-2.5-flash`) using the existing `LOVABLE_API_KEY` secret.

- Wrap the Gemini call in a helper `callAIWithFallback({system, user, tools?})` that:
  1. Tries Gemini direct.
  2. On 429 / 403-quota / 5xx (or network error), retries via Lovable Gateway with equivalent OpenAI-style payload.
  3. Returns `{provider, latencyMs, status, payload}`.
- **Error mapping → UI:** propagate explicit messages: `"AI quota exhausted (Gemini + fallback)"`, `"AI rate-limited, please retry in N seconds"`, `"AI service error (5xx)"`. Surface them in toast + the page error block.
- **Resolve "Failed to send a request to the Edge Function"** on Insights:
  - Root cause is almost certainly the `x-cso-email` header check rejecting the caller (silent 403 swallowed by `supabase.functions.invoke` → generic FunctionsHttpError). Fix:
    - Always send `x-cso-email` from the client (currently only set in some flows).
    - Return descriptive JSON error bodies with CORS headers (already done) and surface the body on the client via `data?.error` instead of just the thrown message.
  - Add a preflight ping (`?health=1` GET) the page can call to confirm the function is reachable before "Generate Insights".

---

## 3. Admin telemetry — Gemini usage dashboard

- New table `ai_call_logs` (function_name, provider, status, latency_ms, error_code, prompt_tokens?, completion_tokens?, created_at, caller_email). RLS: admin/CSO read, edge functions insert via service role.
- Both edge functions write one row per call (success or failure) — no PII (no prompt/response stored).
- New page `**/admin/ai-telemetry**` (CSO/admin only) showing per-day for last 30 days:
  - Total calls, avg latency, error rate, breakdown by provider (Gemini direct vs fallback) and by function.
  - Simple charts via existing `recharts` (already in repo via shadcn `chart.tsx`).

---

## 4. User Management — fully working + edge function reflects changes

- Audit `UserManagementPage` + `OfficerFormDialog`: ensure create / edit / activate-deactivate writes go through (currently RLS requires `has_role(auth.uid(),'admin')` which the anonymous session does NOT satisfy → silent failures).
- Add lightweight server-side admin check via new edge function `manage-officer` (service-role) gated by the same `x-cso-email` header pattern hardened by lookup against `officers.is_cso_admin OR role IN ('chief_secretary','system_admin')`.
- All officer CRUD goes through `manage-officer`, so changes are reflected immediately and bypass the anonymous-session RLS gap until the full per-user JWT refactor lands.
- After any officer change, refresh the cached officers list in `useData`.

---

## 5. Dynamic roles & agencies (extensibility)

- New tables:
  - `roles` (key text PK, label_en, label_mr, is_system bool, created_at) — seed with the existing 5.
  - `agencies` (id, name, short_name, type, parent_department_id nullable, created_at) — independent of `departments` but mappable to one.
- `officers.role` becomes FK-like text referencing `roles.key` (kept as text for compat). Add `officers.agency_id` nullable.
- UI:
  - User Management → "Manage Roles" dialog (admin only): add/edit/disable non-system roles.
  - User Management → "Manage Agencies" dialog: CRUD agencies, choose parent department.
  - Officer form: role dropdown reads from `roles`; new "Agency" select reads from `agencies` filtered by selected department.
- Login dropdown stays the 5 system roles (auth flow unchanged); custom roles are for assignment/visibility only in this iteration.

---

## 6. GIGW compliance + visitor counter

GIGW = Guidelines for Indian Government Websites. We'll add the items that apply to a logged-in portal:

- **Header/footer:**
  - Government of Maharashtra emblem + portal title (already present — verify).
  - Footer with: "Last Updated: &nbsp;", "Content owned by Chief Secretary's Office, Govt. of Maharashtra", links to *Accessibility Statement, Privacy Policy, Terms, Hyperlinking Policy, Copyright Policy, Help, Sitemap, Contact Us*.
  - Visitor counter (see below) + "Best viewed in…" line.
- **Accessibility (WCAG 2.1 AA):**
  - Add skip-to-main-content link, ensure all interactive elements have aria-labels, audit color contrast, add `lang="en"`/`lang="mr"` switching, font-size A- A A+ control in header.
- **New static pages:** `/accessibility`, `/privacy`, `/terms`, `/copyright`, `/hyperlinking`, `/sitemap`, `/contact`, `/help` (Help already exists).
- **Visitor counter:**
  - Table `site_visits (id, visited_at, session_hash)`. Edge function `record-visit` (public, no auth) called once per browser session (sessionStorage flag) inserts a row.
  - Footer widget shows total + today's count via lightweight RPC `get_visitor_counts()` returning `{total, today}`.

---

## Out of scope (explicit)

- Replacing the anonymous-session RLS architecture with per-user JWTs (tracked separately as the big auth refactor — items 1 and 4 are mitigations until then).
- SMS OTP delivery.
- Translating every page to Marathi (we add the toggle + key static pages; full content i18n is a follow-up).
- in task management allow department secretary and chief secretary to assign task to any of collector or guardian secretary/ palak sachiv and task should be refelected in their concerened task. same in for in minutes if any task is alloted it should reflect in their task management and also these task status should be shown to the alloter and globally all to chief secretary and admin. allotment can be @collector.district

---

## Verification checklist

- Anonymous session can NO LONGER select from `officers`, `guardian_secretaries`, `external_identities` (only the safe views).
- `has_role(<other-uid>, 'admin')` returns `false` from a non-admin session.
- Notifications subscription only receives rows for the current officer.
- Insights page: trigger Gemini quota error → fallback succeeds, banner shows "via fallback".
- Insights page no longer shows "Failed to send a request to the Edge Function" — descriptive error appears instead.
- Document AI: upload a small text file → JSON parses → row saved in `document_uploads`.
- `/admin/ai-telemetry` shows recent calls for both functions.
- Add/edit/deactivate an officer in User Management → list refreshes immediately, OTP login with the new officer works.
- Footer visitor counter increments on first visit per browser session.
- All new static pages reachable from footer; skip-link + font-size controls work.

---

## Suggested rollout order (4 PRs)

1. **Security migration + officer/guardian views + has_role guard + notifications scoping** (must ship first; everything else assumes the new policies).
2. **Edge function hardening: AI fallback, telemetry table + logging, error propagation, Insights bug fix.**
3. `**manage-officer` edge function + dynamic roles/agencies tables + UI.**
4. **GIGW pages, footer, visitor counter, accessibility polish, AI telemetry dashboard.**

Approve to start with PR #1.