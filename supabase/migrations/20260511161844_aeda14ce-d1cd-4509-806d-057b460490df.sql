CREATE TABLE IF NOT EXISTS public.ai_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  function_name text NOT NULL,
  provider text NOT NULL,
  status integer NOT NULL,
  latency_ms integer,
  error_code text,
  caller_email text
);

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_created ON public.ai_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_function ON public.ai_call_logs(function_name);

ALTER TABLE public.ai_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read ai_call_logs"
ON public.ai_call_logs
FOR SELECT TO authenticated
USING (true);
