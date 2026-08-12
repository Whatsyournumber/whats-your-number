import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanTier = "free" | "pro" | "patrimonio";
export type PaddleEnv = "sandbox" | "live";

const RANK: Record<PlanTier, number> = { free: 0, pro: 1, patrimonio: 2 };

export class EntitlementError extends Error {
  code = "upgrade_required" as const;
  constructor(public required: PlanTier) {
    super(`This feature requires the ${required} plan`);
  }
}

function tierFromProduct(productId: string | null): PlanTier {
  if (productId === "patrimonio_plan") return "patrimonio";
  if (productId === "pro_plan") return "pro";
  return "free";
}

function isActive(status: string, currentPeriodEnd: string | null) {
  const future = currentPeriodEnd ? new Date(currentPeriodEnd) > new Date() : true;
  if (status === "canceled") return Boolean(currentPeriodEnd) && future;
  if (!["active", "trialing", "past_due"].includes(status)) return false;
  return future;
}

/** Authoritative, server-side plan for a user. Mirrors use-subscription.tsx. */
export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
  environment: PaddleEnv,
): Promise<PlanTier> {
  // Read own role rows directly (RLS: users can view their own roles).
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (roleRow) return "patrimonio";

  const { data } = await supabase
    .from("subscriptions")
    .select("product_id,status,current_period_end,access_product_id,access_until")
    .eq("user_id", userId)
    .eq("environment", environment)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return "free";
  if (!isActive(data.status as string, data.current_period_end as string | null)) return "free";

  const held =
    data.access_product_id && data.access_until && new Date(data.access_until as string) > new Date()
      ? (data.access_product_id as string)
      : null;
  return tierFromProduct(held ?? (data.product_id as string));
}

export async function requireTier(
  supabase: SupabaseClient,
  userId: string,
  environment: PaddleEnv,
  required: PlanTier,
): Promise<PlanTier> {
  const tier = await getUserTier(supabase, userId, environment);
  if (RANK[tier] < RANK[required]) throw new EntitlementError(required);
  return tier;
}

export const FREE_MONTHLY_STATEMENTS = 5;

/** Free plan may import a limited number of statements per calendar month. */
export async function assertStatementQuota(
  supabase: SupabaseClient,
  userId: string,
  environment: PaddleEnv,
): Promise<void> {
  const tier = await getUserTier(supabase, userId, environment);
  if (tier !== "free") return;

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("statements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  if ((count ?? 0) > FREE_MONTHLY_STATEMENTS) throw new EntitlementError("pro");
}
