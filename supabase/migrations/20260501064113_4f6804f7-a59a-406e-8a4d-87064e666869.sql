INSERT INTO storage.buckets (id, name, public)
VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-avatars');

DROP POLICY IF EXISTS "Clients upload own avatar" ON storage.objects;
CREATE POLICY "Clients upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Clients update own avatar" ON storage.objects;
CREATE POLICY "Clients update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  )
  WITH CHECK (
    bucket_id = 'client-avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Clients delete own avatar" ON storage.objects;
CREATE POLICY "Clients delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  );

-- Add country and timezone columns to client_profiles
ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Realtime for notifications (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.client_notifications';
  END IF;
END $$;

ALTER TABLE public.client_notifications REPLICA IDENTITY FULL;