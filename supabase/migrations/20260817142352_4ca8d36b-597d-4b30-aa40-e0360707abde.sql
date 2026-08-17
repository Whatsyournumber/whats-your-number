ALTER TABLE public.onboarding_profiles
  ADD COLUMN IF NOT EXISTS goal_note text,
  ADD COLUMN IF NOT EXISTS home_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS down_payment_pct numeric DEFAULT 20;