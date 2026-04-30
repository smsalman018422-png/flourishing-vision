DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'portfolio'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'testimonials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'blog_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'contact_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_roles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('blog-images', 'blog-images', true),
  ('testimonial-images', 'testimonial-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view managed site image buckets'
  ) THEN
    CREATE POLICY "Public can view managed site image buckets"
    ON storage.objects
    FOR SELECT
    USING (bucket_id IN ('team-photos', 'portfolio-images', 'blog-covers', 'blog-images', 'service-images', 'testimonial-photos', 'testimonial-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload managed site image buckets'
  ) THEN
    CREATE POLICY "Admins can upload managed site image buckets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id IN ('team-photos', 'portfolio-images', 'blog-covers', 'blog-images', 'service-images', 'testimonial-photos', 'testimonial-images')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update managed site image buckets'
  ) THEN
    CREATE POLICY "Admins can update managed site image buckets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id IN ('team-photos', 'portfolio-images', 'blog-covers', 'blog-images', 'service-images', 'testimonial-photos', 'testimonial-images')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    )
    WITH CHECK (
      bucket_id IN ('team-photos', 'portfolio-images', 'blog-covers', 'blog-images', 'service-images', 'testimonial-photos', 'testimonial-images')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete managed site image buckets'
  ) THEN
    CREATE POLICY "Admins can delete managed site image buckets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id IN ('team-photos', 'portfolio-images', 'blog-covers', 'blog-images', 'service-images', 'testimonial-photos', 'testimonial-images')
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;
END $$;