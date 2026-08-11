import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  currency: z.string(),
  periodLabel: z.string(),
  total: z.number(),
  prevTotal: z.number(),
  fixedTotal: z.number(),
  target: z.number(),
  monthlyRun: z.number(),
  environment: z.enum(["sandbox", "live"]).default("live"),
  categories: z.array(z.object({ name: z.string(), amount: z.number(), prevAmount: z.number() })),
  merchants: z.array(z.object({ name: z.string(), amount: z.number(), count: z.number() })),
});

export const getSpendAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireTier } = await import("./entitlements.server");
    await requireTier(context.supabase as never, context.userId, data.environment, "pro");
    const { generateSpendAdvice } = await import("./spend-advice.server");
    return await generateSpendAdvice(data);
  });
