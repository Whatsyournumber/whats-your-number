ALTER TABLE public.onboarding_profiles
  ADD COLUMN IF NOT EXISTS mortgage_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mortgage_rate numeric DEFAULT 3,
  ADD COLUMN IF NOT EXISTS mortgage_term numeric DEFAULT 20;