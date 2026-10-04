CREATE TABLE public.shared_balance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  month_key text NOT NULL CHECK (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  paid_by_user boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id <> partner_id)
);
GRANT SELECT, INSERT, DELETE ON public.shared_balance_payments TO authenticated;
GRANT ALL ON public.shared_balance_payments TO service_role;
ALTER TABLE public.shared_balance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own shared payments" ON public.shared_balance_payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own shared payments" ON public.shared_balance_payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own shared payments" ON public.shared_balance_payments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX shared_balance_payments_owner_month_idx ON public.shared_balance_payments (user_id, month_key, partner_id, created_at DESC);