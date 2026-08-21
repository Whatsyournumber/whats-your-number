/**
 * LinkedIn Community Management API integration (organization page publishing).
 *
 * Configuration lives in secrets:
 *  - LINKEDIN_CM_CLIENT_ID      LinkedIn app client id
 *  - LINKEDIN_CM_CLIENT_SECRET  LinkedIn app client secret
 *  - LINKEDIN_ORG_ID            numeric organization id (e.g. 107005182)
 *  - LINKEDIN_SITE_URL          public site origin (optional, defaults to prod domain)
 *
 * Tokens are persisted server-side in public.linkedin_connection (service role only).
 */

const LINKEDIN_VERSION = "202506";
const API = "https://api.linkedin.com/rest";
const OAUTH = "https://www.linkedin.com/oauth/v2";

export const LINKEDIN_SCOPES = [
  "r_organization_social",
  "w_organization_social",
  "rw_organization_admin",
].join(",");

export function linkedinConfig() {
  const clientId = process.env["LINKEDIN_CM_CLIENT_ID"];
  const clientSecret = process.env["LINKEDIN_CM_CLIENT_SECRET"];
  const orgId = process.env["LINKEDIN_ORG_ID"];
  const siteUrl = (process.env["LINKEDIN_SITE_URL"] ?? "https://whatsyour-number.com").replace(/\/+$/, "");
  return {
    clientId,
    clientSecret,
    orgId,
    siteUrl,
    redirectUri: `${siteUrl}/api/public/linkedin/callback`,
    configured: Boolean(clientId && clientSecret && orgId),
  };
}

export async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export type LinkedInConnection = {
  id: string;
  org_urn: string | null;
  org_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  refresh_expires_at: string | null;
  scope: string | null;
  oauth_state: string | null;
  oauth_state_at: string | null;
};

export async function getConnection(): Promise<LinkedInConnection | null> {
  const db = await adminDb();
  const { data, error } = await db
    .from("linkedin_connection")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function saveConnection(patch: Record<string, unknown>) {
  const db = await adminDb();
  const { error } = await db
    .from("linkedin_connection")
    .upsert({ id: "default", ...patch, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export function buildAuthorizeUrl(state: string) {
  const cfg = linkedinConfig();
  if (!cfg.configured) throw new Error("LinkedIn no está configurado: faltan secretos.");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId!,
    redirect_uri: cfg.redirectUri,
    state,
    scope: LINKEDIN_SCOPES,
  });
  return `${OAUTH}/authorization?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${OAUTH}/accessToken`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LinkedIn OAuth [${res.status}]: ${text}`);
  return JSON.parse(text) as TokenResponse;
}

function iso(secondsFromNow?: number) {
  if (!secondsFromNow) return null;
  return new Date(Date.now() + secondsFromNow * 1000).toISOString();
}

export async function exchangeCode(code: string) {
  const cfg = linkedinConfig();
  const token = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
  });
  const orgUrn = `urn:li:organization:${cfg.orgId}`;
  await saveConnection({
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? null,
    expires_at: iso(token.expires_in),
    refresh_expires_at: iso(token.refresh_token_expires_in),
    scope: token.scope ?? LINKEDIN_SCOPES,
    org_urn: orgUrn,
    oauth_state: null,
    oauth_state_at: null,
  });
  try {
    const name = await fetchOrgName(token.access_token, cfg.orgId!);
    if (name) await saveConnection({ org_name: name });
  } catch {
    /* org name is cosmetic */
  }
  return { ok: true };
}

/** Returns a valid access token, refreshing it when close to expiry. */
export async function getAccessToken(): Promise<string> {
  const cfg = linkedinConfig();
  if (!cfg.configured) throw new Error("LinkedIn no está configurado: faltan secretos.");
  const conn = await getConnection();
  if (!conn?.access_token) throw new Error("LinkedIn no está conectado. Autoriza la página primero.");

  const expiresAt = conn.expires_at ? Date.parse(conn.expires_at) : 0;
  const expiringSoon = !expiresAt || expiresAt - Date.now() < 5 * 60 * 1000;
  if (!expiringSoon) return conn.access_token;

  if (!conn.refresh_token) {
    if (expiresAt && expiresAt > Date.now()) return conn.access_token;
    throw new Error("El token de LinkedIn caducó. Vuelve a autorizar la página.");
  }

  const token = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: conn.refresh_token,
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
  });
  await saveConnection({
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? conn.refresh_token,
    expires_at: iso(token.expires_in),
    refresh_expires_at: iso(token.refresh_token_expires_in) ?? conn.refresh_expires_at,
  });
  return token.access_token;
}

function apiHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "content-type": "application/json",
  };
}

async function fetchOrgName(accessToken: string, orgId: string) {
  const res = await fetch(`${API}/organizations/${orgId}?projection=(localizedName)`, {
    headers: apiHeaders(accessToken),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { localizedName?: string };
  return json.localizedName ?? null;
}

export type PublishInput = {
  commentary: string;
  articleUrl: string;
  articleTitle: string;
  articleDescription?: string;
};

/** Publishes an article share on the organization page. */
export async function publishOrganizationPost(input: PublishInput) {
  const cfg = linkedinConfig();
  const accessToken = await getAccessToken();
  const author = `urn:li:organization:${cfg.orgId}`;

  const body = {
    author,
    commentary: input.commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      article: {
        source: input.articleUrl,
        title: input.articleTitle.slice(0, 400),
        ...(input.articleDescription ? { description: input.articleDescription.slice(0, 4000) } : {}),
      },
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch(`${API}/posts`, {
    method: "POST",
    headers: apiHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`LinkedIn publish failed [${res.status}]: ${errorBody}`);
    throw new Error(`LinkedIn rechazó la publicación [${res.status}]: ${errorBody}`);
  }

  const urn = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id");
  return {
    urn,
    url: urn ? `https://www.linkedin.com/feed/update/${urn}/` : null,
  };
}
