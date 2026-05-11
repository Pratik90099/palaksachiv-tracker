
-- guardian_secretaries: drop public read, allow authenticated only
DROP POLICY IF EXISTS "Public can read guardian_secretaries" ON public.guardian_secretaries;
CREATE POLICY "Authenticated read guardian_secretaries"
  ON public.guardian_secretaries FOR SELECT
  TO authenticated
  USING (true);

-- ai_insights: drop public read, allow authenticated only
DROP POLICY IF EXISTS "Public can read ai_insights" ON public.ai_insights;
CREATE POLICY "Authenticated read ai_insights"
  ON public.ai_insights FOR SELECT
  TO authenticated
  USING (true);

-- document_uploads: drop public read, allow authenticated only
DROP POLICY IF EXISTS "Public can read document_uploads" ON public.document_uploads;
CREATE POLICY "Authenticated read document_uploads"
  ON public.document_uploads FOR SELECT
  TO authenticated
  USING (true);
