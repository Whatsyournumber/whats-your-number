CREATE TABLE public.backlink_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pendiente',
  link_url TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backlink_submissions TO authenticated;
GRANT ALL ON public.backlink_submissions TO service_role;

ALTER TABLE public.backlink_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage backlink submissions"
ON public.backlink_submissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));