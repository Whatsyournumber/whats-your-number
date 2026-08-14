import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AffiliateRow = {
  id: string;
  user_id: string;
  code: string;
  display_name: string | null;
  payout_email: string | null;
  payout_notes: string | null;
  commission_rate: number;
  status: string;
  created_at: string;
};

export type CommissionRow = {
  id: string;
  affiliate_id: string;
  user_id: string;
  product_id: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type ReferralRow = {
  id: string;
  affiliate_id: string;
  user_id: string;
  status: string;
  product_id: string | null;
  converted_at: string | null;
  created_at: string;
};

export function useMyAffiliate() {
  const { user } = useAuth();

  const account = useQuery({
    queryKey: ["affiliate", "me", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("id,user_id,code,display_name,payout_email,payout_notes,commission_rate,status,created_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AffiliateRow | null;
    },
  });

  const affiliateId = account.data?.id;

  const stats = useQuery({
    queryKey: ["affiliate", "stats", affiliateId],
    enabled: Boolean(affiliateId),
    queryFn: async () => {
      const [clicks, referrals, commissions] = await Promise.all([
        supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId!),
        supabase
          .from("affiliate_referrals")
          .select("id,affiliate_id,user_id,status,product_id,converted_at,created_at")
          .eq("affiliate_id", affiliateId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliate_commissions")
          .select("id,affiliate_id,user_id,product_id,base_amount,commission_rate,commission_amount,currency,status,paid_at,created_at")
          .eq("affiliate_id", affiliateId!)
          .order("created_at", { ascending: false }),
      ]);
      if (referrals.error) throw referrals.error;
      if (commissions.error) throw commissions.error;
      return {
        clicks: clicks.count ?? 0,
        referrals: (referrals.data ?? []) as ReferralRow[],
        commissions: (commissions.data ?? []) as CommissionRow[],
      };
    },
  });

  const commissions = stats.data?.commissions ?? [];
  const pending = commissions.filter((c) => c.status === "pending").reduce((a, c) => a + Number(c.commission_amount), 0);
  const paid = commissions.filter((c) => c.status === "paid").reduce((a, c) => a + Number(c.commission_amount), 0);

  return {
    affiliate: account.data ?? null,
    clicks: stats.data?.clicks ?? 0,
    referrals: stats.data?.referrals ?? [],
    commissions,
    pending,
    paid,
    total: pending + paid,
    loading: account.isLoading || stats.isLoading,
  };
}
