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
  /** Análisis anteriores guardados de este usuario (más reciente primero). */
  history?: {
    periodLabel: string;
    total: number;
    target: number;
    createdAt: string;
    snapshot?: unknown;
    actions?: { label?: string; action?: string; monthlySaving?: number }[];
  }[];
  /** Cómo valoró el usuario recomendaciones anteriores. */
  feedback?: { label: string; action: string; verdict: "useful" | "not_useful" | "done" }[];
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
- MONTOS CON SÍMBOLO: cada cifra de dinero dentro de "diagnosis" y "action" lleva el símbolo de la moneda pegado al número (ej. "$23 media", "$1.050 de plan"). Nunca escribas un monto sin símbolo. "monthlySaving" sí va como número puro.
- USA LA FRECUENCIA: cuando el contexto trae número de compras, calcula cuántas veces gastó y el ticket promedio (monto ÷ compras) y construye la acción con esos números: "Saliste 20 veces a comer ($80 media); baja a 10 salidas y cumples tu plan de $500". Di siempre cuántas veces y el promedio con símbolo, y cuántas veces debería hacerlo para ajustarse al plan (veces objetivo = plan ÷ ticket promedio, redondeado hacia abajo).
- RECOMIENDA CON INTELIGENCIA, no solo "gasta menos": primero propón cómo pagar menos por lo MISMO antes de recortar el consumo.
- CADA CAJA CON SU PROPIA LÓGICA: nunca repitas el mismo tipo de consejo en dos cajas. Usa el manual del rubro:
  · Bancos, tarjetas y seguros → busca intereses, comisiones de mantenimiento, descubiertos y cuotas de tarjeta: si pagas la tarjeta completa a tiempo no deberías pagar intereses; negocia o cambia a una cuenta sin comisiones y revisa duplicidad de coberturas.
  · Trenes, vuelos y viajes → compra con 2-4 semanas de antelación, compara fechas y evita cambios de última hora.
  · Restaurantes y delivery → frecuencia y ticket medio: baja el número de salidas o pide directo al restaurante en vez de por app.
  · Supermercado → marca blanca, lista semanal y evitar compras de conveniencia.
  · Apps y suscripciones → cancela las que no usas, pasa a plan anual o familiar.
  · Transporte diario (Uber, taxi) → abono de transporte o combinar con transporte público en las horas caras.
  · Ocio, compras y ropa → regla de 48 horas, límite de salidas al mes, cupones y segunda mano.
  · Salud, educación, hijos → compara proveedores y aprovecha deducciones o pagos anuales, no recortes lo esencial.
  · Gasolina y coche → estaciones low-cost, mantenimiento preventivo y revisar seguros del vehículo.
  Elige el truco que aplique al comercio real del contexto y estima el ahorro en "monthlySaving".
