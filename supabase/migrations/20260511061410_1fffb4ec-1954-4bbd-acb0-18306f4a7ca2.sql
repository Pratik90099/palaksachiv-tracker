
-- 1. Roles infra
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2. login_otps explicit deny-all (RPCs use SECURITY DEFINER; bypass RLS)
DROP POLICY IF EXISTS "Deny all direct access" ON public.login_otps;
CREATE POLICY "Deny all direct access" ON public.login_otps
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- 3. Helper: drop+recreate write policies for operational tables (admin-only writes)
DO $$
DECLARE
  t text;
  ops text[] := ARRAY['INSERT','UPDATE','DELETE'];
  op text;
  tables text[] := ARRAY[
    'departments','districts','project_categories','project_tags',
    'officers','guardian_secretaries','external_identities','integrations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete %I" ON public.%I', t, t);
    EXECUTE format($f$CREATE POLICY "Admins insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'))$f$, t, t);
    EXECUTE format($f$CREATE POLICY "Admins update %I" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'))$f$, t, t);
    EXECUTE format($f$CREATE POLICY "Admins delete %I" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'))$f$, t, t);
  END LOOP;
END $$;

-- 4. Sensitive tables: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Public can read officers" ON public.officers;
CREATE POLICY "Authenticated read officers" ON public.officers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can read external_identities" ON public.external_identities;
CREATE POLICY "Authenticated read external_identities" ON public.external_identities
  FOR SELECT TO authenticated USING (true);

-- 5. Operational tables (project/task/visit ops): keep authenticated writes but require auth.role()=authenticated
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'projects','tasks','task_districts','task_departments',
    'project_districts','project_departments','project_tag_assignments',
    'visits','notifications','meeting_minutes','ai_insights','document_uploads'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete %I" ON public.%I', t, t);
    EXECUTE format($f$CREATE POLICY "Auth insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.role()) = 'authenticated')$f$, t, t);
    EXECUTE format($f$CREATE POLICY "Auth update %I" ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.role()) = 'authenticated') WITH CHECK ((SELECT auth.role()) = 'authenticated')$f$, t, t);
    EXECUTE format($f$CREATE POLICY "Auth delete %I" ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.role()) = 'authenticated')$f$, t, t);
  END LOOP;
END $$;

-- 6. Remove test.admin@gmail.com
DELETE FROM public.login_otps WHERE lower(email::text) = 'test.admin@gmail.com';
DELETE FROM public.external_identities WHERE lower(email) = 'test.admin@gmail.com';
DELETE FROM public.officers WHERE lower(email) = 'test.admin@gmail.com';
