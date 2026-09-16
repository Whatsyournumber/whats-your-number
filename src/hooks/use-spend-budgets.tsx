import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_BUDGET_IDS } from "@/lib/budget-categories";
import { SPEND_PLAN_FIELDS } from "@/lib/onboarding";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

export type BudgetLine = { id: string; amount: number; label?: string; emoji?: string; keywords?: string[] };

const KEY = "whatsyournumber:spend-budgets";

/** Objetivo de gasto por categoría, guardado por cuenta en el navegador. */
export function useSpendBudgets() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const storageKey = useMemo(() => (user?.id ? `${KEY}:${user.id}` : `${KEY}:anon`), [user?.id]);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLines([]);
    setLoaded(false);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as BudgetLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [storageKey]);

  const save = useCallback(
    (next: BudgetLine[]) => {
      setLines(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  // Los gastos fijos del onboarding llenan el plan personalizado la primera vez,
  // para que el objetivo ya venga listo sin escribir nada dos veces.
  const fromOnboarding = useMemo<BudgetLine[]>(
    () =>
      SPEND_PLAN_FIELDS.map((f) => ({ id: f.budgetId, amount: Number(profile[f.key]) || 0 })).filter(
        (l) => l.amount > 0,
      ),
    [profile],
  );

  useEffect(() => {
    if (!loaded) return;
    if (lines.some((l) => l.amount > 0)) return;
    if (!fromOnboarding.length) return;
    const ids = new Set(fromOnboarding.map((l) => l.id));
    save([...fromOnboarding, ...DEFAULT_BUDGET_IDS.filter((id) => !ids.has(id)).map((id) => ({ id, amount: 0 }))]);
  }, [loaded, lines, fromOnboarding, save]);

  const total = lines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);

  const defaults: BudgetLine[] = DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: 0 }));

  return { lines, save, total, loaded, defaults, hasBudget: lines.some((l) => l.amount > 0) };
}
