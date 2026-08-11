CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  product_id text NOT NULL DEFAULT 'pro_plan',
  duration_days integer NOT NULL DEFAULT 30,
  max_uses integer NOT NULL DEFAULT 25,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active promo codes"
ON public.promo_codes FOR SELECT TO authenticated
USING (active = true OR public.is_super_admin(auth.uid()));

CREATE TRIGGER promo_codes_set_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  environment text NOT NULL DEFAULT 'live',
  granted_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id)
);

GRANT SELECT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions"
ON public.promo_redemptions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

INSERT INTO public.promo_codes (code, product_id, duration_days, max_uses, note)
VALUES ('PRUEBAGRATIS', 'pro_plan', 30, 25, 'Invitaciones gratuitas 30 dias Pro');

CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text, _environment text DEFAULT 'live')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
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
$$;

REVOKE ALL ON FUNCTION public.redeem_promo_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text, text) TO authenticated;