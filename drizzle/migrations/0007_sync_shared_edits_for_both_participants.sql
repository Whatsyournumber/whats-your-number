CREATE OR REPLACE FUNCTION private.update_shared_expense_checked(_transaction_id uuid, _total numeric, _my_share numeric, _merchant text, _category text, _tx_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
 v_user uuid := auth.uid();
 v_tx public.imported_transactions%ROWTYPE;
 v_exp public.shared_expenses%ROWTYPE;
 v_other public.shared_expense_participants%ROWTYPE;
 v_mine public.shared_expense_participants%ROWTYPE;
 v_other_tx uuid;
 v_count integer;
 v_id uuid;
 v_pct integer;
 v_items text;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT * INTO v_tx FROM public.imported_transactions WHERE id = _transaction_id AND user_id = v_user;
 IF NOT FOUND OR v_tx.description NOT LIKE 'shared:%' THEN RAISE EXCEPTION 'Shared transaction not found'; END IF;
 IF _total IS NULL OR _my_share IS NULL OR _total <= 0 OR _my_share < 0 OR _my_share > _total OR nullif(btrim(_merchant), '') IS NULL OR _category IS NULL OR _tx_date IS NULL THEN RAISE EXCEPTION 'Invalid shared expense'; END IF;
 SELECT count(*), min(e.id::text)::uuid INTO v_count, v_id
 FROM public.shared_expenses e JOIN public.shared_expense_participants p ON p.expense_id = e.id
 WHERE p.user_id = v_user AND p.status = 'accepted' AND e.tx_date = v_tx.tx_date
 AND coalesce(nullif(e.merchant, ''), e.category) = v_tx.merchant AND e.currency = v_tx.currency
 AND abs((CASE WHEN p.share_amount = 0 AND e.payer_id = v_user THEN e.total ELSE p.share_amount END) - abs(v_tx.amount)) < 0.02;
 IF v_count <> 1 THEN RAISE EXCEPTION 'Could not uniquely match this shared expense'; END IF;
 SELECT * INTO v_exp FROM public.shared_expenses WHERE id = v_id FOR UPDATE;
 SELECT * INTO v_mine FROM public.shared_expense_participants WHERE expense_id = v_id AND user_id = v_user;
 SELECT * INTO v_other FROM public.shared_expense_participants WHERE expense_id = v_id AND user_id <> v_user AND status = 'accepted';
 IF NOT FOUND OR (SELECT count(*) FROM public.shared_expense_participants WHERE expense_id = v_id) <> 2 THEN RAISE EXCEPTION 'Invalid participants'; END IF;
 SELECT count(*), min(id::text)::uuid INTO v_count, v_other_tx FROM public.imported_transactions
 WHERE user_id = v_other.user_id AND tx_date = v_exp.tx_date AND currency = v_exp.currency
 AND merchant = coalesce(nullif(v_exp.merchant, ''), v_exp.category) AND description LIKE 'shared:%'
 AND abs(abs(amount) - CASE WHEN v_other.share_amount = 0 AND v_exp.payer_id = v_other.user_id THEN v_exp.total ELSE v_other.share_amount END) < 0.02;
 IF v_count <> 1 THEN RAISE EXCEPTION 'Could not uniquely match partner transaction'; END IF;
 PERFORM id FROM public.imported_transactions WHERE id IN (_transaction_id, v_other_tx) ORDER BY id FOR UPDATE;
 v_pct := round(_my_share / _total * 100);
 v_items := CASE WHEN jsonb_array_length(v_exp.receipt_items) > 0 THEN '|wyn-receipt:' || v_exp.receipt_items::text
 WHEN position('|wyn-receipt:' in v_tx.description) > 0 THEN substring(v_tx.description from position('|wyn-receipt:' in v_tx.description)) ELSE '' END;
 UPDATE public.shared_expenses SET total = _total, merchant = btrim(_merchant), category = _category, tx_date = _tx_date,
 split_mode = CASE WHEN created_by = v_user THEN v_pct || '/' || (100-v_pct) ELSE (100-v_pct) || '/' || v_pct END WHERE id = v_id;
 UPDATE public.shared_expense_participants SET share_amount = CASE WHEN user_id = v_user THEN _my_share ELSE _total - _my_share END WHERE expense_id = v_id;
 UPDATE public.imported_transactions SET merchant = btrim(_merchant), category = _category, tx_date = _tx_date,
 amount = CASE WHEN _my_share = 0 AND v_exp.payer_id = v_user THEN _total ELSE -_my_share END,
 description = 'shared:' || v_pct || '/' || (100-v_pct) || '|' || coalesce(v_other.display_name, '') || CASE WHEN v_exp.payer_id <> v_user AND _my_share > 0 THEN '|owed' ELSE '' END || v_items
 WHERE id = _transaction_id;
 UPDATE public.imported_transactions SET merchant = btrim(_merchant), category = _category, tx_date = _tx_date,
 amount = CASE WHEN _total - _my_share = 0 AND v_exp.payer_id = v_other.user_id THEN _total ELSE -(_total - _my_share) END,
 description = 'shared:' || (100-v_pct) || '/' || v_pct || '|' || coalesce(v_mine.display_name, '') || CASE WHEN v_exp.payer_id <> v_other.user_id AND _total - _my_share > 0 THEN '|owed' ELSE '' END || v_items
 WHERE id = v_other_tx;
END;
$function$;