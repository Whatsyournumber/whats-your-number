import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

const TIER_RANK: Record<string, number> = { pro_plan: 1, patrimonio_plan: 2 };

const PRICE_TO_PRODUCT: Record<string, string> = {
  pro_monthly: "pro_plan",
  pro_yearly: "pro_plan",
  patrimonio_monthly: "patrimonio_plan",
  patrimonio_yearly: "patrimonio_plan",
};

export const startProTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Only one trial per user: skip if they already have any subscription row.
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .limit(1);
    if (existing && existing.length > 0) return { ok: true, skipped: true, periodEnd: null };

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 14);

    // Writes to subscriptions require the service-role client: RLS only grants
    // INSERT/UPDATE to service_role (authenticated has SELECT only).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
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
    return { ok: true, skipped: false, periodEnd: periodEnd.toISOString() };
  });

export type PortalTarget = "overview" | "payment_method" | "cancel";

/** Hosted Paddle portal: cancel, update payment method, invoices. */
export const openCustomerPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { environment?: PaddleEnv; target?: PortalTarget }) => data ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("subscriptions")
      .select("paddle_subscription_id,paddle_customer_id,environment")
      .eq("user_id", userId);
    if (data.environment) query = query.eq("environment", data.environment);

    const { data: sub } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (
      !sub ||
      sub.paddle_customer_id === "trial" ||
      sub.paddle_subscription_id.startsWith("trial_") ||
      sub.paddle_subscription_id.startsWith("promo_")
    ) {
      return { url: null as string | null, reason: "no_subscription" as const };
    }


    const paddle = getPaddleClient(sub.environment as PaddleEnv);
    const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id, [
      sub.paddle_subscription_id,
    ]);

    const target = data.target ?? "overview";
    const forSub = session.urls.subscriptions?.find((s) => s.id === sub.paddle_subscription_id);
    const url =
      target === "cancel"
        ? forSub?.cancelSubscription
        : target === "payment_method"
          ? forSub?.updateSubscriptionPaymentMethod
          : undefined;

    return { url: (url ?? session.urls.general.overview) as string, reason: null };
  });

/**
 * Upgrade: applies immediately with prorated charge.
 * Downgrade: billed at the lower price from the next cycle, and the current
 * (higher) plan features are held until the paid period ends.
 */
export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; environment?: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const targetProduct = PRICE_TO_PRODUCT[data.priceId];
    if (!targetProduct) throw new Error("Unknown price");

    let query = supabase
      .from("subscriptions")
      .select("paddle_subscription_id,product_id,status,current_period_end,environment")
      .eq("user_id", userId);
    if (data.environment) query = query.eq("environment", data.environment);

    const { data: sub } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (!sub) return { ok: false, reason: "no_subscription" as const };

    // Writes to subscriptions require the service-role client (RLS grants
    // authenticated SELECT only).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUpgrade = (TIER_RANK[targetProduct] ?? 0) > (TIER_RANK[sub.product_id] ?? 0);

    // Invite-code (promo_) and free-trial (trial_) access: no Paddle
    // subscription behind it, so the plan switches instantly in the account
    // (keeps the promo/trial period and the promo price marker intact).
    const isPromo = sub.paddle_subscription_id.startsWith("promo_");
    const isTrial = sub.paddle_subscription_id.startsWith("trial_");
    if (isPromo || isTrial) {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          product_id: targetProduct,
          ...(isTrial ? { price_id: data.priceId } : {}),
          access_product_id: null,
          access_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("paddle_subscription_id", sub.paddle_subscription_id);
      if (error) throw error;
      return { ok: true, upgraded: isUpgrade, instant: true } as const;
    }

    const env = sub.environment as PaddleEnv;

    const paddle = getPaddleClient(env);
    const priceRes = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(data.priceId)}`);
    const priceJson = (await priceRes.json()) as { data?: Array<{ id: string }> };

    const paddlePriceId = priceJson.data?.[0]?.id;
    if (!paddlePriceId) throw new Error("Price not found");

    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode: isUpgrade ? "prorated_immediately" : "do_not_bill",
    } as never);

    // Hold the higher tier until the already-paid period ends on downgrade.
    const hold = !isUpgrade && sub.current_period_end
      ? { access_product_id: sub.product_id, access_until: sub.current_period_end }
      : { access_product_id: null, access_until: null };

    // The new plan must be persisted here too: the subscription.updated webhook
    // only carries status/period, so without this the user keeps the old tier.
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        ...hold,
        product_id: targetProduct,
        price_id: data.priceId,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", sub.paddle_subscription_id);
    if (error) throw error;

    return { ok: true, upgraded: isUpgrade, instant: false } as const;
  });


/**
 * Fallback for the webhook: reads the user's latest subscription straight from
 * Paddle and persists it. The success screen calls this while polling so the
 * plan activates even if the webhook is delayed or was never applied.
 */
export const syncMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const env = data.environment;

    const res = await gatewayFetch(env, "/subscriptions?per_page=100&status=active");
    const json = (await res.json()) as { data?: any[] };
    const list = json.data ?? [];

    const mine = list
      .filter((s) => s?.custom_data?.userId === userId)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];

    if (!mine) return { ok: false, reason: "not_found" as const };

    const item = mine.items?.[0];
    const priceId = item?.price?.import_meta?.external_id as string | undefined;
    const productId = item?.product?.import_meta?.external_id as string | undefined;
    if (!priceId || !productId) return { ok: false, reason: "missing_external_id" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        paddle_subscription_id: mine.id,
        paddle_customer_id: mine.customer_id,
        product_id: productId,
        price_id: priceId,
        status: mine.status,
        current_period_start: mine.current_billing_period?.starts_at,
        current_period_end: mine.current_billing_period?.ends_at,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );
    if (error) {
      // The signed-in token can outlive its auth user (account deleted while the
      // session is still cached): the FK fails and there is nothing to sync.
      if (error.code === "23503") return { ok: false, reason: "stale_session" as const };
      throw error;
    }

    return { ok: true, productId } as const;
  });
