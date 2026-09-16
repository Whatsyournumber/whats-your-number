ALTER TABLE public.onboarding_profiles
  ADD COLUMN IF NOT EXISTS fixed_groceries numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_health numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_family numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_debt numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_restaurants numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_delivery numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_travel numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_nightlife numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_shopping numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_gym numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_professional numeric NOT NULL DEFAULT 0;