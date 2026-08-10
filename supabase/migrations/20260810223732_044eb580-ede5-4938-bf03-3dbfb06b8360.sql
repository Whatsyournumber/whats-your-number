ALTER TABLE public.onboarding_profiles
  ADD COLUMN IF NOT EXISTS fixed_housing numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_utilities numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_insurance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_transport numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_education numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_subscriptions numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_savings numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_other numeric NOT NULL DEFAULT 0;