
-- 1. Officers table
CREATE TABLE public.officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'department_secretary',
  district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read officers" ON public.officers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can insert officers" ON public.officers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update officers" ON public.officers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete officers" ON public.officers FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_officers_updated_at
BEFORE UPDATE ON public.officers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. AI insights table
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by text,
  payload jsonb NOT NULL
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ai_insights" ON public.ai_insights FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can insert ai_insights" ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete ai_insights" ON public.ai_insights FOR DELETE TO authenticated USING (true);

-- 3. Assignment columns on projects + tasks
ALTER TABLE public.projects ADD COLUMN assigned_officer_id uuid REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN assigned_officer_id uuid REFERENCES public.officers(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_assigned_officer ON public.projects(assigned_officer_id);
CREATE INDEX idx_tasks_assigned_officer ON public.tasks(assigned_officer_id);

-- 4. Seed: Chief Secretary + all Guardian Secretaries as officers
INSERT INTO public.officers (name, designation, email, role, district_id)
SELECT
  gs.name,
  COALESCE(gs.designation, 'Guardian Secretary'),
  gs.email,
  'guardian_secretary',
  gs.district_id
FROM public.guardian_secretaries gs
WHERE gs.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.officers (name, designation, email, role)
VALUES ('Chief Secretary', 'Chief Secretary, Government of Maharashtra', 'cs@maharashtra.gov.in', 'chief_secretary')
ON CONFLICT (email) DO NOTHING;
