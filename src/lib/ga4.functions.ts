import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { diagnoseGa4, loadGa4Traffic, type Ga4Diagnostics, type Ga4Summary } from "@/lib/ga4.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Forbidden: admin only");
}

/** Tráfico real de GA4 para el back office (solo admins). */
export const getGa4Traffic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => ({
    days: Math.min(Math.max(Number(data?.days ?? 28), 1), 365),
  }))
  .handler(async ({ data, context }): Promise<Ga4Summary> => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    return loadGa4Traffic(data.days);
  });

/** Diagnóstico de acceso del service account a GA4 (solo admins). */
export const checkGa4Access = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Ga4Diagnostics> => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    return diagnoseGa4();
  });
