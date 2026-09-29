import { useCallback, useMemo } from "react";
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { GROCERY_GROUPS, type GroceryGroup, type GroceryRule } from "@/lib/receipt-insights";

const KEY = "whatsyournumber:grocery-rules:v1";
const EMPTY: GroceryRule[] = [];

export function useGroceryRules() {
  const { value: stored, save } = useSyncedSetting<GroceryRule[]>(KEY, EMPTY);
  const rules = useMemo(() => Array.isArray(stored) ? stored.filter((r) => r && typeof r.match === "string" && GROCERY_GROUPS.includes(r.group)) : EMPTY, [stored]);
  const learn = useCallback((match: string, group: GroceryGroup) => {
    const phrase = match.trim().slice(0, 120);
    if (!phrase || !GROCERY_GROUPS.includes(group)) return;
    save([{ id: crypto.randomUUID(), match: phrase, group }, ...rules.filter((r) => r.match.toLocaleLowerCase() !== phrase.toLocaleLowerCase())]);
  }, [rules, save]);
  const remove = useCallback((id: string) => save(rules.filter((r) => r.id !== id)), [rules, save]);
  return { rules, learn, remove };
}