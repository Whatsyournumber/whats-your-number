ALTER TABLE public.onboarding_profiles
  ADD COLUMN IF NOT EXISTS analysis_scope text,
  ADD COLUMN IF NOT EXISTS income_partner_salary numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income_partner_other numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenses_partner numeric DEFAULT 0;