- MEMORIA DEL USUARIO: si el contexto trae "Historial de análisis previos", personaliza. Haz seguimiento: reconoce si mejoró o empeoró en la categoría respecto a los análisis anteriores ("el mes pasado te dije X: bajaste/subiste Y"), no repitas la misma acción con las mismas palabras y sube el nivel de concreción cuando el rubro se repite.
- Si el usuario marcó una recomendación como "no aplica", NO vuelvas a proponer esa misma acción para ese rubro: propone un ángulo distinto.
- Si marcó una recomendación como "útil" o "ya la hice", da el siguiente paso de esa misma línea (subir el listón, automatizar el ahorro, invertir lo liberado).
No inventes datos: usa solo categorías y comercios del contexto.`;

/** Símbolo de la moneda para escribir montos como "$23 media". */
function currencySymbol(currency: string): string {
  const c = (currency || "USD").toUpperCase();
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  if (c === "USD" || c.endsWith("USD")) return "$";
  return "$";
}

function money(amount: number, currency: string): string {
  return `${currencySymbol(currency)}${Math.round(amount).toLocaleString("es-ES")}`;
}

/** Consejo propio de cada rubro: cada caja tiene su lógica de ayuda. */
function smartTip(category: string, merchant: string | undefined, ctx: { currency: string; avg?: number; count?: number }): string {
  const name = merchant || category;
  const lower = `${category} ${merchant ?? ""}`.toLowerCase();
  const cur = ctx.currency;
  const avg = ctx.avg && ctx.avg > 0 ? money(ctx.avg, cur) : null;
  const freq = ctx.count && ctx.count > 1 ? `${ctx.count} pagos${avg ? ` (${avg} media)` : ""}` : null;

  if (lower.includes("banc") || lower.includes("tarjeta") || lower.includes("bank") || lower.includes("comisi") || lower.includes("interes") || lower.includes("crédit") || lower.includes("credit")) {
    return `Revisa intereses y comisiones de ${name}${freq ? `: ${freq}` : ""}; paga la tarjeta completa a tiempo y pide cuenta sin mantenimiento`;
  }
  if (lower.includes("seguro") || lower.includes("insur")) {
    return `Compara la prima anual de ${name} y elimina coberturas duplicadas antes de renovar`;
  }
  if (lower.includes("deuda") || lower.includes("préstam") || lower.includes("prestam") || lower.includes("loan")) {
    return `Amortiza primero la deuda de ${name} con el interés más alto y evita refinanciar a más plazo`;
  }
  if (lower.includes("tren") || lower.includes("viaje") || lower.includes("vuelo") || lower.includes("flight") || lower.includes("hotel")) {
    return `Compra los pasajes de ${name} con 2-4 semanas de antelación${avg ? `; hoy pagas ${avg} de media` : ""}`;
  }
  if (lower.includes("transport") || lower.includes("uber") || lower.includes("taxi") || lower.includes("cabify")) {
    return `Cambia ${freq ? `${freq} en ` : ""}${name} por abono de transporte en los trayectos del día a día`;
  }
  if (lower.includes("delivery") || lower.includes("glovo") || lower.includes("ubereats") || lower.includes("just eat")) {
    return `Pide directo al restaurante o recoge tú mismo${freq ? `: ${freq} en ${name}` : ` en ${name}`}`;
  }
  if (lower.includes("restaurant") || lower.includes("comida") || lower.includes("food")) {
    return `Baja las salidas a ${name}${freq ? `: ${freq}` : ""} y reserva las comidas fuera para el fin de semana`;
  }
  if (lower.includes("app") || lower.includes("suscrip") || lower.includes("software") || lower.includes("stream")) {
    return `Cancela las suscripciones de ${name} que no usas y pasa el resto a plan anual o familiar`;
  }
  if (lower.includes("super") || lower.includes("grocer") || lower.includes("mercado")) {
    return `Haz una lista semanal en ${name} y cambia a marca blanca en básicos`;
  }
  if (lower.includes("gasolin") || lower.includes("combustible") || lower.includes("coche") || lower.includes("auto")) {
    return `Reposta en estaciones low-cost cerca de ${name} y agenda el mantenimiento preventivo`;
  }
  if (lower.includes("compra") || lower.includes("shopping") || lower.includes("ropa") || lower.includes("moda")) {
    return `Aplica la regla de 48 horas antes de comprar en ${name} y busca cupones o segunda mano`;
  }
  if (lower.includes("ocio") || lower.includes("nightlife") || lower.includes("entreten")) {
    return `Fija un tope de salidas al mes en ${name} y busca días con descuento`;
  }
  if (lower.includes("gimnas") || lower.includes("gym") || lower.includes("cuidado") || lower.includes("belle")) {
    return `Pasa ${name} a cuota anual o bono de sesiones y cancela lo que no uses`;
  }
  if (lower.includes("salud") || lower.includes("educa") || lower.includes("hijo") || lower.includes("colegi")) {
    return `Compara proveedores de ${name} y paga por año para aprovechar descuentos, sin recortar lo esencial`;
  }
  if (lower.includes("servici") || lower.includes("luz") || lower.includes("agua") || lower.includes("internet") || lower.includes("telefon")) {
    return `Renegocia la tarifa de ${name} o cambia de compañía: la permanencia suele estar vencida`;
  }
  if (lower.includes("vivienda") || lower.includes("alquil") || lower.includes("hipotec")) {
    return `Revisa las condiciones de ${name}: renegocia el diferencial o compara la hipoteca con otra entidad`;
  }
  return `Revisa los pagos recurrentes de ${name}${freq ? ` (${freq})` : ""} y elimina los que no aporten valor`;
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
      diagnosis: `${input.periodLabel}: gastaste ${money(b.actual, input.currency)} vs. ${money(b.planned, input.currency)} de plan, un exceso de +${Math.round((excess / b.planned) * 100)}%.`,
      action: smartTip(b.name, merchant?.name, {
        currency: input.currency,
        ...(merchant?.count ? { count: merchant.count, avg: merchant.amount / merchant.count } : {}),
      }),
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
          ? `${input.periodLabel}: gastaste ${money(c.amount, input.currency)} en ${c.name}${c.count ? ` en ${c.count} pagos (${money(c.amount / c.count, input.currency)} media)` : ""}, un ${pct}% más que el periodo anterior.`
          : `${input.periodLabel}: gastaste ${money(c.amount, input.currency)} en ${c.name}${c.count ? ` en ${c.count} pagos (${money(c.amount / c.count, input.currency)} media)` : ""}.`,
      action: smartTip(c.name, merchant?.name, {
        currency: input.currency,
        ...(c.count ? { count: c.count, avg: c.amount / c.count } : {}),
      }),
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
          ? `${input.periodLabel}: gastaste ${money(m.amount, input.currency)} en ${m.name}${m.count ? ` en ${m.count} pagos (${money(m.amount / m.count, input.currency)} media)` : ""}, ${money(diff, input.currency)} más que el periodo anterior.`
          : `${input.periodLabel}: gastaste ${money(m.amount, input.currency)} en ${m.name}${m.count ? ` en ${m.count} pagos (${money(m.amount / m.count, input.currency)} media)` : ""}.`,
      action: smartTip(m.category || m.name, m.name, {
        currency: input.currency,
        ...(m.count ? { count: m.count, avg: m.amount / m.count } : {}),
      }),
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
    .map((c) => {
      const freq =
        c.count && c.count > 0
          ? ` · ${c.count} compras · ticket promedio ${money(c.amount / c.count, input.currency)}`
          : "";
      return `- ${c.name}: ${c.amount.toFixed(0)} ${input.currency} (periodo anterior ${c.prevAmount.toFixed(0)})${freq}`;
    })
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

  // --- Memoria del usuario: análisis previos y feedback ---
  const history = (input.history ?? []).slice(0, 5);
  const feedback = input.feedback ?? [];
  const rejected = feedback.filter((f) => f.verdict === "not_useful");
  const accepted = feedback.filter((f) => f.verdict === "useful" || f.verdict === "done");
  const repeated = new Map<string, number>();
  for (const h of history) for (const a of h.actions ?? []) {
    const key = (a.label ?? "").trim();
    if (key) repeated.set(key, (repeated.get(key) ?? 0) + 1);
  }
  const recurring = [...repeated.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);

  const memoryBlock = history.length || feedback.length
    ? `

