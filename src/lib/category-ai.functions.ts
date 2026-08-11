import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  message: z.string().min(1).max(500),
  lang: z.string(),
  environment: z.enum(["sandbox", "live"]).default("live"),
  categories: z.array(z.string()),
  customRules: z.array(z.object({ name: z.string(), keywords: z.array(z.string()) })),
  merchants: z.array(z.object({ name: z.string(), category: z.string(), amount: z.number() })),
});

export const planCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireTier } = await import("./entitlements.server");
    await requireTier(context.supabase as never, context.userId, data.environment, "pro");
    const { planCategoryChanges } = await import("./category-ai.server");
    return await planCategoryChanges(data);
  });
