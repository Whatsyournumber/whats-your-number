import { useEffect, useState } from "react";

/**
 * Segundos transcurridos desde la medianoche local.
 */
function secondsSinceMidnight() {
  const now = new Date();
  return (
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  );
}

/**
 * Contador "vivo" de registros: arranca en `base` cada día a las 00:00 y
 * sube a lo largo del día (como si entraran nuevas personas), sumando
 * además incrementos en vivo mientras se ve la página.
 */
export function useLiveCount(base: number) {
  // Resetea cada día: base + acumulado proporcional al tiempo transcurrido.
  const [count, setCount] = useState(base);

  useEffect(() => {
    setCount(base + Math.floor(secondsSinceMidnight() / 22));
  }, [base]);

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
