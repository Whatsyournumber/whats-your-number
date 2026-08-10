import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type AdviceInput = {
  currency: string;
  periodLabel: string;
  total: number;
  prevTotal: number;
  fixedTotal: number;
  target: number;
  monthlyRun: number;
  categories: { name: string; amount: number; prevAmount: number }[];
  merchants: { name: string; amount: number; count: number }[];
};

export const adviceSchema = z.object({
  actions: z
    .array(
      z.object({
        /** Rubro o comercio concreto */
        label: z.string(),
        /** Qué está pasando, una sola frase corta con el dato */
        diagnosis: z.string(),
        /** Acción concreta, empieza con verbo, máximo 12 palabras */
        action: z.string(),
        /** Ahorro mensual estimado en la moneda del usuario */
        monthlySaving: z.number(),
        /** true si es un rubro donde te excediste vs. el periodo anterior o vs. el objetivo */
        overspent: z.boolean(),
      }),
    )
    .min(3)
    .max(4),
});

export type SpendAdvice = z.infer<typeof adviceSchema>;

const SYSTEM = `Eres un asesor financiero personal directo y práctico. Respondes SIEMPRE en español.
Devuelve 4 acciones (3 si no hay datos suficientes), ordenadas por ahorro mensual estimado de mayor a menor.
Reglas:
- "label": el rubro o comercio real del contexto (máx. 3 palabras).
- "diagnosis": UNA frase de máximo 14 palabras con el monto y el % vs. periodo anterior o vs. objetivo.
- "action": empieza con un verbo en imperativo, máximo 12 palabras, concreta y medible.
- "monthlySaving": número realista en la moneda dada, sin símbolos ni texto.
- "overspent": true si ese rubro subió vs. el periodo anterior o rompe el objetivo.
No inventes datos: usa solo categorías y comercios del contexto.`;

export async function generateSpendAdvice(input: AdviceInput): Promise<SpendAdvice> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const cats = input.categories
    .map(
      (c) =>
        `- ${c.name}: ${c.amount.toFixed(0)} ${input.currency} (periodo anterior ${c.prevAmount.toFixed(0)})`,
    )
    .join("\n");
  const merch = input.merchants
    .map((m) => `- ${m.name}: ${m.amount.toFixed(0)} ${input.currency} en ${m.count} compras`)
    .join("\n");

  const prompt = `Moneda: ${input.currency}
Periodo analizado: ${input.periodLabel}
Gasto variable del periodo: ${input.total.toFixed(0)} (periodo anterior: ${input.prevTotal.toFixed(0)})
Gastos fijos mensuales: ${input.fixedTotal.toFixed(0)}
Ritmo mensual estimado: ${input.monthlyRun.toFixed(0)}
Objetivo mensual de gasto: ${input.target.toFixed(0)}

Gasto por categoría:
${cats || "- sin datos"}

Top comercios:
${merch || "- sin datos"}`;

  const result = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system: SYSTEM,
    prompt,
    output: Output.object({ schema: adviceSchema }),
  });

  return result.output;
}
