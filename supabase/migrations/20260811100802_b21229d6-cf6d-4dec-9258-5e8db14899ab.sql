INSERT INTO public.promo_codes (code, product_id, duration_days, max_uses, active, note)
VALUES ('PRUEBAGRATIS30', 'pro_plan', 30, 25, true, 'Prueba gratis 30 dias')
ON CONFLICT (code) DO UPDATE SET duration_days = 30, max_uses = 25, active = true, note = 'Prueba gratis 30 dias';

UPDATE public.promo_codes
SET duration_days = 36500, max_uses = 100, active = true, note = 'Acceso Pro ilimitado (invitacion)'
WHERE upper(code) = 'PRUEBAGRATIS';