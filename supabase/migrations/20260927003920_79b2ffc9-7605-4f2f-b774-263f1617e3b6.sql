-- duration_days = 0 significa acceso ilimitado
ALTER TABLE public.promo_redemptions ALTER COLUMN granted_until DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(_user_id uuid, _code text, _environment text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  v_until := CASE WHEN v_promo.duration_days > 0
    THEN now() + make_interval(days => v_promo.duration_days)
    ELSE NULL END;

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
$function$;

-- Códigos con 36500 días (100 años) pasan a ilimitados
UPDATE public.promo_codes SET duration_days = 0 WHERE duration_days >= 36500;

-- Suscripciones otorgadas por códigos ahora ilimitados: sin fecha de corte
UPDATE public.subscriptions s
SET current_period_end = NULL
FROM public.promo_redemptions r
WHERE s.price_id LIKE 'promo_%'
  AND s.user_id = r.user_id
  AND r.granted_until IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.promo_codes c
    WHERE c.id = r.promo_code_id AND c.duration_days = 0
  );

-- Canjes de códigos ahora ilimitados: sin fecha de corte
UPDATE public.promo_redemptions r
SET granted_until = NULL
FROM public.promo_codes c
WHERE r.promo_code_id = c.id AND c.duration_days = 0;