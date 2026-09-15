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
  categories: { name: string; amount: number; prevAmount: number; count?: number | undefined }[];
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
- CON PLAN: toda recomendación debe apoyarse en el plan del usuario. "action" debe citar el monto del plan como límite ("hasta X de plan"), y "monthlySaving" NUNCA puede superar el exceso (real − plan) de esa categoría, ni inventar recortes imposibles.
- SÉ CONCRETO: siempre que puedas, nombra el comercio real que causa el exceso dentro de esa categoría y el monto exacto (ej. "Transporte: plan 200, real 443; Uber subió 300 más que el periodo anterior"). Usa los comercios del contexto que pertenecen a esa categoría.
- USA LA FRECUENCIA: cuando el contexto trae número de compras, calcula cuántas veces gastó y el ticket promedio (monto ÷ compras) y construye la acción con esos números: "Saliste 20 veces a comer (80 de media); baja a 10 salidas y cumples tu plan de 500". Di siempre cuántas veces y el promedio, y cuántas veces debería hacerlo para ajustarse al plan (veces objetivo = plan ÷ ticket promedio, redondeado hacia abajo).
- RECOMIENDA CON INTELIGENCIA, no solo "gasta menos": primero propón cómo pagar menos por lo MISMO antes de recortar el consumo. Ejemplos según el rubro: trenes/vuelos (IRYO, Renfe, aerolíneas) → "Compra los pasajes con 2-4 semanas de antelación, salen hasta X más baratos"; hoteles/viajes → reserva con antelación o compara fechas; delivery → pide directo al restaurante o recoge tú mismo; supermercado → marca blanca o compras semanales planificadas; suscripciones → plan anual o familiar; seguros → compara ofertas anuales; gasolina → estaciones low-cost. Elige el truco que aplique al comercio real del contexto y estima el ahorro en "monthlySaving".
No inventes datos: usa solo categorías y comercios del contexto.`;

function smartTip(category: string, merchant?: string): string {
  const name = merchant || category;
  const lower = category.toLowerCase();
  if (lower.includes("tren") || lower.includes("transport") || lower.includes("viaje") || lower.includes("vuelo")) {
    return `Compra los pasajes de ${name} con 2-4 semanas de antelación para encontrar mejores precios`;
  }
  if (lower.includes("restaurant") || lower.includes("comida") || lower.includes("delivery")) {
    return `Cocina una o dos comidas más en casa y reduce pedidos a ${name}`;
  }
  if (lower.includes("app") || lower.includes("suscrip") || lower.includes("software")) {
    return `Revisa suscripciones de ${name} y cancela las que no uses o baja a plan anual`;
  }
  if (lower.includes("super") || lower.includes("grocer")) {
    return `Planifica la compra semanal en ${name} y apuesta por marca blanca`;
  }
  if (lower.includes("gasolin") || lower.includes("combustible")) {
    return `Usa apps de comparación para repostar en ${name} a mejor precio`;
  }
  if (lower.includes("seguro")) {
    return `Compara ofertas anuales de ${name} y negocia la prima`;
  }
  if (lower.includes("compra") || lower.includes("shopping") || lower.includes("ropa")) {
    return `Espera 48 horas antes de comprar en ${name} y busca cupones`;
  }
  if (lower.includes("ocio") || lower.includes("nightlife") || lower.includes("entreten")) {
    return `Busca días con descuento o happy hour en ${name}`;
  }
  return `Revisa los gastos recurrentes en ${name} y elimina los que no aporten valor`;
}

function buildFallbackActions(input: AdviceInput, existing: SpendAdvice["actions"], needed: number): SpendAdvice["actions"] {
  const used = new Set(existing.map((a) => a.label.toLowerCase()));
  const out: SpendAdvice["actions"] = [...existing];

  // 1) Categorías excedidas del plan (mayor exceso primero)
  const overBudgets = [...(input.budgets ?? [])]
    .filter((b) => b.planned > 0 && b.actual > b.planned)
    .sort((a, b) => b.actual - b.planned - (a.actual - a.planned));

  for (const b of overBudgets) {
    if (out.length >= needed) break;
    const key = b.name.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const excess = b.actual - b.planned;
    const merchant = input.merchants.find((m) =>
      m.category?.toLowerCase() === key || m.name.toLowerCase().includes(key),
    );
    out.push({
      label: b.name,
      diagnosis: `${input.periodLabel}: gastaste ${b.actual.toFixed(0)} vs. ${b.planned.toFixed(0)} de plan, un exceso de +${Math.round((excess / b.planned) * 100)}%.`,
      action: smartTip(b.name, merchant?.name),
      monthlySaving: Math.min(excess, Math.round(excess * 0.5)),
      overspent: true,
    });
  }

  // 2) Categorías de mayor gasto real
  const topCats = [...input.categories].sort((a, b) => b.amount - a.amount);
  for (const c of topCats) {
    if (out.length >= needed) break;
    const key = c.name.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const merchant = input.merchants.find((m) =>
      m.category?.toLowerCase() === key || m.name.toLowerCase().includes(key),
    );
    const diff = c.amount - c.prevAmount;
    const pct = c.prevAmount > 0 ? Math.round((diff / c.prevAmount) * 100) : 0;
    out.push({
      label: c.name,
      diagnosis:
        diff > 0 && c.prevAmount > 0
          ? `${input.periodLabel}: gastaste ${c.amount.toFixed(0)} en ${c.name}, un ${pct}% más que el periodo anterior.`
          : `${input.periodLabel}: gastaste ${c.amount.toFixed(0)} en ${c.name}.`,
      action: smartTip(c.name, merchant?.name),
      monthlySaving: Math.max(10, Math.round(c.amount * 0.15)),
      overspent: diff > 0,
    });
  }

  // 3) Comercios concretos de mayor gasto
  const topMerchants = [...input.merchants].sort((a, b) => b.amount - a.amount);
  for (const m of topMerchants) {
    if (out.length >= needed) break;
    const key = m.name.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const diff = m.prevAmount !== undefined ? m.amount - m.prevAmount : 0;
    out.push({
      label: m.name,
      diagnosis:
        diff > 0
          ? `${input.periodLabel}: gastaste ${m.amount.toFixed(0)} en ${m.name}, ${diff.toFixed(0)} más que el periodo anterior.`
          : `${input.periodLabel}: gastaste ${m.amount.toFixed(0)} en ${m.name}.`,
      action: smartTip(m.category || m.name, m.name),
      monthlySaving: Math.max(10, Math.round(m.amount * 0.12)),
      overspent: diff > 0,
    });
  }

  // 4) Último recurso: boxes genéricos de ahorro
  const generics = [
    "Revisa suscripciones automáticas",
    "Compara seguros anuales",
    "Planifica las compras del mes",
    "Usa transporte público o compartido",
  ];
  let i = 0;
  while (out.length < needed && i < generics.length) {
    const label = generics[i]!;
    if (!used.has(label.toLowerCase())) {
      used.add(label.toLowerCase());
      out.push({
        label,
        diagnosis: `${input.periodLabel}: aún no hay un rubro concreto analizado aquí.`,
        action: label,
        monthlySaving: Math.max(10, Math.round(input.total * 0.02)),
        overspent: false,
      });
    }
    i++;
  }

  return out.slice(0, needed);
}

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

  // Forzamos siempre 4 boxes, completando con datos reales si la IA devolviera menos.
  const actions = result.output.actions ?? [];
  const padded = buildFallbackActions(input, actions, 4);
  return { actions: padded };
}
