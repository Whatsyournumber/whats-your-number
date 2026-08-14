CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR (auth.uid() IS NOT NULL AND _user_id <> auth.uid()) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
    )
  END
$$;

REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;

DROP POLICY "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all profiles" ON public.profiles;
CREATE POLICY "Super admins view all profiles" ON public.profiles FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all onboarding profiles" ON public.onboarding_profiles;
CREATE POLICY "Super admins view all onboarding profiles" ON public.onboarding_profiles FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all statements" ON public.statements;
CREATE POLICY "Super admins view all statements" ON public.statements FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all life goals" ON public.life_goals;
CREATE POLICY "Super admins view all life goals" ON public.life_goals FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Authenticated can view active promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated can view active promo codes" ON public.promo_codes FOR SELECT TO authenticated
USING ((active = true) OR private.is_super_admin(auth.uid()));

DROP POLICY "Users view own redemptions" ON public.promo_redemptions;
CREATE POLICY "Users view own redemptions" ON public.promo_redemptions FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all holdings" ON public.holdings;
CREATE POLICY "Super admins view all holdings" ON public.holdings FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Super admins view all snapshots" ON public.net_worth_snapshots;
CREATE POLICY "Super admins view all snapshots" ON public.net_worth_snapshots FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY "Users view own affiliate account" ON public.affiliates;
CREATE POLICY "Users view own affiliate account" ON public.affiliates FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()));

DROP POLICY "Affiliates view own clicks" ON public.affiliate_clicks;
CREATE POLICY "Affiliates view own clicks" ON public.affiliate_clicks FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_clicks.affiliate_id AND a.user_id = auth.uid()
));

DROP POLICY "Affiliates view own referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliates view own referrals" ON public.affiliate_referrals FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()) OR (auth.uid() = user_id) OR EXISTS (
  SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_referrals.affiliate_id AND a.user_id = auth.uid()
));

DROP POLICY "Affiliates view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates view own commissions" ON public.affiliate_commissions FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.affiliate_commissions c JOIN public.affiliates a ON a.id = c.affiliate_id
  WHERE c.id = affiliate_commissions.id AND a.user_id = auth.uid()
));

DROP FUNCTION IF EXISTS public.is_super_admin(uuid);