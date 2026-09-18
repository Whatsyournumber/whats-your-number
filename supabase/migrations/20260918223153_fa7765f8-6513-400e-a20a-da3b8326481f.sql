CREATE TABLE public.spend_plans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  target numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spend_plans TO authenticated;
GRANT ALL ON public.spend_plans TO service_role;
ALTER TABLE public.spend_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own spend plan" ON public.spend_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER spend_plans_set_updated_at BEFORE UPDATE ON public.spend_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();