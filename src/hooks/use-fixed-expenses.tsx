import { useCallback, useEffect, useState } from "react";

export type FixedExpense = { id: string; name: string; amount: number };

const KEY = "yournorth:fixed-expenses";

const defaults: FixedExpense[] = [
  { id: "ahorro", name: "Fondo de ahorro", amount: 2500 },
  { id: "hipoteca", name: "Hipoteca", amount: 1100 },
  { id: "condominio", name: "Condominio", amount: 230 },
  { id: "seguro-salud", name: "Seguro de salud", amount: 130 },
];

/** Gastos fijos mensuales editables, guardados localmente en el navegador. */
export function useFixedExpenses() {
  const [items, setItems] = useState<FixedExpense[]>(defaults);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FixedExpense[];
        if (Array.isArray(parsed)) {
          // Limpiar entradas obsoletas (p. ej. seguro mercantil).
          const cleaned = parsed.filter((p) => !/mercantil/i.test(p.name));
          const missing = defaults.filter((d) => !cleaned.some((p) => p.id === d.id));
          setItems([...cleaned, ...missing]);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);


  const persist = useCallback((next: FixedExpense[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<FixedExpense>) =>
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [items, persist],
  );

  const add = useCallback(
    () => persist([...items, { id: crypto.randomUUID(), name: "Nuevo gasto fijo", amount: 0 }]),
    [items, persist],
  );

  const remove = useCallback((id: string) => persist(items.filter((i) => i.id !== id)), [items, persist]);

  const total = items.reduce((s, i) => s + (Number.isFinite(i.amount) ? i.amount : 0), 0);

  return { items, update, add, remove, total };
}

const TARGET_KEY = "yournorth:spend-target";

/** Gasto mensual objetivo (target) según tu número, guardado localmente. */
export function useSpendTarget(initial = 5000) {
  const [target, setTarget] = useState(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TARGET_KEY);
      if (raw !== null && Number.isFinite(Number(raw))) setTarget(Number(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((v: number) => {
    setTarget(v);
    try {
      window.localStorage.setItem(TARGET_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  return { target, setTarget: update };
}
