ALTER TABLE public.onboarding_profiles ADD COLUMN IF NOT EXISTS income_business numeric DEFAULT 0 NOT NULL;

CREATE POLICY "Owners can manage their own linkedin connection" ON public.linkedin_connection FOR ALL TO authenticated USING (connected_by = auth.uid()) WITH CHECK (connected_by = auth.uid());