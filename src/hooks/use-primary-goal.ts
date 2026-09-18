import { useSyncedSetting } from "@/hooks/use-synced-setting";

import { useLifeGoals } from "./use-life-goals";

const KEY = "whatsyournumber:primary-goal-id";

export function usePrimaryGoal() {
  const { goals } = useLifeGoals();
  const { value: primaryId, save } = useSyncedSetting<string | null>(KEY, null, { legacyKeys: [KEY] });

  const setPrimary = (id: string | null) => save(id);

  const primary = primaryId ? goals.find((g) => g.id === primaryId) ?? null : null;

  return { primary, setPrimary, goals };
}
