CREATE OR REPLACE FUNCTION public.redeem_promo_code(_user_id uuid, _code text, _environment text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_uid uuid := _user_id;
  v_promo public.promo_codes%ROWTYPE;
  v_until timestamptz;
  v_env text := COALESCE(NULLIF(_environment, ''), 'live');
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_promo FROM public.promo_codes
  WHERE upper(code) = upper(btrim(_code)) FOR UPDATE;

  IF NOT FOUND OR v_promo.active = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF v_promo.used_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exhausted');
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE promo_code_id = v_promo.id AND user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END IF;

  v_until := now() + make_interval(days => v_promo.duration_days);

  INSERT INTO public.promo_redemptions (promo_code_id, user_id, code, environment, granted_until)
  VALUES (v_promo.id, v_uid, v_promo.code, v_env, v_until);

  UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;

  INSERT INTO public.subscriptions (
    user_id, paddle_subscription_id, paddle_customer_id, product_id, price_id,
    status, current_period_start, current_period_end, cancel_at_period_end, environment
  ) VALUES (
    v_uid, 'promo_' || v_promo.code || '_' || v_uid::text, 'promo_' || v_uid::text,
    v_promo.product_id, 'promo_' || v_promo.code,
    'trialing', now(), v_until, true, v_env
  )
  ON CONFLICT (paddle_subscription_id) DO UPDATE
    SET status = 'trialing', current_period_end = EXCLUDED.current_period_end;

  RETURN jsonb_build_object('ok', true, 'product_id', v_promo.product_id, 'until', v_until);
END;
$fn$;

REVOKE ALL ON FUNCTION public.redeem_promo_code(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(uuid, text, text) TO service_role;

DROP FUNCTION IF EXISTS public.redeem_promo_code(text, text);