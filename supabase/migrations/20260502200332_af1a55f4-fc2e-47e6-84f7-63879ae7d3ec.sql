-- Keep the enum-based helper used by existing policies, with safe legacy fallback.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _has_role boolean;
  _has_legacy_admin boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'super_admin'::public.app_role)
  ) INTO _has_role;

  IF _has_role THEN
    RETURN true;
  END IF;

  IF to_regclass('public.admin_users') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = $1)'
      USING _user_id
      INTO _has_legacy_admin;
  END IF;

  RETURN COALESCE(_has_legacy_admin, false);
END;
$$;

-- Add a text overload for code or policies that pass role names as text.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role_enum public.app_role;
BEGIN
  BEGIN
    _role_enum := _role::public.app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    _role_enum := NULL;
  END;

  IF _role_enum IS NOT NULL AND public.has_role(_user_id, _role_enum) THEN
    RETURN true;
  END IF;

  IF to_regclass('public.admin_users') IS NOT NULL THEN
    RETURN (SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = _user_id));
  END IF;

  RETURN false;
END;
$$;

-- Safely migrate legacy admins if that legacy table exists.
DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO public.user_roles (user_id, role)
      SELECT id, ''super_admin''::public.app_role FROM public.admin_users
      ON CONFLICT (user_id, role) DO NOTHING
    ';
  END IF;
END $$;

-- Restore public website read access policies.
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Team members are viewable by everyone"
ON public.team_members
FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Portfolio is viewable by everyone" ON public.portfolio;
CREATE POLICY "Portfolio is viewable by everyone"
ON public.portfolio
FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Visible services are viewable by everyone" ON public.services;
CREATE POLICY "Visible services are viewable by everyone"
ON public.services
FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Testimonials are viewable by everyone" ON public.testimonials;
CREATE POLICY "Testimonials are viewable by everyone"
ON public.testimonials
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
USING (published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings are viewable by everyone"
ON public.site_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Plans viewable by everyone" ON public.membership_plans;
CREATE POLICY "Plans viewable by everyone"
ON public.membership_plans
FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::public.app_role));