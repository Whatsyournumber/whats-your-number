CREATE OR REPLACE FUNCTION private.sync_shared_transactions_checked(_expense_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.shared_expenses%ROWTYPE; p public.shared_expense_participants%ROWTYPE; st uuid; names text; payer_name text; pct integer; descr text;
BEGIN
 SELECT * INTO e FROM public.shared_expenses WHERE id=_expense_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.shared_expense_participants WHERE expense_id=e.id AND user_id=auth.uid() AND status='accepted') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT display_name INTO payer_name FROM public.shared_expense_participants WHERE expense_id=e.id AND user_id=e.payer_id;
 FOR p IN SELECT * FROM public.shared_expense_participants WHERE expense_id=e.id AND status='accepted' ORDER BY user_id FOR UPDATE LOOP
  SELECT string_agg(coalesce(display_name,''),', ' ORDER BY user_id) INTO names FROM public.shared_expense_participants WHERE expense_id=e.id AND user_id<>p.user_id AND status='accepted';
  IF p.user_id<>e.payer_id THEN names:=payer_name; END IF;
  pct:=round(p.share_amount/e.total*100);
  descr:='shared:'||pct||'/'||(100-pct)||'|'||coalesce(names,'')||CASE WHEN e.payer_id<>p.user_id AND p.share_amount>0 THEN '|owed' ELSE '' END||'|expense:'||e.id||CASE WHEN jsonb_array_length(e.receipt_items)>0 THEN '|wyn-receipt:'||e.receipt_items::text ELSE '' END;
  IF p.transaction_id IS NULL THEN
   SELECT id INTO st FROM public.statements WHERE user_id=p.user_id AND storage_path='manual' ORDER BY created_at LIMIT 1;
   IF st IS NULL THEN INSERT INTO public.statements(user_id,file_name,file_type,file_size,storage_path,status) VALUES(p.user_id,'Gastos manuales','manual',0,'manual','processed') RETURNING id INTO st; END IF;
   INSERT INTO public.imported_transactions(user_id,statement_id,tx_date,merchant,description,amount,currency,category) VALUES(p.user_id,st,e.tx_date,coalesce(nullif(e.merchant,''),e.category),descr,CASE WHEN p.share_amount=0 AND p.user_id=e.payer_id THEN e.total ELSE -p.share_amount END,e.currency,e.category);
  ELSE
   UPDATE public.imported_transactions SET tx_date=e.tx_date,merchant=coalesce(nullif(e.merchant,''),e.category),description=descr,amount=CASE WHEN p.share_amount=0 AND p.user_id=e.payer_id THEN e.total ELSE -p.share_amount END,currency=e.currency,category=e.category WHERE id=p.transaction_id AND user_id=p.user_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Missing participant transaction'; END IF;
  END IF;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION private.create_group_shared_expense_checked(_payer_id uuid,_total numeric,_currency text,_category text,_merchant text,_tx_date date,_participants jsonb,_receipt_items jsonb,_request_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); eid uuid; x jsonb;
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
 FOR x IN SELECT value FROM jsonb_array_elements(_participants) LOOP
  INSERT INTO public.shared_expense_participants(expense_id,user_id,display_name,share_amount,status) VALUES(eid,(x->>'user_id')::uuid,left(x->>'name',180),(x->>'share')::numeric,'accepted');
 END LOOP;
 PERFORM private.sync_shared_transactions_checked(eid);
 RETURN eid;
