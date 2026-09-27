REVOKE EXECUTE ON FUNCTION public.is_shared_expense_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_shared_expense_owner(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_shared_expense_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shared_expense_owner(uuid) TO authenticated;