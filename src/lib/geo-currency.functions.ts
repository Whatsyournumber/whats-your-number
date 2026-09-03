import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

/** Países de Europa (UE + EEE + Reino Unido + Suiza) → EUR. */
const EUROPE = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "CH", "GB", "AD", "MC", "SM", "VA", "GI", "AL", "BA",
  "ME", "MK", "RS", "XK", "MD", "UA",
]);

/** Detecta la moneda del visitante por IP (header del CDN): EUR en Europa, USD en el resto. */
export const detectRegionByIp = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const country = (
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country-code") ||
    ""
  ).toUpperCase();
  const currency = EUROPE.has(country) ? "EUR" : "USD";
  return { country, currency };
});
