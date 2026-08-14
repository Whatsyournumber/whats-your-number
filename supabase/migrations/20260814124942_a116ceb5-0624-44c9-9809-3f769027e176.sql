CREATE TABLE public.kid_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '🧒',
  birth_year integer,
  currency text NOT NULL DEFAULT 'EUR',
  starting_capital numeric NOT NULL DEFAULT 0,
  monthly_contribution numeric NOT NULL DEFAULT 0,
  expected_return numeric NOT NULL DEFAULT 10,
  goal text,
  goal_amount numeric NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_profiles TO authenticated;
GRANT ALL ON public.kid_profiles TO service_role;

ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage their kid profiles"
ON public.kid_profiles FOR ALL
TO authenticated
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

CREATE TRIGGER kid_profiles_set_updated_at
BEFORE UPDATE ON public.kid_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();