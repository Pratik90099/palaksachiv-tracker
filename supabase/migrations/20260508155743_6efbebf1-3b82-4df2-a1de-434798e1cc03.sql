
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Officer columns
ALTER TABLE public.officers
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_palak_sachiv boolean NOT NULL DEFAULT false;

-- OTP storage
CREATE TABLE IF NOT EXISTS public.login_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id uuid,
  email citext NOT NULL,
  role text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_otps_email_role ON public.login_otps(email, role, created_at DESC);

ALTER TABLE public.login_otps ENABLE ROW LEVEL SECURITY;
-- intentionally no policies: only SECURITY DEFINER functions touch this table

-- Lookup helper: find an active officer matching email + requested login role
CREATE OR REPLACE FUNCTION public.find_login_officer(_email citext, _role text)
RETURNS public.officers
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.*
  FROM public.officers o
  WHERE o.is_active = true
    AND lower(o.email) = lower(_email)
    AND (
      -- direct role match
      o.role = _role
      -- guardian_secretary login also allowed for department secretaries flagged as palak sachiv
      OR (_role = 'guardian_secretary' AND o.role = 'department_secretary' AND o.is_palak_sachiv = true)
      -- system_admin (CSO) login allowed for any officer flagged is_cso_admin
      OR (_role = 'system_admin' AND o.is_cso_admin = true)
    )
  ORDER BY (o.role = _role) DESC
  LIMIT 1;
$$;

-- Request a new OTP
CREATE OR REPLACE FUNCTION public.request_login_otp(_email text, _role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer public.officers;
  v_code text;
  v_recent_count int;
  v_otp_id uuid;
BEGIN
  IF _email IS NULL OR _email = '' OR _role IS NULL OR _role = '' THEN
    RETURN jsonb_build_object('sent', false, 'error', 'invalid_input');
  END IF;

  v_officer := public.find_login_officer(_email::citext, _role);

  -- Uniform response to prevent enumeration
  IF v_officer.id IS NULL THEN
    RETURN jsonb_build_object('sent', true);
  END IF;

  -- Rate limit: 3 active OTPs per email per 15 minutes
  SELECT count(*) INTO v_recent_count
  FROM public.login_otps
  WHERE email = _email::citext
    AND created_at > now() - interval '15 minutes';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object('sent', false, 'error', 'rate_limited');
  END IF;

  -- Invalidate prior unconsumed OTPs
  UPDATE public.login_otps
  SET consumed_at = now()
  WHERE email = _email::citext
    AND role = _role
    AND consumed_at IS NULL;

  -- Generate 6-digit code
  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  INSERT INTO public.login_otps (officer_id, email, role, code_hash, expires_at)
  VALUES (
    v_officer.id,
    _email::citext,
    _role,
    crypt(v_code, gen_salt('bf', 10)),
    now() + interval '10 minutes'
  )
  RETURNING id INTO v_otp_id;

  RETURN jsonb_build_object(
    'sent', true,
    'otp_id', v_otp_id,
    'dev_code', v_code,
    'recipient_email', v_officer.email,
    'recipient_name', v_officer.name
  );
END;
$$;

-- Verify an OTP
CREATE OR REPLACE FUNCTION public.verify_login_otp(_email text, _role text, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp public.login_otps;
  v_officer public.officers;
  v_district public.districts;
  v_department public.departments;
BEGIN
  IF _email IS NULL OR _role IS NULL OR _code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_input');
  END IF;

  SELECT * INTO v_otp
  FROM public.login_otps
  WHERE email = _email::citext
    AND role = _role
    AND consumed_at IS NULL
    AND expires_at > now()
    AND attempts < 5
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_otp.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_code');
  END IF;

  -- Compare
  IF v_otp.code_hash <> crypt(_code, v_otp.code_hash) THEN
    UPDATE public.login_otps SET attempts = attempts + 1 WHERE id = v_otp.id;
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  UPDATE public.login_otps SET consumed_at = now() WHERE id = v_otp.id;

  SELECT * INTO v_officer FROM public.officers WHERE id = v_otp.officer_id;
  IF v_officer.id IS NULL OR v_officer.is_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'officer_inactive');
  END IF;

  IF v_officer.district_id IS NOT NULL THEN
    SELECT * INTO v_district FROM public.districts WHERE id = v_officer.district_id;
  END IF;
  IF v_officer.department_id IS NOT NULL THEN
    SELECT * INTO v_department FROM public.departments WHERE id = v_officer.department_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_officer.id,
      'name', v_officer.name,
      'email', v_officer.email,
      'designation', coalesce(v_officer.designation, ''),
      -- Login role wins (e.g. department_secretary signing in as palak sachiv)
      'role', _role,
      'district', v_district.name,
      'division', v_district.division,
      'department', coalesce(v_department.short_name, v_department.name),
      'is_cso_admin', v_officer.is_cso_admin,
      'phone', v_officer.phone
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_login_otp(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_login_otp(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_login_otp(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_login_otp(text, text, text) TO anon, authenticated;

-- Seed: ensure the two known CSO admin emails exist as is_cso_admin officers
INSERT INTO public.officers (name, email, role, is_cso_admin, is_active, designation)
SELECT 'Pratik Bavi', 'bavipratik@gmail.com', 'system_admin', true, true, 'CS Office'
WHERE NOT EXISTS (SELECT 1 FROM public.officers WHERE lower(email) = 'bavipratik@gmail.com');

INSERT INTO public.officers (name, email, role, is_cso_admin, is_active, designation)
SELECT 'Rishi Shirke', 'rishishirke65@gmail.com', 'system_admin', true, true, 'CS Office'
WHERE NOT EXISTS (SELECT 1 FROM public.officers WHERE lower(email) = 'rishishirke65@gmail.com');

UPDATE public.officers
SET is_cso_admin = true, is_palak_sachiv = true, is_active = true
WHERE lower(email) IN ('bavipratik@gmail.com', 'rishishirke65@gmail.com');
