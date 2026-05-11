## Diagnosed root causes

**1. Visit RLS error (`new row violates row-level security policy for table "visits"`)**
After OTP login, the app signs in anonymously to Supabase but **never calls `bind_session_officer(officer_id)`**. Every officer-write RLS policy requires `current_officer_id() IS NOT NULL`, which returns NULL → every officer insert/update/delete (visits, projects, tasks, comments, notifications, document_uploads, ai_insights, meeting_minutes) is blocked. This is the single biggest bug in the app right now.

**2. "Failed to send a request to the Edge Function" (Insights & Document AI)**
Both edge functions send an `x-cso-email` custom header from the browser, but their CORS `Access-Control-Allow-Headers` lists **do not include `x-cso-email`**. The browser's preflight rejects the request before the function ever runs — hence the generic "Failed to send a request" error.

**3. Visit-report photos & documents do nothing**
In `VisitsPage.tsx`, the "Upload Photos" and "Upload Documents" buttons are decorative placeholders with no handler, no storage upload, and no DB linkage.

## Fixes (scoped to what you reported)

### A. Bind officer to Supabase session after login
- In `auth-adapter.ts` `verifyLoginOtp` (and `loginAsOfficer` for impersonation), after we know the officer id:
  - `await supabase.auth.signInAnonymously()` if no session yet.
  - `await supabase.rpc("bind_session_officer", { _officer_id: u.id })`.
- In `auth-context.tsx` `ensureSupabaseSession`, also re-bind on reload using the cached user.id so that returning users keep officer-write privileges.
- Net effect: visits, projects, tasks, comments, notifications, etc. will all insert successfully.

### B. Fix CORS on the two AI edge functions
- `supabase/functions/generate-insights/index.ts` and `supabase/functions/process-document/index.ts`: add `x-cso-email` to `Access-Control-Allow-Headers`. Redeploy both functions.
- After fix, "Generate Insights" and "Process Document" calls reach the function instead of failing at preflight.

### C. Make visit photo & document upload work
- Add a new `visit_attachments` table (`visit_id`, `kind enum 'photo'|'document'`, `storage_path`, `file_name`, `file_size`, `mime_type`, `uploaded_by`, `created_at`). Authenticated read; officer/admin insert+delete via the standard `current_officer_id()` policy. Reuse the existing private `documents` storage bucket; store under `visits/{visit_id}/...`.
- In `VisitsPage.tsx`:
  - Replace the two placeholder cards with real `<input type="file" multiple>` controls.
  - Photos: accept `image/jpeg,image/png`, max 20 files, 5 MB each.
  - Docs: accept `.pdf,.docx,.xlsx`, max 10 files, 10 MB each.
  - Upload to `documents` bucket via `supabase.storage.from('documents').upload(...)`, then insert `visit_attachments` rows.
  - On the `VisitDetailSheet`, show a thumbnail grid for photos (signed URLs) and a download list for documents.

## Out of scope for this turn

Your request also says "fix all the buttons / functions in this whole website end-to-end". That's hundreds of buttons across 30+ pages and not actionable as a single change without first knowing which actually misbehave. After the three fixes above ship, the visible breakage from missing officer binding alone disappears across most pages (it was the silent cause of many "save fails" you may have seen). I'll ask you to point me at any specific buttons that still don't work and I'll batch-fix those next.

## Technical details (for reference)

```text
Login flow after fix:
  verify_login_otp  →  officer
  └── signInAnonymously (if needed)
      └── rpc bind_session_officer(officer.id)
          └── session_officer_map row → current_officer_id() works
              └── all officer-write RLS policies pass
```

CORS allowlist (both functions):
`authorization, x-client-info, apikey, content-type, x-cso-email, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version`

Storage path convention: `visits/{visit_id}/photos/{uuid}-{filename}` and `visits/{visit_id}/docs/{uuid}-{filename}` in the existing private `documents` bucket; UI fetches via `createSignedUrl(60)`.