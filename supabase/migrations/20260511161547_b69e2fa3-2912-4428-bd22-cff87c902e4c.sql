-- ============================================================
-- PR #1: Security hardening
-- - Restrict PII tables (officers, guardian_secretaries, external_identities)
-- - Add safe public views for directory display
-- - Harden has_role to prevent arbitrary user-id probing
-- - Scope notifications via recipient_officer_id + session officer mapping
-- ============================================================

-- ---------- 1. has_role guard ----------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Callers may only probe their own user_id, unless they're already an admin.
  IF _user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- ---------- 2. officers: restrict full read; add safe directory view ----------
DROP POLICY IF EXISTS "Authenticated read officers" ON public.officers;

CREATE POLICY "Admins read officers full"
ON public.officers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.officers_directory
WITH (security_invoker = true)
AS
SELECT
  id, name, designation, role,
  district_id, department_id, is_active,
  is_palak_sachiv, is_cso_admin
FROM public.officers
WHERE is_active = true;

GRANT SELECT ON public.officers_directory TO anon, authenticated;

-- ---------- 3. guardian_secretaries: admin-only base, public-safe view ----------
DROP POLICY IF EXISTS "Authenticated read guardian_secretaries" ON public.guardian_secretaries;

CREATE POLICY "Admins read guardian_secretaries"
ON public.guardian_secretaries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.guardian_secretaries_public
WITH (security_invoker = true)
AS
SELECT id, name, designation, district_id
FROM public.guardian_secretaries;

GRANT SELECT ON public.guardian_secretaries_public TO anon, authenticated;

-- ---------- 4. external_identities: admin-only ----------
DROP POLICY IF EXISTS "Authenticated read external_identities" ON public.external_identities;

CREATE POLICY "Admins read external_identities"
ON public.external_identities
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- 5. notifications recipient scoping ----------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_officer_id uuid;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications(recipient_officer_id);

-- Session -> officer mapping (populated when verify_login_otp issues session;
-- the app calls a small RPC after login to record its supabase auth.uid()).
CREATE TABLE IF NOT EXISTS public.session_officer_map (
  auth_uid uuid PRIMARY KEY,
  officer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_officer_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own session map"
ON public.session_officer_map
FOR SELECT TO authenticated
USING (auth_uid = auth.uid());

-- SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION public.current_officer_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT officer_id FROM public.session_officer_map WHERE auth_uid = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.bind_session_officer(_officer_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'no_session';
  END IF;
  INSERT INTO public.session_officer_map(auth_uid, officer_id)
  VALUES (auth.uid(), _officer_id)
  ON CONFLICT (auth_uid) DO UPDATE SET officer_id = EXCLUDED.officer_id, created_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_officer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bind_session_officer(uuid) TO authenticated;

-- Replace open notifications SELECT with recipient-scoped policy
DROP POLICY IF EXISTS "Authenticated can read notifications" ON public.notifications;

CREATE POLICY "Recipient or broadcast notifications"
ON public.notifications
FOR SELECT TO authenticated
USING (
  recipient_officer_id IS NULL
  OR recipient_officer_id = public.current_officer_id()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
