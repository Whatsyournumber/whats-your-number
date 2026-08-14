CREATE TABLE public.kid_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'child',
  theme TEXT NOT NULL DEFAULT 'boy',
  avatar TEXT NOT NULL DEFAULT '👦',
  age NUMERIC(5,2) NOT NULL DEFAULT 10,
  currency TEXT NOT NULL DEFAULT 'EUR',
  base_currency TEXT NOT NULL DEFAULT 'EUR',
  allowance_amount NUMERIC NOT NULL DEFAULT 0,
  allowance_frequency TEXT NOT NULL DEFAULT 'semanal',
  split_spend INTEGER NOT NULL DEFAULT 40,
  split_save INTEGER NOT NULL DEFAULT 40,
  split_grow INTEGER NOT NULL DEFAULT 20,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_members TO authenticated;
GRANT ALL ON public.kid_members TO service_role;
ALTER TABLE public.kid_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kid_members" ON public.kid_members FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.kid_future_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.kid_members(id) ON DELETE CASCADE,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  target_age INTEGER NOT NULL DEFAULT 18,
  expected_return NUMERIC NOT NULL DEFAULT 6,
  goal TEXT NOT NULL DEFAULT '🎓 Universidad',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_future_funds TO authenticated;
GRANT ALL ON public.kid_future_funds TO service_role;
ALTER TABLE public.kid_future_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kid_future_funds" ON public.kid_future_funds FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.kid_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.kid_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✅',
  reward NUMERIC NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL DEFAULT 'semanal',
  status TEXT NOT NULL DEFAULT 'pendiente',
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_tasks TO authenticated;
GRANT ALL ON public.kid_tasks TO service_role;
ALTER TABLE public.kid_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kid_tasks" ON public.kid_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.kid_wishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.kid_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  price NUMERIC NOT NULL DEFAULT 0,
  saved NUMERIC NOT NULL DEFAULT 0,
  achieved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_wishes TO authenticated;
GRANT ALL ON public.kid_wishes TO service_role;
ALTER TABLE public.kid_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kid_wishes" ON public.kid_wishes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.kid_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.kid_members(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Mesada',
  amount NUMERIC NOT NULL DEFAULT 0,
  pocket TEXT NOT NULL DEFAULT 'gastar',
  occurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_movements TO authenticated;
GRANT ALL ON public.kid_movements TO service_role;
ALTER TABLE public.kid_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kid_movements" ON public.kid_movements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.kid_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.kid_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📈',
  value NUMERIC NOT NULL DEFAULT 0,
  growth NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_holdings TO authenticated;
GRANT ALL ON public.kid_holdings TO service_role;
ALTER TABLE public.kid_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kid_holdings" ON public.kid_holdings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER kid_members_updated BEFORE UPDATE ON public.kid_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER kid_future_funds_updated BEFORE UPDATE ON public.kid_future_funds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER kid_tasks_updated BEFORE UPDATE ON public.kid_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER kid_wishes_updated BEFORE UPDATE ON public.kid_wishes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER kid_holdings_updated BEFORE UPDATE ON public.kid_holdings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();