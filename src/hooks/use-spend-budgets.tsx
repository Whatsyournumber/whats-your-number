import { useCallback, useEffect, useState } from "react";

import { DEFAULT_BUDGET_IDS } from "@/lib/budget-categories";

export type BudgetLine = { id: string; amount: number; label?: string; emoji?: string; keywords?: string[] };

const KEY = "whatsyournumber:spend-budgets";

/** Objetivo de gasto por categoría, guardado en el navegador. */
export function useSpendBudgets() {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BudgetLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const save = useCallback((next: BudgetLine[]) => {
    setLines(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const total = lines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);

  const defaults: BudgetLine[] = DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: 0 }));

  return { lines, save, total, loaded, defaults, hasBudget: lines.some((l) => l.amount > 0) };
}
