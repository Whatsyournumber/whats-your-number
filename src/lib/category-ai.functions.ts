import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(500),
  lang: z.string(),
  categories: z.array(z.string()),
  customRules: z.array(z.object({ name: z.string(), keywords: z.array(z.string()) })),
  merchants: z.array(z.object({ name: z.string(), category: z.string(), amount: z.number() })),
});

export const planCategories = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { planCategoryChanges } = await import("./category-ai.server");
    return await planCategoryChanges(data);
  });
