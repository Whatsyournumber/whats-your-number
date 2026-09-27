CREATE TABLE public.shared_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL,
  total numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  category text NOT NULL,
  merchant text NOT NULL DEFAULT '',
  tx_date date NOT NULL DEFAULT current_date,
  split_mode text NOT NULL DEFAULT 'equal',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.shared_expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  share_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expense_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_expense_participants TO authenticated;
GRANT ALL ON public.shared_expenses TO service_role;
GRANT ALL ON public.shared_expense_participants TO service_role;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expense_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_shared_expense_member(_expense_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shared_expenses WHERE id = _expense_id AND created_by = auth.uid())
      OR EXISTS (SELECT 1 FROM public.shared_expense_participants WHERE expense_id = _expense_id AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_shared_expense_owner(_expense_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shared_expenses WHERE id = _expense_id AND created_by = auth.uid())
$$;

CREATE POLICY "members read shared expenses" ON public.shared_expenses FOR SELECT TO authenticated
  USING (public.is_shared_expense_member(id));
CREATE POLICY "creator inserts shared expenses" ON public.shared_expenses FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator deletes shared expenses" ON public.shared_expenses FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "members read participants" ON public.shared_expense_participants FOR SELECT TO authenticated
  USING (public.is_shared_expense_member(expense_id));
CREATE POLICY "creator adds participants" ON public.shared_expense_participants FOR INSERT TO authenticated
  WITH CHECK (public.is_shared_expense_owner(expense_id));
CREATE POLICY "participant updates own row" ON public.shared_expense_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.find_user_by_email(_email text)
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, COALESCE(p.full_name, split_part(p.email, '@', 1))
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND lower(p.email) = lower(btrim(_email)) AND p.id <> auth.uid()
  LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.find_user_by_email(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(text) TO authenticated;