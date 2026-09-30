CREATE OR REPLACE FUNCTION private.create_shared_expense_checked(_partner_id uuid, _payer_id uuid, _total numeric, _currency text, _category text, _merchant text, _tx_date date, _split_mode text, _creator_name text, _partner_name text, _creator_share numeric, _partner_share numeric, _receipt_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_creator_id uuid := auth.uid();
  v_expense_id uuid;
BEGIN
  IF v_creator_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT private.shared_partner_exists(_partner_id) THEN RAISE EXCEPTION 'Invalid participant'; END IF;
  IF _payer_id NOT IN (v_creator_id, _partner_id) THEN RAISE EXCEPTION 'Invalid payer'; END IF;
  IF _total IS NULL OR _creator_share IS NULL OR _partner_share IS NULL OR _total <= 0 OR _creator_share < 0 OR _partner_share < 0 OR abs((_creator_share + _partner_share) - _total) > 0.01 THEN RAISE EXCEPTION 'Invalid split amounts'; END IF;
  IF _receipt_items IS NULL OR pg_catalog.jsonb_typeof(_receipt_items) <> 'array' OR pg_catalog.jsonb_array_length(_receipt_items) > 150 OR pg_catalog.length(_receipt_items::text) > 40000 THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(_receipt_items) item WHERE pg_catalog.jsonb_typeof(item) <> 'object' OR pg_catalog.jsonb_typeof(item->'name') <> 'string' OR pg_catalog.length(item->>'name') > 180 OR pg_catalog.jsonb_typeof(item->'amount') <> 'number' OR (item->>'amount')::numeric <= 0) THEN RAISE EXCEPTION 'Invalid receipt item'; END IF;
  INSERT INTO public.shared_expenses (created_by, payer_id, total, currency, category, merchant, tx_date, split_mode, receipt_items)
  VALUES (v_creator_id, _payer_id, _total, coalesce(nullif(_currency, ''), 'USD'), coalesce(nullif(_category, ''), 'Otros'), coalesce(_merchant, ''), coalesce(_tx_date, current_date), coalesce(nullif(_split_mode, ''), 'equal'), _receipt_items)
  RETURNING id INTO v_expense_id;
  INSERT INTO public.shared_expense_participants (expense_id, user_id, display_name, share_amount, status)
  VALUES (v_expense_id, v_creator_id, nullif(_creator_name, ''), _creator_share, 'accepted'), (v_expense_id, _partner_id, nullif(_partner_name, ''), _partner_share, 'accepted');
  RETURN v_expense_id;
END;
$function$;