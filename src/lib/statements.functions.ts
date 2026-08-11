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
    const { assertStatementQuota } = await import("./entitlements.server");
    await assertStatementQuota(context.supabase as never, context.userId, data.environment);
    const { processStatementForUser } = await import("./statements.server");
    return processStatementForUser(context.supabase as never, context.userId, data.statementId);
  });
