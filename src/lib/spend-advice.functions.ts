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
  categories: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      prevAmount: z.number(),
      count: z.number().optional().default(0),
    }),
  ),
  merchants: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      count: z.number(),
      category: z.string().optional(),
      prevAmount: z.number().optional(),
    }),
  ),
  budgets: z
    .array(z.object({ name: z.string(), planned: z.number(), actual: z.number() }))
    .optional()
    .default([]),
});

export const getSpendAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireTier } = await import("./entitlements.server");
    await requireTier(context.supabase as never, context.userId, data.environment, "pro");
    const { generateSpendAdvice } = await import("./spend-advice.server");

    const supabase = context.supabase as never as {
      from: (t: string) => any;
    };

    // --- Memoria: análisis previos y feedback del usuario ---
    const [{ data: history }, { data: feedback }] = await Promise.all([
      supabase
        .from("spend_ai_memory")
        .select("period_label, currency, total, target, snapshot, actions, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("spend_ai_feedback")
        .select("label, action, verdict, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(24),
    ]);

    const advice = await generateSpendAdvice({
      ...data,
      history: (history ?? []).map((h: any) => ({
        periodLabel: String(h.period_label ?? ""),
        total: Number(h.total ?? 0),
        target: Number(h.target ?? 0),
        createdAt: String(h.created_at ?? ""),
        snapshot: h.snapshot ?? {},
        actions: Array.isArray(h.actions) ? h.actions : [],
      })),
      feedback: (feedback ?? []).map((f: any) => ({
        label: String(f.label ?? ""),
        action: String(f.action ?? ""),
        verdict: String(f.verdict ?? "") as "useful" | "not_useful" | "done",
      })),
    });

    // Guardamos el análisis para que la próxima vez la IA entienda mejor.
    const { error } = await supabase.from("spend_ai_memory").insert({
      user_id: context.userId,
      period_label: data.periodLabel,
      currency: data.currency,
      total: data.total,
      target: data.target,
      snapshot: {
        prevTotal: data.prevTotal,
        fixedTotal: data.fixedTotal,
        monthlyRun: data.monthlyRun,
        categories: data.categories.slice(0, 8),
        budgets: (data.budgets ?? []).slice(0, 12),
      },
      actions: advice.actions,
    });
    if (error) console.error("spend_ai_memory insert failed", error.message);

    return advice;
  });

const feedbackSchema = z.object({
  label: z.string().min(1),
  action: z.string().default(""),
  verdict: z.enum(["useful", "not_useful", "done"]),
});

/** Guarda si una recomendación fue útil, no aplica o ya se hizo. */
export const rateSpendAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => feedbackSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as never as { from: (t: string) => any };
    const { error } = await supabase.from("spend_ai_feedback").insert({
      user_id: context.userId,
      label: data.label,
      action: data.action,
      verdict: data.verdict,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
