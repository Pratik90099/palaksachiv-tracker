

# Backend Readiness Status & Final Wiring Plan

## What's already deployed and working

**Database (12 tables, all RLS-enabled):** `officers`, `projects`, `tasks`, `meeting_minutes`, `visits`, `notifications`, `document_uploads`, `ai_insights`, `integrations`, `external_identities`, plus reference tables (districts, departments, project_categories, project_tags, guardian_secretaries) and link tables.

**Edge functions (4 deployed):**
- `authenticate-cso` — CS Office email/password login with rate limiting ✅
- `process-document` — PDF/CSV AI processing ✅
- `generate-insights` — AI Insights via Lovable AI Gateway ✅
- `parichay-callback` — SSO stub returning 501 until production credentials arrive ✅

**Frontend live data:** Heat Map, Departments, Compliance, Dashboard, Login role counts, Integration Health all read from the database (no more hard-coded mocks).

## What's still pending from the approved plan

Three items from the last-approved plan were not completed:

### 1. `src/lib/auth-adapter.ts` (MISSING)
The pluggable login layer that would route between `loginWithParichay`, `loginWithCSO`, and `loginWithMockRole` — currently `auth-context.tsx` still has the hard-coded `MOCK_USERS` table inline, with no demo-mode gate.

### 2. Officer Directory: `parichay_uid` field + "Login As" tool (MISSING)
`UserManagementPage.tsx` and `OfficerFormDialog.tsx` don't expose the `parichay_uid` or `is_cso_admin` columns that the migration already added to the `officers` table. CS Office can't yet pre-map officers to their Parichay IDs, and there's no impersonation tool for support.

### 3. External-DB migration prep (MISSING)
No consolidated `_full_schema.sql` and no README section documenting the move to an external Postgres.

## Plan to finish the backend

**A. Create `src/lib/auth-adapter.ts`**
- `loginWithParichay(payload)` — calls `parichay-callback` edge function, looks up officer via `external_identities`, sets session
- `loginWithCSO(email, password)` — wraps existing `authenticate-cso` flow
- `loginWithMockRole(role)` — gated behind `import.meta.env.VITE_DEMO_MODE === "true"`; throws otherwise
- `loginAsOfficer(officerId)` — CS Office impersonation; sets a `viewing_as` session flag

**B. Refactor `src/lib/auth-context.tsx`**
- Remove inline `MOCK_USERS`; route all logins through the adapter
- Add `viewingAs` state + `stopImpersonating()` for the CS Office "Login As" feature
- Keep anonymous Supabase session bootstrap (needed for RLS writes)

**C. Update `src/components/AppLayout.tsx`**
- Add an amber banner "Viewing as <name> — Return to your account" when `viewingAs` is set

**D. Extend `src/components/OfficerFormDialog.tsx`**
- Add `Parichay UID` text field (optional)
- Add `Mark as CS Office Admin` switch (writes to `is_cso_admin`)

**E. Extend `src/pages/UserManagementPage.tsx`**
- Add "Login As" action button per row (visible only to `chief_secretary` and `system_admin`)
- Show Parichay UID column when present

**F. Update `src/hooks/use-data.ts`**
- `useCreateOfficer` / `useUpdateOfficer` to pass through `parichay_uid` and `is_cso_admin`

**G. Migration prep**
- Generate `supabase/migrations/_full_schema.sql` consolidating the 9 existing migrations into one portable Postgres-compatible script (uses only `pgcrypto`)
- Add a "Moving to External Postgres" section to `README.md` covering: env vars, RLS replay, `documents` storage bucket re-creation on S3/MinIO, edge function porting

**H. Login page wiring**
- Replace the direct `login(role)` call on demo role buttons with `authAdapter.loginWithMockRole(role)` so the demo gate is enforced
- Wire the Parichay button to call `authAdapter.loginWithParichay()` (which calls the 501 stub today, real OAuth later)

## Files changed

| File | Change |
|---|---|
| `src/lib/auth-adapter.ts` | **New** — pluggable login adapter |
| `src/lib/auth-context.tsx` | Use adapter; add impersonation state |
| `src/components/AppLayout.tsx` | "Viewing as" banner |
| `src/components/OfficerFormDialog.tsx` | Add `parichay_uid` + `is_cso_admin` fields |
| `src/pages/UserManagementPage.tsx` | "Login As" action + Parichay UID column |
| `src/hooks/use-data.ts` | Pass new officer fields through |
| `src/pages/LoginPage.tsx` | Route via adapter; gate mock logins |
| `supabase/migrations/_full_schema.sql` | **New** — consolidated portable schema |
| `README.md` | External-DB migration guide |

## What this delivers

After this batch, the backend is **fully production-ready**:
- One adapter, one swap-point for e-Parichay (only the `parichay-callback` function body changes when credentials arrive)
- CS Office can pre-map every officer to their Parichay UID today
- CS Office can impersonate any officer for support
- A single SQL file replays the entire schema on any external Postgres
- Demo-role buttons disabled in production builds (no `VITE_DEMO_MODE=true`)

