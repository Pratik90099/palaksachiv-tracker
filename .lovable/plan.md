

# Plan: Deployment-Ready Hardening for CS Office

Goal: lock down access control, fix functional bugs in the CS-Office flows, and ship with production-grade settings — without changing the demo's role-selection UX.

---

## Step 1 — Restrict the database (biggest go-live blocker)

Every table currently has RLS policies of `USING (true)` / `WITH CHECK (true)`, so the anon key can read or write anything. Replace these with **read-only public** + **authenticated-only writes**, and harden the two new surfaces.

Migration changes:

| Table | New policy set |
|---|---|
| `districts`, `departments`, `guardian_secretaries`, `project_categories`, `project_tags` | `SELECT` to anon + authenticated; **no public INSERT/UPDATE** |
| `projects`, `tasks`, `task_districts`, `task_departments`, `project_districts`, `project_departments`, `project_tag_assignments`, `visits`, `meeting_minutes`, `notifications`, `document_uploads` | `SELECT` to anon + authenticated; `INSERT` / `UPDATE` / `DELETE` to **authenticated** role only |
| `documents` storage bucket | `SELECT`/`INSERT` for authenticated only |

Because the demo currently runs without a real Supabase session, also add a tiny anonymous sign-in step on app load (`supabase.auth.signInAnonymously()`) so the existing UI keeps working with the new authenticated-only writes. This is a one-line change in `auth-context.tsx` on mount.

---

## Step 2 — CS Office authentication & session persistence

Current issues:
- `useState(null)` for the user means **a page refresh logs the user out**.
- The `system_admin` count badge says "3" but only Pratik + Rishikesh exist.
- The `authenticate-cso` edge function still embeds plaintext passwords. Move them to a **secret** (`CSO_USERS_JSON`) so credentials can be rotated without a code deploy, and hash with bcrypt-style comparison via timing-safe equals.

Changes:
- `auth-context.tsx`: persist `user` in `sessionStorage`, restore on mount.
- `mock-data.ts`: change CS Office count from `3` → `2`.
- `authenticate-cso/index.ts`:
  - Read users from `Deno.env.get("CSO_USERS_JSON")` (fallback to current 2-user array if unset).
  - Add timing-safe comparison.
  - Add a per-IP in-memory rate limit (5 attempts / 15 min) to slow brute-force.
- Remove the on-screen "Authorized Users" hint block from `LoginPage.tsx` (info disclosure).

---

## Step 3 — Route-level role guard

`/document-ai`, `/meeting-minutes`, `/users`, `/settings` are gated only in the sidebar. A user can still type the URL. Add a `<RoleProtectedRoute roles={[...]}>` wrapper in `App.tsx` that redirects unauthorised roles to `/dashboard`.

Mapping:
- `/document-ai` → `system_admin`
- `/meeting-minutes`, `/users` → `system_admin`, `chief_secretary`
- `/settings` → `system_admin`

---

## Step 4 — Fix functional bugs in Document AI page

1. **PDF/DOCX cannot be read by `FileReader.readAsText`** — they come back as binary garbage and waste an AI call. Restrict the accepted types to `.txt` and `.csv` only (update dropzone label, `accept` attribute, and `ALLOWED_*` arrays). Add a clear note: "Convert PDFs to text before upload." (Real PDF parsing requires a server-side parser — out of scope for this hardening pass; can be added later as a separate feature.)
2. Switch model from `google/gemini-3-flash-preview` to **`google/gemini-2.5-flash`** (stable, billed normally, same speed tier).
3. Wrap the AI's JSON output in a Zod schema check before returning, so malformed AI output never crashes the UI.
4. In `handleImportProject` / `handleImportTask`, sanitise `category` against the known enum list before insert.

---

## Step 5 — Fix Meeting Minutes bugs

1. `related_project_id: form.related_project_id || undefined` — when the user picks nothing, current value is `""`, which Supabase rejects as invalid UUID. Use `|| null` and ensure the column accepts null (it already does).
2. Add validation: `attendees`, `decisions`, `action_items` items max 200 chars each; cap list length at 50.
3. The "Convert All to Tasks" handler fires N parallel mutations without awaiting — add sequential awaits + summary toast ("12 tasks created").

---

## Step 6 — Edge function robustness

For both `process-document` and `authenticate-cso`:
- Add structured Zod input validation.
- Always include `corsHeaders` on every response (already done — verify).
- Wrap `JSON.parse(req.json())` failures in try/catch returning 400 (currently throws 500).
- Add `console.log` of `mode` + `fileName` + `userEmail` (no content) for an audit trail.

---

## Step 7 — Realtime hook stability

`use-notifications.ts` already fixed. Add the same pattern (empty deps + `removeChannel` cleanup) defensively to any other realtime subscriber if introduced later — none exist today, so just a documented convention in a code comment.

---

## Files to change

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Replace permissive RLS with role-scoped policies on all 15 tables + storage bucket |
| `src/lib/auth-context.tsx` | sessionStorage persistence + `signInAnonymously` on mount |
| `src/lib/mock-data.ts` | CSO count 3 → 2 |
| `src/pages/LoginPage.tsx` | Remove authorised-users hint block |
| `src/App.tsx` | Add `RoleProtectedRoute` and apply to 4 routes |
| `src/pages/DocumentAIPage.tsx` | Restrict to .txt/.csv, sanitise import payload, better error display |
| `src/pages/RecordMinutesPage.tsx` | `related_project_id` null fix, sequential convert-all, length caps |
| `supabase/functions/process-document/index.ts` | Switch to `gemini-2.5-flash`, Zod validation, audit log |
| `supabase/functions/authenticate-cso/index.ts` | Read users from secret, timing-safe compare, rate-limit |
| (new secret) | `CSO_USERS_JSON` (set via add_secret tool) |

---

## What this delivers

- Database is no longer wide-open from the anon key.
- CSO logins survive refresh and can be rotated without redeploying code.
- URL-typing cannot bypass role restrictions.
- Document AI no longer silently fails on PDFs and uses a stable model.
- Meeting Minutes conversion + project linking work without the existing UUID and async bugs.

After applying, run the security scan to confirm no `error`-level findings remain, then publish.

