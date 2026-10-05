CREATE OR REPLACE FUNCTION private.delete_shared_expense_checked(_transaction_id uuid)
RETURNS TABLE (other_user_id uuid, actor_name text, other_name text, concept text, deleted_expense_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
 v_actor uuid := auth.uid();
 v_own public.imported_transactions%ROWTYPE;
 v_expense public.shared_expenses%ROWTYPE;
 v_own_part public.shared_expense_participants%ROWTYPE;
 v_other public.shared_expense_participants%ROWTYPE;
 v_other_tx uuid;
 v_count integer;
 v_expense_id uuid;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT * INTO v_own FROM public.imported_transactions WHERE id = _transaction_id AND user_id = v_actor FOR UPDATE;
 IF NOT FOUND OR v_own.description NOT LIKE 'shared:%' THEN RAISE EXCEPTION 'Shared transaction not found'; END IF;
 SELECT count(*), min(e.id) INTO v_count, v_expense_id
 FROM public.shared_expenses e JOIN public.shared_expense_participants p ON p.expense_id = e.id
 WHERE p.user_id = v_actor AND p.status <> 'declined'
 AND e.tx_date = v_own.tx_date AND e.merchant = v_own.merchant AND e.currency = v_own.currency
 AND abs(p.share_amount - abs(v_own.amount)) < 0.02;
 IF v_count <> 1 THEN RAISE EXCEPTION 'Cannot uniquely identify shared expense'; END IF;
 SELECT * INTO v_expense FROM public.shared_expenses WHERE id = v_expense_id FOR UPDATE;
 SELECT * INTO v_own_part FROM public.shared_expense_participants WHERE expense_id = v_expense_id AND user_id = v_actor FOR UPDATE;
 SELECT * INTO v_other FROM public.shared_expense_participants WHERE expense_id = v_expense_id AND user_id <> v_actor AND status <> 'declined' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Shared partner not found'; END IF;
 SELECT count(*), min(id) INTO v_count, v_other_tx FROM public.imported_transactions
 WHERE user_id = v_other.user_id AND tx_date = v_expense.tx_date
 AND merchant = v_expense.merchant AND currency = v_expense.currency
 AND description LIKE 'shared:%' AND abs(abs(amount) - v_other.share_amount) < 0.02;
 IF v_count <> 1 THEN RAISE EXCEPTION 'Cannot uniquely identify partner transaction'; END IF;
 DELETE FROM public.imported_transactions WHERE id IN (_transaction_id, v_other_tx);
 DELETE FROM public.shared_expenses WHERE id = v_expense.id;
 RETURN QUERY SELECT v_other.user_id, coalesce(v_own_part.display_name, ''), coalesce(v_other.display_name, ''), v_expense.merchant, v_expense.id;
END;
$function$;
REVOKE ALL ON FUNCTION private.delete_shared_expense_checked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.delete_shared_expense_checked(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.delete_shared_expense(_transaction_id uuid)
RETURNS TABLE (other_user_id uuid, actor_name text, other_name text, concept text, deleted_expense_id uuid)
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $function$
 SELECT * FROM private.delete_shared_expense_checked(_transaction_id);
$function$;
REVOKE ALL ON FUNCTION public.delete_shared_expense(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_shared_expense(uuid) TO authenticated;