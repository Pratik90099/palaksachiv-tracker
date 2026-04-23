-- =====================================================================
-- GS Portal — Consolidated portable schema (NOT a Supabase migration)
-- =====================================================================
-- This file is intentionally OUTSIDE supabase/migrations/ because it is
-- not meant to be replayed by the Supabase CLI. It is a single, portable
-- DDL script for migrating the schema to a non-Supabase Postgres host
-- (RDS, Cloud SQL, Azure Database, on-prem, etc.).
--
-- Usage:
--   psql "$EXTERNAL_DATABASE_URL" -f docs/db/full_schema.sql
--
-- Requires only the `pgcrypto` extension. After running:
--   1. Re-create the `documents` storage bucket on your object store
--      (S3, MinIO, Azure Blob) and re-point the upload edge function.
--   2. If your auth provider uses role names other than `anon` /
--      `authenticated`, edit the RLS DO-block at the bottom of this file.
--   3. Port the four edge functions in `supabase/functions/` to your
--      target runtime (Deno Deploy, Cloudflare Workers, Node, etc.).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Reference tables ----------

CREATE TABLE IF NOT EXISTS public.districts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  division    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  short_name  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  color       text DEFAULT '#6366f1',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Officers (user directory) ----------

CREATE TABLE IF NOT EXISTS public.officers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  designation     text,
  email           text,
  role            text NOT NULL DEFAULT 'department_secretary',
  district_id     uuid REFERENCES public.districts(id),
  department_id   uuid REFERENCES public.departments(id),
  is_active       boolean NOT NULL DEFAULT true,
  is_cso_admin    boolean NOT NULL DEFAULT false,
  parichay_uid    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guardian_secretaries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  designation  text,
  email        text,
  district_id  uuid REFERENCES public.districts(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- Projects + tasks ----------

CREATE TABLE IF NOT EXISTS public.projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  description           text,
  category              text NOT NULL DEFAULT 'Other',
  priority              text NOT NULL DEFAULT 'medium',
  status                text NOT NULL DEFAULT 'not_started',
  is_critical           boolean NOT NULL DEFAULT false,
  is_goi_pending        boolean NOT NULL DEFAULT false,
  start_date            date,
  target_date           date,
  assigned_officer_id   uuid REFERENCES public.officers(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  description           text,
  display_id            text,
  priority              text NOT NULL DEFAULT 'medium',
  status                text NOT NULL DEFAULT 'not_started',
  responsible_officer   text,
  agency                text,
  target_date           date,
  is_critical           boolean NOT NULL DEFAULT false,
  is_goi_pending        boolean NOT NULL DEFAULT false,
  assigned_officer_id   uuid REFERENCES public.officers(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_districts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  district_id   uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.project_departments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.project_tag_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES public.project_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.task_districts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  district_id   uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.task_departments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE
);

-- ---------- Visits, meetings, notifications, documents, AI ----------

CREATE TABLE IF NOT EXISTS public.visits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id     uuid NOT NULL REFERENCES public.districts(id),
  gs_id           uuid REFERENCES public.guardian_secretaries(id),
  visit_date      date,
  quarter         text NOT NULL,
  status          text NOT NULL DEFAULT 'scheduled',
  issues_logged   integer NOT NULL DEFAULT 0,
  rating          text DEFAULT 'satisfactory',
  observations    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  meeting_date          date NOT NULL DEFAULT CURRENT_DATE,
  venue                 text,
  chaired_by            text,
  attendees             text[],
  agenda                text,
  minutes_text          text NOT NULL,
  decisions             text[],
  action_items          text[],
  related_project_id    uuid REFERENCES public.projects(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  message               text,
  type                  text NOT NULL DEFAULT 'info',
  is_read               boolean NOT NULL DEFAULT false,
  link                  text,
  related_project_id    uuid REFERENCES public.projects(id),
  related_task_id       uuid REFERENCES public.tasks(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_uploads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name         text NOT NULL,
  file_type         text NOT NULL,
  file_size         integer NOT NULL DEFAULT 0,
  storage_path      text,
  processing_mode   text NOT NULL DEFAULT 'summarize',
  ai_result         jsonb,
  uploaded_by       text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload       jsonb NOT NULL,
  generated_by  text,
  generated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Integration catalog + SSO identity mapping ----------

CREATE TABLE IF NOT EXISTS public.integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  short_code      text,
  description     text,
  category        text,
  status          text NOT NULL DEFAULT 'planned',
  owner           text,
  notes           text,
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_identities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id      uuid NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  provider        text NOT NULL,                  -- 'parichay' | 'cso' | 'email'
  external_uid    text NOT NULL,
  email           text,
  is_active       boolean NOT NULL DEFAULT true,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_uid)
);

-- ---------- Helper functions + trigger ----------

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_task_display_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 'ACT-\d{4}-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.tasks
    WHERE display_id IS NOT NULL;
  NEW.display_id := 'ACT-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

-- ---------- Row-Level Security ----------
-- Pattern: anyone can read; only authenticated users can write.
-- Replace `anon` / `authenticated` with your own role names if needed.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'districts','departments','project_categories','project_tags',
    'officers','guardian_secretaries','projects','tasks',
    'project_districts','project_departments','project_tag_assignments',
    'task_districts','task_departments','visits','meeting_minutes',
    'notifications','document_uploads','ai_insights',
    'integrations','external_identities'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public can read %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "Public can read %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "Authenticated can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "Authenticated can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "Authenticated can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- ---------- Indexes ----------

CREATE INDEX IF NOT EXISTS idx_tasks_project       ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned      ON public.tasks (assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned   ON public.projects (assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_visits_district     ON public.visits (district_id);
CREATE INDEX IF NOT EXISTS idx_external_identities ON public.external_identities (officer_id);

-- =====================================================================
-- End of consolidated schema
-- =====================================================================
