CREATE OR REPLACE FUNCTION private.create_group_shared_expense_checked(_payer_id uuid, _total numeric, _currency text, _category text, _merchant text, _tx_date date, _participants jsonb, _receipt_items jsonb, _request_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE u uuid:=auth.uid(); eid uuid; v_participant jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 IF _request_id IS NULL THEN RAISE EXCEPTION 'Missing request ID'; END IF;
 SELECT id INTO eid FROM public.shared_expenses WHERE id=_request_id AND created_by=u;
 IF FOUND THEN RETURN eid; END IF;
 IF _total IS NULL OR _total<=0 OR _total<>round(_total,2) OR _total::text IN ('NaN','Infinity') OR _currency IS NULL OR _currency !~ '^[A-Z]{3}$' OR _category IS NULL OR _tx_date IS NULL THEN RAISE EXCEPTION 'Invalid expense'; END IF;
 IF jsonb_typeof(_participants)<>'array' OR jsonb_array_length(_participants)<2 OR jsonb_array_length(_participants)>50 THEN RAISE EXCEPTION 'Invalid participants'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(_participants))<>(SELECT count(DISTINCT x->>'user_id') FROM jsonb_array_elements(_participants) x) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_participants) x WHERE (x->>'user_id')::uuid=u) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_participants) x WHERE (x->>'user_id')::uuid=_payer_id) THEN RAISE EXCEPTION 'Invalid participants'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_participants) x WHERE (x->>'user_id')::uuid<>u AND NOT private.shared_partner_exists((x->>'user_id')::uuid)) THEN RAISE EXCEPTION 'Invalid participant'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_participants) x WHERE jsonb_typeof(x->'share') IS DISTINCT FROM 'number' OR (x->>'share')::numeric<0 OR (x->>'share')::numeric<>round((x->>'share')::numeric,2)) OR (SELECT sum((x->>'share')::numeric) FROM jsonb_array_elements(_participants) x)<>_total THEN RAISE EXCEPTION 'Invalid split amounts'; END IF;
 IF _receipt_items IS NULL OR jsonb_typeof(_receipt_items)<>'array' OR jsonb_array_length(_receipt_items)>150 OR length(_receipt_items::text)>40000 THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_receipt_items) x WHERE jsonb_typeof(x->'name') IS DISTINCT FROM 'string' OR length(x->>'name')>180 OR jsonb_typeof(x->'amount') IS DISTINCT FROM 'number' OR (x->>'amount')::numeric<=0) THEN RAISE EXCEPTION 'Invalid receipt item'; END IF;
 INSERT INTO public.shared_expenses(id,created_by,payer_id,total,currency,category,merchant,tx_date,split_mode,receipt_items) VALUES(_request_id,u,_payer_id,_total,_currency,_category,coalesce(_merchant,''),_tx_date,CASE WHEN jsonb_array_length(_participants)>2 THEN 'group' ELSE 'custom' END,_receipt_items) RETURNING id INTO eid;
 FOR v_participant IN SELECT value FROM jsonb_array_elements(_participants) LOOP
  INSERT INTO public.shared_expense_participants(expense_id,user_id,display_name,share_amount,status) VALUES(eid,(v_participant->>'user_id')::uuid,left(v_participant->>'name',180),(v_participant->>'share')::numeric,'accepted');
 END LOOP;
 PERFORM private.sync_shared_transactions_checked(eid);
 RETURN eid;
END $function$;