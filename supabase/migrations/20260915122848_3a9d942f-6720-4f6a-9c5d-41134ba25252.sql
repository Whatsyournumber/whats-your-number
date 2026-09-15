CREATE TABLE public.spend_ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  period_label TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  total NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC NOT NULL DEFAULT 0,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX spend_ai_memory_user_created_idx ON public.spend_ai_memory (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spend_ai_memory TO authenticated;
GRANT ALL ON public.spend_ai_memory TO service_role;
ALTER TABLE public.spend_ai_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own spend memory" ON public.spend_ai_memory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.spend_ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT '',
  verdict TEXT NOT NULL CHECK (verdict IN ('useful','not_useful','done')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX spend_ai_feedback_user_created_idx ON public.spend_ai_feedback (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spend_ai_feedback TO authenticated;
GRANT ALL ON public.spend_ai_feedback TO service_role;
ALTER TABLE public.spend_ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own spend feedback" ON public.spend_ai_feedback FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);