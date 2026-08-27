ALTER TABLE public.backlink_submissions
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dofollow_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS http_status integer,
  ADD COLUMN IF NOT EXISTS check_error text,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;