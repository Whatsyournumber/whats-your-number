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
  // Yahoo suele añadir una barra extra con el precio de hoy en el mismo mes que la última barra mensual:
  // nos quedamos con el último cierre de cada mes para no repetir "Sep, Sep".
  const byMonth = new Map<string, { t: number; c: number }>();
  for (const p of points) {
    const d = new Date(p.t * 1000);
    byMonth.set(`${d.getUTCFullYear()}-${d.getUTCMonth()}`, p);
  }
  const deduped = [...byMonth.values()].sort((a, b) => a.t - b.t);
  if (deduped.length < 2) return [];
  const base = deduped[0]!.c;
  return deduped.map((p) => {
    const date = new Date(p.t * 1000);
    return { label: MONTHS[date.getUTCMonth()]!, value: ((p.c - base) / base) * 100 };
  });
}

export type SymbolHit = { symbol: string; name: string; type: string; exchange: string };

export async function searchSymbols(query: string): Promise<SymbolHit[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      quotes?: { symbol?: string; shortname?: string; longname?: string; quoteType?: string; exchange?: string }[];
    };
    return (json.quotes ?? [])
      .filter((q) => q.symbol)
      .map((q) => ({
        symbol: q.symbol!,
        name: q.shortname ?? q.longname ?? q.symbol!,
        type: q.quoteType ?? "",
        exchange: q.exchange ?? "",
      }));
  } catch {
    return [];
  }
}

export type IndexStat = {
  symbol: string;
  price: number;
  changePct: number;
  cagr10y: number | null;
  cagr5y: number | null;
  ytdPct: number | null;
  currency: string;
};

/** Rendimiento real (CAGR) de un índice a partir del histórico mensual de Yahoo Finance. */
export async function fetchIndexStat(symbol: string): Promise<IndexStat | null> {
  const [live, hist] = await Promise.all([
    chart(symbol, "5d", "1d"),
    chart(symbol, "10y", "1mo"),
  ]);
  if (!live?.meta?.regularMarketPrice && !hist?.meta?.regularMarketPrice) return null;
  const price = live?.meta?.regularMarketPrice ?? hist?.meta?.regularMarketPrice ?? 0;
  const prev = live?.meta?.previousClose ?? live?.meta?.chartPreviousClose ?? price;

  const closes = hist?.indicators?.quote?.[0]?.close ?? [];
  const stamps = hist?.timestamp ?? [];
  const pts: { t: number; c: number }[] = [];
  for (let i = 0; i < stamps.length; i += 1) {
    const c = closes[i];
    const t = stamps[i];
    if (typeof c === "number" && typeof t === "number") pts.push({ t, c });
  }
  const last = pts[pts.length - 1]?.c ?? price;

  const cagrFrom = (yearsBack: number): number | null => {
    const target = Date.now() / 1000 - yearsBack * 365.25 * 24 * 3600;
    const start = pts.find((p) => p.t >= target);
    if (!start || !start.c || !last) return null;
    const years = (Date.now() / 1000 - start.t) / (365.25 * 24 * 3600);
    if (years < 1) return null;
    return (Math.pow(last / start.c, 1 / years) - 1) * 100;
  };

  const jan1 = Date.UTC(new Date().getUTCFullYear(), 0, 1) / 1000;
  const ytdStart = pts.find((p) => p.t >= jan1 - 40 * 24 * 3600)?.c;

  return {
    symbol,
    price,
    changePct: prev ? ((price - prev) / prev) * 100 : 0,
    cagr10y: cagrFrom(10),
    cagr5y: cagrFrom(5),
    ytdPct: ytdStart && price ? ((price - ytdStart) / ytdStart) * 100 : null,
    currency: live?.meta?.currency ?? hist?.meta?.currency ?? "USD",
  };
}
