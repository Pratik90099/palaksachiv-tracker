
-- 1) ai_call_logs: admin-only SELECT
DROP POLICY IF EXISTS "Auth read ai_call_logs" ON public.ai_call_logs;
CREATE POLICY "Admins read ai_call_logs"
  ON public.ai_call_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) visits: require authenticated SELECT (remove anon)
DROP POLICY IF EXISTS "Public can read visits" ON public.visits;
CREATE POLICY "Authenticated read visits"
  ON public.visits FOR SELECT TO authenticated
  USING (true);

-- Tighten visits writes: must have a bound officer or admin
DROP POLICY IF EXISTS "Auth insert visits" ON public.visits;
DROP POLICY IF EXISTS "Auth update visits" ON public.visits;
DROP POLICY IF EXISTS "Auth delete visits" ON public.visits;
CREATE POLICY "Officer or admin insert visits" ON public.visits FOR INSERT TO authenticated
  WITH CHECK (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Officer or admin update visits" ON public.visits FOR UPDATE TO authenticated
  USING (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Officer or admin delete visits" ON public.visits FOR DELETE TO authenticated
  USING (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role));

-- 3) Tighten write policies on other tables to require bound officer or admin
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_insights','document_uploads','meeting_minutes','notifications',
    'projects','tasks','project_departments','project_districts',
    'project_tag_assignments','task_departments','task_districts'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Auth insert %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Auth update %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Auth delete %1$s" ON public.%1$s', t);
    EXECUTE format($f$CREATE POLICY "Officer or admin insert %1$s" ON public.%1$s FOR INSERT TO authenticated WITH CHECK (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role))$f$, t);
    EXECUTE format($f$CREATE POLICY "Officer or admin update %1$s" ON public.%1$s FOR UPDATE TO authenticated USING (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role)) WITH CHECK (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role))$f$, t);
    EXECUTE format($f$CREATE POLICY "Officer or admin delete %1$s" ON public.%1$s FOR DELETE TO authenticated USING (current_officer_id() IS NOT NULL OR has_role(auth.uid(),'admin'::app_role))$f$, t);
  END LOOP;
END $$;

-- 4) Realtime: restrict broadcast/presence topics to admins or bound officers
DROP POLICY IF EXISTS "Authenticated realtime notifications" ON realtime.messages;
CREATE POLICY "Officer or admin realtime"
  ON realtime.messages FOR SELECT TO authenticated
  USING (public.current_officer_id() IS NOT NULL OR public.has_role(auth.uid(),'admin'::app_role));
