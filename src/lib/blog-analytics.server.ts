/**
 * Lógica de servidor del back office del blog:
 * - registro de visitas (tabla blog_page_views)
 * - agregados de tráfico y países
 * - lectura de Google Search Console vía connector gateway
 */

const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-geo-country",
  "fastly-client-country",
];

const CITY_HEADERS = ["cf-ipcity", "x-vercel-ip-city", "x-geo-city"];

export function headerCountry(headers: Headers | undefined): string | null {
  if (!headers) return null;
  for (const key of COUNTRY_HEADERS) {
    const value = headers.get(key);
    if (value && value.length === 2 && value.toUpperCase() !== "XX") return value.toUpperCase();
  }
  return null;
}

export function headerCity(headers: Headers | undefined): string | null {
  if (!headers) return null;
  for (const key of CITY_HEADERS) {
    const value = headers.get(key);
    if (value) return decodeURIComponent(value).slice(0, 80);
  }
  return null;
}

export type ViewRow = {
  slug: string;
  lang: string;
  country: string | null;
  referrer: string | null;
  device: string | null;
  session_id: string | null;
  created_at: string;
};

export type TrafficSummary = {
  days: number;
  totalViews: number;
  uniqueSessions: number;
  byPost: { slug: string; views: number; sessions: number; es: number; en: number }[];
  byCountry: { country: string; views: number }[];
  byDay: { date: string; views: number }[];
  byReferrer: { source: string; views: number }[];
  byDevice: { device: string; views: number }[];
};

export async function insertBlogView(row: Omit<ViewRow, "created_at">) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("blog_page_views").insert(row as never);
  if (error) throw new Error(error.message);
}

function referrerSource(raw: string | null): string {
  if (!raw) return "Directo";
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "Google";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("facebook")) return "Facebook";
    if (host.includes("t.co") || host.includes("twitter") || host === "x.com") return "X / Twitter";
    if (host.includes("whatsyour-number") || host.includes("whatsyournumber")) return "Interno";
    return host;
  } catch {
    return "Directo";
  }
}

export async function loadTraffic(days: number): Promise<TrafficSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("blog_page_views")
    .select("slug,lang,country,referrer,device,session_id,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50_000);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ViewRow[];
  const posts = new Map<string, { views: number; sessions: Set<string>; es: number; en: number }>();
  const countries = new Map<string, number>();
  const daysMap = new Map<string, number>();
  const referrers = new Map<string, number>();
  const devices = new Map<string, number>();
  const sessions = new Set<string>();

  for (const row of rows) {
    const post = posts.get(row.slug) ?? { views: 0, sessions: new Set<string>(), es: 0, en: 0 };
    post.views += 1;
    if (row.session_id) post.sessions.add(row.session_id);
    if (row.lang === "en") post.en += 1;
    else post.es += 1;
    posts.set(row.slug, post);

    const country = row.country ?? "??";
    countries.set(country, (countries.get(country) ?? 0) + 1);

    const day = row.created_at.slice(0, 10);
    daysMap.set(day, (daysMap.get(day) ?? 0) + 1);

    const source = referrerSource(row.referrer);
    referrers.set(source, (referrers.get(source) ?? 0) + 1);

    const device = row.device ?? "desconocido";
    devices.set(device, (devices.get(device) ?? 0) + 1);

    if (row.session_id) sessions.add(row.session_id);
  }

  const series: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    series.push({ date, views: daysMap.get(date) ?? 0 });
  }

  return {
    days,
    totalViews: rows.length,
    uniqueSessions: sessions.size,
    byPost: [...posts.entries()]
      .map(([slug, v]) => ({ slug, views: v.views, sessions: v.sessions.size, es: v.es, en: v.en }))
      .sort((a, b) => b.views - a.views),
    byCountry: [...countries.entries()]
      .map(([country, views]) => ({ country, views }))
      .sort((a, b) => b.views - a.views),
    byDay: series,
    byReferrer: [...referrers.entries()]
      .map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views),
    byDevice: [...devices.entries()]
      .map(([device, views]) => ({ device, views }))
      .sort((a, b) => b.views - a.views),
  };
}

/* ------------------------------ Search Console ----------------------------- */

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

export type GscSummary =
  | { status: "not_connected" }
  | { status: "no_property"; sites: string[] }
  | { status: "selection_required"; candidates: string[] }
  | {
      status: "ok";
      siteUrl: string;
      range: { start: string; end: string };
      totals: { clicks: number; impressions: number; ctr: number; position: number };
      queries: GscRow[];
      pages: GscRow[];
      countries: GscRow[];
    };