END $$;
CREATE OR REPLACE FUNCTION public.create_group_shared_expense(_payer_id uuid,_total numeric,_currency text,_category text,_merchant text,_tx_date date,_participants jsonb,_receipt_items jsonb,_request_id uuid) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.create_group_shared_expense_checked(_payer_id,_total,_currency,_category,_merchant,_tx_date,_participants,_receipt_items,_request_id); $$;
CREATE OR REPLACE FUNCTION private.update_shared_expense_checked(_transaction_id uuid,_total numeric,_my_share numeric,_merchant text,_category text,_tx_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); eid uuid; e public.shared_expenses%ROWTYPE; p public.shared_expense_participants%ROWTYPE; n integer; old_other numeric; remaining numeric; share numeric; i integer:=0;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 IF _total IS NULL OR _my_share IS NULL OR _total<=0 OR _my_share<0 OR _my_share>_total OR _total::text IN ('NaN','Infinity') OR _my_share::text IN ('NaN','Infinity') OR nullif(btrim(_merchant),'') IS NULL OR _category IS NULL OR _tx_date IS NULL THEN RAISE EXCEPTION 'Invalid shared expense'; END IF;
 PERFORM private.recover_shared_links_checked();
 SELECT expense_id INTO eid FROM public.shared_expense_participants WHERE user_id=u AND transaction_id=_transaction_id AND status='accepted';
 IF NOT FOUND THEN RAISE EXCEPTION 'Confirm this legacy transaction first'; END IF;
 SELECT * INTO e FROM public.shared_expenses WHERE id=eid FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.shared_expense_participants WHERE expense_id=eid AND (status<>'accepted' OR transaction_id IS NULL)) THEN RAISE EXCEPTION 'Partner must confirm their legacy transaction first'; END IF;
 PERFORM id FROM public.imported_transactions WHERE id IN(SELECT transaction_id FROM public.shared_expense_participants WHERE expense_id=eid) ORDER BY id FOR UPDATE;
 SELECT count(*),sum(share_amount) INTO n,old_other FROM public.shared_expense_participants WHERE expense_id=eid AND user_id<>u;
 IF n<1 THEN RAISE EXCEPTION 'Invalid participants'; END IF;
 remaining:=round(_total,2)-round(_my_share,2);
 FOR p IN SELECT * FROM public.shared_expense_participants WHERE expense_id=eid AND user_id<>u ORDER BY user_id LOOP
  i:=i+1;
  share:=CASE WHEN i=n THEN remaining ELSE least(remaining,round((round(_total,2)-round(_my_share,2))*CASE WHEN old_other>0 THEN p.share_amount/old_other ELSE 1.0/n END,2)) END;
  UPDATE public.shared_expense_participants SET share_amount=share WHERE id=p.id;
  remaining:=remaining-share;
 END LOOP;
 UPDATE public.shared_expense_participants SET share_amount=round(_my_share,2) WHERE expense_id=eid AND user_id=u;
 UPDATE public.shared_expenses SET total=round(_total,2),merchant=btrim(_merchant),category=_category,tx_date=_tx_date,split_mode=CASE WHEN n>1 THEN 'group' ELSE 'custom' END WHERE id=eid;
 PERFORM private.sync_shared_transactions_checked(eid);
END $$;
CREATE OR REPLACE FUNCTION private.delete_shared_expense_checked(_transaction_id uuid) RETURNS TABLE(other_user_id uuid,actor_name text,other_name text,concept text,deleted_expense_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); eid uuid; e public.shared_expenses%ROWTYPE; actor text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 PERFORM private.recover_shared_links_checked();
 SELECT expense_id,display_name INTO eid,actor FROM public.shared_expense_participants WHERE user_id=u AND transaction_id=_transaction_id AND status='accepted';
 IF NOT FOUND THEN RAISE EXCEPTION 'Confirm this legacy transaction first'; END IF;
 SELECT * INTO e FROM public.shared_expenses WHERE id=eid FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.shared_expense_participants WHERE expense_id=eid AND transaction_id IS NULL AND status<>'declined') THEN RAISE EXCEPTION 'Partner must confirm their legacy transaction first'; END IF;
 RETURN QUERY SELECT p.user_id,actor,p.display_name,coalesce(nullif(e.merchant,''),e.category),e.id FROM public.shared_expense_participants p WHERE p.expense_id=eid AND p.user_id<>u;
 DELETE FROM public.imported_transactions WHERE id IN(SELECT transaction_id FROM public.shared_expense_participants WHERE expense_id=eid);
 DELETE FROM public.shared_expenses WHERE id=eid;
END $$;
REVOKE ALL ON FUNCTION private.sync_shared_transactions_checked(uuid),private.create_group_shared_expense_checked(uuid,numeric,text,text,text,date,jsonb,jsonb,uuid),public.create_group_shared_expense(uuid,numeric,text,text,text,date,jsonb,jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.create_group_shared_expense_checked(uuid,numeric,text,text,text,date,jsonb,jsonb,uuid),public.create_group_shared_expense(uuid,numeric,text,text,text,date,jsonb,jsonb,uuid) TO authenticated;