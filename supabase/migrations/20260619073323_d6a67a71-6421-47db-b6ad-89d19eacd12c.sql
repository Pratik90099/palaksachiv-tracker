
-- 1. Remove broad documents bucket policies (scoped policies remain)
DROP POLICY IF EXISTS "documents_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;

-- 2. Lock down sensitive officer columns at the GRANT level.
-- RLS SELECT policy stays USING(true) for safe columns; column GRANTs ensure
-- sensitive columns can only be read via SECURITY DEFINER admin RPCs.
REVOKE SELECT ON public.officers FROM anon, authenticated;

GRANT SELECT (
  id, name, designation, role, district_id, department_id,
  is_active, created_at, updated_at
) ON public.officers TO anon, authenticated;

-- Service role and admin RPCs (SECURITY DEFINER, owned by postgres) keep full access.
GRANT ALL ON public.officers TO service_role;
