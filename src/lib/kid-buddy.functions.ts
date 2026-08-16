import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  currency: z.string(),
  lang: z.enum(["es", "en"]),
  today: z.number(),
  future: z.number(),
  targetAge: z.number(),
  monthly: z.number(),
  pace: z.number(),
  pockets: z.array(z.object({ label: z.string(), amount: z.number() })),
  dream: z
    .object({ title: z.string(), saved: z.number(), price: z.number() })
    .nullable()
    .default(null),
});

export const getBuddyTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generateBuddyTip } = await import("./kid-buddy.server");
    return await generateBuddyTip(data);
  });
