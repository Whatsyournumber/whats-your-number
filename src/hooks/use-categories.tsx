import { useCallback } from "react";
import { BASE_CATEGORIES, type CategoryRule } from "@/lib/categorize";
import { useSyncedSetting } from "@/hooks/use-synced-setting";

export type CustomCategory = { id: string; name: string; keywords: string };

const KEY = "whatsyournumber:custom-categories";
const EMPTY: CustomCategory[] = [];

/** Categorías personalizadas del usuario (nombre + palabras clave), guardadas en su cuenta. */
export function useCategories() {
  const { value: items, save: persist } = useSyncedSetting<CustomCategory[]>(KEY, EMPTY);

  const add = useCallback(
    (name = "Nueva categoría", keywords = "") => {
      const id = crypto.randomUUID();
      persist([...items, { id, name, keywords }]);
      return id;
    },
    [items, persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<CustomCategory>) =>
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [items, persist],
  );

  const remove = useCallback((id: string) => persist(items.filter((i) => i.id !== id)), [items, persist]);

  const rules: CategoryRule[] = items
    .filter((i) => i.name.trim())
    .map((i) => ({
      name: i.name.trim(),
      hints: i.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    }));

  const names = Array.from(new Set([...BASE_CATEGORIES, ...rules.map((r) => r.name)]));

  return { items, add, update, remove, rules, names };
}
