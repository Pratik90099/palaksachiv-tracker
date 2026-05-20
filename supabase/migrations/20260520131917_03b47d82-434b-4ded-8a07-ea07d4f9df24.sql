CREATE OR REPLACE FUNCTION public.grant_user_role_from_session()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_officer public.officers;
BEGIN
  SELECT * INTO v_officer FROM public.officers WHERE id = NEW.officer_id;
  IF v_officer.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_officer.is_cso_admin = true
     OR v_officer.role = 'system_admin'
     OR v_officer.role = 'chief_secretary' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.auth_uid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.auth_uid, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

INSERT INTO public.user_roles (user_id, role)
SELECT som.auth_uid, 'admin'::app_role
FROM public.session_officer_map som
JOIN public.officers o ON o.id = som.officer_id
WHERE o.role = 'chief_secretary'
ON CONFLICT (user_id, role) DO NOTHING;