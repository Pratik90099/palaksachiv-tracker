
-- Attach the previously-orphan grant_user_role_from_session trigger.
DROP TRIGGER IF EXISTS trg_grant_user_role_from_session ON public.session_officer_map;
CREATE TRIGGER trg_grant_user_role_from_session
  AFTER INSERT OR UPDATE ON public.session_officer_map
  FOR EACH ROW EXECUTE FUNCTION public.grant_user_role_from_session();

-- Backfill: grant 'admin' to currently-bound CSO/system_admin sessions.
INSERT INTO public.user_roles (user_id, role)
SELECT som.auth_uid, 'admin'::app_role
FROM public.session_officer_map som
JOIN public.officers o ON o.id = som.officer_id
WHERE o.is_cso_admin = true OR o.role = 'system_admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Baseline 'user' role for every other already-bound session.
INSERT INTO public.user_roles (user_id, role)
SELECT som.auth_uid, 'user'::app_role
FROM public.session_officer_map som
JOIN public.officers o ON o.id = som.officer_id
WHERE NOT (o.is_cso_admin = true OR o.role = 'system_admin')
ON CONFLICT (user_id, role) DO NOTHING;
