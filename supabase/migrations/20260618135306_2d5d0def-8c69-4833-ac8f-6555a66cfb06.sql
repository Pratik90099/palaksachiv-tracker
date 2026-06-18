CREATE OR REPLACE FUNCTION public.find_login_officer_public(_email text, _role text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
    'is_cso_admin', v_officer.is_cso_admin
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_login_officer_public(text, text) TO anon, authenticated;