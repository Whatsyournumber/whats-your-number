import { supabase } from "@/integrations/supabase/client";
import { convertMoneyValue } from "@/lib/fx";

const BUDGETS_KEY = "whatsyournumber:spend-budgets";

type Line = { amount?: number } & Record<string, unknown>;

const convertLines = (lines: unknown, from: string, to: string) =>
  Array.isArray(lines)
    ? (lines as Line[]).map((l) => ({ ...l, amount: convertMoneyValue(Number(l?.amount) || 0, from, to) }))
    : lines;

/** Reconvierte el presupuesto guardado (caché local y nube) al cambiar de moneda:
 *  gastos fijos personalizados, plan por categoría y gasto objetivo. */
export async function convertBudgetCurrency(userId: string | null, from: string, to: string) {
  if (!from || !to || from.toUpperCase() === to.toUpperCase()) return;
  try {
    for (const key of Object.keys(window.localStorage).filter((k) => k.startsWith(BUDGETS_KEY))) {
      const raw = window.localStorage.getItem(key);
      if (raw) window.localStorage.setItem(key, JSON.stringify(convertLines(JSON.parse(raw), from, to)));
    }
  } catch {
    /* ignore */
  }
  if (!userId) return;

  const { data: fixed } = await supabase.from("custom_fixed_expenses").select("id, amount").eq("user_id", userId);
  await Promise.all(
    (fixed ?? []).map((r) =>
      supabase
        .from("custom_fixed_expenses")
        .update({ amount: convertMoneyValue(Number(r.amount) || 0, from, to) })
        .eq("id", r.id),
    ),
  );

  const { data: plan } = await supabase.from("spend_plans").select("lines, target").eq("user_id", userId).maybeSingle();
  if (plan) {
    await supabase
      .from("spend_plans")
      .update({
        lines: convertLines(plan.lines, from, to) as never,
        target: convertMoneyValue(Number(plan.target) || 0, from, to),
      })
      .eq("user_id", userId);
  }
}
