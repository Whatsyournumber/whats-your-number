import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertSuperAdmin,
  maybeGrantReferralReward,
  randomCode,
  slugifyCode,
  REFERRALS_FOR_FREE_PRO,
} from "@/lib/affiliates.server";


/** Public: records a visit coming from an affiliate link. */
export const trackAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; path?: string; referrer?: string }) => {
    if (!data?.code) throw new Error("code required");
    return { code: data.code.trim().toUpperCase().slice(0, 24), path: data.path ?? null, referrer: data.referrer ?? null };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id,status")
      .eq("code", data.code)
      .maybeSingle();
    if (!affiliate || affiliate.status !== "active") return { ok: false };
    await supabaseAdmin.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      code: data.code,
      landing_path: data.path,
      referrer: data.referrer,
    });
    return { ok: true };
  });

/** Creates (or returns) the affiliate account of the signed-in user. */
export const joinAffiliateProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { displayName?: string; payoutEmail?: string; environment?: "sandbox" | "live" }) => data ?? {})
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const environment = data.environment === "live" ? "live" : "sandbox";

    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id,code")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const reward = await maybeGrantReferralReward(supabaseAdmin, existing.id as string, environment);
      return { ok: true, code: existing.code as string, ...reward };
    }


    const base = slugifyCode(data.displayName ?? "") || "WYN";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      const candidate = `${base}${randomCode(4)}`.slice(0, 16);
      const { data: taken } = await supabaseAdmin.from("affiliates").select("id").eq("code", candidate).maybeSingle();
      if (!taken) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Could not generate a code");

    const { error } = await supabaseAdmin.from("affiliates").insert({
      user_id: context.userId,
      code,
      display_name: data.displayName ?? null,
      payout_email: data.payoutEmail ?? null,
    });
    if (error) throw new Error(error.message);
    await grantAffiliateProPlan(supabaseAdmin, context.userId, environment);
    return { ok: true, code, proGranted: true };
  });

/** Links the signed-in user to the affiliate whose link they arrived with. */
export const attachAffiliateReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => {
    if (!data?.code) throw new Error("code required");
    return { code: data.code.trim().toUpperCase().slice(0, 24) };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("affiliate_referrals")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: false, reason: "already_referred" };

    const { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id,user_id,status")
      .eq("code", data.code)
      .maybeSingle();
    if (!affiliate || affiliate.status !== "active") return { ok: false, reason: "invalid_code" };
    if (affiliate.user_id === context.userId) return { ok: false, reason: "self_referral" };

    const { error } = await supabaseAdmin.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      user_id: context.userId,
      code: data.code,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Updates the payout details of the signed-in affiliate. */
export const updateMyAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { displayName?: string; payoutEmail?: string; payoutNotes?: string }) => data ?? {})
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("affiliates")
      .update({
        display_name: data.displayName ?? null,
        payout_email: data.payoutEmail ?? null,
        payout_notes: data.payoutNotes ?? null,
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Super admin: change commission rate or pause an affiliate. */
export const adminUpdateAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; commissionRate?: number; status?: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { commission_rate?: number; status?: string } = {};
    if (typeof data.commissionRate === "number") patch.commission_rate = Math.max(0, Math.min(90, data.commissionRate));
    if (data.status) patch.status = data.status === "paused" ? "paused" : "active";
    const { error } = await supabaseAdmin.from("affiliates").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Super admin: mark an affiliate's pending commissions as paid. */
export const adminMarkCommissionsPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { affiliateId: string }) => {
    if (!data?.affiliateId) throw new Error("affiliateId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("affiliate_commissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("affiliate_id", data.affiliateId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
