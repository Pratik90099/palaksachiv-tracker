

# Plan: Remove Demo Mode Entirely

Strip all demo-mode scaffolding so the portal only authenticates via real flows (Parichay SSO + CS Office credentials). No more mock role buttons, no `VITE_DEMO_MODE` flag, no `MOCK_USERS` table.

## Changes

### 1. `src/lib/auth-adapter.ts`
- Delete the `MOCK_USERS` constant and the `loginWithMockRole()` function entirely.
- Delete the `DEMO_MODE` constant and the `isDemoMode` export.
- Keep only: `loginWithParichay()`, `loginWithCSO()`, `loginAsOfficer()` (CS Office impersonation).

### 2. `src/lib/auth-context.tsx`
- Remove any `login(role)` mock-role code path and any reference to `loginWithMockRole` / `isDemoMode`.
- Auth context exposes only: `loginWithParichay`, `loginWithCSO`, `loginAsOfficer`, `stopImpersonating`, `logout`.

### 3. `src/pages/LoginPage.tsx`
- Remove the entire "Demo: Sign in as…" role-button section (the 7 mock role cards / role count chips that used `loginWithMockRole`).
- Keep only two login paths:
  - **Sign in with Parichay SSO** (primary, calls `loginWithParichay()`)
  - **CS Office sign in** (email + password form, calls `loginWithCSO()`)
- Remove the live role-count fetch from `officers` if it was only used to label demo buttons; keep it only if shown elsewhere on the page.

### 4. `.env` / docs
- Remove any `VITE_DEMO_MODE` references from `README.md` (external-DB migration guide) so operators don't think they need to set it.

### 5. Sweep
- Search the repo for `VITE_DEMO_MODE`, `loginWithMockRole`, `MOCK_USERS`, `isDemoMode`, `demo` (case-insensitive in auth/login files) and remove every remaining hit.
- Confirm `tsc` is clean.

## Files changed

| File | Change |
|---|---|
| `src/lib/auth-adapter.ts` | Delete `MOCK_USERS`, `loginWithMockRole`, `isDemoMode`, `DEMO_MODE` |
| `src/lib/auth-context.tsx` | Drop mock-role login path |
| `src/pages/LoginPage.tsx` | Remove demo role buttons; keep Parichay + CS Office only |
| `README.md` | Strip `VITE_DEMO_MODE` mentions |

## What this delivers

- Login page shows only the two real auth paths: Parichay SSO and CS Office credentials.
- No code path remains that can mint a session from a hard-coded officer.
- Production build and demo build are now identical — one less env var, one less surface area.
- Until Parichay credentials arrive, only CS Office users can sign in (the SSO button surfaces the 501 stub message), which matches the production rollout intent.

