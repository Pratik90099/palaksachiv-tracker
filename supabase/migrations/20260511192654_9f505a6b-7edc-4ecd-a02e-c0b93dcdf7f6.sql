CREATE TABLE public.visit_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  author_officer_id uuid REFERENCES public.officers(id) ON DELETE SET NULL,
  author_role text,
  comment_text text NOT NULL,
  is_action_taken boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_visit_comments_visit ON public.visit_comments(visit_id);

ALTER TABLE public.visit_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read visit_comments"
  ON public.visit_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officer or admin insert visit_comments"
  ON public.visit_comments FOR INSERT TO authenticated
  WITH CHECK ((current_officer_id() IS NOT NULL) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Author or admin update visit_comments"
  ON public.visit_comments FOR UPDATE TO authenticated
  USING ((author_officer_id = current_officer_id()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((author_officer_id = current_officer_id()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Author or admin delete visit_comments"
  ON public.visit_comments FOR DELETE TO authenticated
  USING ((author_officer_id = current_officer_id()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_visit_comments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.visit_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change('visit_comments');