import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import { hasAnalyticsConsent, initGA, trackPageView, updateConsent } from "@/lib/analytics";

/** Inicializa GA4 y envía page_view en cada cambio de ruta si hay consentimiento de medición. */
export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const booted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || booted.current) return;
    booted.current = true;

    // Inicializa el script si ya hay consentimiento previo; si no, queda listo
    // para cuando el usuario decida desde el banner.
    if (hasAnalyticsConsent()) {
      initGA();
      trackPageView(window.location.pathname);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wyn.consent.v1") {
        updateConsent();
        if (hasAnalyticsConsent()) {
          trackPageView(window.location.pathname);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasAnalyticsConsent()) {
      initGA();
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
