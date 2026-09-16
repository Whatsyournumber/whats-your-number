import { SPEND_PLAN_FIELDS, totalSpendPlan, type OnboardingData, type SpendPlanKey } from "@/lib/onboarding";

/**
 * Pasa el plan de gastos del onboarding al plan de gastos personalizado
 * (categorías + objetivo mensual), para que la cuenta entre con el número listo.
 * No pisa un plan que la persona ya haya guardado.
 */
export function seedSpendPlanFromOnboarding(userId: string | null, data: Pick<OnboardingData, SpendPlanKey>) {
  const uid = userId ?? "anon";
  const budgetsKey = `whatsyournumber:spend-budgets:${uid}`;
  const targetKey = `whatsyournumber:spend-target:${uid}`;
  const total = totalSpendPlan(data);
  if (total <= 0) return;

  try {
    const existing = window.localStorage.getItem(budgetsKey);
    if (existing) {
      const parsed = JSON.parse(existing) as { amount?: number }[];
      if (Array.isArray(parsed) && parsed.some((l) => Number(l?.amount) > 0)) return;
    }
    const lines = SPEND_PLAN_FIELDS.filter((f) => (Number(data[f.key]) || 0) > 0).map((f) => ({
      id: f.budgetId,
      amount: Number(data[f.key]) || 0,
    }));
    if (!lines.length) return;
    window.localStorage.setItem(budgetsKey, JSON.stringify(lines));
    const currentTarget = Number(window.localStorage.getItem(targetKey));
    if (!Number.isFinite(currentTarget) || currentTarget <= 0) {
      window.localStorage.setItem(targetKey, String(total));
    }
  } catch {
    /* ignore */
  }
}
