/**
 * Indexación acelerada y difusión off-site (sin LinkedIn).
 *
 * Canales 100% automáticos y limpios (nada de granjas de enlaces tipo
 * Linklicious, que Google trata como spam):
 *  1. IndexNow  → Bing, Yandex, Seznam, Naver (indexan en minutos)
 *  2. Google Search Console → envío del sitemap por API (conector)
 *  3. Ping-o-Matic (XML-RPC) → agregadores y directorios de blogs
 *  4. Feed hubs (Superfeedr/WebSub) → distribuye el RSS ES/EN a lectores
 *     y agregadores hispanos que sigan el feed
 */

export const SITE = "https://whatsyour-number.com";
export const INDEXNOW_KEY = "e41a719c80d6bb2fb3940e599ea81337";

export type ChannelResult = {
  channel: string;
  ok: boolean;
  detail: string;
};

/* --------------------------------- IndexNow -------------------------------- */

/** Envía hasta 10.000 URLs a la red IndexNow (Bing, Yandex, Seznam, Naver). */
export async function submitIndexNow(urls: string[]): Promise<ChannelResult> {
  try {
    const response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10_000),
      }),
    });
    const text = await response.text();
    return {
      channel: "IndexNow (Bing · Yandex · Seznam · Naver)",
      ok: response.ok || response.status === 202,
      detail: `HTTP ${response.status}${text ? ` · ${text.slice(0, 120)}` : ""} · ${urls.length} URLs`,
    };
  } catch (error) {
    return {
      channel: "IndexNow (Bing · Yandex · Seznam · Naver)",
      ok: false,
      detail: error instanceof Error ? error.message : "error de red",
    };
  }
}

/* ------------------------------ Ping-o-Matic ------------------------------- */

function xmlRpcPing(title: string, url: string, feed: string) {
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>weblogUpdates.extendedPing</methodName>
  <params>
    <param><value><string>${title}</string></value></param>
    <param><value><string>${url}</string></value></param>
    <param><value><string>${url}</string></value></param>
    <param><value><string>${feed}</string></value></param>
  </params>
</methodCall>`;
}

/** Avisa a los agregadores de blogs de que hay contenido nuevo. */
export async function pingAggregators(lang: "es" | "en"): Promise<ChannelResult[]> {
  const feed = `${SITE}/api/public/rss${lang === "en" ? "?lang=en" : ""}`;
  const title = lang === "en" ? "WhatsYourNumber Blog" : "Blog de WhatsYourNumber";
  const endpoints = [
    { name: "Ping-o-Matic", url: "https://rpc.pingomatic.com/" },
    { name: "Twingly", url: "https://rpc.twingly.com/" },
    { name: "Blogdigger", url: "https://pinger.blogflux.com/rpc/" },
  ];

  return Promise.all(
    endpoints.map(async ({ name, url }) => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/xml" },
          body: xmlRpcPing(title, SITE, feed),
        });
        const text = await response.text();
        const failed = /<boolean>1<\/boolean>/.test(text);
        return {
          channel: `${name} (${lang.toUpperCase()})`,
          ok: response.ok && !failed,
          detail: `HTTP ${response.status}`,
        };
      } catch (error) {
        return {
          channel: `${name} (${lang.toUpperCase()})`,
          ok: false,
          detail: error instanceof Error ? error.message : "error de red",
        };
      }
    }),
  );
}

/* ----------------------------- WebSub / feed hub --------------------------- */

/** Notifica al hub WebSub público para que los lectores reciban el feed al instante. */
export async function pingWebSub(lang: "es" | "en"): Promise<ChannelResult> {
  const feed = `${SITE}/api/public/rss${lang === "en" ? "?lang=en" : ""}`;
  try {
    const response = await fetch("https://pubsubhubbub.appspot.com/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "hub.mode": "publish", "hub.url": feed }).toString(),
    });
    return {
      channel: `WebSub hub (${lang.toUpperCase()})`,
      ok: response.ok || response.status === 204,
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      channel: `WebSub hub (${lang.toUpperCase()})`,
      ok: false,
      detail: error instanceof Error ? error.message : "error de red",
    };
  }
}

/* --------------------------- Google Search Console ------------------------- */

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

/** Reenvía el sitemap a la propiedad verificada de Search Console. */
export async function submitSitemapToGoogle(): Promise<ChannelResult> {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const connectionApiKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableApiKey || !connectionApiKey) {
    return { channel: "Google Search Console", ok: false, detail: "conector no configurado" };
  }
  const headers = {
    Authorization: `Bearer ${lovableApiKey}`,
    "X-Connection-Api-Key": connectionApiKey,
  };
  try {
    const listed = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!listed.ok) {
      return { channel: "Google Search Console", ok: false, detail: `HTTP ${listed.status}` };
    }
    const { siteEntry = [] } = (await listed.json()) as {
      siteEntry?: { siteUrl: string; permissionLevel?: string }[];
    };
    const host = new URL(SITE).hostname;
    const match = siteEntry.find(
      (entry) =>
        entry.permissionLevel !== "siteUnverifiedUser" &&
        (entry.siteUrl === `sc-domain:${host}` ||
          entry.siteUrl === `${SITE}/` ||
          entry.siteUrl === SITE),
    );
    if (!match) {
      return { channel: "Google Search Console", ok: false, detail: "sin propiedad verificada" };
    }
    const sitemap = `${SITE}/sitemap.xml`;
    const submitted = await fetch(
      `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(match.siteUrl)}/sitemaps/${encodeURIComponent(sitemap)}`,
      { method: "PUT", headers },
    );
    return {
      channel: "Google Search Console",
      ok: submitted.ok,
      detail: submitted.ok ? `sitemap enviado a ${match.siteUrl}` : `HTTP ${submitted.status}`,
    };
  } catch (error) {
    return {
      channel: "Google Search Console",
      ok: false,
      detail: error instanceof Error ? error.message : "error de red",
    };
  }
}

/* --------------------------------- Runner ---------------------------------- */

export type DistributionReport = {
  ranAt: string;
  urls: number;
  results: ChannelResult[];
};

/** Ejecuta todos los canales de indexación/difusión para las URLs indicadas. */
export async function distribute(urls: string[]): Promise<DistributionReport> {
  const [indexNow, google, esPings, enPings, esHub, enHub] = await Promise.all([
    submitIndexNow(urls),
    submitSitemapToGoogle(),
    pingAggregators("es"),
    pingAggregators("en"),
    pingWebSub("es"),
    pingWebSub("en"),
  ]);
  return {
    ranAt: new Date().toISOString(),
    urls: urls.length,
    results: [indexNow, google, ...esPings, ...enPings, esHub, enHub],
  };
}
