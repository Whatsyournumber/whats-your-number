CREATE TABLE public.life_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎯',
  kind TEXT NOT NULL DEFAULT 'purchase',
  target_year INTEGER NOT NULL DEFAULT date_part('year', now())::int + 2,
  cost NUMERIC NOT NULL DEFAULT 0,
  monthly NUMERIC NOT NULL DEFAULT 0,
  saved NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_goals TO authenticated;
GRANT ALL ON public.life_goals TO service_role;
ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own life goals" ON public.life_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_life_goals_updated_at BEFORE UPDATE ON public.life_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();