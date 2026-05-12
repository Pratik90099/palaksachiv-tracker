# Generate officers.csv + user_roles.csv

Two CSVs you can import into Supabase Studio.

## 1. officers.csv — full seed

One row per officer, with `district_id` / `department_id` resolved to real UUIDs from the DB so they import cleanly.

Rows generated:
- 6 Divisional Commissioners (one per division)
- 36 District Collectors (one per district)
- 36 Guardian Secretaries / Palak Sachiv (one per district, `is_palak_sachiv = true`, role = `department_secretary`)
- N Department Secretaries (one per department in `departments` table)
- 1 Chief Secretary (state-level)
- 1 CMO officer (state-level)
- 1 CS Office / system_admin (`is_cso_admin = true`)

Columns:
```
name, role, designation, email, phone, district_id, department_id, parichay_uid, is_cso_admin, is_palak_sachiv, is_active
```

Placeholder values:
- `name`: e.g. "Collector — Pune", "Guardian Secretary — Nagpur", "Dept Secretary — PWD"
- `email`: slugged placeholder like `collector.pune@maharashtra.gov.in` (you'll replace with real IDs)
- `designation`: matching role title
- `phone`: blank
- `parichay_uid`: blank
- `is_cso_admin`: `true` only on the CS Office row
- `is_palak_sachiv`: `true` for the 36 Guardian Secretary rows
- `is_active`: `true`

`id`, `created_at`, `updated_at` auto-generate on import.

## 2. user_roles.csv — template

For granting `admin` access in the Lovable Cloud `user_roles` table. This table uses `auth.users.id` (not officer ids), so it can only be filled in **after** an officer signs in for the first time.

Columns:
```
user_id, role
```

Delivered as a **headers-only template** with a comment row explaining: paste the `auth.uid` from `auth.users` for each officer who needs admin privileges, with `role = admin`. Also includes a short README block on how to look up `user_id` from the Supabase Auth dashboard.

## Process

1. Query DB for all 36 districts (id, name, division) and all departments (id, name, short_name).
2. Python script generates `officers.csv` with real UUIDs filled in.
3. Generate `user_roles.csv` headers-only template + brief instructions block.
4. QA: open both files, confirm row counts and that every district_id / department_id resolves.
5. Save to `/mnt/documents/officers.csv` and `/mnt/documents/user_roles.csv`.

## Import instructions you'll get

- **officers**: Table Editor → officers → Import CSV. Edit names/emails before or after import.
- **user_roles**: Fill in `user_id` from Auth → Users after each officer's first login, then import.
