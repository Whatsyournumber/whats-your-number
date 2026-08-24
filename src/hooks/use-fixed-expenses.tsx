import { useCallback, useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { convertMoneyValue } from "@/lib/fx";
import { FIXED_FIELDS } from "@/lib/onboarding";

export type FixedExpense = { id: string; name: string; amount: number };

const KEY = "whatsyournumber:fixed-expenses";

/** Sin gastos fijos precargados: cada persona añade los suyos. */
const defaults: FixedExpense[] = [];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Nombres heredados que en realidad son categorías del onboarding y no deben duplicarse. */
const LEGACY_ALIASES: Record<string, string> = {};
for (const f of FIXED_FIELDS) {
  LEGACY_ALIASES[norm(f.es)] = f.key;
  LEGACY_ALIASES[norm(f.en)] = f.key;
}
const EXTRA_ALIASES: Record<string, string> = {
  hipoteca: "fixed_housing",
  mortgage: "fixed_housing",
  alquiler: "fixed_housing",
  renta: "fixed_housing",
  rent: "fixed_housing",
  "fondo de ahorro": "fixed_savings",
  ahorro: "fixed_savings",
  savings: "fixed_savings",
  "seguro de salud": "fixed_insurance",
  seguros: "fixed_insurance",
  insurance: "fixed_insurance",
  "health insurance": "fixed_insurance",
  servicios: "fixed_utilities",
  utilities: "fixed_utilities",
  luz: "fixed_utilities",
  internet: "fixed_utilities",
  transporte: "fixed_transport",
  transport: "fixed_transport",
  educacion: "fixed_education",
  colegio: "fixed_education",
  education: "fixed_education",
  suscripciones: "fixed_subscriptions",
  subscriptions: "fixed_subscriptions",
};

/** ¿Este item personalizado duplica una categoría del onboarding? */
function isOnboardingCategory(name: string) {
  const n = norm(name);
  if (LEGACY_ALIASES[n] || EXTRA_ALIASES[n]) return true;
  // "Pago de renta Madrid", "Renta piso" → vivienda
  return /^(pago de )?(renta|alquiler|rent|hipoteca|mortgage)\b/.test(n);
}

/** Gastos fijos mensuales editables.
 *  Los gastos estándar (FIXED_FIELDS) se derivan del onboarding (fuente de verdad);
 *  los personalizados que añade el usuario se guardan en el navegador. */
export function useFixedExpenses() {
  const [items, setItems] = useState<FixedExpense[]>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const { profile } = useProfile();
  const { lang } = useLanguage();

  const onboardingKeys = useMemo(() => new Set(FIXED_FIELDS.map((f) => f.key as string)), []);

  // Carga solo los items personalizados (no del onboarding) desde localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FixedExpense[];
        if (Array.isArray(parsed)) {
          const custom = parsed.filter((i) => !onboardingKeys.has(i.id) && !isOnboardingCategory(i.name));
          setItems(custom);
          // Limpia los duplicados heredados del almacenamiento.
          if (custom.length !== parsed.length) window.localStorage.setItem(KEY, JSON.stringify(custom));
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [onboardingKeys]);

  // Sincroniza los gastos fijos estándar con el onboarding (fuente de verdad),
  // en el mismo orden y con las etiquetas del onboarding.
  useEffect(() => {
    if (!hydrated) return;
    const fromOnboarding = FIXED_FIELDS.map((f) => ({
      id: f.key as string,
      name: `${f.emoji} ${lang === "en" ? f.en : f.es}`,
      amount: Number(profile[f.key]) || 0,
    })).filter((i) => i.amount > 0);
    setItems((prev) => {
      const custom = prev.filter((i) => !onboardingKeys.has(i.id));
      return [...fromOnboarding, ...custom];
    });
  }, [hydrated, profile, onboardingKeys, lang]);


  // Persiste solo los items personalizados; los estándar vienen del onboarding.
  const persist = useCallback(
    (next: FixedExpense[]) => {
      setItems(next);
      try {
        const custom = next.filter((i) => !onboardingKeys.has(i.id));
        window.localStorage.setItem(KEY, JSON.stringify(custom));
      } catch {
        /* ignore */
      }
    },
    [onboardingKeys],
  );

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

/** Reconvierte los gastos fijos personalizados guardados al cambiar la moneda del perfil. */
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
