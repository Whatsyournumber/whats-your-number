import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

/** Deletes an auth user and all their data (cascades via FKs). */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => {
    if (!data?.userId) throw new Error("userId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("No puedes borrar tu propia cuenta");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Storage cleanup for uploaded statements.
    const { data: stmts } = await supabaseAdmin
      .from("statements")
      .select("storage_path")
      .eq("user_id", data.userId);
    const paths = (stmts ?? []).map((s: { storage_path: string }) => s.storage_path).filter(Boolean);
    if (paths.length > 0) await supabaseAdmin.storage.from("statements").remove(paths);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscriptions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string; product_id?: string; duration_days?: number; max_uses?: number; note?: string }) => {
    if (!data?.code?.trim()) throw new Error("code required");
    return {
      code: data.code.trim().toUpperCase(),
      product_id: data.product_id?.trim() || "pro_plan",
      duration_days: Math.max(1, Math.min(36500, Number(data.duration_days) || 30)),
      max_uses: Math.max(1, Math.min(100000, Number(data.max_uses) || 25)),
      note: data.note?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("promo_codes")
      .insert({
        code: data.code,
        product_id: data.product_id,
        duration_days: data.duration_days,
        max_uses: data.max_uses,
        note: data.note,
        active: true,
      })
      .select("id,code")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const adminDeletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("promo_redemptions").delete().eq("promo_code_id", data.id);
    const { error } = await supabaseAdmin.from("promo_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePromoRedemption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("promo_redemptions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
