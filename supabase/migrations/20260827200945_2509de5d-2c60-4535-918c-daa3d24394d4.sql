CREATE TABLE public.blog_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'es',
  country TEXT,
  city TEXT,
  referrer TEXT,
  device TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX blog_page_views_slug_created_idx ON public.blog_page_views (slug, created_at DESC);
CREATE INDEX blog_page_views_created_idx ON public.blog_page_views (created_at DESC);
CREATE INDEX blog_page_views_country_idx ON public.blog_page_views (country);

GRANT INSERT ON public.blog_page_views TO anon;
GRANT INSERT ON public.blog_page_views TO authenticated;
GRANT ALL ON public.blog_page_views TO service_role;

ALTER TABLE public.blog_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a blog page view"
  ON public.blog_page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);