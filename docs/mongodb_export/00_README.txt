================================================================================
  GS Portal — MongoDB JSON Export
================================================================================

Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Source:    Lovable Cloud (PostgreSQL) — nvvyqsxwjyzokaiazghw

WHAT'S INCLUDED
----------------
17 JSON files ready for mongoimport. Each file is a JSON array of documents
with embedded relationships (denormalized for MongoDB).

FILE LIST
---------
Reference Tables:
  districts.json           (36 docs)  — 36 Maharashtra districts
  departments.json         (16 docs)  — Govt departments
  project_categories.json  (6 docs)   — Project classification categories
  project_tags.json        (16 docs)  — Project tags
  integrations.json        (10 docs)  — External system catalog

People:
  officers.json            (110 docs) — All officers with embedded district/department
  guardian_secretaries.json (36 docs) — GS per district with embedded district
  user_roles.json          (2 docs)   — Role assignments with embedded officer

Projects & Tasks:
  projects.json            (1 doc)    — Projects with embedded districts, depts, tags, officer
  tasks.json               (2 docs)   — Tasks with embedded project, districts, depts, officer

Operations:
  visits.json              (1 doc)    — Field visits with embedded district, GS
  visit_comments.json      (0 docs)   — Visit comments
  visit_attachments.json   (2 docs)   — Visit photo/document metadata
  meeting_minutes.json     (2 docs)   — Meeting records with embedded project
  notifications.json       (0 docs)   — System notifications
  document_uploads.json    (0 docs)   — Uploaded document metadata
  ai_insights.json         (1 doc)    — AI-generated summaries
  external_identities.json (0 docs)   — SSO identity mappings

IMPORT INSTRUCTIONS
-------------------
Option A: mongoimport (MongoDB Atlas or local)
  1. Create a database (e.g. "gs_portal")
  2. For each JSON file, run:

     mongoimport \
       --uri "mongodb+srv://USER:PASS@cluster.mongodb.net/gs_portal" \
       --collection districts \
       --jsonArray \
       --file districts.json

     # Repeat for each collection...

Option B: mongosh (MongoDB shell)
  use gs_portal
  db.districts.insertMany( JSON.parse( cat("districts.json") ) )
  # Repeat for each collection...

Option C: MongoDB Compass
  1. Connect to your cluster
  2. Select database → Add Data → Import JSON
  3. Choose each .json file

EMBEDDED RELATIONSHIPS
----------------------
These JSON files are denormalized for document storage:
  - officers.district       → {_id, name, division}
  - officers.department     → {_id, name, short_name}
  - guardian_secretaries.district → {_id, name, division}
  - projects.districts[]    → [{_id, name, division}]
  - projects.departments[]  → [{_id, name, short_name}]
  - projects.tags[]         → [{_id, name}]
  - projects.assigned_officer → {_id, name, designation, role}
  - tasks.project           → {_id, title, status}
  - tasks.districts[]       → [{_id, name}]
  - tasks.departments[]     → [{_id, name}]
  - visits.district         → {_id, name}
  - visits.guardian_secretary → {_id, name, designation}
  - meeting_minutes.related_project → {_id, title}
  - external_identities.officer → {_id, name, email}
  - user_roles.officer      → {_id, name, email}

If you prefer strict relational references (ObjectIds only), use the CSV seed 
files in docs/seed/ instead and write an ETL script.

IMPORTANT NOTES
---------------
- IDs from Postgres (UUID) are preserved as string _id values.
- This export is a SNAPSHOT. Real-time sync requires an ETL pipeline.
- "user_roles" and "external_identities" may need auth integration.
- The "login_otps", "audit_logs", "ai_call_logs", "session_officer_map", 
  "site_visits" tables are intentionally excluded (runtime data only).

CREDIT
------
Generated from Lovable Cloud managed backend.
For updates, re-run the export script against the live database.
================================================================================
