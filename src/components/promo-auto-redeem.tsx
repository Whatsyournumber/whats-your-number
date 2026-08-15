import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { getPaddleEnvironment } from "@/lib/paddle";
import { clearPendingPromoCode, getPendingPromoCode } from "@/lib/pending-promo";
import { setPendingDiscount } from "@/lib/pending-discount";
import { lookupDiscountCode, redeemPromoCode } from "@/lib/promo.functions";

type RedeemResult = { ok: boolean; error?: string; until?: string };
type LookupResult = { ok: boolean; code?: string; label?: string };

/**
 * Procesa el código introducido en el registro apenas hay sesión.
 * 1) Si es un descuento de Paddle (ej. 30%), lleva al usuario a /precios con
 *    el descuento guardado para aplicarlo en el checkout.
 * 2) Si no, se canjea como código de invitación (acceso Pro sin tarjeta).
 */
export function PromoAutoRedeem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const t = useT();
  const done = useRef(false);

  useEffect(() => {
    if (!user || done.current) return;
    const code = getPendingPromoCode();
    if (!code) return;
    done.current = true;

    void (async () => {
      const environment = getPaddleEnvironment();
      try {
        const discount = (await lookupDiscountCode({ data: { code, environment } })) as LookupResult;
        if (discount?.ok && discount.code) {
          setPendingDiscount({ code: discount.code, label: discount.label ?? "" });
          clearPendingPromoCode();
          toast.success(
            t(
              `Descuento ${discount.label} aplicado. Elige tu plan para completar el pago.`,
              `${discount.label} discount applied. Pick your plan to complete payment.`,
            ),
          );
          navigate({ to: "/precios" });
          return;
        }
      } catch {
        // Si la validación falla seguimos con el canje clásico.
      }

      try {
        const result = (await redeemPromoCode({ data: { code, environment } })) as RedeemResult;
        clearPendingPromoCode();
        if (result?.ok) {
          toast.success(t("¡Código activado! Ya tienes acceso Pro.", "Code activated! You now have Pro access."));
          await qc.invalidateQueries();
        }
      } catch {
        clearPendingPromoCode();
      }
    })();
  }, [user, qc, t, navigate]);

  return null;
}
