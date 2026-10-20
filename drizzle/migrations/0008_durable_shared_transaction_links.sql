ALTER TABLE public.shared_expense_participants ADD COLUMN transaction_id uuid REFERENCES public.imported_transactions(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX shared_participant_transaction_unique ON public.shared_expense_participants(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE OR REPLACE FUNCTION private.validate_shared_transaction_link() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.transaction_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.transaction_id IS DISTINCT FROM OLD.transaction_id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.expense_id IS DISTINCT FROM OLD.expense_id) THEN
 IF NOT EXISTS (SELECT 1 FROM public.imported_transactions t JOIN public.shared_expenses e ON e.id=NEW.expense_id WHERE t.id=NEW.transaction_id AND t.user_id=NEW.user_id AND t.currency=e.currency AND t.description LIKE 'shared:%') THEN RAISE EXCEPTION 'Invalid shared transaction link'; END IF;
 IF TG_OP='UPDATE' AND OLD.transaction_id IS NOT NULL THEN RAISE EXCEPTION 'Shared transaction already linked'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_shared_transaction_link BEFORE INSERT OR UPDATE ON public.shared_expense_participants FOR EACH ROW EXECUTE FUNCTION private.validate_shared_transaction_link();
CREATE OR REPLACE FUNCTION private.attach_shared_transaction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_exp uuid;
BEGIN
 IF NEW.description LIKE 'shared:%' THEN
 v_exp := substring(NEW.description FROM '\|expense:([0-9a-f-]{36})')::uuid;
 IF v_exp IS NOT NULL THEN
 UPDATE public.shared_expense_participants SET transaction_id=NEW.id WHERE expense_id=v_exp AND user_id=NEW.user_id AND transaction_id IS NULL;
 IF NOT FOUND AND NOT EXISTS(SELECT 1 FROM public.shared_expense_participants WHERE expense_id=v_exp AND user_id=NEW.user_id AND transaction_id=NEW.id) THEN RAISE EXCEPTION 'Invalid or duplicate shared transaction'; END IF;
 END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attach_shared_transaction AFTER INSERT OR UPDATE OF description ON public.imported_transactions FOR EACH ROW EXECUTE FUNCTION private.attach_shared_transaction();
CREATE OR REPLACE FUNCTION private.recover_shared_links_checked() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 WITH candidates AS (
 SELECT p.id AS participant_id,t.id AS transaction_id,count(*) OVER(PARTITION BY p.id) AS pc,count(*) OVER(PARTITION BY t.id) AS tc
 FROM public.shared_expense_participants p JOIN public.shared_expenses e ON e.id=p.expense_id JOIN public.imported_transactions t ON t.user_id=p.user_id AND t.currency=e.currency AND t.tx_date=e.tx_date AND t.merchant=coalesce(nullif(e.merchant,''),e.category) AND t.description LIKE 'shared:%' AND abs(abs(t.amount)-CASE WHEN p.share_amount=0 AND e.payer_id=p.user_id THEN e.total ELSE p.share_amount END)<0.02
 WHERE p.transaction_id IS NULL AND p.status='accepted' AND EXISTS(SELECT 1 FROM public.shared_expense_participants m WHERE m.expense_id=e.id AND m.user_id=auth.uid() AND m.status='accepted') AND NOT EXISTS(SELECT 1 FROM public.shared_expense_participants linked WHERE linked.transaction_id=t.id)
 ) UPDATE public.shared_expense_participants p SET transaction_id=c.transaction_id FROM candidates c WHERE c.participant_id=p.id AND c.pc=1 AND c.tc=1;
END $$;
CREATE OR REPLACE FUNCTION public.recover_shared_links() RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.recover_shared_links_checked(); $$;
REVOKE ALL ON FUNCTION private.recover_shared_links_checked(),public.recover_shared_links() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.recover_shared_links_checked(),public.recover_shared_links() TO authenticated;
CREATE OR REPLACE FUNCTION private.confirm_shared_link_checked(_expense_id uuid,_transaction_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 PERFORM id FROM public.shared_expenses WHERE id=_expense_id FOR UPDATE;
 UPDATE public.shared_expense_participants SET transaction_id=_transaction_id WHERE expense_id=_expense_id AND user_id=auth.uid() AND status='accepted' AND transaction_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Shared participant missing or already linked'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.confirm_shared_link(_expense_id uuid,_transaction_id uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.confirm_shared_link_checked(_expense_id,_transaction_id); $$;
REVOKE ALL ON FUNCTION private.confirm_shared_link_checked(uuid,uuid),public.confirm_shared_link(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.confirm_shared_link_checked(uuid,uuid),public.confirm_shared_link(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION private.update_shared_expense_checked(_transaction_id uuid, _total numeric, _my_share numeric, _merchant text, _category text, _tx_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
 v_user uuid := auth.uid(); v_tx public.imported_transactions%ROWTYPE; v_exp public.shared_expenses%ROWTYPE;
 v_other public.shared_expense_participants%ROWTYPE; v_mine public.shared_expense_participants%ROWTYPE;
 v_other_tx uuid; v_count integer; v_id uuid; v_pct integer; v_items text;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT * INTO v_tx FROM public.imported_transactions WHERE id = _transaction_id AND user_id = v_user;
 IF NOT FOUND OR v_tx.description NOT LIKE 'shared:%' THEN RAISE EXCEPTION 'Shared transaction not found'; END IF;
 IF _total IS NULL OR _my_share IS NULL OR _total <= 0 OR _my_share < 0 OR _my_share > _total OR nullif(btrim(_merchant), '') IS NULL OR _category IS NULL OR _tx_date IS NULL THEN RAISE EXCEPTION 'Invalid shared expense'; END IF;
 PERFORM private.recover_shared_links_checked();
 SELECT count(*), min(p.expense_id::text)::uuid INTO v_count, v_id FROM public.shared_expense_participants p WHERE p.user_id=v_user AND p.status='accepted' AND p.transaction_id=_transaction_id;
 IF v_count <> 1 THEN RAISE EXCEPTION 'Confirm this legacy transaction first'; END IF;
 SELECT * INTO v_exp FROM public.shared_expenses WHERE id = v_id FOR UPDATE;
 SELECT * INTO v_mine FROM public.shared_expense_participants WHERE expense_id = v_id AND user_id = v_user;
 SELECT * INTO v_other FROM public.shared_expense_participants WHERE expense_id = v_id AND user_id <> v_user AND status = 'accepted';
 IF NOT FOUND OR (SELECT count(*) FROM public.shared_expense_participants WHERE expense_id = v_id) <> 2 THEN RAISE EXCEPTION 'Invalid participants'; END IF;
 v_other_tx := v_other.transaction_id;
 IF v_other_tx IS NULL THEN RAISE EXCEPTION 'Partner must confirm their legacy transaction first'; END IF;
 PERFORM id FROM public.imported_transactions WHERE id IN (_transaction_id, v_other_tx) ORDER BY id FOR UPDATE;
 v_pct := round(_my_share / _total * 100);
 v_items := CASE WHEN jsonb_array_length(v_exp.receipt_items) > 0 THEN '|wyn-receipt:' || v_exp.receipt_items::text WHEN position('|wyn-receipt:' in v_tx.description) > 0 THEN substring(v_tx.description from position('|wyn-receipt:' in v_tx.description)) ELSE '' END;
 UPDATE public.shared_expenses SET total = _total, merchant = btrim(_merchant), category = _category, tx_date = _tx_date, split_mode = CASE WHEN created_by = v_user THEN v_pct || '/' || (100-v_pct) ELSE (100-v_pct) || '/' || v_pct END WHERE id = v_id;
 UPDATE public.shared_expense_participants SET share_amount = CASE WHEN user_id = v_user THEN _my_share ELSE _total - _my_share END WHERE expense_id = v_id;
 UPDATE public.imported_transactions SET merchant = btrim(_merchant), category = _category, tx_date = _tx_date, amount = CASE WHEN _my_share = 0 AND v_exp.payer_id = v_user THEN _total ELSE -_my_share END, description = 'shared:' || v_pct || '/' || (100-v_pct) || '|' || coalesce(v_other.display_name, '') || CASE WHEN v_exp.payer_id <> v_user AND _my_share > 0 THEN '|owed' ELSE '' END || '|expense:' || v_id || v_items WHERE id = _transaction_id;
 UPDATE public.imported_transactions SET merchant = btrim(_merchant), category = _category, tx_date = _tx_date, amount = CASE WHEN _total - _my_share = 0 AND v_exp.payer_id = v_other.user_id THEN _total ELSE -(_total - _my_share) END, description = 'shared:' || (100-v_pct) || '/' || v_pct || '|' || coalesce(v_mine.display_name, '') || CASE WHEN v_exp.payer_id <> v_other.user_id AND _total - _my_share > 0 THEN '|owed' ELSE '' END || '|expense:' || v_id || v_items WHERE id = v_other_tx;
END;
$function$;
CREATE OR REPLACE FUNCTION private.delete_shared_expense_checked(_transaction_id uuid)
RETURNS TABLE (other_user_id uuid, actor_name text, other_name text, concept text, deleted_expense_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
 v_actor uuid := auth.uid(); v_own public.imported_transactions%ROWTYPE; v_expense public.shared_expenses%ROWTYPE; v_own_part public.shared_expense_participants%ROWTYPE; v_other public.shared_expense_participants%ROWTYPE; v_other_tx uuid; v_count integer; v_expense_id uuid;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT * INTO v_own FROM public.imported_transactions WHERE id = _transaction_id AND user_id = v_actor FOR UPDATE;
 IF NOT FOUND OR v_own.description NOT LIKE 'shared:%' THEN RAISE EXCEPTION 'Shared transaction not found'; END IF;
 PERFORM private.recover_shared_links_checked();
 SELECT count(*), min(p.expense_id::text)::uuid INTO v_count,v_expense_id FROM public.shared_expense_participants p WHERE p.user_id=v_actor AND p.transaction_id=_transaction_id AND p.status<>'declined';
 IF v_count <> 1 THEN RAISE EXCEPTION 'Confirm this legacy transaction first'; END IF;
 SELECT * INTO v_expense FROM public.shared_expenses WHERE id = v_expense_id FOR UPDATE;
 SELECT * INTO v_own_part FROM public.shared_expense_participants WHERE expense_id = v_expense_id AND user_id = v_actor FOR UPDATE;
 SELECT * INTO v_other FROM public.shared_expense_participants WHERE expense_id = v_expense_id AND user_id <> v_actor AND status <> 'declined' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Shared partner not found'; END IF;
 v_other_tx := v_other.transaction_id;
 IF v_other_tx IS NULL THEN RAISE EXCEPTION 'Partner must confirm their legacy transaction first'; END IF;
 DELETE FROM public.imported_transactions WHERE id IN (_transaction_id, v_other_tx);
 DELETE FROM public.shared_expenses WHERE id = v_expense.id;
 RETURN QUERY SELECT v_other.user_id, coalesce(v_own_part.display_name, ''), coalesce(v_other.display_name, ''), coalesce(nullif(v_expense.merchant, ''), v_expense.category), v_expense.id;
END;
$function$;