CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at timestamptz NOT NULL DEFAULT now(),
  session_hash text
);

CREATE INDEX IF NOT EXISTS idx_site_visits_visited_at ON public.site_visits(visited_at DESC);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a visit"
ON public.site_visits FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read visits"
ON public.site_visits FOR SELECT TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.get_visitor_counts()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.site_visits),
    'today', (SELECT count(*) FROM public.site_visits WHERE visited_at >= date_trunc('day', now()))
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_visitor_counts() TO anon, authenticated;
