import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const processStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        statementId: z.string().uuid(),
        environment: z.enum(["sandbox", "live"]).default("live"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertStatementQuota, EntitlementError } = await import("./entitlements.server");
    try {
      await assertStatementQuota(context.supabase as never, context.userId, data.environment);
    } catch (err) {
      if (err instanceof EntitlementError) {
        // Cuota del plan Free agotada: no es un crash, se devuelve como upsell.
        return { inserted: 0, summary: "", upgradeRequired: "pro" as const };
      }
      throw err;
    }
    const { processStatementForUser } = await import("./statements.server");
    const result = await processStatementForUser(context.supabase as never, context.userId, data.statementId);
    return { ...result, upgradeRequired: null };
  });

