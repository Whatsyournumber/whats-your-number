import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useProfile, type Profile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { convertMoneyValue } from "@/lib/fx";
import { FIXED_FIELDS } from "@/lib/onboarding";

export type FixedExpense = { id: string; name: string; amount: number };

const KEY = "whatsyournumber:fixed-expenses";

/** Sin gastos fijos precargados: cada persona añade los suyos. */
const defaults: FixedExpense[] = [];

type FixedFieldKey = (typeof FIXED_FIELDS)[number]["key"];

const fixedFieldKeys = FIXED_FIELDS.map((f) => f.key);

function isFixedFieldKey(id: string): id is FixedFieldKey {
  return fixedFieldKeys.includes(id as FixedFieldKey);
}

/** Gastos fijos mensuales editables.
 *  Los gastos estándar (FIXED_FIELDS) se derivan del onboarding (fuente de verdad);
 *  los personalizados que añade el usuario se guardan en el navegador. */
export function useFixedExpenses() {
  const [items, setItems] = useState<FixedExpense[]>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Ids de gastos estándar puestos a 0 en esta sesión: la fila se mantiene
  // visible aunque el perfil ya tenga 0 (el filtro del sync los excluiría).
  const zeroHold = useRef<Set<string>>(new Set());
  const { profile, save } = useProfile();
  const { lang } = useLanguage();

  const onboardingKeys = useMemo(() => new Set(FIXED_FIELDS.map((f) => f.key as string)), []);

  // Carga solo los items personalizados desde localStorage. No se filtra por nombre:
  // "Internet", "Transporte" o "Renta garaje" pueden ser gastos personalizados válidos.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FixedExpense[];
        if (Array.isArray(parsed)) {
          const custom = parsed.filter((i) => !onboardingKeys.has(i.id));
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
    })).filter((i) => i.amount > 0 || zeroHold.current.has(i.id));
    setItems((prev) => {
      const custom = prev.filter((i) => !onboardingKeys.has(i.id));
      return [...fromOnboarding, ...custom];
    });
  }, [hydrated, profile, onboardingKeys, lang]);

  useEffect(
    () => () => {
      for (const timer of Object.values(saveTimers.current)) clearTimeout(timer);
    },
    [],
  );


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
    (id: string, patch: Partial<FixedExpense>) => {
      const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      setItems(next);

      if (isFixedFieldKey(id)) {
        if (typeof patch.amount === "number") {
          const amount = Number.isFinite(patch.amount) ? Math.max(0, patch.amount) : 0;
          if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
          // El 0 también se persiste (p. ej. dejaste de pagar el gimnasio);
          // zeroHold mantiene la fila visible aunque el perfil pase a 0.
          if (amount > 0) zeroHold.current.delete(id);
          else zeroHold.current.add(id);
          saveTimers.current[id] = setTimeout(() => {
            void save({ [id]: amount } as Partial<Profile>).catch(() => setItems(items));
          }, 500);
        }
        return;
      }

      persist(next);
    },
    [items, persist, save],
  );

  const add = useCallback(
    () => persist([...items, { id: crypto.randomUUID(), name: "Nuevo gasto fijo", amount: 0 }]),
    [items, persist],
  );

  const remove = useCallback(
    (id: string) => {
      const next = items.filter((i) => i.id !== id);
      setItems(next);

      if (isFixedFieldKey(id)) {
        zeroHold.current.delete(id);
        void save({ [id]: 0 } as Partial<Profile>).catch(() => setItems(items));
        return;
      }

      persist(next);
    },
    [items, persist, save],
  );

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
