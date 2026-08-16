import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type BuddyInput = {
  name: string;
  age: number;
  currency: string;
  lang: "es" | "en";
  today: number;
  future: number;
  targetAge: number;
  monthly: number;
  pace: number;
  pockets: { label: string; amount: number }[];
  dream: { title: string; saved: number; price: number } | null;
};

export const buddyTipSchema = z.object({
  /** Saludo corto y alegre para el niño */
  headline: z.string(),
  /** Observación de UN número concreto, frase corta */
  insight: z.string(),
  /** Consejo accionable y simple, empieza con verbo */
  tip: z.string(),
});

export type BuddyTip = z.infer<typeof buddyTipSchema>;

export async function generateBuddyTip(input: BuddyInput): Promise<BuddyTip> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const system =
    input.lang === "es"
      ? `Eres Buddy, un robot amigable que enseña dinero a niños de 6 a 14 años. Responde SIEMPRE en español.
Reglas: usa palabras simples y cálidas, tutea al niño, máximo 8 palabras por frase, incluye 1 emoji como mucho en el headline.
"insight": menciona UN número real del contexto (con su moneda). "tip": una acción concreta que el niño puede hacer esta semana. Nunca inventes datos ni hables de inversión compleja.`
      : `You are Buddy, a friendly robot teaching money to kids aged 6-14. ALWAYS answer in English.
Rules: simple warm words, max 8 words per sentence, at most 1 emoji in the headline.
"insight": mention ONE real number from the context (with currency). "tip": one concrete action for this week. Never invent data.`;

  const prompt = `Niño: ${input.name}, ${input.age} años. Moneda: ${input.currency}
Dinero hoy: ${input.today.toFixed(0)}
Proyección a los ${input.targetAge}: ${input.future.toFixed(0)}
Ahorro mensual: ${input.monthly.toFixed(0)} (ritmo real reciente: ${input.pace.toFixed(0)})
Bolsillos: ${input.pockets.map((p) => `${p.label} ${p.amount.toFixed(0)}`).join(", ") || "sin datos"}
Sueño actual: ${
    input.dream
      ? `${input.dream.title}, lleva ${input.dream.saved.toFixed(0)} de ${input.dream.price.toFixed(0)}`
      : "ninguno"
  }`;

  const result = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system,
    prompt,
    output: Output.object({ schema: buddyTipSchema }),
  });

  return result.output;
}
