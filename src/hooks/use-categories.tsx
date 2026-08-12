import { useCallback, useEffect, useState } from "react";
import { BASE_CATEGORIES, type CategoryRule } from "@/lib/categorize";

export type CustomCategory = { id: string; name: string; keywords: string };

const KEY = "whatsyournumber:custom-categories";

/** Categorías personalizadas del usuario (nombre + palabras clave), guardadas en el navegador. */
export function useCategories() {
  const [items, setItems] = useState<CustomCategory[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomCategory[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: CustomCategory[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

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
