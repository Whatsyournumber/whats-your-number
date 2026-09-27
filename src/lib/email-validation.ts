import { z } from "zod";

const emailSchema = z.string().trim().max(254).email();

export const normalizeValidEmail = (value: string) => {
  const parsed = emailSchema.safeParse(value);
  return parsed.success ? parsed.data.toLowerCase() : null;
};