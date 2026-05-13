-- Auto-grant admin role in user_roles when an admin officer first signs in.
-- session_officer_map gets one row per officer per auth session (upsert on auth_uid).
-- We watch INSERT/UPDATE and copy the appropriate role into user_roles.

CREATE OR REPLACE FUNCTION public.grant_user_role_from_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_officer public.officers;
BEGIN
  SELECT * INTO v_officer FROM public.officers WHERE id = NEW.officer_id;
  IF v_officer.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- CS Office staff and system_admin role get the 'admin' app_role.
  IF v_officer.is_cso_admin = true OR v_officer.role = 'system_admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.auth_uid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Everyone else gets a baseline 'user' role.
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.auth_uid, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_user_role_from_session ON public.session_officer_map;
CREATE TRIGGER trg_grant_user_role_from_session
AFTER INSERT OR UPDATE ON public.session_officer_map
FOR EACH ROW EXECUTE FUNCTION public.grant_user_role_from_session();

-- One-time backfill: for every officer that already has a session mapped,
-- make sure user_roles has the matching app_role.
INSERT INTO public.user_roles (user_id, role)
SELECT m.auth_uid,
       CASE WHEN o.is_cso_admin = true OR o.role = 'system_admin'
            THEN 'admin'::app_role
            ELSE 'user'::app_role
       END
FROM public.session_officer_map m
JOIN public.officers o ON o.id = m.officer_id
ON CONFLICT (user_id, role) DO NOTHING;