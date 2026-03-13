
-- Enable RLS on all tables
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_secretaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Demo mode: allow all operations for anon and authenticated
-- These should be replaced with proper RLS when real auth is added
CREATE POLICY "Allow all read access" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Allow all read access" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow all read access" ON public.guardian_secretaries FOR SELECT USING (true);
CREATE POLICY "Allow all access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.project_districts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.project_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.task_districts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.task_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write access" ON public.districts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all write access" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all write access" ON public.guardian_secretaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.districts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.departments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.guardian_secretaries FOR UPDATE USING (true) WITH CHECK (true);

-- Fix search path warnings
ALTER FUNCTION public.generate_task_display_id() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
