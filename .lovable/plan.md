

# Plan: Remove Frontend Mock Data + e-Parichay Readiness + Integration Truth

## What's actually wrong (critical findings)

### 1. Database is clean ✅ — but UI still shows fake numbers
DB tables (`projects`, `tasks`, `visits`, `notifications`, `meeting_minutes`) all return **0 rows**. The "demo data not removed" feeling comes from **hard-coded constants in `src/lib/mock-data.ts`** that several pages still render directly:

| Page | What it shows from mock | Reality |
|---|---|---|
| **Heat Map** | `MOCK_HEAT_DATA` — 36 random scores per refresh | No real district scoring |
| **Departments** | `DEPARTMENT_PERFORMANCE` — hard-coded scores | Fake |
| **Compliance** | `GS_COMPLIANCE` from MAHARASHTRA_DISTRICTS slice | Fake |
| **Dashboard charts** | `QUARTERLY_DATA`, `DEPARTMENT_PERFORMANCE` | Fake |
| **Critical Issues / Reports / Escalations** | `MOCK_ACTIONABLES` (10 fake rows), `MOCK_VISITS` (6 fake rows) | Fake |
| **Login role counts** | `USER_ROLES` count badges (36, 45, 36...) | Hard-coded |

### 2. Integration Health is **fake** — PRAGATI is NOT integrated
`IntegrationHealthPage.tsx` is a **static array** of 10 hard-coded entries (PRAGATI, PFMS, GeM, e-Taal, etc.) with random "lastSync" timestamps and a fake spinning refresh button. **Zero real API calls** to any external system. This must be honestly labeled.

### 3. e-Parichay readiness gap
- Login page already shows a "Sign in with Parichay SSO" button — but it's a **dead button** (no onClick).
- `auth-context.tsx` uses anonymous Supabase sign-in for RLS, hard-coded `MOCK_USERS` for non-CSO roles.
- No mapping layer between an e-Parichay identity (typically `parichay_uid` / official email) and the `officers` table.

---

## Changes

### Step 1 — Wipe remaining demo data + replace with live queries

**Delete** from `src/lib/mock-data.ts`: `MOCK_ACTIONABLES`, `MOCK_VISITS`, `MOCK_HEAT_DATA`, `DASHBOARD_STATS`, `QUARTERLY_DATA`, `DEPARTMENT_PERFORMANCE`. Keep only enums and configs (`USER_ROLES`, `STATUS_CONFIG`, `PRIORITY_CONFIG`, `MAHARASHTRA_DISTRICTS`, `DIVISIONS`, `ISSUE_CATEGORIES`, `DEPARTMENTS` as reference lists).

**Rewrite to use live data:**
- `HeatMapPage.tsx` — compute district scores from `tasks` + `visits` joined by district. Empty state: "No data yet — scores appear once tasks are recorded."
- `DepartmentsPage.tsx` — aggregate `tasks` grouped by department.
- `CompliancePage.tsx` — derive GS compliance from real `visits` per district.
- `DashboardPage.tsx` — replace `QUARTERLY_DATA` / `DEPARTMENT_PERFORMANCE` with live aggregations from `useTasks()`/`useProjects()`.
- `CriticalIssuesPage.tsx`, `EscalationsPage.tsx`, `GOIPendingPage.tsx`, `ReportsPage.tsx` — confirm they all use `useTasks()` / `useProjects()` filters (not MOCK_ACTIONABLES).
- `LoginPage.tsx` — fetch role counts from `officers` table grouped by role instead of hard-coded `count`.

### Step 2 — Make Integration Health honest

Two options for the user to choose at execution time (default: **A**):

- **A. Mark as "Planned"**: Replace the static list with a "Coming Soon" panel listing planned integrations and their status (`Planned`, `In Discussion`, `Live`). Persist in a new `integrations` table so CS Office can edit status from the UI. No fake "99.9% uptime" numbers.
- **B. Hide the page** entirely until real connectors exist; remove sidebar entry for non-admins.

