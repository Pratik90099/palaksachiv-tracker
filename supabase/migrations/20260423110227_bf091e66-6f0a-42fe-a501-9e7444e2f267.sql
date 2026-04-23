-- 1. Add Parichay UID and CS Office admin flag to officers
ALTER TABLE public.officers
  ADD COLUMN IF NOT EXISTS parichay_uid TEXT,
  ADD COLUMN IF NOT EXISTS is_cso_admin BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS officers_parichay_uid_key
  ON public.officers(parichay_uid)
  WHERE parichay_uid IS NOT NULL;

-- 2. external_identities: maps officers to login providers
CREATE TABLE IF NOT EXISTS public.external_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('parichay', 'email', 'cso')),
  external_uid TEXT NOT NULL,
  email TEXT,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_uid)
);

ALTER TABLE public.external_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read external_identities"
  ON public.external_identities FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can insert external_identities"
  ON public.external_identities FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update external_identities"
  ON public.external_identities FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete external_identities"
  ON public.external_identities FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER trg_external_identities_updated_at
  BEFORE UPDATE ON public.external_identities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. integrations: planned/live external system catalog
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_discussion', 'live', 'deprecated')),
  owner TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read integrations"
  ON public.integrations FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can insert integrations"
  ON public.integrations FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update integrations"
  ON public.integrations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete integrations"
  ON public.integrations FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed with planned integrations
INSERT INTO public.integrations (name, short_code, description, category, status, display_order) VALUES
  ('PRAGATI', 'pragati', 'PM''s Pro-Active Governance and Timely Implementation', 'Governance', 'planned', 10),
  ('PFMS', 'pfms', 'Public Financial Management System', 'Finance', 'planned', 20),
  ('GeM', 'gem', 'Government e-Marketplace', 'Procurement', 'planned', 30),
  ('e-Office', 'eoffice', 'NIC e-Office for file movement', 'Administration', 'planned', 40),
  ('e-Taal', 'etaal', 'Electronic Transaction Aggregation & Analysis Layer', 'Analytics', 'planned', 50),
  ('Parichay SSO', 'parichay', 'NIC single sign-on for government officers', 'Authentication', 'in_discussion', 5),
  ('SETU', 'setu', 'Maharashtra service delivery portal', 'Citizen Services', 'planned', 60),
  ('Mahabhulekh', 'mahabhulekh', 'Maharashtra land records', 'Revenue', 'planned', 70),
  ('Aaple Sarkar', 'aaplesarkar', 'Citizen grievance redressal', 'Grievance', 'planned', 80),
  ('CMO Dashboard', 'cmo', 'Chief Minister''s Office dashboard feed', 'Governance', 'planned', 90)
ON CONFLICT DO NOTHING;