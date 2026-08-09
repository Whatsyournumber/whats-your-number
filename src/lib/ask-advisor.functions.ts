import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(1).max(2000),
  lang: z.enum(["es", "en"]),
  context: z.string().max(8000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .default([]),
});

export const askAdvisor = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generateAdvisorAnswer } = await import("./ask-advisor.server");
    return { answer: await generateAdvisorAnswer(data) };
  });
