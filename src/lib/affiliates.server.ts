/** Server-only helpers for the affiliate program. */

export const PRICE_AMOUNTS: Record<string, number> = {
  pro_monthly: 7,
  pro_yearly: 60,
  patrimonio_monthly: 19,
  patrimonio_yearly: 160,
};

export const PRODUCT_MONTHLY: Record<string, number> = {
  pro_plan: 7,
  patrimonio_plan: 19,
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(len = 7): string {
  let out = "";
  for (let i = 0; i < len; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export function slugifyCode(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
}

/** Records a commission for a referred user's payment. Idempotent per subscription period. */
export async function recordAffiliateCommission(
  admin: any,
  params: {
    userId: string;
    productId: string;
    priceId: string;
    paddleSubscriptionId: string;
    periodStart: string | null;
    environment: string;
  },
) {
  const { data: referral } = await admin
    .from("affiliate_referrals")
    .select("id,affiliate_id")
    .eq("user_id", params.userId)
    .maybeSingle();
  if (!referral) return;

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id,commission_rate,status")
    .eq("id", referral.affiliate_id)
    .maybeSingle();
  if (!affiliate || affiliate.status !== "active") return;

  await admin
    .from("affiliate_referrals")
    .update({
      status: "subscribed",
      product_id: params.productId,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  const base = PRICE_AMOUNTS[params.priceId] ?? PRODUCT_MONTHLY[params.productId] ?? 0;
  if (base <= 0) return;
  const rate = Number(affiliate.commission_rate ?? 30);

  await admin.from("affiliate_commissions").upsert(
    {
      affiliate_id: affiliate.id,
      referral_id: referral.id,
      user_id: params.userId,
      product_id: params.productId,
      base_amount: base,
      commission_rate: rate,
      commission_amount: Math.round(((base * rate) / 100) * 100) / 100,
      period_start: params.periodStart,
      paddle_subscription_id: params.paddleSubscriptionId,
      environment: params.environment,
      status: "pending",
    },
    { onConflict: "paddle_subscription_id,period_start", ignoreDuplicates: true },
  );
}

export async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

/** Sign-ups needed through an affiliate link to unlock the complimentary Pro plan. */
export const REFERRALS_FOR_FREE_PRO = 3;

/** Grants the free Pro plan once an affiliate reaches REFERRALS_FOR_FREE_PRO sign-ups. */
export async function maybeGrantReferralReward(
  admin: any,
  affiliateId: string,
  environment: string,
): Promise<{ unlocked: boolean; referrals: number }> {
  const { count } = await admin
    .from("affiliate_referrals")
    .select("id", { count: "exact", head: true })
    .eq("affiliate_id", affiliateId);
  const referrals = count ?? 0;
  if (referrals < REFERRALS_FOR_FREE_PRO) return { unlocked: false, referrals };

  const { data: affiliate } = await admin.from("affiliates").select("user_id,status").eq("id", affiliateId).maybeSingle();
  if (!affiliate || affiliate.status !== "active") return { unlocked: false, referrals };

  await grantAffiliateProPlan(admin, affiliate.user_id, environment);
  return { unlocked: true, referrals };
}

/** Grants a complimentary Pro plan to an affiliate so they can demo/sell the product. */

export async function grantAffiliateProPlan(admin: any, userId: string, environment: string) {
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id,product_id,status,current_period_end")
    .eq("user_id", userId)
    .eq("environment", environment)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const until = new Date();
  until.setFullYear(until.getFullYear() + 1);

  // Never downgrade an existing paying customer.
  if (existing && existing.product_id !== "affiliate_grant" && existing.status === "active") return;

  const payload = {
    user_id: userId,
    paddle_subscription_id: `affiliate_grant_${userId}`,
    paddle_customer_id: `affiliate_${userId}`,
    product_id: "pro_plan",
    price_id: "affiliate_pro_grant",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: until.toISOString(),
    cancel_at_period_end: false,
    environment,
    access_product_id: "pro_plan",
    access_until: until.toISOString(),
  };

  if (existing) {
    await admin.from("subscriptions").update(payload).eq("id", existing.id);
  } else {
    await admin.from("subscriptions").insert(payload);
  }
}
