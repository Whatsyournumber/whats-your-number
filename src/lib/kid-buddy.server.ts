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

const ANGLES_ES = [
  "Felicita un HITO logrado (dinero ahorrado, avance del sueño, constancia). Celebra con energía.",
  "Muestra que si ahorra un poco más al mes, llega MUCHO más rápido a su sueño. Usa los meses calculados.",
  "Explica que gastar un poquito menos en el bolsillo Gastar acelera su número. Da un ejemplo pequeño.",
  "Habla del poder del interés: su dinero crece solo con el tiempo. Usa la proyección.",
  "Anima con el siguiente mini-objetivo: cuánto le falta para el próximo escalón redondo.",
  "Reconoce su ritmo de ahorro reciente y propón mantenerlo una semana más.",
];

const ANGLES_EN = [
  "Celebrate a MILESTONE reached (money saved, dream progress, consistency). Be cheerful.",
  "Show that saving a bit more each month reaches the dream MUCH sooner. Use the computed months.",
  "Explain that spending a little less from the Spend pocket speeds up their number. Small example.",
  "Talk about the power of interest: money grows on its own over time. Use the projection.",
  "Encourage the next mini-goal: how much is missing for the next round step.",
  "Recognize their recent saving pace and suggest keeping it one more week.",
];

function facts(input: BuddyInput) {
  const pace = input.pace > 0 ? input.pace : input.monthly;
  const lines: string[] = [];
  if (input.dream) {
    const missing = Math.max(0, input.dream.price - input.dream.saved);
    const pct = input.dream.price > 0 ? Math.round((input.dream.saved / input.dream.price) * 100) : 0;
    lines.push(`Sueño avance: ${pct}% (faltan ${missing.toFixed(0)} ${input.currency})`);
    if (pace > 0) {
      const months = Math.ceil(missing / pace);
      const faster = Math.ceil(missing / (pace * 1.5));
      lines.push(
        `A su ritmo llega en ${months} meses; ahorrando 50% más llegaría en ${faster} meses (${months - faster} meses antes)`,
      );
    }
  }
  const spend = input.pockets.find((p) => /gast|spend/i.test(p.label));
  if (spend) lines.push(`Bolsillo Gastar: ${spend.amount.toFixed(0)} ${input.currency}`);
  const nextStep = Math.ceil((input.today + 1) / 50) * 50;
  lines.push(`Próximo escalón redondo: ${nextStep} ${input.currency} (faltan ${(nextStep - input.today).toFixed(0)})`);
  return lines.join("\n");
}

export async function generateBuddyTip(input: BuddyInput): Promise<BuddyTip> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const gateway = createLovableAiGatewayProvider(apiKey);
  const angles = input.lang === "es" ? ANGLES_ES : ANGLES_EN;
  const angle = angles[Math.floor(Math.random() * angles.length)];

  const system =
    input.lang === "es"
      ? `Eres Buddy, un robot amigable que enseña dinero a niños de 6 a 14 años. Responde SIEMPRE en español.
Reglas: usa palabras simples y cálidas, tutea al niño, máximo 8 palabras por frase, incluye 1 emoji como mucho en el headline.
"insight": menciona UN número real del contexto (con su moneda). "tip": una acción concreta que el niño puede hacer esta semana.
Nunca inventes datos ni hables de inversión compleja. Varía el mensaje cada vez, nunca repitas la misma frase.
ENFOQUE DE HOY: ${angle}`
      : `You are Buddy, a friendly robot teaching money to kids aged 6-14. ALWAYS answer in English.
Rules: simple warm words, max 8 words per sentence, at most 1 emoji in the headline.
"insight": mention ONE real number from the context (with currency). "tip": one concrete action for this week.
Never invent data. Vary the message every time, never repeat the same phrasing.
TODAY'S FOCUS: ${angle}`;

  const prompt = `Niño: ${input.name}, ${input.age} años. Moneda: ${input.currency}
Dinero hoy: ${input.today.toFixed(0)}
Proyección a los ${input.targetAge}: ${input.future.toFixed(0)}
Ahorro mensual: ${input.monthly.toFixed(0)} (ritmo real reciente: ${input.pace.toFixed(0)})
Bolsillos: ${input.pockets.map((p) => `${p.label} ${p.amount.toFixed(0)}`).join(", ") || "sin datos"}
Sueño actual: ${
    input.dream
      ? `${input.dream.title}, lleva ${input.dream.saved.toFixed(0)} de ${input.dream.price.toFixed(0)}`
      : "ninguno"
  }
Datos calculados:
${facts(input)}`;

  const result = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system,
    prompt,
    temperature: 1,
    output: Output.object({ schema: buddyTipSchema }),
  });

  return result.output;
}

