## 1. Verify Help & Contact links + NIC removal

- Browser-test `/help` and `/contact` at desktop (1024) and mobile (375):
  - `mailto:cs[at]maharashtra[dot]gov[dot]in?cc=bavipratik[at]gmail[dot]com,rishishirke65[at]gmail[dot]com` opens mail client with CCs prefilled.
  - `tel:+912222025042` is tappable (no truncation, full-row hit area on mobile).
  - All buttons use `<a>` (not `<button>`) so OS handlers fire.
- Code sweep: `rg -i "nic\.in|NIC Portal|nic-link"` across `src/`, `index.html`, `public/`. Confirm zero hits in nav, footer, sitemap, help, contact, login.
- Fix any link that renders as plain text or has wrong scheme; ensure `aria-label` on icon-only links.

## 2. /help/user-manual — enrich existing HTML page

Stay HTML (no PDF). Update `src/pages/static/UserManualPage.tsx`:

- Add a "Last updated" stamp at the top, sourced from a single constant `MANUAL_LAST_UPDATED = "11 May 2026"` so future edits bump the date in one place.
- Add a sticky table-of-contents sidebar (desktop) / collapsible accordion (mobile) for the existing sections.
- Add **Print / Save as PDF** button (`window.print()`) with a print stylesheet that hides nav/sidebar.
- Add a "Download offline copy" link that triggers print-to-PDF (browser-native, no PDF dependency).
- Link from `/help` page ("Read the full User Manual →") and keep the existing sitemap entry.

## 3. Audit trail for Meeting Minutes & Tasks

### Schema (one new migration)

```text
audit_logs
  id uuid pk
  entity_type text  -- 'meeting_minutes' | 'task'
  entity_id uuid
  action text       -- 'view' | 'create' | 'update' | 'delete'
  actor_officer_id uuid
  actor_email text  -- denormalized snapshot
  actor_role text
  district_id uuid  -- officer's district at time of action (nullable for state roles)
  diff jsonb        -- {before, after} for writes; null for views
  user_agent text
  created_at timestamptz default now()
```

RLS:

- INSERT: any authenticated officer (`current_officer_id() IS NOT NULL`).
- SELECT: admin only, plus the actor can read their own rows (`actor_officer_id = current_officer_id()`).
- UPDATE/DELETE: denied (immutable log; 10-yr retention rule).

Indexes: `(entity_type, entity_id, created_at desc)`, `(actor_officer_id, created_at desc)`.

### Server-side write logging (triggers)

`AFTER INSERT/UPDATE/DELETE` triggers on `tasks` and `meeting_minutes` insert into `audit_logs` with `diff = jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))`. Actor resolved via `current_officer_id()`; if null (admin), record `actor_role='admin'`.

### Client-side view logging

Add `src/lib/audit.ts` exporting `logView(entityType, entityId)`. Call from:

- `src/pages/RecordMinutesPage.tsx` detail/edit view mount.
- `src/pages/ActionablesPage.tsx` task detail/edit view mount.
- Debounced (one log per entity per 30s per session) to avoid spam.

### Admin viewer

Extend `/admin/ai-telemetry` style — add `/admin/audit-trail` listing recent rows with filters (entity type, actor, district, date range). Reuse the existing admin layout.

## 4. Role-gating verification for Minutes & Tasks

Allowed roles per memory: `system_admin`, `chief_secretary`, `cmo`, `guardian_secretary`, `district_collector`, `divisional_commissioner`, `department_secretary` (i.e. all officer roles).

Steps:

- Audit `src/components/AppSidebar.tsx` `roles` arrays for the Minutes and Actionables items — confirm all 7 roles listed.
- Add a `<RoleGuard allow={[...]}/>` wrapper inside `RecordMinutesPage.tsx` and `ActionablesPage.tsx` that redirects to `/403` if the active role is not in the allow-list (defensive, since sidebar hiding alone is not enough).
- Browser test by switching role via the QA bypass account (`pratikbbavi@gmail.com` / `567890`) through each of the 5 dropdown roles; assert both pages render and that the `/403` is reachable for any future restricted role.
- Document the matrix in a comment at the top of each page file.

## Files touched

- New: `supabase/migrations/<ts>_audit_logs.sql`, `src/lib/audit.ts`, `src/pages/admin/AuditTrailPage.tsx`, `src/components/RoleGuard.tsx` (if not already present).
- Edit: `src/pages/static/UserManualPage.tsx`, `src/pages/HelpPage.tsx`, `src/pages/RecordMinutesPage.tsx`, `src/pages/ActionablesPage.tsx`, `src/App.tsx` (audit trail route), `src/components/AppSidebar.tsx` (admin entry).

## Out of scope

- No PDF hosting / Storage bucket.
- No view-tracking via Postgres (client-only as agreed).
- No changes to existing RLS on `tasks` / `meeting_minutes`.