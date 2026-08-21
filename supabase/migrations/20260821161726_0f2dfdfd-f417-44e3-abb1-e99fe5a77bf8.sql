CREATE TABLE public.linkedin_connection (
  id TEXT PRIMARY KEY DEFAULT 'default',
  org_urn TEXT,
  org_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  refresh_expires_at TIMESTAMPTZ,
  scope TEXT,
  oauth_state TEXT,
  oauth_state_at TIMESTAMPTZ,
  connected_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.linkedin_connection TO service_role;
ALTER TABLE public.linkedin_connection ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.linkedin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'es',
  post_urn TEXT,
  post_url TEXT,
  commentary TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  error TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.linkedin_posts TO service_role;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view linkedin posts"
ON public.linkedin_posts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
GRANT SELECT ON public.linkedin_posts TO authenticated;