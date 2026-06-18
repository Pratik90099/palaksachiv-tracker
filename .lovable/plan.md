## Goal

Add an **OTP / Password** toggle to the existing login page so the same `LoginPage.tsx` works on an external deployment (password). Passwords are stored in **Supabase Auth** (`auth.users`), keyed by the officer's email, so the existing `officers` directory and RLS policies stay unchanged.

## What gets built

### 1. `src/pages/LoginPage.tsx` — add a Tabs control above the role selector

```text
┌─ Sign In ───────────────────────────┐
│  [ One-time code ] [ Password ]     │  ← Tabs
│                                     │
│  Sign in as: [ role select ▾ ]      │
│  Email:      [ ............... ]    │
│  Password:   [ ............... ]    │  ← only in Password tab
│  [ Sign in ]    Forgot password?    │
└─────────────────────────────────────┘
```

- Default tab = `otp` (preserves current behaviour).
- Password tab shows the same role select + email + a password input + "Forgot password?" link.
- Submit calls `signInWithPasswordAndBindOfficer(email, password, role)` (new helper in `auth-adapter.ts`).
- On success: same `setUserFromAdapter(user)` + `navigate("/dashboard")` as OTP.

### 2. `src/lib/auth-adapter.ts` — three new helpers

- `**signInWithPasswordAndBindOfficer(email, password, role)**`
  1. `supabase.auth.signInWithPassword({ email, password })` — creates a real (non-anonymous) Supabase session.
  2. Call `find_login_officer_public(email, role)` RPC (new, security-definer wrapper around the existing `find_login_officer`) to resolve the officer row for that (email, role) pair, honoring the same dual-charge / Palak Sachiv / QA-bypass rules.
  3. Reject if no officer match → "No officer registered with this email for the selected role." Then `supabase.auth.signOut()` to clean up.
  4. `bindOfficerSession(officer.id)` — same trigger fires that grants `admin` app_role for `system_admin` / `chief_secretary` / `is_cso_admin`.
  5. Return the same `AuthUser` shape OTP returns.
- `**requestPasswordReset(email)**` — `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password })`.
- `**updatePassword(newPassword)**` — `supabase.auth.updateUser({ password })`, used by the reset page.

### 3. `src/pages/ResetPasswordPage.tsx` — new public route

- Detects the `type=recovery` hash from the auth email link, shows a "Set new password" form, calls `updatePassword`, then redirects to `/login`.
- Wired into `src/App.tsx` as a public route alongside `/login`.

### 4. DB migration — one RPC + minor tweaks

- `find_login_officer_public(_email text, _role text) RETURNS jsonb` — security-definer wrapper that returns a JSON projection (id, role, is_cso_admin) of `find_login_officer`. Lets the client resolve the officer post-password-sign-in without exposing the full `officers` row to anon.
- No new tables, no changes to RLS, no changes to `user_roles`. The existing `grant_user_role_from_session()` trigger already runs on `bind_session_officer` and will correctly grant `admin` for CS Office / Chief Secretary even when the session is a real password session instead of an anonymous one.

### 5. No password-setup UI in this pass

Admins seed passwords one of two ways (no extra UI work this pass):

- **Recommended:** officer clicks "Forgot password?" on the login page → receives reset email → sets their own password. Works as soon as an officer's email exists in `auth.users` (which signup-disabled Supabase Auth will create on first reset).
- **Bulk seeding for external deploy:** documented one-time SQL/admin-API step in the plan — not part of the React change.

(If you want a "Set password for officer" button in User Management later, we can add it as a follow-up.)

## Files touched


| File                                                 | Change                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/pages/LoginPage.tsx`                            | Add Tabs (OTP / Password), password input, forgot-password link                  |
| `src/lib/auth-adapter.ts`                            | Add `signInWithPasswordAndBindOfficer`, `requestPasswordReset`, `updatePassword` |
| `src/pages/ResetPasswordPage.tsx`                    | New file — public reset-password screen                                          |
| `src/App.tsx`                                        | Add `/reset-password` route                                                      |
| `supabase/migrations/<timestamp>_password_login.sql` | Add `find_login_officer_public` RPC                                              |
| `mem://index.md`                                     | Update auth Core line: "Passwordless OTP **or password (Supabase Auth)**"        |


## Out of scope

- Bulk password import / admin password-set UI (follow-up)
- MFA / Apple / Google OAuth (separate request)
- Disabling OTP entirely on the external server — both tabs ship; defaults can flip later via a small env flag if you want

## Test plan

1. `bavipratik@gmail.com, pratikbbavi@gmail.com` → Password tab → enter QA password (after first using "Forgot password?" to set one) → lands on `/dashboard` with admin sidebar.
2. Non-admin officer → Password tab → same role they're registered under → success. Wrong role → "No officer registered…" error and session cleared.
3. OTP tab still works unchanged.
4. `/reset-password` opens from the email link, sets new password, redirects to `/login`.

Approve and I'll switch to build mode and apply the changes.