
-- Visit attachments table
CREATE TABLE IF NOT EXISTS public.visit_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('photo','document')),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_attachments_visit ON public.visit_attachments(visit_id);

ALTER TABLE public.visit_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read visit_attachments"
  ON public.visit_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officer or admin insert visit_attachments"
  ON public.visit_attachments FOR INSERT TO authenticated
  WITH CHECK ((current_officer_id() IS NOT NULL) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Uploader or admin delete visit_attachments"
  ON public.visit_attachments FOR DELETE TO authenticated
  USING ((uploaded_by = current_officer_id()) OR has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for the existing private 'documents' bucket, scoped to visits/
CREATE POLICY "Officers can upload to visits folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'visits'
    AND ((current_officer_id() IS NOT NULL) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Authenticated can read visits folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'visits');

CREATE POLICY "Officer or admin can delete visits folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'visits'
    AND ((current_officer_id() IS NOT NULL) OR has_role(auth.uid(), 'admin'::app_role))
  );
