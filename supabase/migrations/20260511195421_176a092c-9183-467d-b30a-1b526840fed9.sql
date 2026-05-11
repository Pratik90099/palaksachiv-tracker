
-- Helper to determine if caller can see a given visit
CREATE OR REPLACE FUNCTION public.can_see_visit(_visit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.visits v
      JOIN public.officers o ON o.id = public.current_officer_id()
      LEFT JOIN public.districts vd ON vd.id = v.district_id
      LEFT JOIN public.districts od ON od.id = o.district_id
      WHERE v.id = _visit_id
        AND (
          o.role IN ('chief_secretary','cmo','system_admin')
          OR (o.role IN ('district_collector','guardian_secretary') AND o.district_id = v.district_id)
          OR (o.role = 'divisional_commissioner' AND vd.division = od.division)
        )
    )
  END;
$$;

-- Helper: is current officer the GS who filed this visit
CREATE OR REPLACE FUNCTION public.is_visit_owner(_visit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.visits v
    WHERE v.id = _visit_id
      AND v.gs_id = public.current_officer_id()
  );
$$;

-- Helper: privileged write role (CS/CMO/admin officer or auth admin)
CREATE OR REPLACE FUNCTION public.is_privileged_visit_writer()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.officers o
      WHERE o.id = public.current_officer_id()
        AND o.role IN ('chief_secretary','cmo','system_admin')
    );
$$;

-- Tighten visits SELECT
DROP POLICY IF EXISTS "Authenticated read visits" ON public.visits;
CREATE POLICY "Scoped read visits" ON public.visits
  FOR SELECT TO authenticated
  USING (public.can_see_visit(id));

-- Tighten visits UPDATE/DELETE to owner GS, CS/CMO/admin
DROP POLICY IF EXISTS "Officer or admin update visits" ON public.visits;
CREATE POLICY "Owner GS or privileged update visits" ON public.visits
  FOR UPDATE TO authenticated
  USING (gs_id = public.current_officer_id() OR public.is_privileged_visit_writer())
  WITH CHECK (gs_id = public.current_officer_id() OR public.is_privileged_visit_writer());

DROP POLICY IF EXISTS "Officer or admin delete visits" ON public.visits;
CREATE POLICY "Owner GS or privileged delete visits" ON public.visits
  FOR DELETE TO authenticated
  USING (gs_id = public.current_officer_id() OR public.is_privileged_visit_writer());

-- Tighten visit_attachments SELECT
DROP POLICY IF EXISTS "Authenticated read visit_attachments" ON public.visit_attachments;
CREATE POLICY "Scoped read visit_attachments" ON public.visit_attachments
  FOR SELECT TO authenticated
  USING (public.can_see_visit(visit_id));

-- Tighten visit_comments SELECT
DROP POLICY IF EXISTS "Authenticated read visit_comments" ON public.visit_comments;
CREATE POLICY "Scoped read visit_comments" ON public.visit_comments
  FOR SELECT TO authenticated
  USING (public.can_see_visit(visit_id));

-- Cascade deletes for visit children. Drop existing FKs if any, then re-add with cascade.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visit_attachments_visit_id_fkey') THEN
    ALTER TABLE public.visit_attachments DROP CONSTRAINT visit_attachments_visit_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visit_comments_visit_id_fkey') THEN
    ALTER TABLE public.visit_comments DROP CONSTRAINT visit_comments_visit_id_fkey;
  END IF;
END $$;

ALTER TABLE public.visit_attachments
  ADD CONSTRAINT visit_attachments_visit_id_fkey
  FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;

ALTER TABLE public.visit_comments
  ADD CONSTRAINT visit_comments_visit_id_fkey
  FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;

-- Storage policies on documents bucket for visits/<visit_id>/... paths
DO $$ BEGIN
  -- drop if previously created
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='visits scoped read') THEN
    DROP POLICY "visits scoped read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='visits uploader insert') THEN
    DROP POLICY "visits uploader insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='visits uploader delete') THEN
    DROP POLICY "visits uploader delete" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "visits scoped read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'visits'
    AND public.can_see_visit(((storage.foldername(name))[2])::uuid)
  );

CREATE POLICY "visits uploader insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'visits'
    AND (public.current_officer_id() IS NOT NULL OR public.has_role(auth.uid(),'admin'::app_role))
  );

CREATE POLICY "visits uploader delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'visits'
    AND (
      public.has_role(auth.uid(),'admin'::app_role)
      OR public.is_privileged_visit_writer()
      OR EXISTS (
        SELECT 1 FROM public.visit_attachments va
        WHERE va.storage_path = storage.objects.name
          AND va.uploaded_by = public.current_officer_id()
      )
    )
  );
