
-- Districts table
CREATE TABLE public.districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  division TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardian Secretaries table
CREATE TABLE public.guardian_secretaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table (multi-district, multi-department)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'not_started',
  is_goi_pending BOOLEAN NOT NULL DEFAULT false,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project districts (many-to-many)
CREATE TABLE public.project_districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  UNIQUE(project_id, district_id)
);

-- Project departments (many-to-many)
CREATE TABLE public.project_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  UNIQUE(project_id, department_id)
);

-- Tasks (actionables within projects)
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'not_started',
  responsible_officer TEXT,
  agency TEXT,
  target_date DATE,
  is_goi_pending BOOLEAN NOT NULL DEFAULT false,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  display_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task districts (many-to-many: each task can span districts)
CREATE TABLE public.task_districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  UNIQUE(task_id, district_id)
);

-- Task departments (many-to-many: each task assigned to departments)
CREATE TABLE public.task_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  UNIQUE(task_id, department_id)
);

-- Visits table
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gs_id UUID REFERENCES public.guardian_secretaries(id) ON DELETE SET NULL,
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  visit_date DATE,
  quarter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  issues_logged INTEGER NOT NULL DEFAULT 0,
  rating TEXT DEFAULT 'satisfactory',
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate display_id for tasks
CREATE OR REPLACE FUNCTION public.generate_task_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 'ACT-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.tasks
  WHERE display_id IS NOT NULL;
  
  NEW.display_id := 'ACT-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_task_display_id
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL)
  EXECUTE FUNCTION public.generate_task_display_id();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
