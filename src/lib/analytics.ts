declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const STORAGE_KEY = "wyn.consent.v1";
const MEASUREMENT_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"];
const GTM_ID = "GTM-NRXQF2T7";

let initialized = false;
let gtmLoaded = false;

function readConsent(): { analytics: boolean; marketing: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { analytics?: boolean; marketing?: boolean };
    return { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics ?? false;
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing ?? false;
}

/**
 * Carga Google Tag Manager (Google Ads + Meta Pixel se configuran dentro de GTM).
 * Solo se carga con consentimiento de marketing; las señales de consentimiento
 * se envían por dataLayer antes de cargar el contenedor.
 */
export function initGTM() {
  if (typeof window === "undefined" || gtmLoaded) return;
  if (!hasMarketingConsent()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);

  gtmLoaded = true;
}

// gtag.js solo procesa objetos `arguments`, no arrays.
function pushGtag(..._args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export type ConversionEvent = "sign_up" | "login" | "demo_start" | "demo_complete";

/**
 * Evento de conversión para GA4 (gtag) y GTM (dataLayer).
 * GA4 solo con consentimiento de analítica; GTM solo con consentimiento de marketing.
 * En GTM crea un activador "Evento personalizado" con el mismo nombre (sign_up, login, demo_start, demo_complete).
 */
export function trackConversion(name: ConversionEvent, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (hasAnalyticsConsent()) {
    if (!initialized) initGA();
    pushGtag("event", name, params);
  }
  if (hasMarketingConsent()) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
  }
}

function updateConsentState() {
  const consent = readConsent();
  const analyticsGranted = consent?.analytics ?? false;
  const marketingGranted = consent?.marketing ?? false;

  pushGtag("consent", "update", {
    ad_storage: marketingGranted ? "granted" : "denied",
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_user_data: marketingGranted ? "granted" : "denied",
    ad_personalization: marketingGranted ? "granted" : "denied",
  });
}

export function initGA() {
  if (typeof window === "undefined" || initialized) return;
  if (!MEASUREMENT_ID) {
    console.warn("[GA4] VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY no está configurado");
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  const consent = readConsent();
  const analyticsGranted = consent?.analytics ?? false;
  const marketingGranted = consent?.marketing ?? false;

  pushGtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });

  pushGtag("js", new Date());
  pushGtag("config", MEASUREMENT_ID, {
    send_page_view: false,
    cookie_flags: "SameSite=None;Secure",
    allow_google_signals: marketingGranted,
    allow_ad_personalization_signals: marketingGranted,
  });

  initialized = true;
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !initialized) return;
  if (!hasAnalyticsConsent()) return;

  pushGtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !initialized) return;
  if (!hasAnalyticsConsent()) return;

  pushGtag("event", name, params);
}

export function updateConsent() {
  if (!initialized) {
    initGA();
  }
  updateConsentState();
  initGTM();
}
