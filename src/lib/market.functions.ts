import { createServerFn } from "@tanstack/react-start";

export const getMarketQuotes = createServerFn({ method: "GET" })
  .inputValidator((input: { symbols: string[] }) => ({
    symbols: (input?.symbols ?? [])
      .map((s) => String(s).trim().toUpperCase())
      .filter((s) => /^[A-Z0-9.^=:&/-]{1,20}$/.test(s))
      .slice(0, 20),
  }))
  .handler(async ({ data }) => {
    const { fetchQuotes } = await import("./market.server");
    return { quotes: await fetchQuotes(data.symbols), updatedAt: Date.now() };
  });

export const getMarketSeries = createServerFn({ method: "GET" })
  .inputValidator((input: { symbols: string[] }) => ({
    symbols: (input?.symbols ?? [])
      .map((s) => String(s).trim().toUpperCase())
      .filter((s) => /^[A-Z0-9.^=:&/-]{1,20}$/.test(s))
      .slice(0, 5),
  }))
  .handler(async ({ data }) => {
    const { fetchYearSeries } = await import("./market.server");
    const entries = await Promise.all(
      data.symbols.map(async (s) => [s, await fetchYearSeries(s)] as const),
    );
    return { series: Object.fromEntries(entries), updatedAt: Date.now() };
  });

export const searchMarketSymbols = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => ({ query: String(input?.query ?? "").trim().slice(0, 40) }))
  .handler(async ({ data }) => {
    if (data.query.length < 1) return { hits: [] };
    const { searchSymbols } = await import("./market.server");
    return { hits: await searchSymbols(data.query) };
  });

/** Rendimiento real de los índices que usa el planificador (S&P 500, Nasdaq 100, Bitcoin). */
export const getIndexReturns = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchIndexStat } = await import("./market.server");
  const symbols = ["^GSPC", "^NDX", "BTC-USD"] as const;
  const stats = await Promise.all(symbols.map((s) => fetchIndexStat(s)));
  return {
    indexes: Object.fromEntries(symbols.map((s, i) => [s, stats[i] ?? null])),
    updatedAt: Date.now(),
  };
});

/** Rendimiento anualizado (CAGR) de activos concretos, para el simulador. */
export const getSymbolReturns = createServerFn({ method: "GET" })
  .inputValidator((input: { symbols: string[] }) => ({
    symbols: (input?.symbols ?? [])
      .map((s) => String(s).trim().toUpperCase())
      .filter((s) => /^[A-Z0-9.^=:&/-]{1,20}$/.test(s))
      .slice(0, 5),
  }))
  .handler(async ({ data }) => {
    const { fetchIndexStat } = await import("./market.server");
    const entries = await Promise.all(
      data.symbols.map(async (s) => {
        const stat = await fetchIndexStat(s);
        // Rendimiento actual en tiempo real: lo que lleva el año (YTD) en vivo.
        const annual = stat?.ytdPct ?? stat?.cagr5y ?? stat?.cagr10y ?? null;
        return [s, annual] as const;
      }),
    );
    return { returns: Object.fromEntries(entries), updatedAt: Date.now() };
  });
