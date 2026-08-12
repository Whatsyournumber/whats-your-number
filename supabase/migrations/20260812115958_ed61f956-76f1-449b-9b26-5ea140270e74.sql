CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'etf',
  label text NOT NULL DEFAULT '',
  ticker text,
  quantity numeric NOT NULL DEFAULT 0,
  cost_basis numeric NOT NULL DEFAULT 0,
  manual_value numeric NOT NULL DEFAULT 0,
  monthly_contribution numeric NOT NULL DEFAULT 0,
  expected_return numeric NOT NULL DEFAULT 7,
  note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holdings TO authenticated;
GRANT ALL ON public.holdings TO service_role;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own holdings" ON public.holdings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins view all holdings" ON public.holdings FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));
CREATE TRIGGER holdings_set_updated_at BEFORE UPDATE ON public.holdings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX holdings_user_idx ON public.holdings(user_id);

CREATE TABLE public.net_worth_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  assets numeric NOT NULL DEFAULT 0,
  liabilities numeric NOT NULL DEFAULT 0,
  net_worth numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, taken_on)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.net_worth_snapshots TO authenticated;
GRANT ALL ON public.net_worth_snapshots TO service_role;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snapshots" ON public.net_worth_snapshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins view all snapshots" ON public.net_worth_snapshots FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));
CREATE INDEX net_worth_snapshots_user_idx ON public.net_worth_snapshots(user_id, taken_on);