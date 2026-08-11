import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { getPaddleEnvironment } from "@/lib/paddle";
import { clearPendingPromoCode, getPendingPromoCode } from "@/lib/pending-promo";

type RedeemResult = { ok: boolean; error?: string; until?: string };

/** Canjea el código guardado en el registro apenas hay sesión (sin pedir tarjeta). */
export function PromoAutoRedeem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const t = useT();
  const done = useRef(false);

  useEffect(() => {
    if (!user || done.current) return;
    const code = getPendingPromoCode();
    if (!code) return;
    done.current = true;

    void (async () => {
      try {
        const { data, error } = await supabase.rpc("redeem_promo_code", {
          _code: code,
          _environment: getPaddleEnvironment(),
        });
        if (error) throw error;
        const result = data as unknown as RedeemResult;
        clearPendingPromoCode();
        if (result?.ok) {
          toast.success(t("¡Código activado! Ya tienes acceso Pro.", "Code activated! You now have Pro access."));
          await qc.invalidateQueries();
        }
      } catch {
        clearPendingPromoCode();
      }
    })();
  }, [user, qc, t]);

  return null;
}
