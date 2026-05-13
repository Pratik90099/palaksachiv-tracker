## Plan: Add seed CSV bundle to repo for GitHub sync

### Goal
Make the complete interlinked seed CSV bundle available in the GitHub repository so the user can download it from GitHub and import into Supabase Studio.

### Steps
1. Create `docs/seed/` directory in the project root
2. Copy all 22 CSV files + `00_README.txt` from `/mnt/documents/seed/` into `docs/seed/`
3. Verify file list matches the expected 23 files (22 CSVs + README)

### Import order (documented in 00_README.txt)
Tier 1 (reference): `01_districts.csv`, `02_departments.csv`, `03_project_categories.csv`, `04_project_tags.csv`
Tier 2 (directory): `05_officers.csv`, `06_guardian_secretaries.csv`
Tier 3 (work items): `07_projects.csv`, `08_tasks.csv`
Tier 4 (join tables): `09_project_districts.csv`, `10_project_departments.csv`, `11_project_tag_assignments.csv`, `12_task_districts.csv`, `13_task_departments.csv`
Tier 5 (operational): `14_visits.csv` through `22_ai_insights.csv`

### Excluded tables (cannot be pre-seeded)
- `user_roles` — populated by login trigger from auth.users
- `session_officer_map` — populated at login
- `login_otps` — ephemeral, RLS-locked
- `audit_logs`, `ai_call_logs`, `site_visits` — runtime-only

### Expected outcome
All seed files appear in the project file tree; GitHub bidirectional sync pushes them to the connected repository automatically.