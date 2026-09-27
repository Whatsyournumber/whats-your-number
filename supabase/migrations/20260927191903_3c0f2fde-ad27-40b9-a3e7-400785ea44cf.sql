CREATE OR REPLACE FUNCTION public.create_shared_expense(_partner_id uuid, _payer_id uuid, _total numeric, _currency text, _category text, _merchant text, _tx_date date, _split_mode text, _creator_name text, _partner_name text, _creator_share numeric, _partner_share numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_id uuid := auth.uid();
  v_expense_id uuid;
BEGIN
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _partner_id IS NULL OR _partner_id = v_creator_id OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _partner_id) THEN
    RAISE EXCEPTION 'Invalid participant';
  END IF;
  IF _payer_id NOT IN (v_creator_id, _partner_id) THEN
    RAISE EXCEPTION 'Invalid payer';
  END IF;
  IF _total <= 0 OR _creator_share < 0 OR _partner_share < 0 OR abs((_creator_share + _partner_share) - _total) > 0.01 THEN
    RAISE EXCEPTION 'Invalid split amounts';
  END IF;

  INSERT INTO public.shared_expenses (created_by, payer_id, total, currency, category, merchant, tx_date, split_mode)
  VALUES (v_creator_id, _payer_id, _total, COALESCE(NULLIF(_currency, ''), 'USD'),
    COALESCE(NULLIF(_category, ''), 'Otros'), COALESCE(_merchant, ''),
    COALESCE(_tx_date, current_date), COALESCE(NULLIF(_split_mode, ''), 'equal'))
  RETURNING id INTO v_expense_id;

  INSERT INTO public.shared_expense_participants (expense_id, user_id, display_name, share_amount, status)
  VALUES
    (v_expense_id, v_creator_id, NULLIF(_creator_name, ''), _creator_share, 'accepted'),
    (v_expense_id, _partner_id, NULLIF(_partner_name, ''), _partner_share, 'accepted');

  RETURN v_expense_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.create_shared_expense(uuid, uuid, numeric, text, text, text, date, text, text, text, numeric, numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_shared_expense(uuid, uuid, numeric, text, text, text, date, text, text, text, numeric, numeric) TO authenticated;