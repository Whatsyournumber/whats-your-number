import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

function readLocal<T>(storageKey: string): T | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocal(storageKey: string, value: unknown) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  if (typeof value === "string") return value.length === 0;
  return false;
}

/**
 * Ajuste del usuario guardado en su cuenta (nube) y cacheado en el navegador,
 * para que móvil, tablet y ordenador vean siempre lo mismo.
 *
 * `legacyKeys` permite migrar claves antiguas de localStorage una sola vez.
 */
export function useSyncedSetting<T>(
  key: string,
  fallback: T,
  options?: { legacyKeys?: string[] },
) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const storageKey = useMemo(() => `${key}:${userId ?? "anon"}`, [key, userId]);
  const legacyKeys = options?.legacyKeys;
  const legacySig = legacyKeys?.join("|") ?? "";

  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    let cancelled = false;
    setValue(fallbackRef.current);
    setLoaded(false);

    let local = readLocal<T>(storageKey);
    if (local == null && legacySig) {
      for (const legacy of legacySig.split("|")) {
        if (!legacy) continue;
        const old = readLocal<T>(legacy);
        if (old != null) {
          local = old;
          writeLocal(storageKey, old);
          break;
        }
      }
    }
    if (local != null) setValue(local);

    if (!userId) {
      setLoaded(true);
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data && !isEmpty((data.value as { v?: T } | null)?.v)) {
        const remote = (data.value as { v: T }).v;
        setValue(remote);
        writeLocal(storageKey, remote);
      } else if (!error && local != null && !isEmpty(local)) {
        void supabase
          .from("user_settings")
          .upsert({ user_id: userId, key, value: { v: local } }, { onConflict: "user_id,key" })
          .then(({ error: upErr }) => {
            if (upErr) console.error("user_settings seed", upErr.message);
          });
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, userId, key, legacySig]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const save = useCallback(
    (next: T) => {
      setValue(next);
      writeLocal(storageKey, next);
      if (!userId) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void supabase
          .from("user_settings")
          .upsert({ user_id: userId, key, value: { v: next } }, { onConflict: "user_id,key" })
          .then(({ error }) => {
            if (error) console.error("user_settings upsert", error.message);
          });
      }, 400);
    },
    [storageKey, userId, key],
  );

  return { value, save, loaded };
}
