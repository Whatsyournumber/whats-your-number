import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  currency: z.string(),
  periodLabel: z.string(),
  total: z.number(),
  prevTotal: z.number(),
  fixedTotal: z.number(),
  target: z.number(),
  monthlyRun: z.number(),
  categories: z.array(z.object({ name: z.string(), amount: z.number(), prevAmount: z.number() })),
  merchants: z.array(z.object({ name: z.string(), amount: z.number(), count: z.number() })),
});

export const getSpendAdvice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generateSpendAdvice } = await import("./spend-advice.server");
    return await generateSpendAdvice(data);
  });
