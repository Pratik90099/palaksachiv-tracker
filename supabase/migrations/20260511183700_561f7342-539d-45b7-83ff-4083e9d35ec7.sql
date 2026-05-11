
-- Audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_officer_id uuid,
  actor_email text,
  actor_role text,
  district_id uuid,
  diff jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor  ON public.audit_logs (actor_officer_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Inserts: any authenticated user (officer or admin)
CREATE POLICY "Authenticated insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Reads: admins see everything; officers see their own rows
CREATE POLICY "Admins or self read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR actor_officer_id = current_officer_id()
  );

-- Updates and deletes: never allowed (no policy = denied under RLS)

-- Trigger function to log writes on tasks / meeting_minutes
CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer_id uuid;
  v_email text;
  v_role text;
  v_district uuid;
  v_action text;
  v_entity_id uuid;
BEGIN
  v_officer_id := public.current_officer_id();
  IF v_officer_id IS NOT NULL THEN
    SELECT email, role, district_id
      INTO v_email, v_role, v_district
      FROM public.officers WHERE id = v_officer_id;
  ELSE
    v_role := CASE WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN 'admin' ELSE NULL END;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
  ELSIF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_entity_id := NEW.id;
  ELSE
    v_action := 'update';
    v_entity_id := NEW.id;
  END IF;

  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_officer_id,
    actor_email, actor_role, district_id, diff
  ) VALUES (
    TG_ARGV[0], v_entity_id, v_action, v_officer_id,
    v_email, v_role, v_district,
    jsonb_build_object(
      'before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'after',  CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change('task');

CREATE TRIGGER trg_audit_meeting_minutes
  AFTER INSERT OR UPDATE OR DELETE ON public.meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change('meeting_minutes');
