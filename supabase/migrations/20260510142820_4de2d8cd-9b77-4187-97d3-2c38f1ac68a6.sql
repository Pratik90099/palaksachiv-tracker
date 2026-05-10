
-- Helper: consume an OTP for email dispatch (server-side only via service role)
CREATE OR REPLACE FUNCTION public.consume_pending_otp_for_dispatch(_otp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp public.login_otps;
  v_officer public.officers;
BEGIN
  SELECT * INTO v_otp FROM public.login_otps WHERE id = _otp_id;
  IF v_otp.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  SELECT * INTO v_officer FROM public.officers WHERE id = v_otp.officer_id;
  RETURN jsonb_build_object(
    'found', true,
    'email', v_otp.email::text,
    'role', v_otp.role,
    'recipient_name', coalesce(v_officer.name, ''),
    'expires_at', v_otp.expires_at
  );
END;
$$;

-- Update find_login_officer to allow QA bypass email through ANY role
CREATE OR REPLACE FUNCTION public.find_login_officer(_email citext, _role text)
RETURNS public.officers
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.*
  FROM public.officers o
  WHERE o.is_active = true
    AND lower(o.email) = lower(_email)
    AND (
      o.role = _role
      OR (_role = 'guardian_secretary' AND o.role = 'department_secretary' AND o.is_palak_sachiv = true)
      OR (_role = 'system_admin' AND o.is_cso_admin = true)
      -- QA BYPASS: whitelisted test email may sign in as any of the 5 roles
      OR (lower(o.email) = 'pratikbbavi@gmail.com'
          AND _role IN ('district_collector','department_secretary','guardian_secretary','chief_secretary','system_admin'))
    )
  ORDER BY (o.role = _role) DESC
  LIMIT 1;
$$;

-- Update verify_login_otp with QA BYPASS for pratikbbavi@gmail.com + 567890
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

  -- ============================================================
  -- QA BYPASS — REMOVE BEFORE PRODUCTION
  -- Whitelisted email + fixed code grants instant login for any role.
  -- ============================================================
  IF lower(_email) = 'pratikbbavi@gmail.com' AND _code = '567890' THEN
    v_officer := public.find_login_officer(_email::citext, _role);
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
        'role', _role,
        'district', v_district.name,
        'division', v_district.division,
        'department', coalesce(v_department.short_name, v_department.name),
        'is_cso_admin', v_officer.is_cso_admin,
        'phone', v_officer.phone
      )
    );
  END IF;
  -- ============================================================
  -- END QA BYPASS
  -- ============================================================

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

-- Update request_login_otp to keep dev_code out of response (Gmail will send it)
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

  -- QA BYPASS: whitelisted email skips OTP generation entirely (uses fixed code 567890).
  IF lower(_email) = 'pratikbbavi@gmail.com' THEN
    RETURN jsonb_build_object('sent', true, 'bypass', true);
  END IF;

  v_officer := public.find_login_officer(_email::citext, _role);
  IF v_officer.id IS NULL THEN
    RETURN jsonb_build_object('sent', true);
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.login_otps
  WHERE email = _email::citext AND created_at > now() - interval '15 minutes';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object('sent', false, 'error', 'rate_limited');
  END IF;

  UPDATE public.login_otps
  SET consumed_at = now()
  WHERE email = _email::citext AND role = _role AND consumed_at IS NULL;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  INSERT INTO public.login_otps (officer_id, email, role, code_hash, expires_at)
  VALUES (
    v_officer.id, _email::citext, _role,
    crypt(v_code, gen_salt('bf', 10)), now() + interval '10 minutes'
  )
  RETURNING id INTO v_otp_id;

  RETURN jsonb_build_object(
    'sent', true,
    'otp_id', v_otp_id,
    'plain_code', v_code,  -- passed to edge function via client; edge function dispatches via Gmail
    'recipient_email', v_officer.email,
    'recipient_name', v_officer.name
  );
END;
$$;

-- Seed test admin and QA bypass officer
INSERT INTO public.officers (name, email, role, designation, is_cso_admin, is_palak_sachiv, is_active)
VALUES
  ('Test Admin', 'test.admin@gmail.com', 'system_admin', 'System Administrator (Test)', true, true, true),
  ('Pratik Bavi (QA)', 'pratikbbavi@gmail.com', 'department_secretary', 'QA Test Account', true, true, true)
ON CONFLICT DO NOTHING;
