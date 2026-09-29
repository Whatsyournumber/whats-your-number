-- A narrow private helper checks whether the authenticated caller chose an existing participant.
CREATE OR REPLACE FUNCTION private.shared_partner_exists(_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT auth.uid() IS NOT NULL AND _partner_id IS NOT NULL AND _partner_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _partner_id)
$function$;
REVOKE ALL ON FUNCTION private.shared_partner_exists(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.shared_partner_exists(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_shared_expense(_partner_id uuid, _payer_id uuid, _total numeric, _currency text, _category text, _merchant text, _tx_date date, _split_mode text, _creator_name text, _partner_name text, _creator_share numeric, _partner_share numeric, _receipt_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_creator_id uuid := auth.uid();
  v_expense_id uuid;
BEGIN
  IF v_creator_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT private.shared_partner_exists(_partner_id) THEN RAISE EXCEPTION 'Invalid participant'; END IF;
  IF _payer_id NOT IN (v_creator_id, _partner_id) THEN RAISE EXCEPTION 'Invalid payer'; END IF;
  IF _total <= 0 OR _creator_share < 0 OR _partner_share < 0 OR abs((_creator_share + _partner_share) - _total) > 0.01 THEN RAISE EXCEPTION 'Invalid split amounts'; END IF;
  IF jsonb_typeof(_receipt_items) <> 'array' OR jsonb_array_length(_receipt_items) > 150 OR length(_receipt_items::text) > 40000 THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(_receipt_items) item WHERE jsonb_typeof(item) <> 'object' OR jsonb_typeof(item->'name') <> 'string' OR length(item->>'name') > 180 OR jsonb_typeof(item->'amount') <> 'number' OR (item->>'amount')::numeric <= 0) THEN RAISE EXCEPTION 'Invalid receipt item'; END IF;
  INSERT INTO public.shared_expenses (created_by, payer_id, total, currency, category, merchant, tx_date, split_mode, receipt_items)
  VALUES (v_creator_id, _payer_id, _total, COALESCE(NULLIF(_currency, ''), 'USD'), COALESCE(NULLIF(_category, ''), 'Otros'), COALESCE(_merchant, ''), COALESCE(_tx_date, current_date), COALESCE(NULLIF(_split_mode, ''), 'equal'), _receipt_items)
  RETURNING id INTO v_expense_id;
  INSERT INTO public.shared_expense_participants (expense_id, user_id, display_name, share_amount, status)
  VALUES (v_expense_id, v_creator_id, NULLIF(_creator_name, ''), _creator_share, 'accepted'), (v_expense_id, _partner_id, NULLIF(_partner_name, ''), _partner_share, 'accepted');
  RETURN v_expense_id;
END;
$function$;