Historial de análisis previos de este usuario (más reciente primero):
${
        history
          .map(
            (h) =>
              `- ${h.periodLabel}: gasto ${h.total.toFixed(0)} vs. objetivo ${h.target.toFixed(0)} · te recomendé: ${
                (h.actions ?? [])
                  .map((a) => `${a.label ?? ""} (${a.action ?? ""})`)
                  .filter((s) => s.trim() !== " ()")
                  .join("; ") || "sin datos"
              }`,
          )
          .join("\n") || "- sin análisis previos"
      }
${
        recurring.length
          ? `\nRubros que se repiten en tus análisis (${recurring.map(([k, n]) => `${k} x${n}`).join(", ")}): ya se lo dijiste antes, sé más específico y exige un paso concreto.`
          : ""
      }${
        rejected.length
          ? `\nRecomendaciones que el usuario marcó como "no aplica" (NO repetirlas): ${rejected.map((f) => `${f.label}: ${f.action}`).join(" | ")}`
          : ""
      }${
        accepted.length
          ? `\nRecomendaciones que el usuario marcó como útiles o ya hechas (da el siguiente paso): ${accepted.map((f) => `${f.label}: ${f.action}`).join(" | ")}`
          : ""
      }`
    : "";

  const prompt = `Moneda: ${input.currency} (escribe cada monto con el símbolo "${currencySymbol(input.currency)}" pegado al número, ej. "${currencySymbol(input.currency)}23 media")
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
  }${memoryBlock}`;

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
