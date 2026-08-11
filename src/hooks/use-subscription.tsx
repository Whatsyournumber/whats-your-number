import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getPaddleEnvironment } from "@/lib/paddle";

export type PlanTier = "free" | "pro" | "patrimonio";

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  access_product_id: string | null;
  access_until: string | null;
  environment: "sandbox" | "live";
  created_at: string;
}

function tierFromProduct(productId: string): PlanTier {
  if (productId === "patrimonio_plan") return "patrimonio";
  if (productId === "pro_plan") return "pro";
  return "free";
}

function isActive(status: string, currentPeriodEnd: string | null) {
  const future = currentPeriodEnd ? new Date(currentPeriodEnd) > new Date() : true;
  // Canceled subscriptions keep full access until the paid period ends.
  if (status === "canceled") return Boolean(currentPeriodEnd) && future;
  if (!["active", "trialing", "past_due"].includes(status)) return false;
  return future;
}

export function useSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const environment = getPaddleEnvironment();

  const query = useQuery({
    queryKey: ["subscription", user?.id, environment],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,user_id,product_id,price_id,status,current_period_end,cancel_at_period_end,access_product_id,access_until,environment,created_at")
        .eq("user_id", user!.id)
        .eq("environment", environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Subscription | null;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("subscription_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["subscription", user.id, environment] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc, environment]);

  const subscription = query.data;
  const active = subscription ? isActive(subscription.status, subscription.current_period_end) : false;
  // On a downgrade we hold the previous (higher) plan until access_until.
  const heldProduct =
    subscription?.access_product_id && subscription.access_until && new Date(subscription.access_until) > new Date()
      ? subscription.access_product_id
      : null;
  const tier: PlanTier = active && subscription ? tierFromProduct(heldProduct ?? subscription.product_id) : "free";

  return {
    subscription,
    tier,
    active,
    isFree: tier === "free",
    isPro: tier === "pro" || tier === "patrimonio",
    isPatrimonio: tier === "patrimonio",
    isTrial: subscription?.status === "trialing",
    loading: query.isLoading,
  };
}

export function planMeetsTier(required: PlanTier, current: PlanTier): boolean {
  const rank: Record<PlanTier, number> = { free: 0, pro: 1, patrimonio: 2 };
  return rank[current] >= rank[required];
}
