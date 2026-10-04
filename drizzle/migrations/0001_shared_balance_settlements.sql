CREATE TABLE public.shared_balance_settlements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key text NOT NULL CHECK (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  currency text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, partner_id, month_key),
  CHECK (user_id <> partner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_balance_settlements TO authenticated;
GRANT ALL ON public.shared_balance_settlements TO service_role;
ALTER TABLE public.shared_balance_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own shared settlements" ON public.shared_balance_settlements FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());