import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const processStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ statementId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { processStatementForUser } = await import("./statements.server");
    return processStatementForUser(context.supabase as never, context.userId, data.statementId);
  });
