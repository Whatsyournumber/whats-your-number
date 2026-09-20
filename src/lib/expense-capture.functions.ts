import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  kind: z.enum(["voice", "receipt"]),
  data: z.string().min(16),
  mimeType: z.string().default(""),
  categories: z.array(z.string()).default([]),
  currency: z.string().default("EUR"),
  today: z.string(),
  lang: z.enum(["es", "en"]).default("es"),
});


/** Convierte una nota de voz o la foto de un recibo en un gasto listo para guardar. */
export const captureExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Falta la configuración de IA.");
    const categories = data.categories.length ? data.categories : ["Otros"];
    const mod = await import("./expense-capture.server");

    if (data.kind === "voice") {
      const transcript = await mod.transcribeExpenseAudio(apiKey, data.data, data.mimeType);
      if (!transcript) throw new Error("No escuchamos nada. Vuelve a grabar acercándote al micrófono.");
      const expense = await mod.parseExpenseFromText(
        apiKey,
        transcript,
        categories,
        data.currency,
        data.today,
      );
      return { ...expense, items: [] as { name: string; amount: number; category: string }[], transcript };
    }

    const expense = await mod.parseExpenseFromReceipt(
      apiKey,
      data.data,
      data.mimeType,
      categories,
      data.currency,
      data.today,
    );
    return { ...expense, items: expense.items ?? [], transcript: "" };
  });
