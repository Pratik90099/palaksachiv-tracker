## Goals

1. Lock down visit attachment visibility to match role/district scoping.
2. Add upload progress + retry for visit photos/documents.
3. Add delete/replace for attachments in the Visit detail sheet, role-gated with confirmation.
4. Add edit/delete for the visit itself, restricted to the authoring Guardian Secretary (and admins).
5. End-to-end sweep of pages/buttons; report broken or silent actions by URL × role.

---

## 1. Attachment visibility (RLS + UI)

Current state: `visit_attachments` SELECT policy is `true` for all authenticated users → any logged-in officer can list every district's photos/docs. Same risk on `visit_comments`.

Fix:
- Tighten SELECT on `visit_attachments` and `visit_comments` to only allow rows where the parent `visits.district_id` is visible to the caller:
  - admin (`has_role(... ,'admin')`) → all
  - chief_secretary / cmo → all
  - district_collector / guardian_secretary → only rows whose visit's district matches their `officers.district_id`
  - divisional_commissioner → districts in their division
  - department_secretary → none (visits are district artifacts)
- Add a SECURITY DEFINER helper `can_see_visit(visit_id)` to keep the policy simple and avoid recursion.
- Storage: add a SELECT policy on `storage.objects` for bucket `documents` path `visits/<visit_id>/...` mirroring the same rule (currently uploads work but signed-URL reads should also be gated).
- Frontend `useRoleFilter.filterVisits` already scopes the list; keep it as a defense-in-depth layer.

## 2. Upload progress + retry

In `VisitsPage.tsx` upload handlers:
- Track per-file state: `{ id, name, progress, status: 'queued'|'uploading'|'error'|'done', error? }` in a `useState` array.
- Use `supabase.storage.from('documents').upload(path, file, { ... })` inside a small wrapper that streams `XMLHttpRequest` for progress (Supabase JS does not expose progress events; use `fetch` to the storage REST endpoint with a signed upload URL via `createSignedUploadUrl` so we can attach an `XHR.upload.onprogress`).
- Render a compact list under the upload buttons with a `<Progress />` bar, file name, % and a Retry button on error.
- Retry re-runs the same upload + DB insert for only failed items, keeps successful ones.
- Validate size/type client-side before queuing (current 5MB photo / 10MB doc limits).

## 3. Attachment delete & replace in Visit detail sheet

In `VisitDetailSheet`:
- Show each attachment row with: thumbnail/icon, name, size, uploader, "Replace" and "Delete" buttons.
- Permission rule: visible only when `currentOfficerId === uploaded_by` OR user is admin/CS/CMO. Collectors cannot delete a Guardian Secretary's photos.
- Delete flow: `<AlertDialog>` confirmation → remove `storage.objects` row at `storage_path` → delete `visit_attachments` row → invalidate query.
- Replace flow: same confirmation, then file picker → upload new file → on success delete the old object + row, insert new row. Reuses the progress/retry component from §2.
- RLS already supports this (uploader-or-admin DELETE). Add matching `storage.objects` DELETE policy for the same scope.

## 4. Edit / delete the visit itself

In `VisitsPage` row actions (and inside the detail sheet header):
- Add "Edit" and "Delete" buttons visible only when:
  - `user.role === 'guardian_secretary'` AND `visit.gs_id` maps to current officer, OR
  - admin / chief_secretary / cmo
- Edit: opens the existing create-visit dialog pre-filled (`visit_date`, `quarter`, `status`, `rating`, `issues_logged`, `observations`). New `useUpdateVisit` mutation.
- Delete: `AlertDialog` confirmation → `useDeleteVisit` mutation. Cascade-delete attached storage files first (list `visit_attachments`, remove from `documents` bucket, then delete rows; finally delete the visit). Comments and attachments are removed via DB cascade once we add `ON DELETE CASCADE` FKs (none exist today — add them in the migration).
- RLS for visit UPDATE/DELETE: tighten current `current_officer_id() IS NOT NULL` to `gs_id = current_officer_id() OR admin/CS/CMO via has_role`.

## 5. End-to-end sweep

Process:
- Log in once per role (district_collector, guardian_secretary, department_secretary, chief_secretary, system_admin) using the QA bypass account.
- For every route in `AppSidebar` + footer + dashboard widgets, click each primary button and form submit. Capture (a) network 4xx/5xx, (b) console errors, (c) toasts that never appear, (d) buttons with no `onClick`.
- Deliverable: a table in the final reply — `Route | Role | Element | Symptom | Root cause | Fix`.
- Known suspects to verify first: ActionablesPage filters, ProjectsPage create/edit/delete, TaskFormDialog assign-officer, NotificationsPage mark-as-read, AlertsPage acknowledge, DocumentAIPage upload + process, InsightsPage generate, RecordMinutesPage save + export PDF, GovernanceScorecardPage refresh, HeatMapPage drilldown, OfficerFormDialog admin-only fields, ProfilePage save, SettingsPage toggles, static footer pages.

---

## Technical sections

### Migration outline

```sql
-- helper
create or replace function public.can_see_visit(_visit_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select case
    when has_role(auth.uid(),'admin') then true
    else exists (
      select 1
      from visits v
      join officers o on o.id = current_officer_id()
      where v.id = _visit_id
        and (
          o.role in ('chief_secretary','cmo')
          or (o.role in ('district_collector','guardian_secretary') and o.district_id = v.district_id)
          or (o.role='divisional_commissioner' and v.district_id in (
                select id from districts where division = (select division from districts where id=o.district_id)))
        )
    )
  end;
$$;

-- replace permissive SELECT on visit_attachments / visit_comments / visits with can_see_visit(...)
-- tighten visits UPDATE/DELETE to gs_id = current_officer_id() OR admin/CS/CMO
-- add storage.objects SELECT/DELETE policies for bucket=documents path like 'visits/%'
-- add ON DELETE CASCADE for visit_attachments.visit_id and visit_comments.visit_id
```

### New / changed files
- `supabase/migrations/<ts>_visit_scoping_and_edit.sql`
- `src/hooks/use-data.ts` — add `useUpdateVisit`, `useDeleteVisit`, `useDeleteVisitAttachment`, `useReplaceVisitAttachment`.
- `src/components/UploadQueue.tsx` (new) — progress + retry UI used by VisitsPage.
- `src/pages/VisitsPage.tsx` — wire edit/delete on visit, attachment delete/replace, upload queue.
- (After sweep) targeted fixes per finding.

### Out of scope
- Re-architecting role storage (already in `officers` per project memory).
- Changing the documents bucket from private to public.

## Deliverable to user
A short bug list from §5 plus the implemented changes from §1-§4.