### Step 3 — e-Parichay readiness layer

Since e-Parichay SSO requires production-only credentials and a government-issued OAuth client, build a **pluggable adapter** now so the swap-in is a one-line change later:

1. **New table `external_identities`**:
   `id, officer_id (fk → officers), provider ('parichay' | 'email' | 'cso'), external_uid, email, last_login_at, is_active`
2. **New `auth-adapter.ts`** module exporting:
   ```
   loginWithParichay(parichayPayload) → looks up external_identities → loads officer → sets session
   loginWithCSO(email, password)      → existing flow
   loginWithMockRole(role)            → demo only, gated by VITE_DEMO_MODE
   ```
3. **Login page**: wire the existing "Sign in with Parichay SSO" button to call a `parichay-callback` edge function stub (returns 501 + "Awaiting Parichay client credentials"). This makes the integration point visible and testable.
4. **Officer Directory** gets two new fields: `parichay_uid` (text, optional) and `is_cso_admin` (boolean). When CS Office adds an officer, they enter the Parichay UID — and that officer auto-logs-in via SSO once Parichay is wired.
5. **Migration on a future swap**: only the `parichay-callback` edge function body changes; everything else (officer rows, RLS, role checks) already works.

### Step 4 — CS Office full admin access (confirm + tighten)

- `system_admin` role already has access to: User Management, Settings, Document AI, Meeting Minutes.
- Add `system_admin` to `Insights` route guard if missing.
- Add a **"Login As" tool** on the Officer Directory (CS Office only) — lets CS Office impersonate any officer for support/debugging, with a banner "Viewing as <name>". Useful before Parichay rollout.
- Document in code that `system_admin` bypasses all role-scoped filters in `use-role-filter.ts` (already true, just add a comment).

### Step 5 — External DB migration prep

You said the project will move to an external DB soon. Two prep steps:

1. **Generate a portable schema dump**: emit `supabase/migrations/_full_schema.sql` (one consolidated file) that any Postgres can replay — no Supabase-specific extensions outside `pgcrypto`.
2. **Document the external-DB swap** in `README.md`: env-var changes, how to re-run RLS policies, how to re-create the `documents` storage bucket on a non-Supabase host (S3/MinIO).

---

## Files changed

| File | Change |
|---|---|
| `src/lib/mock-data.ts` | Strip transactional mocks; keep enums/configs only |
| `src/pages/HeatMapPage.tsx` | Live data from tasks + visits |
| `src/pages/DepartmentsPage.tsx` | Live aggregation |
| `src/pages/CompliancePage.tsx` | Live GS compliance |
| `src/pages/DashboardPage.tsx` | Live charts; remove `QUARTERLY_DATA` import |
| `src/pages/LoginPage.tsx` | Live role counts; wire Parichay button |
| `src/pages/IntegrationHealthPage.tsx` | "Planned integrations" with editable status |
| `supabase/migrations/<new>.sql` | `external_identities` table; `integrations` table; `parichay_uid` + `is_cso_admin` columns on `officers` |
| `src/lib/auth-adapter.ts` (new) | Pluggable login adapter |
| `src/lib/auth-context.tsx` | Use adapter; gate mock login behind `VITE_DEMO_MODE` |
| `supabase/functions/parichay-callback/index.ts` (new) | Stub returning 501 with clear message |
| `src/pages/UserManagementPage.tsx` | Add Parichay UID field + "Login As" |
| `README.md` | External-DB migration guide |

---

## What this delivers

- All UI numbers come from the real database — empty until CS Office enters work.
- Integration Health honestly shows "Planned" instead of fake PRAGATI uptime.
- e-Parichay SSO has a real, stub-able plug point — flipping it on later requires only filling the `parichay-callback` edge function with the production OAuth handshake.
- CS Office retains full admin + "Login As" for support.
- One consolidated schema file ready for the external-DB migration.

