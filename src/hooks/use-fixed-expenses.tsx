import { useCallback, useEffect, useState } from "react";

import { useProfile } from "@/hooks/use-profile";
import { convertMoneyValue } from "@/lib/fx";
import { FIXED_FIELDS } from "@/lib/onboarding";

export type FixedExpense = { id: string; name: string; amount: number };

const KEY = "whatsyournumber:fixed-expenses";

/** Sin gastos fijos precargados: cada persona añade los suyos. */
const defaults: FixedExpense[] = [];

/** Gastos fijos mensuales editables, guardados localmente en el navegador. */
export function useFixedExpenses() {
  const [items, setItems] = useState<FixedExpense[]>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FixedExpense[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Si aún no hay gastos fijos guardados, se rellenan con los del onboarding.
  useEffect(() => {
    if (!hydrated) return;
    let stored = false;
    try {
      stored = window.localStorage.getItem(KEY) !== null;
    } catch {
      /* ignore */
    }
    if (stored) return;
    const seeded = FIXED_FIELDS.map((f) => ({
      id: f.key as string,
      name: f.es,
      amount: Number(profile[f.key]) || 0,
    })).filter((i) => i.amount > 0);
    if (seeded.length === 0) return;
    setItems(seeded);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
    } catch {
      /* ignore */
    }
  }, [hydrated, profile]);



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

/** Reconvierte los gastos fijos guardados al cambiar la moneda del perfil. */
export function convertStoredFixedExpenses(from: string, to: string) {
  if (!from || !to || from.toUpperCase() === to.toUpperCase()) return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FixedExpense[];
      if (Array.isArray(parsed)) {
        const next = parsed.map((i) => ({ ...i, amount: convertMoneyValue(Number(i.amount) || 0, from, to) }));
        window.localStorage.setItem(KEY, JSON.stringify(next));
      }
    }
    const target = window.localStorage.getItem(TARGET_KEY);
    if (target !== null && Number.isFinite(Number(target))) {
      window.localStorage.setItem(TARGET_KEY, String(convertMoneyValue(Number(target), from, to)));
    }
  } catch {
    /* ignore */
  }
}

const TARGET_KEY = "whatsyournumber:spend-target";

/** Gasto mensual objetivo (target) según tu número, guardado localmente. */
export function useSpendTarget(initial = 0) {
  const [target, setTarget] = useState(initial);

  // Si el perfil cambia y aún no hay un objetivo guardado, sigue al perfil.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(TARGET_KEY) === null) setTarget(initial);
    } catch {
      /* ignore */
    }
  }, [initial]);


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
