

# Plan: Production Cleanup + Officer Assignment + AI Insights

## Goal
Clear demo data, give Chief Secretary + CS Office full user/officer management with direct assignment of projects and tasks to specific officers (also from meeting minutes), and add an AI Insights layer.

---

## Part 1 — Clean Demo Data

Wipe transactional demo data while keeping **reference data** (districts, departments, guardian secretaries, categories, tags) intact.

Insert (DELETE) statements to clear:
- `projects` (10 rows) and dependent rows in `project_districts`, `project_departments`, `project_tag_assignments`
- `tasks` (12 rows) and dependent rows in `task_districts`, `task_departments`
- `meeting_minutes` (already 0)
- `visits` (already 0)
- `notifications` (4 rows)
- `document_uploads` (already 0)

Kept as-is: districts (36), departments (16), guardian_secretaries (36), project_categories (6), project_tags (16) — these are the master lists the system needs to operate from day one.

Also remove the hard-coded `MOCK_USERS` array in `UserManagementPage.tsx` so the User Management page reads live data from the database (see Part 2).

---

## Part 2 — Officer Directory + Direct Assignment

### 2A. New `officers` table (single source of truth for assignable people)

Migration creates `officers` table:
- `id uuid pk`, `name text`, `designation text`, `email text unique`, `role text` (one of the 7 UserRole values), `district_id uuid?`, `department_id uuid?`, `is_active boolean default true`, timestamps
- RLS: public read, authenticated write (matches current pattern)
- Seed it once with the existing 36 guardian_secretaries + a Chief Secretary entry, so the directory is non-empty on first load

### 2B. Add `assigned_officer_id` to `projects` and `tasks`

Migration adds `assigned_officer_id uuid` (nullable) to both `projects` and `tasks`. The existing `responsible_officer` text column on `tasks` stays (legacy free-text), but the new column is the structured link used for filtering and "what's assigned to me".

### 2C. User Management page becomes the Officers CRUD

`UserManagementPage.tsx` rewritten to:
- Read officers from the `officers` table via a new `useOfficers()` hook
- Add/Edit/Deactivate officers via a new `OfficerFormDialog` — fields: name, designation, role, district, department, email
- Search + role filter (existing UI preserved)
- Visible to `system_admin` and `chief_secretary`

New hooks in `use-data.ts`: `useOfficers`, `useCreateOfficer`, `useUpdateOfficer`, `useDeleteOfficer`.

### 2D. Assign officer in Project & Task forms

In `ProjectFormDialog.tsx` and `TaskFormDialog.tsx`, add an **"Assign to Officer"** dropdown populated from `useOfficers()`, optionally filtered by selected districts/departments. Saves to `assigned_officer_id`.

### 2E. Assign officer from Meeting Minutes action items

In `RecordMinutesPage.tsx`, alongside each action item add a small "Assign to" picker (officer dropdown). The existing **"Convert to Task"** / **"Convert All to Tasks"** flows pass `assigned_officer_id` into `useCreateTask`, so a task created from minutes shows up immediately on that officer's dashboard.

### 2F. Officer-scoped views ("reflects to respective user")

Extend `use-role-filter.ts` so when the logged-in user matches an officer (by email), `filterProjects()` and `filterTasks()` also return items where `assigned_officer_id === currentOfficer.id`. The Dashboard, Projects, and Actionables pages already call these filters, so the assigned items will appear in that officer's views automatically. Add a small **"Assigned to me"** badge/section on the Dashboard.

---

## Part 3 — AI Insights Layer

### 3A. New edge function `generate-insights`

`supabase/functions/generate-insights/index.ts`:
- Reads aggregated, **non-PII** stats server-side (counts by status, overdue count, critical count, GOI-pending count, top 5 stuck districts/departments, recent meeting decisions count)
- Sends only the aggregated summary to Lovable AI (`google/gemini-2.5-flash`) — never raw rows
- Returns structured JSON: `{ headline, key_insights: string[], risks: string[], recommendations: string[] }` enforced via tool-calling schema
- CORS, Zod input validation, 429/402 error pass-through

### 3B. New page `InsightsPage.tsx` at `/insights`

- Header: "AI Insights & Recommendations"
- "Generate Insights" button → calls the edge function, renders the four sections in cards
- Refresh button + last-generated timestamp
- Stored in a new `ai_insights` table (id, generated_at, payload jsonb, generated_by) so insights persist between sessions
- Sidebar entry with `Sparkles` icon, gated to `chief_secretary`, `cmo`, `system_admin`, `divisional_commissioner`

### 3C. Dashboard mini-insight widget

Small card on `DashboardPage.tsx` showing the latest insight `headline` + top 1 recommendation, with a "View all insights" link.

---

## Files Changed

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Create `officers`, `ai_insights` tables; add `assigned_officer_id` to `projects` and `tasks`; seed officers from existing GS list |
| (data wipe via insert tool) | DELETE rows in `projects`, `tasks`, link tables, `notifications` |
| `src/hooks/use-data.ts` | Add `useOfficers`, `useCreateOfficer`, `useUpdateOfficer`, `useDeleteOfficer`; include `assigned_officer_id` in project/task create/update |
| `src/hooks/use-role-filter.ts` | Add officer-id–based filter branch |
| `src/components/OfficerFormDialog.tsx` | New — add/edit officer |
| `src/pages/UserManagementPage.tsx` | Rewrite to read live `officers` data, with CRUD UI |
| `src/components/ProjectFormDialog.tsx` | Add "Assign to Officer" dropdown |
| `src/components/TaskFormDialog.tsx` | Add "Assign to Officer" dropdown |
| `src/pages/RecordMinutesPage.tsx` | Per-action-item officer picker; pass through to task creation |
| `supabase/functions/generate-insights/index.ts` | New AI edge function |
| `src/pages/InsightsPage.tsx` | New page |
| `src/components/AppSidebar.tsx` | Add "AI Insights" nav item |
| `src/App.tsx` | Add `/insights` route under role guard |
| `src/pages/DashboardPage.tsx` | Add mini-insight widget + "Assigned to me" section |

---

## Deployment-Ready Checklist (delivered after this batch)

- Database is empty of demo transactions; reference data ready to use
- Chief Secretary can add officers and assign projects/tasks/meeting action items directly
- Each officer sees their assigned items on login
- AI Insights generates state-wide summary on demand without exposing raw data
- All new endpoints follow existing RLS pattern (public read, authenticated write) and Zod input validation

