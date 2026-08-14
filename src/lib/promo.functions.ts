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
