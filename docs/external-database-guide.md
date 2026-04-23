# External Database Migration Guide (Frontend + Backend)

This guide explains how to run this project on a database outside the current Supabase project.

## Prerequisites

- PostgreSQL 14+
- Access to run SQL as a privileged DB user
- A REST/API layer compatible with the frontend's Supabase client expectations (for example Supabase, PostgREST with equivalent JWT/RLS behavior, or a custom backend)
- Environment secret management for production keys

## 1) Create the target database

Create a fresh database and connect with a superuser/admin role.

```bash
createdb palaksachiv_tracker
psql "$EXTERNAL_DATABASE_URL" -c 'select version();'
```

## 2) Load full schema

Replay the portable schema file:

```bash
psql "$EXTERNAL_DATABASE_URL" -f docs/db/full_schema.sql
```

This creates tables, indexes, helper functions, triggers, and RLS policies.

## 3) Verify schema health

Run quick checks:

```bash
# key tables exist
psql "$EXTERNAL_DATABASE_URL" -c "\dt public.*"

# extension required by schema
psql "$EXTERNAL_DATABASE_URL" -c "select extname from pg_extension where extname='pgcrypto';"

# sample row counts
psql "$EXTERNAL_DATABASE_URL" -c "select 'projects' as table, count(*) from public.projects union all select 'tasks', count(*) from public.tasks union all select 'officers', count(*) from public.officers;"
```

## 4) Configure app environment variables

Set these in `.env` (or deployment secrets):

- `VITE_SUPABASE_URL` — API base URL your frontend will call
- `VITE_SUPABASE_PUBLISHABLE_KEY` — public key/token for browser access
- `SUPABASE_SERVICE_ROLE_KEY` — server-side key for edge functions
- `LOVABLE_API_KEY` — required for AI functions
- `VITE_DEMO_MODE=false` for production

## 5) Migrate/port edge functions

Current backend function entry points:

- `supabase/functions/authenticate-cso/index.ts`
- `supabase/functions/process-document/index.ts`
- `supabase/functions/generate-insights/index.ts`
- `supabase/functions/parichay-callback/index.ts`

If not running on Supabase Functions, port these to your runtime (Node/Workers/etc.) and preserve request/response shape expected by the frontend.

## 6) Storage setup for documents

`process-document` expects a private `documents` bucket/object storage. Configure equivalent private storage and update upload logic if platform differs.

## 7) Critical production hardening before go-live

Before production, address these known blockers:

1. Implement real OAuth flow in `parichay-callback` (currently stubbed in code).
2. Remove fallback default CSO credentials and require secret-managed credentials only.
3. Tighten RLS policies for sensitive tables (avoid broad public-read for production data).
4. Disable demo login paths in production (`VITE_DEMO_MODE=false`).

## 8) Smoke test checklist

After deployment:

- Login works (CSO and/or Parichay when available)
- CRUD works for projects/tasks/officers
- File processing succeeds via `process-document`
- Insights generation works via `generate-insights`
- RLS rules behave as expected for each role

## 9) Rollback plan

- Keep a pre-migration DB snapshot/backup.
- Deploy in staging first.
- Promote to production only after smoke + permission tests pass.

