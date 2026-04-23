
-- ============================================================
-- LOCK DOWN PUBLIC TABLES — SELECT public, WRITE authenticated
-- ============================================================

-- Reference tables: SELECT public, WRITE authenticated only
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['districts','departments','guardian_secretaries','project_categories','project_tags']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all read access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all write access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow update access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON public.%I', t);

    EXECUTE format('CREATE POLICY "Public can read %I" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can update %I" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can delete %I" ON public.%I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- Operational tables: SELECT public, WRITE authenticated
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'projects','tasks','task_districts','task_departments',
    'project_districts','project_departments','project_tag_assignments',
    'visits','meeting_minutes','notifications','document_uploads'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all read access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all write access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow update access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow delete access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON public.%I', t);

    EXECUTE format('CREATE POLICY "Public can read %I" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can update %I" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can delete %I" ON public.%I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- ============================================================
-- DOCUMENTS STORAGE BUCKET — authenticated only
-- ============================================================

DROP POLICY IF EXISTS "documents_public_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;

CREATE POLICY "documents_authenticated_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "documents_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "documents_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
