import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { getMarketQuotes, getMarketSeries } from "@/lib/market.functions";

const STORE_KEY = "wyn.watchlist";
export const DEFAULT_WATCHLIST = ["SPY", "QQQ", "VOO", "AAPL", "NVDA", "BTC-USD", "ETH-USD"];

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_WATCHLIST);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length) setSymbols(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setSymbols(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const add = useCallback(
    (raw: string) => {
      const s = raw.trim().toUpperCase();
      if (!s || !/^[A-Z0-9.^=:&/-]{1,20}$/.test(s)) return false;
      if (symbols.includes(s)) return false;
      persist([...symbols, s].slice(0, 20));
      return true;
    },
    [persist, symbols],
  );

  const remove = useCallback((s: string) => persist(symbols.filter((x) => x !== s)), [persist, symbols]);

  return { symbols, add, remove };
}

export function useQuotes(symbols: string[]) {
  return useQuery({
    queryKey: ["market-quotes", symbols.join(",")],
    queryFn: () => getMarketQuotes({ data: { symbols } }),
    enabled: symbols.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarketSeries(symbols: string[]) {
  return useQuery({
    queryKey: ["market-series", symbols.join(",")],
    queryFn: () => getMarketSeries({ data: { symbols } }),
    enabled: symbols.length > 0,
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
  });
}
