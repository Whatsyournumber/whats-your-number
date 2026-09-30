import { useCallback, useMemo } from "react";
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { GROCERY_GROUPS, type GroceryGroup, type GroceryRule } from "@/lib/receipt-insights";

const KEY = "whatsyournumber:grocery-rules:v1";
const EMPTY: GroceryRule[] = [];

export function useGroceryRules() {
  const { value: stored, save } = useSyncedSetting<GroceryRule[]>(KEY, EMPTY);
  const rules = useMemo(() => Array.isArray(stored) ? stored.filter((r) => r && typeof r.match === "string" && GROCERY_GROUPS.includes(r.group)) : EMPTY, [stored]);
  const learn = useCallback((match: string, group: GroceryGroup, origin: "added" | "corrected" = "corrected") => {
    const phrase = match.trim().slice(0, 120);
    if (!phrase || !GROCERY_GROUPS.includes(group)) return;
    const lower = phrase.toLocaleLowerCase();
    const existing = rules.find((r) => r.match.toLocaleLowerCase() === lower);
    // Al reasignar un rubro se conserva si el producto fue añadido a mano por el usuario.
    const resolvedOrigin = existing?.origin ?? origin;
    save([{ id: existing?.id ?? crypto.randomUUID(), match: phrase, group, origin: resolvedOrigin }, ...rules.filter((r) => r.match.toLocaleLowerCase() !== lower)]);
  }, [rules, save]);
  const remove = useCallback((id: string) => save(rules.filter((r) => r.id !== id)), [rules, save]);
  return { rules, learn, remove };
}