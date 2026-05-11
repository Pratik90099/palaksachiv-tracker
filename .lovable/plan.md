## Goal

Let District Collectors review visit reports filed for their district by the Guardian Secretary and respond with "Action Taken" comments.

## Findings

- `visits` table already records `district_id`, `gs_id`, `observations`, `rating`. RLS allows any authenticated user to read.
- `useRoleFilter` already restricts visit visibility to the Collector's own district when `role === "district_collector"`.
- Collector role is **not** currently in the sidebar `Visit Management` (`/visits`) entry — only Guardian Secretary, CS, CMO. So Collectors can't open the page today.
- `VisitsPage.tsx` shows a flat table with no detail/comment UI.
- No `visit_comments` table exists.

## Plan

### 1. Database (migration)

Create `public.visit_comments`:

- `visit_id` (FK → visits, cascade delete), `author_officer_id` (FK officers), `author_role`, `comment_text`, `is_action_taken` boolean default true, `created_at`.
- RLS: authenticated read all; insert allowed when `current_officer_id() IS NOT NULL OR has_role(...,'admin')` (mirrors the rest of the schema); update/delete only by author or admin.
- Add audit trigger reusing `log_entity_change('visit_comments')`.
- Add index on `visit_id`.

### 2. Sidebar visibility

In `src/components/AppSidebar.tsx`, add `district_collector` to the `Visit Management` roles array so Collectors see the page.

### 3. Visits page enhancements (`src/pages/VisitsPage.tsx`)

- Apply `useRoleFilter().filterVisits` so Collectors only see visits for their assigned district (Guardian Sec already district-scoped, CS/CMO see all).
- Hide the "Log New Visit" button unless role is `guardian_secretary`, `system_admin`, or `chief_secretary` (Collectors only respond, they don't log).
- Make each table row clickable → opens a Drawer/Dialog with full visit details (district, date, quarter, status, rating, issues, observations, filing GS name).
- Inside the drawer, show a chronological list of `visit_comments` (author name + role badge + timestamp + comment).
- Add a comment composer at the bottom of the drawer:
  - Visible to `district_collector` (for the matching district), `chief_secretary`, `cmo`, `system_admin`.
  - Textarea + checkbox "Mark as Action Taken" (default checked) + Submit button.
  - On submit, insert into `visit_comments` with `author_officer_id = currentOfficerId`, `author_role = user.role`.
- Add a small "💬 N" badge column on each visit row showing comment count.

### 4. Data hooks (`src/hooks/use-data.ts`)

- `useVisitComments(visitId)` — fetch comments with officer name join.
- `useAddVisitComment()` — mutation, invalidates the visit + comments query.
- Extend `useVisits` select to include `guardian_secretaries(name)` and a `comments_count` aggregate.

### 5. Notifications

On comment insert by Collector, fire a `notifications` row to the visit's `gs_id` (so the Guardian Secretary sees the response under bell icon). Reuse existing notifications table — done client-side after the comment insert.

### 6. Verify

- Log in as Guardian Sec → file a visit for their district.
- Switch to that district's Collector → open `/visits`, see only their district, open the visit, post an "Action Taken" comment.
- Switch back to Guardian Sec → notification appears, comment visible in drawer.
- CS/CMO can read all comments but composer is also enabled for them as oversight.

## Out of scope

- Photo / document uploads on visits (the existing dropzones remain stubs).
- Editing or deleting comments after submit — keep audit trail intact.
- Marathi translation of new UI strings (English only for v1).
- ensure notification is activated for all the activites where necessary