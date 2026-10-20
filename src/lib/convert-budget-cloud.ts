import { supabase } from "@/integrations/supabase/client";
import { convertMoneyValue } from "@/lib/fx";

const BUDGETS_KEY = "whatsyournumber:spend-budgets";

type Line = { amount?: number } & Record<string, unknown>;

const conv = (v: unknown, from: string, to: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? convertMoneyValue(n, from, to) : Number(v) || 0;
};

const convertLines = (lines: unknown, from: string, to: string) =>
  Array.isArray(lines) ? (lines as Line[]).map((l) => ({ ...l, amount: conv(l?.amount, from, to) })) : lines;

/** Ajustes sincronizados que guardan importes, con cómo convertir cada uno. */
const SETTING_CONVERTERS: Record<string, (v: any, from: string, to: string) => unknown> = {
  "whatsyournumber:app-subscriptions": (v, f, t) =>
    Array.isArray(v) ? v.map((s) => ({ ...s, amount: conv(s?.amount, f, t) })) : v,
  "whatsyournumber:savings-allocation": (v, f, t) =>
    v && typeof v === "object" ? { ...v, invest: conv(v.invest, f, t), goals: conv(v.goals, f, t) } : v,
  "whatsyournumber:savings-goals": (v, f, t) =>
    v && Array.isArray(v.items)
      ? {
          ...v,
          items: v.items.map((g: any) => ({
            ...g,
            target: conv(g?.target, f, t),
            saved: conv(g?.saved, f, t),
            monthly: conv(g?.monthly, f, t),
          })),
        }
      : v,
};

/** Reconvierte todo lo guardado en la moneda del perfil al cambiar de divisa:
 *  plan de gasto, gastos fijos, patrimonio, metas, suscripciones y reparto del ahorro.
 *  Los movimientos importados no se tocan: guardan su propia moneda y se convierten al mostrarlos. */
export async function convertBudgetCurrency(userId: string | null, from: string, to: string) {
  if (!from || !to || from.toUpperCase() === to.toUpperCase()) return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(BUDGETS_KEY)) {
        const raw = window.localStorage.getItem(key);
        if (raw) window.localStorage.setItem(key, JSON.stringify(convertLines(JSON.parse(raw), from, to)));
      } else if (Object.keys(SETTING_CONVERTERS).some((k) => key.startsWith(k))) {
        // La nube es la fuente de verdad: se borra la caché para no reescribir valores antiguos.
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
  if (!userId) return;

  const { data: fixed } = await supabase.from("custom_fixed_expenses").select("id, amount").eq("user_id", userId);
  const { data: plan } = await supabase.from("spend_plans").select("lines, target").eq("user_id", userId).maybeSingle();
  const { data: holdings } = await supabase
    .from("holdings")
    .select("id, cost_basis, manual_value, monthly_contribution, linked_liability, monthly_income")
    .eq("user_id", userId);
  const { data: goals } = await supabase.from("life_goals").select("id, cost, monthly, saved").eq("user_id", userId);
  const { data: settings } = await supabase
    .from("user_settings")
    .select("key, value")
    .eq("user_id", userId)
    .in("key", Object.keys(SETTING_CONVERTERS));

  await Promise.all([
    ...(fixed ?? []).map((r) =>
      supabase.from("custom_fixed_expenses").update({ amount: conv(r.amount, from, to) }).eq("id", r.id),
    ),
    ...(holdings ?? []).map((h) =>
      supabase
        .from("holdings")
        .update({
          cost_basis: conv(h.cost_basis, from, to),
          manual_value: conv(h.manual_value, from, to),
          monthly_contribution: conv(h.monthly_contribution, from, to),
          linked_liability: conv(h.linked_liability, from, to),
          monthly_income: conv(h.monthly_income, from, to),
        })
        .eq("id", h.id),
    ),
    ...(goals ?? []).map((g) =>
      supabase
        .from("life_goals")
        .update({ cost: conv(g.cost, from, to), monthly: conv(g.monthly, from, to), saved: conv(g.saved, from, to) })
        .eq("id", g.id),
    ),
    ...(settings ?? []).map((s) => {
      const wrapped = s.value as { v?: unknown } | null;
      const next = SETTING_CONVERTERS[s.key]!(wrapped?.v, from, to);
      return supabase
        .from("user_settings")
        .update({ value: { ...(wrapped ?? {}), v: next } as never })
        .eq("user_id", userId)
        .eq("key", s.key);
    }),
    plan
      ? supabase
          .from("spend_plans")
          .update({ lines: convertLines(plan.lines, from, to) as never, target: conv(plan.target, from, to) })
          .eq("user_id", userId)
      : Promise.resolve(),
  ]);
}
