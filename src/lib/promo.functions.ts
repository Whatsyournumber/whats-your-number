import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  code: z.string().trim().min(1).max(64),
  environment: z.enum(["sandbox", "live"]),
});

export type RedeemPromoResult = {
  ok: boolean;
  error?: string;
  product_id?: string;
  until?: string;
};

/** Canjea un código promocional. La verificación de sesión ocurre en el servidor. */
export const redeemPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }): Promise<RedeemPromoResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("redeem_promo_code", {
      _user_id: context.userId,
      _code: data.code,
      _environment: data.environment,
    });
    if (error) throw new Error(error.message);
    return (result ?? { ok: false }) as RedeemPromoResult;
  });

export type DiscountLookup = {
  ok: boolean;
  code?: string;
  label?: string;
  type?: string;
  amount?: string;
};

/** Comprueba si el código es un descuento de Paddle (ej. 30% off) aplicable en el checkout. */
export const lookupDiscountCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<DiscountLookup> => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const code = data.code.trim().toUpperCase();
    const res = await gatewayFetch(
      data.environment,
      `/discounts?code=${encodeURIComponent(code)}&status=active`,
    );
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as {
      data?: Array<{ code?: string; type?: string; amount?: string; currency_code?: string | null }>;
    };
    const hit = json.data?.find((d) => (d.code ?? "").toUpperCase() === code);
    if (!hit) return { ok: false };
    const label =
      hit.type === "percentage"
        ? `${Number(hit.amount ?? 0)}%`
        : `${(Number(hit.amount ?? 0) / 100).toFixed(2)} ${(hit.currency_code ?? "").toUpperCase()}`.trim();
    return { ok: true, code, label, type: hit.type ?? "", amount: hit.amount ?? "" };
  });
