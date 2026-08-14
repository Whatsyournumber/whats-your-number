/** Tasas de cambio del día (mismas referencias que usa Google: mercado spot diario). */
import { useQuery } from "@tanstack/react-query";
import { setFxFactor } from "@/lib/mfn";
import { useEffect } from "react";

export type FxSnapshot = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
};

export async function fetchFxRates(base: string): Promise<FxSnapshot> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
  if (!res.ok) throw new Error("No se pudieron obtener las tasas de cambio");
  const json = (await res.json()) as {
    result: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };
  if (json.result !== "success" || !json.rates) throw new Error("Respuesta de tasas inválida");
  return { base, rates: json.rates, updatedAt: json.time_last_update_utc ?? new Date().toUTCString() };
}

/** Factor para pasar de `base` (moneda en la que se guardaron los datos) a `display`. */
export function useFx(base: string | null | undefined, display: string | null | undefined) {
  const from = (base || "EUR").toUpperCase();
  const to = (display || from).toUpperCase();

  const query = useQuery({
    queryKey: ["fx", from],
    queryFn: () => fetchFxRates(from),
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    enabled: from !== to,
  });

  const factor = from === to ? 1 : (query.data?.rates?.[to] ?? null);

  useEffect(() => {
    setFxFactor(factor ?? 1);
  }, [factor]);

  return {
    factor: factor ?? 1,
    ready: from === to || factor !== null,
    from,
    to,
    updatedAt: query.data?.updatedAt ?? null,
    isLoading: query.isLoading,
  };
}
