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
