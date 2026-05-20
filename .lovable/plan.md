## Goal

Make "Chief Secretary Office" explicitly the system_admin role, grant the `chief_secretary` role the same CSO admin powers, and rename labels for clarity. No security-scan findings are addressed here — those stay separate.

## Changes

### 1. Login dropdown label (`src/pages/LoginPage.tsx`)

- Rename the `system_admin` option from "CSO" → **"Chief Secretary Office (System Admin)"**.
- Keep the underlying role value `system_admin` unchanged (DB + RPC contracts stay intact).

### 2. Role labels (sidebar + User Management page)

- `AppSidebar.tsx`: change roleLabel fallback from "CS Office" → **"CS Office (Admin)"** for `system_admin`.
- `UserManagementPage.tsx` ROLE_LABEL: `system_admin` → **"Chief Secretary Office (Admin)"**.
- `OfficerFormDialog.tsx` ROLE_OPTIONS: same rename for the `system_admin` option.

### 3. Grant chief_secretary the admin app_role (DB migration)

- Update `public.grant_user_role_from_session()` so the `admin` app_role is also granted when `officer.role = 'chief_secretary'` (in addition to the current `is_cso_admin` / `role = 'system_admin'`).
- Backfill: insert `('admin')` into `user_roles` for all existing `session_officer_map` rows whose officer has `role = 'chief_secretary'` (ON CONFLICT DO NOTHING) so currently logged-in CS officers gain admin powers without re-login.

### 4. Frontend admin gates

- `src/pages/UserManagementPage.tsx`: extend `isCsoStaff` to include `user.role === 'chief_secretary'`.
- `src/components/AppSidebar.tsx`: same update to `isCsoStaff` (so the "User Management" link shows for Chief Secretary too).
- `canImpersonate` already includes `chief_secretary` — no change.

### 5. Memory update

- Update `mem://index.md` Core auth line: clarify that **both `system_admin` and `chief_secretary` are admin-grade roles** with full CSO admin powers.

## Out of scope (not touched in this turn)

- The three security-scan findings on the security panel (officers PII RLS, documents bucket policies, realtime topic scoping). Those will be addressed separately if you ask.
- Any other role's permissions (Guardian Secretary, Collector, etc. remain as-is).

## Test plan

1. Sign in as `pratikbbavi@gmail.com , bavipratik@gmail.com`and choose the renamed "Chief Secretary Office (System Admin)" option → lands on home → User Management visible → can add officer.
2. Log in as an officer whose `officers.role = 'chief_secretary'` → sidebar shows "User Management" → Add Officer succeeds (RLS passes because `admin` user_role is now granted).
3. Log in as a Department Secretary → "User Management" still hidden → access-restricted card if navigated directly.