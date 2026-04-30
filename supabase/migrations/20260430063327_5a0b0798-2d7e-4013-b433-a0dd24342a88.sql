ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS read_time_minutes integer,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_role text,
  ADD COLUMN IF NOT EXISTS author_avatar_url text;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts(slug);