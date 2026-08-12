-- Lock down SECURITY DEFINER / internal helper functions
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_super_admin_for_owner_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;

-- Promo redemption stays user-callable (it validates auth.uid() internally)
REVOKE ALL ON FUNCTION public.redeem_promo_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text, text) TO authenticated, service_role;

-- Explicit write denial on promo tables (writes only via SECURITY DEFINER function / service role)
DROP POLICY IF EXISTS "No client inserts on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "No client updates on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "No client deletes on promo_codes" ON public.promo_codes;
CREATE POLICY "No client inserts on promo_codes" ON public.promo_codes FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates on promo_codes" ON public.promo_codes FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on promo_codes" ON public.promo_codes FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "No client inserts on promo_redemptions" ON public.promo_redemptions;
DROP POLICY IF EXISTS "No client updates on promo_redemptions" ON public.promo_redemptions;
DROP POLICY IF EXISTS "No client deletes on promo_redemptions" ON public.promo_redemptions;
CREATE POLICY "No client inserts on promo_redemptions" ON public.promo_redemptions FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates on promo_redemptions" ON public.promo_redemptions FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on promo_redemptions" ON public.promo_redemptions FOR DELETE TO anon, authenticated USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.promo_codes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.promo_redemptions FROM anon, authenticated;
GRANT ALL ON public.promo_codes TO service_role;
GRANT ALL ON public.promo_redemptions TO service_role;