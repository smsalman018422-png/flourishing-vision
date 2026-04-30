-- Add is_visible to team_members (default true so existing rows stay visible)
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Add status to contact_submissions
DO $$ BEGIN
  CREATE TYPE public.contact_status AS ENUM ('new', 'contacted', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS status public.contact_status NOT NULL DEFAULT 'new';

-- Public storage buckets for admin uploads
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('team-photos', 'team-photos', true),
  ('portfolio-images', 'portfolio-images', true),
  ('blog-covers', 'blog-covers', true),
  ('service-images', 'service-images', true),
  ('testimonial-photos', 'testimonial-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all five buckets
DO $$ BEGIN
  CREATE POLICY "Public read admin assets"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('team-photos','portfolio-images','blog-covers','service-images','testimonial-photos'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated admins can write/update/delete
DO $$ BEGIN
  CREATE POLICY "Admins can upload admin assets"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id IN ('team-photos','portfolio-images','blog-covers','service-images','testimonial-photos')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update admin assets"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id IN ('team-photos','portfolio-images','blog-covers','service-images','testimonial-photos')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete admin assets"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id IN ('team-photos','portfolio-images','blog-covers','service-images','testimonial-photos')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;