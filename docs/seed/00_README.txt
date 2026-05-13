SUPABASE STUDIO IMPORT BUNDLE
==============================
All UUIDs are real DB values — foreign keys line up across files.
Import in numeric order via Table Editor → Insert → Import data from CSV.
IMPORTANT: uncheck "Auto-generate IDs" so the CSV `id` column is used as-is.

ORDER & ROW COUNTS
------------------
01_districts.csv                 36
02_departments.csv               16
03_project_categories.csv         6
04_project_tags.csv              16
05_officers.csv                 110   (FK: districts, departments)
06_guardian_secretaries.csv      36   (FK: districts)
07_projects.csv                   1   (FK: officers)
08_tasks.csv                      2   (FK: projects, officers)
09_project_districts.csv          6   (FK: projects, districts)
10_project_departments.csv        2   (FK: projects, departments)
11_project_tag_assignments.csv    2   (FK: projects, project_tags)
12_task_districts.csv             1   (FK: tasks, districts)
13_task_departments.csv           1   (FK: tasks, departments)
14_visits.csv                     1   (FK: districts, guardian_secretaries)
15_visit_comments.csv             0
16_visit_attachments.csv          2   (FK: visits)
17_meeting_minutes.csv            2   (FK: projects, nullable)
18_notifications.csv              0
19_integrations.csv              10
20_external_identities.csv        0
21_document_uploads.csv           0
22_ai_insights.csv                1

INTEGRITY VERIFIED
------------------
- 0 orphan officers.district_id / officers.department_id
- 0 collectors / guardian_secretaries without a district
- 0 orphan project / task / visit FKs
- 36 guardian_secretaries rows, one per district

KNOWN SEMANTIC NOTES (not FK errors, current live data state)
-------------------------------------------------------------
- 1 department_secretary officer has NULL department_id
- 2 officers flagged is_palak_sachiv but have role <> 'department_secretary'
- 3 officers flagged is_palak_sachiv have NULL district_id
  (These match what's in production today.)

INTENTIONALLY NOT INCLUDED
--------------------------
- user_roles, session_officer_map  → require auth.users; auto-populated by
  the grant_user_role_from_session trigger on first login.
- login_otps                       → ephemeral, RLS deny-all.
- audit_logs, ai_call_logs, site_visits → runtime telemetry.
