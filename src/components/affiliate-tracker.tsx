import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/hooks/use-auth";
import { clearPendingRef, getPendingRef, setPendingRef } from "@/lib/pending-ref";
import { attachAffiliateReferral, trackAffiliateClick } from "@/utils/affiliates.functions";
import { getPaddleEnvironment } from "@/lib/paddle";


/** Captura ?ref= del enlace de afiliado y lo vincula al usuario cuando hay sesión. */
export function AffiliateTracker() {
  const { user } = useAuth();
  const location = useRouterState({ select: (r) => r.location });
  const clicked = useRef(false);
  const attached = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || clicked.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;
    clicked.current = true;
    setPendingRef(code);
    void trackAffiliateClick({
      data: { code, path: location.pathname, referrer: document.referrer || "" },
    }).catch(() => undefined);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || attached.current) return;
    const code = getPendingRef();
    if (!code) return;
    attached.current = true;
    void attachAffiliateReferral({ data: { code, environment: getPaddleEnvironment() } })
      .catch(() => undefined)
      .finally(() => clearPendingRef());
  }, [user]);

  return null;
}
