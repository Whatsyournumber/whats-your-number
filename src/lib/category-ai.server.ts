import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type CategoryAiInput = {
  /** Lo que escribió el usuario, en lenguaje natural. */
  message: string;
  /** Idioma de la interfaz: "es" | "en". */
  lang: string;
  /** Categorías existentes (base + propias). */
  categories: string[];
  /** Reglas propias actuales: nombre -> palabras clave. */
  customRules: { name: string; keywords: string[] }[];
  /** Comercios del periodo con su categoría actual, para dar contexto real. */
  merchants: { name: string; category: string; amount: number }[];
};

export const categoryPlanSchema = z.object({
  /** Respuesta conversacional corta para el usuario. */
  reply: z.string(),
  ops: z
    .array(
      z.object({
        /** create: crea la categoría; assign: manda comercios a una categoría; remove: elimina una categoría propia. */
        type: z.enum(["create", "assign", "remove"]),
        /** Nombre de la categoría destino. */
        category: z.string(),
        /** Palabras clave / comercios en minúsculas que van a esa categoría. */
        keywords: z.array(z.string()),
        /** Explicación de una línea de lo que hace esta operación. */
        note: z.string(),
      }),
    )
    .max(8),
});

export type CategoryPlan = z.infer<typeof categoryPlanSchema>;

const SYSTEM = `Eres el asistente de categorización de gastos de WhatsYourNumber.
El usuario te habla en lenguaje natural (como en un chat) para ordenar sus categorías de gasto.
Traduces su intención a operaciones sobre reglas de categorización basadas en palabras clave.

Reglas:
- "type": "create" para una categoría nueva, "assign" para mandar comercios/palabras a una categoría existente, "remove" para borrar una categoría propia.
- "category": usa EXACTAMENTE el nombre de una categoría existente cuando aplique; si el usuario pide una nueva, elige un nombre corto y claro.
- "keywords": fragmentos en minúscula, sin tildes innecesarias, que aparezcan en el nombre del comercio (ej. "fandango", "glovo"). Nunca frases largas.
- Usa solo comercios que aparezcan en el contexto cuando el usuario diga "los de X" o "los que veo en Otros".
- Si la petición es ambigua o no implica cambios, devuelve ops vacío y pide la aclaración en "reply".
- "reply": máximo 2 frases, tono directo y humano, en el idioma indicado.
No inventes montos ni comercios que no estén en el contexto.`;

export async function planCategoryChanges(input: CategoryAiInput): Promise<CategoryPlan> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const custom = input.customRules.length
    ? input.customRules.map((r) => `- ${r.name}: ${r.keywords.join(", ") || "(sin palabras clave)"}`).join("\n")
    : "- (ninguna)";

  const merchants = input.merchants.length
    ? input.merchants
        .slice(0, 60)
        .map((m) => `- ${m.name} → ${m.category} (${m.amount.toFixed(0)})`)
        .join("\n")
    : "- (sin movimientos)";

  const prompt = `Idioma de respuesta: ${input.lang === "en" ? "inglés" : "español"}

Categorías disponibles:
${input.categories.join(", ")}

Reglas propias actuales:
${custom}

Comercios del periodo y su categoría actual:
${merchants}

Petición del usuario:
"""${input.message}"""`;

  const result = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system: SYSTEM,
    prompt,
    output: Output.object({ schema: categoryPlanSchema }),
  });

  return result.output;
}
