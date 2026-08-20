import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { tierForCountry, type PricingTier } from "@/lib/pricing-tiers";

const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-geo-country",
  "fastly-client-country",
];

/**
 * País del visitante a partir de la IP (headers del edge).
 * Solo se usa para mostrar el precio inicial: el precio final lo valida
 * el checkout con el país de facturación.
 */
export const getVisitorPricingTier = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ country: string | null; tier: PricingTier }> => {
    const request = getRequest();
    let country: string | null = null;
    for (const header of COUNTRY_HEADERS) {
      const value = request?.headers.get(header);
      if (value && value.length === 2 && value.toUpperCase() !== "XX") {
        country = value.toUpperCase();
        break;
      }
    }
    return { country, tier: tierForCountry(country) };
  },
);
