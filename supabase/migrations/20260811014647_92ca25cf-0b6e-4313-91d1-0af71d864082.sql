ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS access_product_id text,
  ADD COLUMN IF NOT EXISTS access_until timestamptz;