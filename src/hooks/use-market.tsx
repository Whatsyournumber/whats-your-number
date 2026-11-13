import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFxRates } from "@/hooks/use-fx-rates";
import { useProfile } from "@/hooks/use-profile";
import { convertAmount } from "@/lib/fx";

import { getDailySeries, getMarketQuotes, getPriceOnDate, getMarketSeries, getSymbolReturns, searchMarketSymbols } from "@/lib/market.functions";

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
    // near real-time: refresh every 10s while the tab is visible
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
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

/** Cierres diarios recientes: permite calcular la rentabilidad desde el día exacto de compra. */
export function useDailySeries(symbols: string[]) {
  return useQuery({
    queryKey: ["market-daily", symbols.join(",")],
    queryFn: () => getDailySeries({ data: { symbols } }),
    enabled: symbols.length > 0,
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
  });
}

export function useSymbolSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["market-search", q],
    queryFn: () => searchMarketSymbols({ data: { query: q } }),
    enabled: q.length >= 1,
    staleTime: 5 * 60_000,
  });
}

export function useSymbolReturns(symbols: string[]) {
  return useQuery({
    queryKey: ["market-symbol-returns", symbols.join(",")],
    queryFn: () => getSymbolReturns({ data: { symbols } }),
    enabled: symbols.length > 0,
    staleTime: 30 * 60_000,
  });
}

/** Cotizaciones de las posiciones del usuario convertidas a la moneda de su perfil,
 *  para que valor, precio de entrada y ganancia usen siempre la misma divisa. */
export function useHoldingQuotes(symbols: string[]) {
  const { profile } = useProfile();
  useFxRates();
  const to = (profile.currency || "USD").toUpperCase();
  const query = useQuotes(symbols);
  const data = useMemo(
    () =>
      query.data
        ? {
            ...query.data,
            quotes: query.data.quotes.map((q) => ({
              ...q,
              price: convertAmount(q.price, q.currency || "USD", to),
              currency: to,
            })),
          }
        : query.data,
    [query.data, to],
  );
  return { ...query, data };
}

/** Precio del ticker en la fecha de compra, convertido a la moneda del perfil. */
export function usePurchasePrice(ticker: string, date: string, enabled: boolean) {
  const { profile } = useProfile();
  useFxRates();
  const to = (profile.currency || "USD").toUpperCase();
  const symbol = ticker.trim().toUpperCase();
  const day = date.slice(0, 10);
  const query = useQuery({
    queryKey: ["market-price-on-date", symbol, day],
    queryFn: () => getPriceOnDate({ data: { symbol, date: day } }),
    enabled: enabled && symbol.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(day),
    staleTime: 60 * 60_000,
  });
  const convert = (r: { price: number; currency: string; date: string } | null | undefined) =>
    r ? { price: convertAmount(r.price, r.currency || "USD", to), date: r.date } : null;
  const value = convert(query.data?.result);
  /** Espera el precio si aún no ha llegado (al guardar). */
  const resolve = async () => {
    if (value) return value;
    if (!symbol || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const res = await query.refetch();
    return convert(res.data?.result);
  };
  return { value, isFetching: query.isFetching, resolve };
}
