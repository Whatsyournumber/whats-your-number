import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: role, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!role) throw new Error("Forbidden: admin only");
}

/** Verifica todos los backlinks guardados y actualiza su estado (solo admins). */
export const runBacklinkVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { verifyBacklinks } = await import("@/lib/backlinks.server");
    return verifyBacklinks();
  });
