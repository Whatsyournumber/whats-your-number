CREATE TABLE public.blog_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL,
  url TEXT NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT false,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  distributed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (slug, lang)
);

GRANT SELECT ON public.blog_distributions TO authenticated;
GRANT ALL ON public.blog_distributions TO service_role;

ALTER TABLE public.blog_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view distributions"
ON public.blog_distributions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));