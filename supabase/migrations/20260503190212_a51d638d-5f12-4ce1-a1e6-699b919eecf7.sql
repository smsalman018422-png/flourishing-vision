DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;

CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
TO public
USING (
  COALESCE(published, false) = true
);
