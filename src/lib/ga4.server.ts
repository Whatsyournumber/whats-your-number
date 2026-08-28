// GA4 Data API access using a Google service account (server-only).
// Required secrets: GA4_PROPERTY_ID (numeric) and GA4_SERVICE_ACCOUNT_JSON
// (full JSON key of a service account with "Viewer" on the GA4 property).

export interface Ga4Summary {
  configured: boolean;
  error?: string;
  propertyId?: string;
  range: { start: string; end: string };
  totals: { users: number; sessions: number; pageviews: number };
  byDay: Array<{ date: string; pageviews: number; sessions: number; users: number }>;
  blogPages: Array<{ path: string; pageviews: number; users: number }>;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google OAuth failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

interface RunReportRow {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

async function runReport(
  token: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<RunReportRow[]> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 Data API failed [${res.status}]: ${text}`);
  }
  const json = (await res.json()) as { rows?: RunReportRow[] };
  return json.rows ?? [];
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400_000);
  return d.toISOString().slice(0, 10);
}

export async function loadGa4Traffic(days: number): Promise<Ga4Summary> {
  const propertyId = process.env["GA4_PROPERTY_ID"]?.trim();
  const rawSa = process.env["GA4_SERVICE_ACCOUNT_JSON"];
  const end = new Date().toISOString().slice(0, 10);
  const start = isoDaysAgo(days);

  const empty: Ga4Summary = {
    configured: false,
    range: { start, end },
    totals: { users: 0, sessions: 0, pageviews: 0 },
    byDay: [],
    blogPages: [],
  };

  if (!propertyId || !rawSa) return empty;

  try {
    const sa = JSON.parse(rawSa) as ServiceAccountKey;
    if (!sa.client_email || !sa.private_key) {
      return { ...empty, configured: false, error: "Service account JSON inválido" };
    }
    const token = await getAccessToken(sa);

    const dateRange = { startDate: start, endDate: end };

    const [totalsRows, dayRows, pageRows] = await Promise.all([
      runReport(token, propertyId, {
        dateRanges: [dateRange],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      runReport(token, propertyId, {
        dateRanges: [dateRange],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      runReport(token, propertyId, {
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "BEGINS_WITH", value: "/blog" },
          },
        },
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 15,
      }),
    ]);

    const totalsRow = totalsRows[0]?.metricValues ?? [];
    const num = (v?: string) => Number(v ?? 0);

    return {
      configured: true,
      propertyId,
      range: { start, end },
      totals: {
        users: num(totalsRow[0]?.value),
        sessions: num(totalsRow[1]?.value),
        pageviews: num(totalsRow[2]?.value),
      },
      byDay: dayRows.map((r) => {
        const raw = r.dimensionValues?.[0]?.value ?? "";
        return {
          date: raw ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw,
          pageviews: num(r.metricValues?.[0]?.value),
          sessions: num(r.metricValues?.[1]?.value),
          users: num(r.metricValues?.[2]?.value),
        };
      }),
      blogPages: pageRows.map((r) => ({
        path: r.dimensionValues?.[0]?.value ?? "",
        pageviews: num(r.metricValues?.[0]?.value),
        users: num(r.metricValues?.[1]?.value),
      })),
    };
  } catch (err) {
    return {
      ...empty,
      configured: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
