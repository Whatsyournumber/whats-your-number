import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_CATEGORIES, type CategoryRule } from "@/lib/categorize";
import { useAuth } from "@/hooks/use-auth";

export type CustomCategory = { id: string; name: string; keywords: string };

const KEY = "whatsyournumber:custom-categories";

/** Categorías personalizadas del usuario (nombre + palabras clave), guardadas por cuenta en el navegador. */
export function useCategories() {
  const { user } = useAuth();
  const storageKey = useMemo(() => (user?.id ? `${KEY}:${user.id}` : `${KEY}:anon`), [user?.id]);
  const [items, setItems] = useState<CustomCategory[]>([]);

  useEffect(() => {
    setItems([]);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomCategory[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: CustomCategory[]) => {
      setItems(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

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
