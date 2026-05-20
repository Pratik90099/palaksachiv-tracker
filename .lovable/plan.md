# Fix: Add Officer from User Management + OTP delivery

## Problem
Clicking **Add Officer** in User Management appears to do nothing / errors. New users therefore never exist in `officers`, so `request_login_otp` returns `{sent:true}` with no actual code sent (the function silently no-ops when the officer isn't found).

## Root cause
- `officers` INSERT RLS = `has_role(auth.uid(), 'admin')`
- The DB function `grant_user_role_from_session()` is supposed to grant that `admin` role to CSO Office staff (`is_cso_admin = true` or `role = 'system_admin'`) the moment they bind their session via `bind_session_officer`.
- The schema currently has **no triggers** — so `user_roles` is never populated, and every officer INSERT is rejected by RLS. The `useCreateOfficer` mutation throws a permission error, and only the generic toast is shown (often unnoticed).

OTP delivery itself is healthy — once the officer row exists, `request_login_otp` + `send-login-otp` already handle everything (verified in conversation history).

## Fix

### 1. Database migration
- Attach the missing trigger:
  ```
  CREATE TRIGGER trg_grant_user_role_from_session
    AFTER INSERT OR UPDATE ON public.session_officer_map
    FOR EACH ROW EXECUTE FUNCTION public.grant_user_role_from_session();
  ```
- Backfill: for every existing `session_officer_map` row whose officer is `is_cso_admin = true` or `role = 'system_admin'`, insert `('admin')` into `user_roles` (ON CONFLICT DO NOTHING). This re-enables already-logged-in CSO admins without forcing them to log out/in.

### 2. Frontend polish (small)
`src/components/OfficerFormDialog.tsx` — on successful create, also show a hint toast: *"Officer can now sign in — they'll receive a 6-digit OTP at {email} after choosing their role on the login screen."* No logic change.

(Optional) `src/hooks/use-data.ts` — surface a clearer message if Postgres returns `42501` permission denied (e.g. "Only CS Office admins can add officers — please re-login").

## Test plan
1. Log in as `pratikbbavi@gmail.com` (QA bypass, CSO admin) → User Management → **Add Officer** with a real email → expect success toast + row appears in table.
2. Log out, go to Login, select the new officer's role, enter their email → expect "Code sent to …".
3. Receive 6-digit OTP email → enter → land on dashboard.

## Files touched
- `supabase/migrations/<new>.sql` — trigger + backfill
- `src/components/OfficerFormDialog.tsx` — success-toast copy
- `src/hooks/use-data.ts` *(optional)* — friendlier RLS error
