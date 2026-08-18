import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  lang: z.enum(["es", "en"]),
  currency: z.string(),
  riskLevel: z.string(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })),
  buckets: z.array(z.object({ label: z.string(), current: z.number(), target: z.number() })),
  totalValue: z.number(),
  annualGain: z.number(),
  topPosition: z.object({ name: z.string(), pct: z.number() }).nullable().default(null),
});

export const getPortfolioInsight = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generatePortfolioInsight } = await import("./portfolio-ai.server");
    return await generatePortfolioInsight(data);
  });
