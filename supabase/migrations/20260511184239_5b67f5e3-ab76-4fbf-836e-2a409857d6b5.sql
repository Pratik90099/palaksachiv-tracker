
-- 1. Restrict sensitive officer columns from broad authenticated SELECT
REVOKE SELECT ON public.officers FROM authenticated;
REVOKE SELECT ON public.officers FROM anon;
GRANT SELECT (id, name, designation, role, district_id, department_id, is_active, created_at, updated_at)
  ON public.officers TO authenticated;

-- 2. Admin RPC: list all officers with full details
CREATE OR REPLACE FUNCTION public.get_officers_admin()
RETURNS SETOF public.officers
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.officers ORDER BY name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_officers_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_officers_admin() TO authenticated;

-- 3. Admin RPC: fetch one officer full record (for impersonation / detail view)
CREATE OR REPLACE FUNCTION public.get_officer_full(_officer_id uuid)
RETURNS public.officers
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.officers;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO v_row FROM public.officers WHERE id = _officer_id;
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_officer_full(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_officer_full(uuid) TO authenticated;

-- 4. Tighten audit_logs INSERT policy (was permissive WITH CHECK true)
DROP POLICY IF EXISTS "Authenticated insert audit_logs" ON public.audit_logs;
CREATE POLICY "Officer or admin insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (current_officer_id() IS NOT NULL OR has_role(auth.uid(), 'admin'::app_role));
