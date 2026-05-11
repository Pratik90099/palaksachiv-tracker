-- Replace the admin-only officers SELECT with a permissive policy, then use
-- column-level GRANTs to hide email/phone from non-admin readers.
DROP POLICY IF EXISTS "Admins read officers full" ON public.officers;

CREATE POLICY "Authenticated read officers safe columns"
ON public.officers
FOR SELECT
TO authenticated
USING (true);

-- Revoke broad SELECT, then re-grant only safe columns to authenticated.
REVOKE SELECT ON public.officers FROM authenticated, anon;

GRANT SELECT
  (id, name, designation, role, district_id, department_id,
   is_active, is_palak_sachiv, is_cso_admin, parichay_uid,
   created_at, updated_at)
ON public.officers TO authenticated;

-- Admin-only view that exposes contact details (email/phone).
CREATE OR REPLACE VIEW public.officers_admin
WITH (security_invoker = true)
AS
SELECT * FROM public.officers
WHERE public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.officers_admin TO authenticated;
