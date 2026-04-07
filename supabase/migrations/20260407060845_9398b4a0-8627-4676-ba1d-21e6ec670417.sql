
-- Create document_uploads table
CREATE TABLE public.document_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT,
  processing_mode TEXT NOT NULL DEFAULT 'summarize',
  ai_result JSONB,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies (matching current demo pattern)
CREATE POLICY "Allow all read access" ON public.document_uploads FOR SELECT USING (true);
CREATE POLICY "Allow all write access" ON public.document_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.document_uploads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete access" ON public.document_uploads FOR DELETE USING (true);

-- Create documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage RLS policies
CREATE POLICY "Allow document uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow document reads" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
