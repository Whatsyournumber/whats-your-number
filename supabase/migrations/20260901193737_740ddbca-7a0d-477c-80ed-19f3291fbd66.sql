CREATE TABLE public.custom_fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fixed_expenses TO authenticated;
GRANT ALL ON public.custom_fixed_expenses TO service_role;
ALTER TABLE public.custom_fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own fixed expenses" ON public.custom_fixed_expenses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER custom_fixed_expenses_set_updated_at BEFORE UPDATE ON public.custom_fixed_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();