function gscHeaders() {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const connectionApiKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableApiKey || !connectionApiKey) return null;
  return {
    Authorization: `Bearer ${lovableApiKey}`,
    "X-Connection-Api-Key": connectionApiKey,
  };
}

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

async function gscQuery(
  headers: Record<string, string>,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<GscRow[]> {
  const response = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search Console [${response.status}]: ${text}`);
  }
  const json = (await response.json()) as { rows?: GscRow[] };
  return json.rows ?? [];
}

type SiteResolution =
  | { ok: true; siteUrl: string; headers: Record<string, string> }
  | { ok: false; summary: Exclude<GscSummary, { status: "ok" }> };

async function resolveSite(targetUrl: string, selectedSiteUrl?: string): Promise<SiteResolution> {
  const headers = gscHeaders();
  if (!headers) return { ok: false, summary: { status: "not_connected" } };

  const listed = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
  if (!listed.ok) throw new Error(`Search Console [${listed.status}]: ${await listed.text()}`);
  const { siteEntry = [] } = (await listed.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel?: string }[];
  };
  const verified = siteEntry.filter((entry) => entry.permissionLevel !== "siteUnverifiedUser");
  const target = new URL(targetUrl);
  const matches = verified.filter((entry) => coversTarget(entry.siteUrl, target));

  if (selectedSiteUrl) {
    const found = matches.find((entry) => entry.siteUrl === selectedSiteUrl);
    if (!found) {
      return { ok: false, summary: { status: "selection_required", candidates: matches.map((m) => m.siteUrl) } };
    }
    return { ok: true, siteUrl: found.siteUrl, headers };
  }
  if (matches.length === 0) {
    return { ok: false, summary: { status: "no_property", sites: verified.map((m) => m.siteUrl) } };
  }
  if (matches.length === 1) return { ok: true, siteUrl: matches[0]!.siteUrl, headers };
  return { ok: false, summary: { status: "selection_required", candidates: matches.map((m) => m.siteUrl) } };
}

export async function loadSearchConsole(
  targetUrl: string,
  selectedSiteUrl?: string,
  days = 28,
): Promise<GscSummary> {
  const resolved = await resolveSite(targetUrl, selectedSiteUrl);
  if (!resolved.ok) return resolved.summary;
  const { headers, siteUrl } = resolved;


  const end = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 2) * 86_400_000).toISOString().slice(0, 10);
  const blogFilter = {
    dimensionFilterGroups: [
      { filters: [{ dimension: "page", operator: "contains", expression: "/blog/" }] },
    ],
  };
  const base = { startDate: start, endDate: end, rowLimit: 100, ...blogFilter };

  const [queries, pages, countries, totalsRows] = await Promise.all([
    gscQuery(headers, siteUrl, { ...base, dimensions: ["query"] }),
    gscQuery(headers, siteUrl, { ...base, dimensions: ["page"] }),
    gscQuery(headers, siteUrl, { ...base, dimensions: ["country"], rowLimit: 30 }),
    gscQuery(headers, siteUrl, { ...base, dimensions: [], rowLimit: 1 }),
  ]);

  const totalsRow = totalsRows[0];
  return {
    status: "ok",
    siteUrl,
    range: { start, end },
    totals: {
      clicks: totalsRow?.clicks ?? 0,
      impressions: totalsRow?.impressions ?? 0,
      ctr: totalsRow?.ctr ?? 0,
      position: totalsRow?.position ?? 0,
    },
    queries,
    pages,
    countries,
  };
}

/* --------------------------- Keywords objetivo ---------------------------- */

export type KeywordRank = {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
};

export type KeywordRankings =
  | Exclude<GscSummary, { status: "ok" }>
  | {
      status: "ok";
      siteUrl: string;
      range: { start: string; end: string };
      ranks: KeywordRank[];
    };

/** Posición media de cada keyword objetivo en todo el sitio (no solo el blog). */
export async function loadKeywordRankings(
  targetUrl: string,
  keywords: string[],
  days = 28,
  selectedSiteUrl?: string,
): Promise<KeywordRankings> {
  const resolved = await resolveSite(targetUrl, selectedSiteUrl);
  if (!resolved.ok) return resolved.summary;
  const { headers, siteUrl } = resolved;

  const end = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 2) * 86_400_000).toISOString().slice(0, 10);

  const rows = await gscQuery(headers, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit: 5000,
  });

  const map = new Map<string, GscRow>();
  for (const row of rows) {
    const key = (row.keys[0] ?? "").toLowerCase().trim();
    if (key) map.set(key, row);
  }

  const ranks: KeywordRank[] = keywords.map((keyword) => {
    const row = map.get(keyword.toLowerCase().trim());
    return {
      keyword,
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
      ctr: row?.ctr ?? 0,
      position: row ? row.position : null,
    };
  });

  return { status: "ok", siteUrl, range: { start, end }, ranks };
}

/* ------------------------- Análisis deep LLM / IA -------------------------- */

/** Motores de respuesta / asistentes de IA que envían tráfico al blog. */
const AI_SOURCES: { id: string; label: string; match: RegExp }[] = [
  { id: "chatgpt", label: "ChatGPT", match: /(chatgpt\.com|chat\.openai\.com|openai\.com|searchgpt)/i },
  { id: "perplexity", label: "Perplexity", match: /perplexity\.ai/i },
  { id: "gemini", label: "Google Gemini / AI Overviews", match: /(gemini\.google|bard\.google|google\.com\/search\?.*udm=50)/i },
  { id: "copilot", label: "Microsoft Copilot", match: /(copilot\.microsoft|bing\.com\/chat|edgeservices\.bing)/i },
  { id: "claude", label: "Claude", match: /claude\.ai/i },
  { id: "grok", label: "Grok", match: /(grok\.com|x\.ai)/i },
  { id: "deepseek", label: "DeepSeek", match: /deepseek\.com/i },
  { id: "mistral", label: "Le Chat (Mistral)", match: /(chat\.mistral|mistral\.ai)/i },
  { id: "you", label: "You.com", match: /you\.com/i },
  { id: "poe", label: "Poe", match: /poe\.com/i },
  { id: "phind", label: "Phind", match: /phind\.com/i },
];

export type LlmInsights = {
  days: number;
  totalViews: number;
  aiViews: number;
  aiShare: number;
  bySource: { id: string; label: string; views: number; sessions: number }[];
  byPost: { slug: string; lang: string; views: number; sources: string[] }[];
  byDay: { date: string; views: number }[];
  byCountry: { country: string; views: number }[];
};

function aiSource(raw: string | null): { id: string; label: string } | null {
  if (!raw) return null;
  const found = AI_SOURCES.find((source) => source.match.test(raw));
  return found ? { id: found.id, label: found.label } : null;
}

/** Dónde están leyendo los LLM nuestros contenidos (tráfico desde asistentes de IA). */
export async function loadLlmInsights(days: number): Promise<LlmInsights> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("blog_page_views")
    .select("slug,lang,country,referrer,device,session_id,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50_000);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ViewRow[];
  const bySource = new Map<string, { label: string; views: number; sessions: Set<string> }>();
  const byPost = new Map<string, { lang: string; views: number; sources: Set<string> }>();
  const byDay = new Map<string, number>();
  const byCountry = new Map<string, number>();
  let aiViews = 0;

  for (const row of rows) {
    const source = aiSource(row.referrer);
    if (!source) continue;
    aiViews += 1;

    const entry = bySource.get(source.id) ?? { label: source.label, views: 0, sessions: new Set<string>() };
    entry.views += 1;
    if (row.session_id) entry.sessions.add(row.session_id);
    bySource.set(source.id, entry);

    const post = byPost.get(row.slug) ?? { lang: row.lang, views: 0, sources: new Set<string>() };
    post.views += 1;
    post.sources.add(source.label);
    byPost.set(row.slug, post);

    const day = row.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);

    const country = row.country ?? "??";
    byCountry.set(country, (byCountry.get(country) ?? 0) + 1);
  }

  const series: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    series.push({ date, views: byDay.get(date) ?? 0 });
  }

  return {
    days,
    totalViews: rows.length,
    aiViews,
    aiShare: rows.length ? aiViews / rows.length : 0,
    bySource: [...bySource.entries()]
      .map(([id, value]) => ({ id, label: value.label, views: value.views, sessions: value.sessions.size }))
      .sort((a, b) => b.views - a.views),
    byPost: [...byPost.entries()]
      .map(([slug, value]) => ({ slug, lang: value.lang, views: value.views, sources: [...value.sources] }))
      .sort((a, b) => b.views - a.views),
    byDay: series,
    byCountry: [...byCountry.entries()]
      .map(([country, views]) => ({ country, views }))
      .sort((a, b) => b.views - a.views),
  };
}
