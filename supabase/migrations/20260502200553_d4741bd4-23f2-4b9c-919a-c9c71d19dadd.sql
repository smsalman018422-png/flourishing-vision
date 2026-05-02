-- Remove the compatibility overload; existing policies use the enum helper.
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Keep public visitor access simple and unauthenticated.
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Team members are viewable by everyone"
ON public.team_members
FOR SELECT
USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
CREATE POLICY "Admins can view all team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Portfolio is viewable by everyone" ON public.portfolio;
CREATE POLICY "Portfolio is viewable by everyone"
ON public.portfolio
FOR SELECT
USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can view all portfolio" ON public.portfolio;
CREATE POLICY "Admins can view all portfolio"
ON public.portfolio
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Visible services are viewable by everyone" ON public.services;
CREATE POLICY "Visible services are viewable by everyone"
ON public.services
FOR SELECT
USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
CREATE POLICY "Admins can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
USING (published = true);

DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Plans viewable by everyone" ON public.membership_plans;
CREATE POLICY "Plans viewable by everyone"
ON public.membership_plans
FOR SELECT
USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can view all plans" ON public.membership_plans;
CREATE POLICY "Admins can view all plans"
ON public.membership_plans
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));