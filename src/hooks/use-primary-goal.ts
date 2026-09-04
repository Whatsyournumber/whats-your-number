import { useEffect, useState } from "react";

import { useLifeGoals } from "./use-life-goals";

const KEY = "whatsyournumber:primary-goal-id";

export function usePrimaryGoal() {
  const { goals } = useLifeGoals();
  const [primaryId, setPrimaryIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPrimaryIdState(window.localStorage.getItem(KEY));
    } catch {
      setPrimaryIdState(null);
    }
  }, []);

  const setPrimary = (id: string | null) => {
    try {
      if (id) window.localStorage.setItem(KEY, id);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setPrimaryIdState(id);
  };

  const primary = primaryId ? goals.find((g) => g.id === primaryId) ?? null : null;

  return { primary, setPrimary, goals };
}
