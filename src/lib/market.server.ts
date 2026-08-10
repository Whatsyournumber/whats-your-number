const BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  changePct: number;
  currency: string;
};

export type SeriesPoint = { label: string; value: number };

type ChartResult = {
  meta: {
    symbol: string;
    shortName?: string;
    longName?: string;
    currency?: string;
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
  };
  timestamp?: number[];
  indicators: { quote: { close?: (number | null)[] }[] };
};

async function chart(symbol: string, range: string, interval: string): Promise<ChartResult | null> {
  try {
    const res = await fetch(
      `${BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: ChartResult[] } };
    return json.chart?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const r = await chart(symbol, "5d", "1d");
      if (!r?.meta?.regularMarketPrice) return null;
      const price = r.meta.regularMarketPrice;
      const closes = (r.indicators?.quote?.[0]?.close ?? []).filter((c): c is number => typeof c === "number");
      const prev = r.meta.previousClose ?? closes[closes.length - 2] ?? r.meta.chartPreviousClose ?? price;
      return {
        symbol: r.meta.symbol ?? symbol,
        name: r.meta.shortName ?? r.meta.longName ?? symbol,
        price,
        previousClose: prev,
        changePct: prev ? ((price - prev) / prev) * 100 : 0,
        currency: r.meta.currency ?? "USD",
      } satisfies Quote;
    }),
  );
  return results.filter((q): q is Quote => q !== null);
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Monthly cumulative % return over the last 12 months, base 0. */
export async function fetchYearSeries(symbol: string): Promise<SeriesPoint[]> {
  const r = await chart(symbol, "1y", "1mo");
  const closes = r?.indicators?.quote?.[0]?.close ?? [];
  const stamps = r?.timestamp ?? [];
  const points: { t: number; c: number }[] = [];
  for (let i = 0; i < stamps.length; i += 1) {
    const c = closes[i];
    const t = stamps[i];
    if (typeof c === "number" && typeof t === "number") points.push({ t, c });
  }
  if (points.length < 2) return [];
  const base = points[0]!.c;
  return points.map((p) => {
    const date = new Date(p.t * 1000);
    return { label: MONTHS[date.getUTCMonth()]!, value: ((p.c - base) / base) * 100 };
  });
}
