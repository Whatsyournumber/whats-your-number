import { streamText } from "ai";

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

const SYSTEM = `Eres un asesor financiero personal, directo y práctico. Respondes SIEMPRE en español, en markdown breve.
Devuelve EXACTAMENTE las 4 recomendaciones más importantes, ordenadas por impacto de ahorro (mayor primero).
Formato exacto, sin introducción ni cierre:
### Las 4 acciones de mayor impacto
- **<Rubro o comercio>** — qué está pasando (monto y % vs. periodo anterior o vs. objetivo) → acción concreta. Ahorro estimado: <monto> <moneda>/mes
(repite hasta tener 4 bullets, ni uno más ni uno menos)
### Total alcanzable
- una sola frase: ahorro mensual sumado y si con eso cumples el objetivo de gasto
No inventes datos que no estén en el contexto. Usa categorías y comercios reales del contexto.`;

export async function generateSpendAdvice(input: AdviceInput): Promise<string> {
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

  const result = streamText({ model: gateway("google/gemini-3.6-flash"), system: SYSTEM, prompt });
  return await result.text;
}
