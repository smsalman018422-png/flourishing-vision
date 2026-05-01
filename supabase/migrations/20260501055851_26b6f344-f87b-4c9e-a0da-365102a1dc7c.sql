-- Extend client_projects
ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_team_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.client_projects
  ADD CONSTRAINT client_projects_progress_range CHECK (progress >= 0 AND progress <= 100);

-- Extend client_reports
ALTER TABLE public.client_reports
  ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS week_start DATE,
  ADD COLUMN IF NOT EXISTS week_end DATE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- Storage bucket for report files (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-reports', 'client-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Files are stored under <client_id>/<filename>. Clients see their own folder; admins see all.
CREATE POLICY "Clients read own report files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'client-reports'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Admins upload report files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'client-reports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update report files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'client-reports' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'client-reports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete report files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'client-reports' AND public.has_role(auth.uid(), 'admin'));