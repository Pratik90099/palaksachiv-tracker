-- Restore full column access on officers; the column-level approach broke
-- the app because it uses anonymous Supabase sessions (per architectural
-- design noted in security memory). Tracked separately under per-user JWT
-- refactor.
GRANT SELECT ON public.officers TO authenticated;
