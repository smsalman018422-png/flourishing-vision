-- Allow super_admins (and admins) to view all roles, not just their own.
-- Uses has_role() (SECURITY DEFINER) to avoid recursive RLS evaluation.

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
