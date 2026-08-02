CREATE TABLE public.onboarding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  age integer,
  country text,
  country_code text,
  currency text DEFAULT 'USD',
  timezone text,
  income_salary numeric DEFAULT 0,
  income_bonus numeric DEFAULT 0,
  income_rent numeric DEFAULT 0,
  income_other numeric DEFAULT 0,
  monthly_expenses numeric DEFAULT 0,
  monthly_savings numeric DEFAULT 0,
  assets_cash numeric DEFAULT 0,
  assets_bank numeric DEFAULT 0,
  assets_retirement numeric DEFAULT 0,
  assets_etf numeric DEFAULT 0,
  assets_stocks numeric DEFAULT 0,
  assets_crypto numeric DEFAULT 0,
  assets_property numeric DEFAULT 0,
  liabilities numeric DEFAULT 0,
  retire_age integer DEFAULT 60,
  desired_retirement_income numeric DEFAULT 0,
  expected_return numeric DEFAULT 7,
  priority text,
  risk_profile text,
  current_step integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_profiles TO authenticated;
GRANT ALL ON public.onboarding_profiles TO service_role;

ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own onboarding profile"
ON public.onboarding_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_onboarding_profiles_updated_at
BEFORE UPDATE ON public.onboarding_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();