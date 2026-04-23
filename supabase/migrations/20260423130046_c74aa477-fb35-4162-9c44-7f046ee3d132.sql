
-- 1. external_identities: remove anon read
DROP POLICY IF EXISTS "Public can read external_identities" ON public.external_identities;
CREATE POLICY "Authenticated can read external_identities"
  ON public.external_identities FOR SELECT
  TO authenticated USING (true);

-- 2. notifications: drop permissive policies, restrict to authenticated
DROP POLICY IF EXISTS "Allow all access" ON public.notifications;
DROP POLICY IF EXISTS "Public can read notifications" ON public.notifications;

CREATE POLICY "Authenticated can read notifications"
  ON public.notifications FOR SELECT
  TO authenticated USING (true);

-- 3. Realtime channel policy for authenticated subscribers
DROP POLICY IF EXISTS "Authenticated realtime notifications" ON realtime.messages;
CREATE POLICY "Authenticated realtime notifications"
  ON realtime.messages FOR SELECT
  TO authenticated USING (true);

-- 4. Storage: drop legacy public-role policies on documents bucket
DROP POLICY IF EXISTS "Allow document uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow document reads" ON storage.objects;
