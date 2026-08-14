import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uni = z.object({
  name: z.string(),
  city: z.string(),
  country: z.string(),
  total: z.number(),
  rank: z.number(),
  gap: z.number().optional(),
});

const schema = z.object({
  lang: z.enum(["es", "en"]),
  childName: z.string().max(80),
  childAge: z.number(),
  currency: z.string().max(8),
  budget: z.number(),
  interests: z.string().max(300).default(""),
  monthlyExtraFor1: z.number().default(0),
  affordable: z.array(uni).max(10).default([]),
  stretch: z.array(uni).max(10).default([]),
});

export const getCollegeAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generateCollegeAdvice } = await import("./college-ai.server");
    return { answer: await generateCollegeAdvice(data) };
  });
