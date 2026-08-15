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

    if (
      !sub ||
      sub.paddle_customer_id === "trial" ||
      sub.paddle_subscription_id.startsWith("trial_") ||
      sub.paddle_subscription_id.startsWith("promo_")
    ) {
      return { accountEmail, name: null, email: null, card: null };
    }

    const { fetchBillingDetails } = await import("@/lib/billing.server");
    const details = await fetchBillingDetails(
      sub.environment as PaddleEnv,
      sub.paddle_customer_id,
      sub.paddle_subscription_id,
    );
    return { accountEmail, ...details };
  });
