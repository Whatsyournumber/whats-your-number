import { useCallback, useEffect, useState } from "react";
import { sameMerchant } from "@/hooks/use-transactions";

export type LearnedRule = { id: string; match: string; category: string; createdAt: string };

const KEY = "whatsyournumber:learned-rules";

/**
 * Reglas aprendidas: cuando el usuario mueve un movimiento a otra categoría en Gastos,
 * se guarda "comercio → categoría" y se aplica automáticamente la próxima vez.
 */
export function useCategoryRules() {
  const [rules, setRules] = useState<LearnedRule[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LearnedRule[];
        if (Array.isArray(parsed)) setRules(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: LearnedRule[]) => {
    setRules(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const learn = useCallback(
    (match: string | null | undefined, category: string) => {
      const m = (match ?? "").trim();
      if (!m || !category) return;
      const rest = rules.filter((r) => !sameMerchant(r.match, m));
      persist([{ id: crypto.randomUUID(), match: m, category, createdAt: new Date().toISOString() }, ...rest]);
    },
    [rules, persist],
  );

  const remove = useCallback((id: string) => persist(rules.filter((r) => r.id !== id)), [rules, persist]);

  const resolve = useCallback(
    (merchant: string | null | undefined, description?: string | null) => {
      const hit = rules.find((r) => sameMerchant(r.match, merchant) || (description && sameMerchant(r.match, description)));
      return hit?.category ?? null;
    },
    [rules],
  );

  return { rules, learn, remove, resolve };
}
