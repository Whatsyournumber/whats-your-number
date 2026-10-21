CREATE OR REPLACE FUNCTION private.fx_money(_value numeric, _rate numeric) RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT round(coalesce(_value,0)*_rate,2); $$;
CREATE OR REPLACE FUNCTION private.save_financial_profile_checked(_from text,_to text,_rate numeric,_profile jsonb,_holdings jsonb DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); p public.onboarding_profiles%ROWTYPE; h public.holdings%ROWTYPE; j jsonb; k text; cols text; assignments text; v jsonb; g jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 SELECT * INTO p FROM public.onboarding_profiles WHERE user_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Financial profile missing'; END IF;
 IF upper(coalesce(p.currency,'EUR'))<>upper(_from) THEN RAISE EXCEPTION 'Currency changed elsewhere. Reload before saving'; END IF;
 IF _to IS NULL OR _to !~ '^[A-Z]{3}$' OR _rate IS NULL OR _rate<=0 OR _rate>1000000000 OR _rate::text IN ('NaN','Infinity') OR (upper(_from)=_to AND _rate<>1) THEN RAISE EXCEPTION 'Invalid currency conversion'; END IF;
 IF jsonb_typeof(_profile)<>'object' THEN RAISE EXCEPTION 'Invalid profile'; END IF;
 SELECT string_agg(format('%I = (jsonb_populate_record(NULL::public.onboarding_profiles, $1)).%I',key,key),',') INTO assignments FROM jsonb_object_keys(_profile) key WHERE key IN (SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='onboarding_profiles' AND column_name NOT IN ('id','user_id','created_at','updated_at','completed_at','current_step','currency'));
 IF assignments IS NOT NULL THEN EXECUTE 'UPDATE public.onboarding_profiles SET '||assignments||' WHERE user_id=$2' USING _profile,u; END IF;
 IF _holdings IS NOT NULL THEN
  IF jsonb_typeof(_holdings)<>'array' OR jsonb_array_length(_holdings)>1000 THEN RAISE EXCEPTION 'Invalid holdings'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(_holdings) x JOIN public.holdings existing ON existing.id=(x->>'id')::uuid WHERE existing.user_id<>u) THEN RAISE EXCEPTION 'Invalid holding owner'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(_holdings))<>(SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(_holdings) x) THEN RAISE EXCEPTION 'Duplicate holdings'; END IF;
  DELETE FROM public.holdings WHERE user_id=u AND id NOT IN(SELECT (x->>'id')::uuid FROM jsonb_array_elements(_holdings) x);
  FOR j IN SELECT value FROM jsonb_array_elements(_holdings) LOOP
   INSERT INTO public.holdings(id,user_id,kind,label,ticker,quantity,cost_basis,manual_value,monthly_contribution,expected_return,linked_liability,monthly_income,target_year,probability,note,position,purchased_at)
   VALUES((j->>'id')::uuid,u,j->>'kind',coalesce(nullif(j->>'label',''),'Posición'),nullif(j->>'ticker',''),coalesce((j->>'quantity')::numeric,0),coalesce((j->>'cost_basis')::numeric,0),coalesce((j->>'manual_value')::numeric,0),coalesce((j->>'monthly_contribution')::numeric,0),coalesce((j->>'expected_return')::numeric,0),coalesce((j->>'linked_liability')::numeric,0),coalesce((j->>'monthly_income')::numeric,0),(j->>'target_year')::integer,coalesce((j->>'probability')::numeric,100),nullif(j->>'note',''),coalesce((j->>'position')::integer,0),nullif(j->>'purchased_at','')::date)
   ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,label=excluded.label,ticker=excluded.ticker,quantity=excluded.quantity,cost_basis=excluded.cost_basis,manual_value=excluded.manual_value,monthly_contribution=excluded.monthly_contribution,expected_return=excluded.expected_return,linked_liability=excluded.linked_liability,monthly_income=excluded.monthly_income,target_year=excluded.target_year,probability=excluded.probability,note=excluded.note,position=excluded.position,purchased_at=excluded.purchased_at;
  END LOOP;
 ELSIF upper(_from)<>_to THEN
  UPDATE public.holdings SET cost_basis=private.fx_money(cost_basis,_rate),manual_value=private.fx_money(manual_value,_rate),monthly_contribution=private.fx_money(monthly_contribution,_rate),linked_liability=private.fx_money(linked_liability,_rate),monthly_income=private.fx_money(monthly_income,_rate) WHERE user_id=u;
 END IF;
 IF upper(_from)<>_to THEN
  UPDATE public.custom_fixed_expenses SET amount=private.fx_money(amount,_rate) WHERE user_id=u;
  UPDATE public.life_goals SET cost=private.fx_money(cost,_rate),monthly=private.fx_money(monthly,_rate),saved=private.fx_money(saved,_rate) WHERE user_id=u;
  UPDATE public.spend_plans SET target=private.fx_money(target,_rate),lines=coalesce((SELECT jsonb_agg(x||jsonb_build_object('amount',private.fx_money((x->>'amount')::numeric,_rate)) ORDER BY ord) FROM jsonb_array_elements(lines) WITH ORDINALITY a(x,ord)),'[]'::jsonb) WHERE user_id=u;
  FOR k,v IN SELECT key,value FROM public.user_settings WHERE user_id=u AND key IN ('whatsyournumber:app-subscriptions','whatsyournumber:savings-allocation','whatsyournumber:savings-goals') FOR UPDATE LOOP
   g:=v->'v';
   IF k='whatsyournumber:app-subscriptions' AND jsonb_typeof(g)='array' THEN
    g:=coalesce((SELECT jsonb_agg(x||jsonb_build_object('amount',private.fx_money((x->>'amount')::numeric,_rate)) ORDER BY ord) FROM jsonb_array_elements(g) WITH ORDINALITY a(x,ord)),'[]'::jsonb);
   ELSIF k='whatsyournumber:savings-allocation' AND jsonb_typeof(g)='object' THEN
    g:=g||jsonb_build_object('invest',private.fx_money((g->>'invest')::numeric,_rate),'goals',private.fx_money((g->>'goals')::numeric,_rate));
   ELSIF k='whatsyournumber:savings-goals' AND jsonb_typeof(g->'items')='array' THEN
    g:=jsonb_set(g,'{items}',coalesce((SELECT jsonb_agg(x||jsonb_build_object('target',private.fx_money((x->>'target')::numeric,_rate),'saved',private.fx_money((x->>'saved')::numeric,_rate),'monthly',private.fx_money((x->>'monthly')::numeric,_rate)) ORDER BY ord) FROM jsonb_array_elements(g->'items') WITH ORDINALITY a(x,ord)),'[]'::jsonb));
   END IF;
   UPDATE public.user_settings SET value=jsonb_set(v,'{v}',coalesce(g,'null'::jsonb)) WHERE user_id=u AND key=k;
  END LOOP;
 END IF;
 UPDATE public.onboarding_profiles SET currency=_to WHERE user_id=u;
END $$;
CREATE OR REPLACE FUNCTION public.save_financial_profile(_from text,_to text,_rate numeric,_profile jsonb,_holdings jsonb DEFAULT NULL) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.save_financial_profile_checked(_from,_to,_rate,_profile,_holdings); $$;
REVOKE ALL ON FUNCTION private.fx_money(numeric,numeric),private.save_financial_profile_checked(text,text,numeric,jsonb,jsonb),public.save_financial_profile(text,text,numeric,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.save_financial_profile_checked(text,text,numeric,jsonb,jsonb),public.save_financial_profile(text,text,numeric,jsonb,jsonb) TO authenticated;