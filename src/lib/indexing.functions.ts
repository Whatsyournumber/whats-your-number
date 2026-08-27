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

/** Lanza la indexación acelerada + difusión off-site (solo admins). */
export const runIndexingDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { force?: boolean } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { distributeNewPosts } = await import("@/lib/indexing.server");
    return distributeNewPosts(data.force ?? true);
  });

/**
 * Difunde solo los artículos nuevos (los que aún no se han enviado) y devuelve
 * el histórico de enlaces. Se ejecuta solo al abrir el panel de Difusión.
 */
export const syncNewPostsDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { distributeNewPosts } = await import("@/lib/indexing.server");
    return distributeNewPosts(false);
  });
