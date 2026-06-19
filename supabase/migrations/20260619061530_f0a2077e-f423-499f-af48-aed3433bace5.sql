
-- 1. password_reset_requests audit table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  ip inet,
  requested_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  reason text
);
CREATE INDEX IF NOT EXISTS password_reset_requests_email_time_idx
  ON public.password_reset_requests (email, requested_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_requests_ip_time_idx
  ON public.password_reset_requests (ip, requested_at DESC);

GRANT ALL ON public.password_reset_requests TO service_role;
GRANT SELECT ON public.password_reset_requests TO authenticated;

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read password reset attempts"
  ON public.password_reset_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. password_login_enabled flag on officers
ALTER TABLE public.officers
  ADD COLUMN IF NOT EXISTS password_login_enabled boolean NOT NULL DEFAULT false;

UPDATE public.officers
   SET password_login_enabled = true
 WHERE is_cso_admin = true
    OR role IN ('system_admin', 'chief_secretary');

-- 3. Rate-limit + audit RPC for password reset (callable by edge function)
CREATE OR REPLACE FUNCTION public.request_password_reset_check(_email text, _ip text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email citext := lower(_email)::citext;
  v_ip inet := NULLIF(_ip, '')::inet;
  v_officer public.officers;
  v_email_count int;
  v_ip_count int;
  v_reason text;
  v_send boolean := false;
BEGIN
  IF _email IS NULL OR _email = '' THEN
    RETURN jsonb_build_object('allowed', false, 'send', false, 'reason', 'invalid_input');
  END IF;

  SELECT count(*) INTO v_email_count
    FROM public.password_reset_requests
   WHERE email = v_email AND requested_at > now() - interval '15 minutes';

  IF v_ip IS NOT NULL THEN
    SELECT count(*) INTO v_ip_count
      FROM public.password_reset_requests
     WHERE ip = v_ip AND requested_at > now() - interval '15 minutes';
  ELSE
    v_ip_count := 0;
  END IF;

  IF v_email_count >= 3 OR v_ip_count >= 10 THEN
    v_reason := 'rate_limited';
    INSERT INTO public.password_reset_requests(email, ip, success, reason)
    VALUES (v_email, v_ip, false, v_reason);
    RETURN jsonb_build_object('allowed', true, 'send', false, 'reason', v_reason);
  END IF;

  SELECT * INTO v_officer
    FROM public.officers
   WHERE lower(email) = lower(_email)
     AND is_active = true
   LIMIT 1;

  IF v_officer.id IS NULL THEN
    v_reason := 'unknown_email';
  ELSIF v_officer.password_login_enabled = false
        AND v_officer.is_cso_admin = false
        AND v_officer.role NOT IN ('system_admin','chief_secretary') THEN
    v_reason := 'role_not_allowed';
  ELSE
    v_reason := 'ok';
    v_send := true;
  END IF;

  INSERT INTO public.password_reset_requests(email, ip, success, reason)
  VALUES (v_email, v_ip, v_send, v_reason);

  -- Also append to audit_logs for unified review
  INSERT INTO public.audit_logs(entity_type, entity_id, action, actor_email, diff)
  VALUES ('auth', v_officer.id, 'password_reset_request', v_email::text,
          jsonb_build_object('ip', _ip, 'reason', v_reason, 'send', v_send));

  RETURN jsonb_build_object('allowed', true, 'send', v_send, 'reason', v_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.request_password_reset_check(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_password_reset_check(text, text) TO service_role;

-- 4. Audit log for every password sign-in attempt
CREATE OR REPLACE FUNCTION public.log_password_login_attempt(_email text, _role text, _success boolean, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer_id uuid;
BEGIN
  SELECT id INTO v_officer_id
    FROM public.officers
   WHERE lower(email) = lower(coalesce(_email,''))
   LIMIT 1;

  INSERT INTO public.audit_logs(entity_type, entity_id, action, actor_email, actor_role, diff)
  VALUES ('auth', v_officer_id, 'password_login', lower(coalesce(_email,'')), _role,
          jsonb_build_object('success', _success, 'reason', _reason));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_password_login_attempt(text, text, boolean, text) TO anon, authenticated;

-- 5. Update find_login_officer_public to expose password_login_enabled
CREATE OR REPLACE FUNCTION public.find_login_officer_public(_email text, _role text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer public.officers;
BEGIN
  IF _email IS NULL OR _email = '' OR _role IS NULL OR _role = '' THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  v_officer := public.find_login_officer(_email::citext, _role);
  IF v_officer.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'id', v_officer.id,
    'role', v_officer.role,
    'is_cso_admin', v_officer.is_cso_admin,
    'password_login_enabled',
       v_officer.password_login_enabled
       OR v_officer.is_cso_admin
       OR v_officer.role IN ('system_admin','chief_secretary')
  );
END;
$$;
