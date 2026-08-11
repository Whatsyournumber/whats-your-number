import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  question: z.string().min(1).max(2000),
  lang: z.enum(["es", "en"]),
  context: z.string().max(8000),
  environment: z.enum(["sandbox", "live"]).default("live"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .default([]),
});

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireTier } = await import("./entitlements.server");
    await requireTier(context.supabase as never, context.userId, data.environment, "pro");
    const { generateAdvisorAnswer } = await import("./ask-advisor.server");
    return { answer: await generateAdvisorAnswer(data) };
  });
