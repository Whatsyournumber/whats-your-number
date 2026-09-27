GRANT SELECT, INSERT, DELETE ON public.shared_expenses TO authenticated;
GRANT ALL ON public.shared_expenses TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.shared_expense_participants TO authenticated;
GRANT ALL ON public.shared_expense_participants TO service_role;