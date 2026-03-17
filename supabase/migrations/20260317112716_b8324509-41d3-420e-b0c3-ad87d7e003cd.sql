
-- Create notifications table for real-time alerts
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  related_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  related_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
