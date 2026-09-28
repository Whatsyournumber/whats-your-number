ALTER TABLE public.onboarding_profiles
ADD COLUMN goal_secondary text;

COMMENT ON COLUMN public.onboarding_profiles.goal_secondary IS 'Optional second financial goal selected during onboarding';