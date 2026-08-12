ALTER TABLE public.holdings
  ADD COLUMN IF NOT EXISTS linked_liability numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_income numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_year integer,
  ADD COLUMN IF NOT EXISTS probability numeric NOT NULL DEFAULT 100;