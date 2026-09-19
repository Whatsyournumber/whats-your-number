import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_BUDGET_IDS, type BudgetGroup } from "@/lib/budget-categories";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type BudgetLine = {
  id: string;
  amount: number;
  label?: string;
  emoji?: string;
  keywords?: string[];
  /** Grupo elegido al crear una categoría personalizada. */
  group?: BudgetGroup;
  /** Día del mes en que se cobra (solo gastos fijos): alimenta Próximos pagos. */
  dueDay?: number;
};

const KEY = "whatsyournumber:spend-budgets";

function readLocal(storageKey: string): BudgetLine[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetLine[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeLocal(storageKey: string, lines: BudgetLine[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

/** Objetivo de gasto por categoría. Se guarda en la cuenta (nube) para que
 *  todos los dispositivos vean el mismo plan; el navegador solo es caché. */
export function useSpendBudgets() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const storageKey = useMemo(() => (userId ? `${KEY}:${userId}` : `${KEY}:anon`), [userId]);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLines([]);
    setLoaded(false);

    const local = readLocal(storageKey);
    if (local.length) setLines(local);

    if (!userId) {
      setLoaded(true);
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from("spend_plans")
        .select("lines")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoaded(true);
        return;
      }
      const remote = (Array.isArray(data?.lines) ? (data.lines as BudgetLine[]) : []).filter(
        (l) => l && typeof l.id === "string",
      );
      if (remote.some((l) => Number(l?.amount) > 0)) {
        // La nube manda: es el mismo plan en móvil, tablet y ordenador.
        setLines(remote);
        writeLocal(storageKey, remote);
      } else if (local.length) {
        // Primera vez con sincronización: subimos el plan de este dispositivo.
        void supabase
          .from("spend_plans")
          .upsert({ user_id: userId, lines: local }, { onConflict: "user_id" })
          .then(({ error: upErr }) => {
            if (upErr) console.error("spend_plans seed", upErr.message);
          });
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, userId]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const save = useCallback(
    (next: BudgetLine[]) => {
      setLines(next);
      writeLocal(storageKey, next);
      if (!userId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void supabase
          .from("spend_plans")
          .upsert({ user_id: userId, lines: next }, { onConflict: "user_id" })
          .then(({ error }) => {
            if (error) console.error("spend_plans upsert", error.message);
          });
      }, 400);
    },
    [storageKey, userId],
  );

  const total = lines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);

  const defaults: BudgetLine[] = DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: 0 }));

  return { lines, save, total, loaded, defaults, hasBudget: lines.some((l) => l.amount > 0) };
}
