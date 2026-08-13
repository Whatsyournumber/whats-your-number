REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR (auth.uid() IS NOT NULL AND _user_id <> auth.uid()) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
    )
  END
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;