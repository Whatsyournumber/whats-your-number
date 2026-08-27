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
