import { SPEND_PLAN_FIELDS, totalSpendPlan, type OnboardingData, type SpendPlanKey } from "@/lib/onboarding";

/**
 * Pasa el plan de gastos del onboarding al plan de gastos personalizado
 * (categorías + objetivo mensual), para que la cuenta entre con el número listo.
 * No pisa un plan que la persona ya haya guardado.
 */
export function seedSpendPlanFromOnboarding(
  userId: string | null,
  data: Pick<OnboardingData, SpendPlanKey>,
  extraLines: { id: string; label?: string; amount: number }[] = [],
) {
  const uid = userId ?? "anon";
  const budgetsKey = `whatsyournumber:spend-budgets:${uid}`;
  const targetKey = `whatsyournumber:spend-target:${uid}`;

  // Varias categorías del onboarding pueden compartir budgetId (p. ej. los dos
  // Transporte): se suman en una sola línea del plan.
  const byId = new Map<string, { id: string; label?: string; amount: number }>();
  const add = (id: string, amount: number, label?: string) => {
    if (amount <= 0) return;
    const prev = byId.get(id);
    byId.set(id, { id, label: label ?? prev?.label, amount: (prev?.amount ?? 0) + amount });
  };
  for (const f of SPEND_PLAN_FIELDS) add(f.budgetId, Number(data[f.key]) || 0);
  for (const l of extraLines) add(l.id, Number(l.amount) || 0, l.label);
  const lines = [...byId.values()];
  const total = lines.reduce((s, l) => s + l.amount, 0);
  if (total <= 0 || !lines.length) return;

  try {
    const existing = window.localStorage.getItem(budgetsKey);
    if (existing) {
      const parsed = JSON.parse(existing) as { amount?: number }[];
      if (Array.isArray(parsed) && parsed.some((l) => Number(l?.amount) > 0)) return;
    }
    window.localStorage.setItem(budgetsKey, JSON.stringify(lines));
    const currentTarget = Number(window.localStorage.getItem(targetKey));
    if (!Number.isFinite(currentTarget) || currentTarget <= 0) {
      window.localStorage.setItem(targetKey, String(total));
    }
  } catch {
    /* ignore */
  }
}
