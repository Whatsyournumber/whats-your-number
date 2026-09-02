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
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const onboardingKeys = useMemo(() => new Set(FIXED_FIELDS.map((f) => f.key as string)), []);

  // Carga los gastos personalizados: primero la caché local (respuesta instantánea) y
  // después la cuenta, que es la fuente de verdad y sobrevive a cerrar sesión o cambiar de equipo.
  useEffect(() => {
    let cancelled = false;
    const readLocal = () => {
      try {
        const raw = window.localStorage.getItem(KEY);
        const parsed = raw ? (JSON.parse(raw) as FixedExpense[]) : [];
        return Array.isArray(parsed) ? parsed.filter((i) => !onboardingKeys.has(i.id)) : [];
      } catch {
        return [];
      }
    };
    // Solo reemplaza los personalizados: las filas estándar (onboarding) ya
    // presentes se conservan aunque el perfil haya llegado antes que esta carga.
    const setCustom = (custom: FixedExpense[]) =>
      setItems((prev) => [...prev.filter((i) => onboardingKeys.has(i.id)), ...custom]);

    const local = readLocal();
    if (local.length) setCustom(local);

    if (!userId) {
      setHydrated(true);
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from("custom_fixed_expenses")
        .select("id, name, amount, position")
        .eq("user_id", userId)
        .order("position", { ascending: true });
      if (cancelled) return;
      if (error) {
        setHydrated(true);
        return;
      }
      let remote: FixedExpense[] = (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount) || 0,
      }));
      // Primera vez con sesión: subimos lo que ya existía en este navegador.
      if (!remote.length && local.length) {
        await supabase.from("custom_fixed_expenses").insert(
          local.map((i, idx) => ({ id: i.id, user_id: userId, name: i.name, amount: i.amount, position: idx })),
        );
        remote = local;
      }
      if (cancelled) return;
      setItems(remote);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(remote));
      } catch {
        /* ignore */
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [onboardingKeys, userId]);

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

  // Guarda un gasto personalizado en la cuenta (debounce por fila).
  const saveCustom = useCallback(
    (item: FixedExpense, position: number) => {
      if (!userId) return;
      if (saveTimers.current[item.id]) clearTimeout(saveTimers.current[item.id]);
      saveTimers.current[item.id] = setTimeout(() => {
        // El builder solo ejecuta la petición al hacer await/then.
        void (async () => {
          const { error } = await supabase.from("custom_fixed_expenses").upsert({
            id: item.id,
            user_id: userId,
            name: item.name,
            amount: Number.isFinite(item.amount) ? item.amount : 0,
            position,
          });
          if (error) console.error("custom_fixed_expenses upsert", error.message);
        })();
      }, 400);
    },
    [userId],
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
      const idx = next.findIndex((i) => i.id === id);
      const item = next[idx];
      if (item) saveCustom(item, idx);
    },
    [items, persist, save, saveCustom],
  );

  const add = useCallback(() => {
    const item: FixedExpense = { id: crypto.randomUUID(), name: "Nuevo gasto fijo", amount: 0 };
    const next = [...items, item];
    persist(next);
    saveCustom(item, next.length - 1);
  }, [items, persist, saveCustom]);

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
      if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
      if (userId) {
        void (async () => {
          const { error } = await supabase.from("custom_fixed_expenses").delete().eq("id", id).eq("user_id", userId);
          if (error) console.error("custom_fixed_expenses delete", error.message);
        })();
      }
    },
    [items, persist, save, userId],
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
