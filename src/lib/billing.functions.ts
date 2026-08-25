import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PaddleEnv } from "@/lib/paddle.server";

export const getBillingDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const accountEmail = (claims as { email?: string } | null)?.email ?? null;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id,paddle_customer_id,environment")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscriptionId = sub?.paddle_subscription_id ?? "";
    const customerId = sub?.paddle_customer_id ?? "";

    if (
      !sub ||
      !subscriptionId ||
      !customerId ||
      customerId === "trial" ||
      subscriptionId.startsWith("trial_") ||
      subscriptionId.startsWith("promo_")
    ) {
      return { accountEmail, name: null, email: null, card: null };
    }

    try {
      const { fetchBillingDetails } = await import("@/lib/billing.server");
      const details = await fetchBillingDetails(
        (sub.environment ?? data.environment) as PaddleEnv,
        customerId,
        subscriptionId,
      );
      return { accountEmail, ...details };
    } catch (error) {
      console.error("[billing] fetchBillingDetails failed", error);
      return { accountEmail, name: null, email: null, card: null };
    }
  });
