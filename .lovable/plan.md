## Goal

Produce a complete, internally-consistent set of CSV files at `/mnt/documents/seed/` that you can drop into Supabase Studio's Table Editor in order, starting from an empty database, and end up with the same data that's currently live — districts, departments, officers, guardian_secretaries, and the linking IDs all matching by UUID.

## What I'll generate

All exports use real UUIDs from the live DB (so FKs line up) and are ordered by dependency. You upload them top-to-bottom in Supabase Studio.

### Tier 1 — Reference tables (no FKs)
1. `01_districts.csv` — id, name, division, created_at (36 rows)
2. `02_departments.csv` — id, name, short_name, created_at (16 rows)
3. `03_project_categories.csv` — id, name, description, color, created_at
4. `04_project_tags.csv` — id, name, created_at

### Tier 2 — Directory (FK → districts, departments)
5. `05_officers.csv` — full row including `id`, `district_id`, `department_id`, `role`, `is_palak_sachiv`, `is_cso_admin`, `is_active`, `phone`, `parichay_uid`, timestamps
6. `06_guardian_secretaries.csv` — id, name, designation, email, district_id, created_at

### Tier 3 — Work items (FK → officers)
7. `07_projects.csv` — full row, `assigned_officer_id` resolves to officers.id
8. `08_tasks.csv` — full row, `project_id` and `assigned_officer_id` resolve

### Tier 4 — Join tables (FK → projects/tasks/districts/departments/tags)
9. `09_project_districts.csv`
10. `10_project_departments.csv`
11. `11_project_tag_assignments.csv`
12. `12_task_districts.csv`
13. `13_task_departments.csv`

### Tier 5 — Operational tables (only if they currently have rows)
14. `14_visits.csv` — FK → districts, guardian_secretaries
15. `15_visit_comments.csv`, `16_visit_attachments.csv` — FK → visits
16. `17_meeting_minutes.csv` — FK → projects (nullable)
17. `18_notifications.csv` — FK → projects, tasks, officers (recipient)
18. `19_integrations.csv`
19. `20_external_identities.csv` — FK → officers
20. `21_document_uploads.csv`, `22_ai_insights.csv`

### Deliberately excluded (cannot be pre-seeded)
- `user_roles` — `user_id` points at `auth.users`, which only exists after a real login. Auto-populated by the `grant_user_role_from_session` trigger. I'll still ship a 1-row `user_roles_current.csv` snapshot of what's in the DB right now for reference, but it won't be part of the import sequence.
- `session_officer_map` — same reason; populated on login.
- `login_otps` — RLS-locked, ephemeral.
- `audit_logs`, `ai_call_logs`, `site_visits` — runtime-only, no value re-seeding.

## Interlink guarantees I'll verify before delivering

After exporting, I'll run these checks and only hand off the bundle if all pass:

- Every `officers.district_id` exists in `01_districts.csv`
- Every `officers.department_id` exists in `02_departments.csv`
- Every officer with `role = 'district_collector'` or `'guardian_secretary'` has a non-null `district_id`
- Every officer with `role = 'department_secretary'` has a non-null `department_id`
- Every officer with `is_palak_sachiv = true` is also `role = 'department_secretary'` AND has a `district_id` (Palak Sachiv = dept sec assigned a guardian district)
- Every `guardian_secretaries.district_id` exists in districts; one GS row per district (no orphans, no duplicates)
- Every `projects.assigned_officer_id` exists in officers
- Every `tasks.project_id` exists in projects; every `tasks.assigned_officer_id` exists in officers
- Every join-table FK resolves on both sides
- `visits.district_id` and `visits.gs_id` resolve

I'll output a `00_README.txt` in the bundle that lists the import order, the row counts, and a note that `user_roles` is intentionally not in the bundle.

## Import procedure (I'll include this in the README)

In Supabase Studio → Table Editor → for each file in numeric order:
- Open the table → "Insert" → "Import data from CSV"
- Uncheck "Auto-generate IDs" so the CSV's `id` column is used as-is (this is what keeps all FKs valid)
- Confirm row count matches the README

## What I need from you (one decision)

For the operational tables (visits, notifications, meeting_minutes, document_uploads, ai_insights, audit_logs), do you want:

1. **Full snapshot** — export every row currently in the DB so a fresh import reproduces today's state exactly (includes test/demo data).
2. **Reference data only** — skip operational tables; the bundle contains only districts, departments, project taxonomy, officers, GS, projects, tasks, join tables, and integrations. Cleanest re-seed.
3. **Reference + integrations + projects/tasks** — middle ground, no visits/notifications/meetings/documents.

Default if you don't pick: **option 2 (reference data only)** — safest for a from-scratch rebuild.
