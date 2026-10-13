CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  event text NOT NULL,
  step integer,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX funnel_events_created_idx ON public.funnel_events(created_at);
GRANT INSERT ON public.funnel_events TO anon, authenticated;
GRANT SELECT ON public.funnel_events TO authenticated;
GRANT ALL ON public.funnel_events TO service_role;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone logs funnel events" ON public.funnel_events FOR INSERT TO anon, authenticated
WITH CHECK (
  event IN ('visit','auth_view','sign_up','login','onboarding_step','onboarding_complete')
  AND length(session_id) <= 64 AND (step IS NULL OR step BETWEEN 1 AND 11)
  AND (user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "admins read funnel" ON public.funnel_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));