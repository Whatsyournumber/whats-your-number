import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type PaddleEnv } from "@/lib/paddle.server";

export const startProTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 14);

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        paddle_subscription_id: `trial_${userId}_${now.getTime()}`,
        paddle_customer_id: "trial",
        product_id: "pro_plan",
        price_id: "pro_monthly",
        status: "trialing",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        environment: data.environment,
        updated_at: now.toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );

    if (error) throw error;
    return { ok: true, periodEnd: periodEnd.toISOString() };
  });
