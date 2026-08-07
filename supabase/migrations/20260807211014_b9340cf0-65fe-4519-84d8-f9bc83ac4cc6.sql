ALTER TABLE public.onboarding_profiles
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS children text,
  ADD COLUMN IF NOT EXISTS plans_children text,
  ADD COLUMN IF NOT EXISTS lifestyle text,
  ADD COLUMN IF NOT EXISTS travel_frequency text,
  ADD COLUMN IF NOT EXISTS housing text;