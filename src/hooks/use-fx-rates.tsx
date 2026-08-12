import { useQuery } from "@tanstack/react-query";

import { setLiveRates } from "@/lib/fx";

type ErApiResponse = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

/**
 * Tasas de cambio del día (base USD). Se cachean 12h y alimentan la tabla
 * global de conversión usada por los movimientos importados.
 */
export function useFxRates() {
  const query = useQuery({
    queryKey: ["fx-rates-usd"],
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    queryFn: async () => {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("No pudimos obtener las tasas del día");
      const json = (await res.json()) as ErApiResponse;
      if (!json.rates) throw new Error("Respuesta de tasas inválida");
      setLiveRates(json.rates, json.time_last_update_utc);
      return { updatedAt: json.time_last_update_utc ?? new Date().toISOString() };
    },
  });

  return { updatedAt: query.data?.updatedAt ?? null, isLoading: query.isLoading };
}
