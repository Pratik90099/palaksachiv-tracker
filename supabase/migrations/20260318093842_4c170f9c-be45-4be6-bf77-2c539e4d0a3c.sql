
-- Project categories (PRAGATI, CM War Room, etc.)
CREATE TABLE public.project_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.project_categories FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed default categories
INSERT INTO public.project_categories (name, description) VALUES
  ('PRAGATI', 'Pro-Active Governance And Timely Implementation'),
  ('CM War Room', 'Chief Minister War Room monitored projects'),
  ('State Priority', 'State-level priority projects'),
  ('Central Scheme', 'Centrally sponsored scheme projects'),
  ('District Initiative', 'District-level initiative projects'),
  ('Other', 'General/uncategorized projects');

-- Project tags (Infrastructure, Social, etc.)
CREATE TABLE public.project_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.project_tags FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed default tags
INSERT INTO public.project_tags (name) VALUES
  ('Infrastructure'), ('Social'), ('Health'), ('Education'),
  ('Water Supply'), ('Road'), ('Housing'), ('Agriculture'),
  ('Industry'), ('Tourism'), ('Environment'), ('Urban Development'),
  ('Rural Development'), ('IT'), ('Energy'), ('Transport');

-- Junction table: projects <-> tags (many-to-many)
CREATE TABLE public.project_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.project_tags(id) ON DELETE CASCADE,
  UNIQUE(project_id, tag_id)
);

ALTER TABLE public.project_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.project_tag_assignments FOR ALL TO public USING (true) WITH CHECK (true);
