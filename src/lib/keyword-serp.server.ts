/**
 * Fuente alternativa de posicionamiento mientras Search Console no devuelve datos.
 * Consulta el SERP público de DuckDuckGo (que usa el índice de Bing) y busca
 * la primera aparición de nuestro dominio.
 */

export type SerpRegion = "es" | "us" | "mx" | "gb";

/** Parámetro regional de DuckDuckGo (kl) por país. */
const REGION_KL: Record<SerpRegion, string> = {
  es: "es-es",
  mx: "mx-es",
  us: "us-en",
  gb: "uk-en",
};

export const REGION_LABEL: Record<SerpRegion, string> = {
  es: "España",
  mx: "México",
  us: "EE. UU.",
  gb: "Reino Unido",
};

export type SerpRank = {
  keyword: string;
  /** País/región desde el que se midió el SERP. */
  region: SerpRegion;
  /** Posición 1-based en el SERP, o null si no aparece en la primera página. */
  position: number | null;
  /** URL nuestra encontrada, si la hay. */
  url: string | null;
  /** Dominios que ocupan el top 5 orgánico (para contexto competitivo). */
  topDomains: string[];
  error?: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decodeResultUrl(href: string): string | null {
  try {
    const raw = href.startsWith("//") ? `https:${href}` : href;
    const url = new URL(raw);
    const uddg = url.searchParams.get("uddg");
    if (uddg) return uddg;
    if (url.hostname.endsWith("duckduckgo.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isAd(href: string) {
  return href.includes("ad_provider") || href.includes("y.js") || href.includes("bing.com/aclick");
}

export async function fetchSerpRank(
  keyword: string,
  domain: string,
  region: SerpRegion = "es",
): Promise<SerpRank> {
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}&kl=${REGION_KL[region]}`,
      { headers: { "User-Agent": UA, Accept: "text/html" } },
    );
    if (!response.ok) {
      return { keyword, region, position: null, url: null, topDomains: [], error: `HTTP ${response.status}` };
    }
    const html = await response.text();
    const matches = [...html.matchAll(/class="result__a"\s+href="([^"]+)"/g)];

    const organic: string[] = [];
    for (const match of matches) {
      const href = match[1] ?? "";
      if (isAd(href)) continue;
      const resolved = decodeResultUrl(href);
      if (!resolved) continue;
      organic.push(resolved);
    }

    let position: number | null = null;
    let found: string | null = null;
    const topDomains: string[] = [];

    organic.forEach((url, index) => {
      let host = "";
      try {
        host = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return;
      }
      if (topDomains.length < 5 && !topDomains.includes(host)) topDomains.push(host);
      if (position === null && host.endsWith(domain)) {
        position = index + 1;
        found = url;
      }
    });

    return { keyword, region, position, url: found, topDomains };
  } catch (error) {
    return {
      keyword,
      region,
      position: null,
      url: null,
      topDomains: [],
      error: error instanceof Error ? error.message : "network error",
    };
  }
}

/** Ejecuta las consultas con concurrencia limitada para no saturar la fuente. */
export async function fetchSerpRanks(
  keywords: { keyword: string; region: SerpRegion }[],
  domain: string,
  concurrency = 4,
) {
  const results: SerpRank[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, keywords.length) }, async () => {
    while (cursor < keywords.length) {
      const index = cursor++;
      const item = keywords[index]!;
      results[index] = await fetchSerpRank(item.keyword, domain, item.region);
    }
  });
  await Promise.all(workers);
  return { source: "duckduckgo" as const, checkedAt: new Date().toISOString(), ranks: results.filter(Boolean) };
}

export type SerpRankings = Awaited<ReturnType<typeof fetchSerpRanks>>;
