## Findings from your CSV vs. the live database

I read `/mnt/documents/officers.csv` and cross-checked it against the live tables:

- 97 rows in CSV: 6 Divisional Commissioners, 36 District Collectors, 36 Guardian Secretaries, 16 Department Secretaries, 1 Chief Secretary, 1 CMO, 1 CS Office (system_admin)
- All 36 `district_id` values in the CSV resolve to real `districts.id` rows — **0 broken refs**
- All 16 `department_id` values resolve to real `departments.id` rows — **0 broken refs**
- No duplicate emails inside the CSV

**But: the `officers` table is not empty.** It already has 75 rows with real names and emails (Collectors, Guardian Secretaries, system admins). 26 of the 97 CSV emails collide with rows already in the DB — those are real officer records, not placeholders. A naive import would either fail on those 26 or create unwanted duplicates, and it would also overwrite/duplicate the 49 real Guardian Secretary records that already exist with real names.

I need a decision from you before I import. Two main questions:

### Q1 — How to handle the 26 email collisions

1. **Skip collisions** — insert only the 71 new placeholder rows (Div Commissioners, missing Collectors, missing Dept Secs, CS, CMO, CS Office). Leaves all real officer data untouched. *Safest.*
2. **Upsert on email** — for the 26 colliding rows, update `role`, `district_id`, `department_id`, `is_palak_sachiv`, `designation` from the CSV, keep the existing `name`. Risky: many real GS rows would have their role/department flipped to placeholder values.
3. **Don't import officers at all** — your real data is already richer than the CSV; just generate the user_roles flow.

### Q2 — Guardian Secretaries are already in the DB

Your DB already has 49 real Guardian Secretaries (with real names like "Shri Vikas Chandra Rastogi"). The CSV has 36 placeholder GS rows ("Guardian Secretary — Pune", etc.) keyed to district. Importing them would create 36 *additional* fake GS records sitting alongside the real ones. Recommend **dropping the 36 GS rows from the import** unless you specifically want district-keyed placeholders too.

## Proposed plan (assuming Q1=Skip, Q2=drop placeholder GS)

### Step 1 — Officer import (~35 new rows)

Run an insert-only batch through the database tool that inserts only rows whose `email` is not already in `officers`:

- 6 Divisional Commissioners (none currently exist)
- ~12 District Collectors that aren't in the DB yet
- 16 Department Secretaries (none currently match by email)
- 1 Chief Secretary, 1 CMO, 1 CS Office (system_admin)
- 0 Guardian Secretaries (real ones already exist)

After insert I'll re-verify: row count, no NULL `district_id` for collectors, no NULL `department_id` for dept secs, every officer's FK-style references resolve.

### Step 2 — `user_roles` backfill mechanism

`user_roles` cannot be pre-populated from the CSV: its `user_id` column points at `auth.users.id`, and an officer has no `auth.users` row until they sign in for the first time (the app calls `signInAnonymously` + `bind_session_officer` on successful OTP verify). So I'll wire it up as an automatic backfill instead of a CSV import:

- Add a trigger on `public.session_officer_map` (which is written exactly once per officer's first login) that:
  - looks up the officer's `is_cso_admin` and `role`
  - inserts the matching `app_role` into `user_roles` (`admin` for CS Office; otherwise a non-admin role mapping or skip)
  - is idempotent (`ON CONFLICT DO NOTHING`)
- One-time backfill: for the 2 existing system_admin officers (Pratik Bavi, Rishi Shirke) and the QA bypass account, manually insert `user_roles` rows tied to whatever `auth.uid` they currently map to in `session_officer_map`.

You'll also still get a `user_roles.csv` template for any *manual* admin grants you want to do outside this flow.

### Step 3 — Verification queries I'll run after each step

- `SELECT role, count(*) FROM officers GROUP BY role` — confirm seed targets
- Orphan check: any officer with `role='district_collector'` and NULL `district_id`, etc.
- `SELECT count(*) FROM user_roles` before/after first login of a test officer
- Confirm trigger fires by impersonating one officer end-to-end

## What I need from you

Please answer Q1 and Q2 (or pick "implement plan" with the defaults: **Q1 = Skip collisions, Q2 = drop the 36 placeholder GS rows, plus add the auto-backfill trigger for `user_roles`**).
