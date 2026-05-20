## Goal

Only CS Office Staff (officers with `is_cso_admin = true` or `role = 'system_admin'`) can add, edit, delete, or impersonate officers. Everyone else sees a read-only directory (or no access at all).

## Current state

- DB RLS on `officers` already gates writes on `has_role(auth.uid(), 'admin')`.
- The `admin` app_role is granted by `grant_user_role_from_session()` trigger only when the officer is `is_cso_admin` OR `role = 'system_admin'`. So the backend rule is already correct.
- The UI gap: `UserManagementPage.tsx` shows **Add / Edit / Delete** buttons to every logged-in user. Non-CSO users click "Add Officer", fill the form, and get a silent RLS rejection — confusing.
- The route itself is also reachable by anyone.

## Changes

### 1. `src/pages/UserManagementPage.tsx`
- Compute `isCsoStaff = user?.is_cso_admin || user?.role === 'system_admin'`.
- If not CSO staff: render a friendly "Access restricted — only CS Office Staff can manage officers" empty state and hide the table entirely. (Or show read-only table without action buttons — pick one in the plan; default is **read-only table, no action column**.)
- Hide the top-right **Add Officer** button unless `isCsoStaff`.
- Hide **Edit / Delete / Login-as** action buttons in each row unless `isCsoStaff` (impersonation already had its own `canImpersonate` check — align it to the same flag).

### 2. `src/components/AppSidebar.tsx` (read-only verify)
- Hide the "User Management" nav link for non-CSO users so they don't see a dead-end menu item. (Need to confirm current visibility logic — will read the file during implementation.)

### 3. No DB / RLS changes
- Backend already enforces the rule correctly. This is purely a UX fix so non-CSO users never see actions they can't perform.

## Out of scope

- No changes to OTP flow, `officers` table, or RLS policies.
- No changes to other admin-gated pages (Audit Trail, AI Telemetry, etc.) — those can be reviewed in a follow-up if desired.

## Test plan

1. Sign in as `pratikbbavi@gmail.com` (CSO admin via QA bypass) → User Management → see Add/Edit/Delete buttons → add a new officer successfully.
2. Sign in as a Department Secretary or District Collector → either see no "User Management" link, or land on a read-only directory with no action buttons.
3. Confirm RLS still rejects manual API calls from non-CSO sessions (defense in depth).
