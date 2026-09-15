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
  merchants: {
    name: string;
    amount: number;
    count: number;
    category?: string | undefined;
    prevAmount?: number | undefined;
  }[];
  /** Plan de gasto por categoría definido por el usuario. */
  budgets?: { name: string; planned: number; actual: number }[];
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
    .min(4)
    .max(4),
});

export type SpendAdvice = z.infer<typeof adviceSchema>;

const SYSTEM = `Eres un asesor financiero personal directo y práctico. Respondes SIEMPRE en español.
Devuelve SIEMPRE exactamente 4 acciones: UNA por categoría, sin repetir categoría.
CON PLAN: las 4 categorías donde MÁS se excedió el plan (mayor exceso primero); si hay menos de 4 excedidas, completa con las categorías de mayor gasto real restantes.
SIN PLAN: las 4 categorías de mayor gasto del contexto.
Reglas:
- "label": el rubro o comercio real del contexto (máx. 3 palabras).
- "diagnosis": UNA frase de máximo 14 palabras que mencione el periodo analizado, el monto y el % vs. periodo anterior o vs. objetivo.
- "action": empieza con un verbo en imperativo, máximo 12 palabras, concreta y medible.
- "monthlySaving": número realista en la moneda dada, sin símbolos ni texto.
- "overspent": true si ese rubro subió vs. el periodo anterior o rompe el objetivo.
- Si hay un "Plan de gasto por categoría", las categorías EXCEDIDAS van primero, ordenadas por cuánto se pasaron (mayor exceso primero), y "diagnosis" debe decir real vs. plan y el exceso (ej. "1.596 vs. 500 de plan, +219%").
- La primera acción SIEMPRE debe ser la categoría donde más se excedió el plan, si existe plan.
- CON PLAN: toda recomendación debe apoyarse en el plan del usuario. "action" debe citar el monto del plan como límite ("hasta X de plan"), y "monthlySaving" NUNCA puede superar el exceso (real − plan) de esa categoría, ni inventar recortes imposibles. Ignora categorías dentro de plan salvo que falten excedidas.
- SIN PLAN: usa los datos reales y, además, la ÚLTIMA acción debe ser "label": "Plan de gastos", invitando a definir un plan personalizado con topes concretos para sus 2-3 categorías mayores (menciona los montos reales); "monthlySaving" conservador (≈10% de esas categorías) y "overspent": false.
- SÉ CONCRETO: siempre que puedas, nombra el comercio real que causa el exceso dentro de esa categoría y el monto exacto (ej. "Transporte: plan 200, real 443; Uber subió 300 más que el periodo anterior"). Usa los comercios del contexto que pertenecen a esa categoría.
- RECOMIENDA CON INTELIGENCIA, no solo "gasta menos": primero propón cómo pagar menos por lo MISMO antes de recortar el consumo. Ejemplos según el rubro: trenes/vuelos (IRYO, Renfe, aerolíneas) → "Compra los pasajes con 2-4 semanas de antelación, salen hasta X más baratos"; hoteles/viajes → reserva con antelación o compara fechas; delivery → pide directo al restaurante o recoge tú mismo; supermercado → marca blanca o compras semanales planificadas; suscripciones → plan anual o familiar; seguros → compara ofertas anuales; gasolina → estaciones low-cost. Elige el truco que aplique al comercio real del contexto y estima el ahorro en "monthlySaving".
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
    .map((m) => {
      const diff = m.prevAmount !== undefined ? m.amount - m.prevAmount : null;
      const delta =
        diff === null
          ? ""
          : diff > 0
            ? ` · ${diff.toFixed(0)} más que el periodo anterior`
            : ` · ${Math.abs(diff).toFixed(0)} menos que el periodo anterior`;
      return `- ${m.name}${m.category ? ` [categoría: ${m.category}]` : ""}: ${m.amount.toFixed(0)} ${input.currency} en ${m.count} compras${delta}`;
    })
    .join("\n");

  const overBudget = (input.budgets ?? [])
    .filter((b) => b.planned > 0 && b.actual > b.planned)
    .sort((a, b) => (b.actual - b.planned) - (a.actual - a.planned))[0];

  const prompt = `Moneda: ${input.currency}
Periodo analizado: ${input.periodLabel}
Gasto variable del periodo: ${input.total.toFixed(0)} (periodo anterior: ${input.prevTotal.toFixed(0)})
Gastos fijos mensuales: ${input.fixedTotal.toFixed(0)}
Ritmo mensual estimado: ${input.monthlyRun.toFixed(0)}
Objetivo mensual de gasto: ${input.target.toFixed(0)}

Gasto por categoría:
${cats || "- sin datos"}

Top comercios:
${merch || "- sin datos"}

Plan de gasto por categoría (plan vs. real mensual):
${
  input.budgets && input.budgets.length
    ? [...input.budgets]
        .sort((a, b) => (b.actual - b.planned) - (a.actual - a.planned))
        .map(
          (b) =>
            `- ${b.name}: plan ${b.planned.toFixed(0)} · real ${b.actual.toFixed(0)}${
              b.planned > 0 && b.actual > b.planned
                ? ` (EXCEDIDO en ${(b.actual - b.planned).toFixed(0)}, +${Math.round(((b.actual - b.planned) / b.planned) * 100)}%)`
                : ""
            }`,
        )
        .join("\n")
    : "- (el usuario no definió plan)"
}${
    overBudget
      ? `\n\nCategoría donde MÁS se excedió el plan: ${overBudget.name} (real ${overBudget.actual.toFixed(0)} vs. plan ${overBudget.planned.toFixed(0)}). Debe ser la primera acción.`
      : ""
  }`;

  const result = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system: SYSTEM,
    prompt,
    output: Output.object({ schema: adviceSchema }),
  });

  return result.output;
}
