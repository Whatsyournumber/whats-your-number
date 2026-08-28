import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadGa4Traffic, type Ga4Summary } from "@/lib/ga4.server";

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
