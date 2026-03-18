
CREATE TABLE public.meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date date NOT NULL DEFAULT CURRENT_DATE,
  venue text,
  chaired_by text,
  attendees text[],
  agenda text,
  minutes_text text NOT NULL,
  decisions text[],
  action_items text[],
  related_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.meeting_minutes
  FOR ALL TO public
  USING (true) WITH CHECK (true);
