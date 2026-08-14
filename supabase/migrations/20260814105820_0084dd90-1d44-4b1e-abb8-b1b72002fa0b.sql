CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  display_name text,
  payout_email text,
  payout_notes text,
  commission_rate numeric NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  code text NOT NULL,
  landing_path text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_clicks_affiliate_idx ON public.affiliate_clicks(affiliate_id, created_at DESC);

CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'signed_up',
  product_id text,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_referrals_affiliate_idx ON public.affiliate_referrals(affiliate_id, created_at DESC);

CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  base_amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 30,
  commission_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  period_start timestamptz,
  paddle_subscription_id text,
  environment text NOT NULL DEFAULT 'live',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX affiliate_commissions_unique_period
  ON public.affiliate_commissions(paddle_subscription_id, period_start)
  WHERE paddle_subscription_id IS NOT NULL AND period_start IS NOT NULL;
CREATE INDEX affiliate_commissions_affiliate_idx ON public.affiliate_commissions(affiliate_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
GRANT SELECT ON public.affiliate_referrals TO authenticated;
GRANT ALL ON public.affiliate_referrals TO service_role;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own affiliate account" ON public.affiliates
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Users create own affiliate account" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own affiliate account" ON public.affiliates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No client deletes on affiliates" ON public.affiliates
  FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "Affiliates view own clicks" ON public.affiliate_clicks
  FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  );
CREATE POLICY "No client writes on affiliate_clicks" ON public.affiliate_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Affiliates view own referrals" ON public.affiliate_referrals
  FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid())
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  );
CREATE POLICY "No client writes on affiliate_referrals" ON public.affiliate_referrals
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates on affiliate_referrals" ON public.affiliate_referrals
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Affiliates view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  );
CREATE POLICY "No client writes on affiliate_commissions" ON public.affiliate_commissions
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates on affiliate_commissions" ON public.affiliate_commissions
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER affiliates_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER affiliate_referrals_updated_at BEFORE UPDATE ON public.affiliate_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();