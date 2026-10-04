CREATE OR REPLACE FUNCTION private.update_shared_expense_checked(_transaction_id uuid, _total numeric, _my_share numeric, _merchant text, _category text, _tx_date date)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_tx public.imported_transactions%ROWTYPE;
  v_exp public.shared_expenses%ROWTYPE;
  v_match_count integer;
  v_partner uuid;
  v_partner_share numeric;
  v_pct integer;
  v_description text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_tx FROM public.imported_transactions WHERE id = _transaction_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND OR v_tx.description NOT LIKE 'shared:%' THEN RAISE EXCEPTION 'Shared transaction not found'; END IF;
  IF _total IS NULL OR _my_share IS NULL OR _total <= 0 OR _my_share < 0 OR _my_share > _total OR _merchant IS NULL OR _tx_date IS NULL THEN RAISE EXCEPTION 'Invalid shared expense'; END IF;
  SELECT count(*), min(e.id::text)::uuid INTO v_match_count, v_exp.id
  FROM public.shared_expenses e
  JOIN public.shared_expense_participants mine ON mine.expense_id = e.id AND mine.user_id = v_user AND mine.status = 'accepted'
  WHERE e.merchant = v_tx.merchant AND e.tx_date = v_tx.tx_date
    AND EXISTS (SELECT 1 FROM public.shared_expense_participants other WHERE other.expense_id = e.id AND other.user_id <> v_user AND other.status = 'accepted');
  IF v_match_count <> 1 THEN RAISE EXCEPTION 'Could not uniquely match this shared expense'; END IF;
  SELECT * INTO v_exp FROM public.shared_expenses WHERE id = v_exp.id FOR UPDATE;
  SELECT user_id INTO v_partner FROM public.shared_expense_participants WHERE expense_id = v_exp.id AND user_id <> v_user AND status = 'accepted' LIMIT 1;
  IF v_partner IS NULL OR (SELECT count(*) FROM public.shared_expense_participants WHERE expense_id = v_exp.id) <> 2 THEN RAISE EXCEPTION 'Invalid participants'; END IF;
  v_partner_share := _total - _my_share;
  v_pct := round(_my_share / _total * 100);
  v_description := 'shared:' || v_pct || '/' || (100 - v_pct) || '|' || split_part(split_part(v_tx.description, '|', 2), 'wyn-receipt:', 1);
  IF v_exp.payer_id <> v_user AND _my_share > 0 THEN v_description := v_description || '|owed'; END IF;
  IF position('|wyn-receipt:' in v_tx.description) > 0 THEN
    v_description := v_description || substring(v_tx.description from position('|wyn-receipt:' in v_tx.description));
  END IF;
  UPDATE public.shared_expenses SET total = _total, merchant = btrim(_merchant), category = _category, tx_date = _tx_date,
    split_mode = CASE WHEN created_by = v_user THEN v_pct || '/' || (100 - v_pct) ELSE (100 - v_pct) || '/' || v_pct END
  WHERE id = v_exp.id;
  UPDATE public.shared_expense_participants SET share_amount = CASE WHEN user_id = v_user THEN _my_share ELSE v_partner_share END WHERE expense_id = v_exp.id;
  UPDATE public.imported_transactions SET amount = CASE WHEN _my_share = 0 AND v_exp.payer_id = v_user THEN v_partner_share ELSE -_my_share END,
    merchant = btrim(_merchant), category = _category, tx_date = _tx_date, description = v_description
  WHERE id = _transaction_id AND user_id = v_user;
END;
$function$;
REVOKE ALL ON FUNCTION private.update_shared_expense_checked(uuid, numeric, numeric, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.update_shared_expense_checked(uuid, numeric, numeric, text, text, date) TO authenticated;
CREATE OR REPLACE FUNCTION public.update_shared_expense(_transaction_id uuid, _total numeric, _my_share numeric, _merchant text, _category text, _tx_date date)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $function$
  SELECT private.update_shared_expense_checked(_transaction_id, _total, _my_share, _merchant, _category, _tx_date);
$function$;
REVOKE ALL ON FUNCTION public.update_shared_expense(uuid, numeric, numeric, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_shared_expense(uuid, numeric, numeric, text, text, date) TO authenticated;