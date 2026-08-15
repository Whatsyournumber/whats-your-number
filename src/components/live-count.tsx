import { useEffect, useState } from "react";

/**
 * Contador "vivo" de registros: arranca en `base` y sube poco a poco,
 * como si entraran nuevas personas mientras se ve la página.
 */
export function useLiveCount(base: number) {
  const [count, setCount] = useState(base);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setCount((c) => c + 1);
      window.setTimeout(tick, 1500 + Math.random() * 3000);
    };
    const id = window.setTimeout(tick, 1500 + Math.random() * 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  return count;
}

export function formatCount(n: number, lang: string) {
  return n.toLocaleString(lang.startsWith("en") ? "en-US" : "es-ES");
}
