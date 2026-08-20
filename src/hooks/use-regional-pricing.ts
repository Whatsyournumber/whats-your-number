import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getVisitorPricingTier } from "@/lib/geo-pricing.functions";
import { TIER_PRICES, tierForCountry, type PricingTier } from "@/lib/pricing-tiers";

/** Heurística local mientras llega la respuesta del servidor. */
function fallbackTier(): PricingTier {
  if (typeof window === "undefined") return "standard";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Toronto|Vancouver|Edmonton|Winnipeg|Halifax)/.test(tz))
      return "premium";
    if (/^(Australia|Pacific\/Auckland)/.test(tz)) return "premium";
    if (/^Europe\/(Zurich|Oslo|Stockholm|Copenhagen|Helsinki|Reykjavik)/.test(tz)) return "premium";
    if (/^(Africa|America)\//.test(tz)) return "accessible";
    if (/^Europe\/(Madrid|Lisbon|Rome|Athens|Warsaw|Prague|Budapest|Bucharest|Sofia|Zagreb|Ljubljana|Tallinn|Riga|Vilnius|Bratislava|Malta|Nicosia|Kiev|Kyiv|Belgrade|Sarajevo|Skopje|Tirane|Podgorica|Chisinau)/.test(tz))
      return "accessible";
    if (/^Asia\/(Kolkata|Calcutta|Jakarta|Manila|Ho_Chi_Minh|Bangkok|Kuala_Lumpur|Dhaka|Karachi|Colombo|Kathmandu|Phnom_Penh|Vientiane|Yangon|Ulaanbaatar|Tashkent|Almaty|Bishkek|Dushanbe|Istanbul|Amman|Beirut|Baghdad|Tbilisi|Yerevan|Baku)/.test(tz))
      return "accessible";
  } catch {
    /* noop */
  }
  return "standard";
}

export function useRegionalPricing() {
  const query = useQuery({
    queryKey: ["visitor-pricing-tier"],
    queryFn: () => getVisitorPricingTier(),
    staleTime: 30 * 60_000,
    retry: 1,
  });

  // El primer render del cliente debe coincidir con el HTML del servidor:
  // solo aplicamos la heurística local después de hidratar.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const tier: PricingTier = query.data?.tier ?? (hydrated ? fallbackTier() : "standard");

  return {
    tier,
    country: query.data?.country ?? null,
    prices: TIER_PRICES[tier],
    loading: query.isLoading,
  };
}

export { tierForCountry };
