import { useQuery } from "@tanstack/react-query";
import { getIndexReturns } from "@/lib/market.functions";

export type LiveIndex = {
  rate: number;
  price: number;
  changePct: number;
  ytdPct: number | null;
  cagr10y: number | null;
};

const SYMBOL_BY_KEY: Record<string, string> = {
  sp500: "^GSPC",
  nasdaq: "^NDX",
  cripto: "BTC-USD",
};

const CLAMP: Record<string, [number, number]> = {
  sp500: [4, 18],
  nasdaq: [5, 22],
  cripto: [10, 35],
};

/** Rendimiento real de los índices (CAGR 10 años) + precio en vivo, refrescado cada minuto. */
export function useIndexReturns() {
  const query = useQuery({
    queryKey: ["index-returns"],
    queryFn: () => getIndexReturns(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const live: Record<string, LiveIndex> = {};
  for (const [key, symbol] of Object.entries(SYMBOL_BY_KEY)) {
    const stat = query.data?.indexes?.[symbol];
    if (!stat) continue;
    const cagr = stat.cagr10y ?? stat.cagr5y;
    if (cagr == null || !Number.isFinite(cagr)) continue;
    const [min, max] = CLAMP[key] ?? [0, 100];
    live[key] = {
      rate: Math.round(Math.min(max, Math.max(min, cagr))),
      price: stat.price,
      changePct: stat.changePct,
      ytdPct: stat.ytdPct,
      cagr10y: cagr,
    };
  }

  return { live, updatedAt: query.data?.updatedAt ?? null, isLoading: query.isLoading };
}
