import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type PortfolioInsightInput = {
  lang: "es" | "en";
  currency: string;
  riskLevel: string;
  metrics: { label: string; value: string }[];
  buckets: { label: string; current: number; target: number }[];
  totalValue: number;
  annualGain: number;
  topPosition: { name: string; pct: number } | null;
};

export const insightSchema = z.object({
  /** Explicación simple de cada métrica, mismo orden que la entrada */
  hints: z.array(z.string()),
  /** Qué hacer ahora, máximo 2 frases */
  advice: z.string(),
});

export type PortfolioInsight = z.infer<typeof insightSchema>;

export async function generatePortfolioInsight(
  input: PortfolioInsightInput,
): Promise<PortfolioInsight> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const gateway = createLovableAiGatewayProvider(apiKey);
  const es = input.lang === "es";

  const system = es
    ? `Eres un asesor de inversiones que explica en español simple, como a un amigo sin conocimientos financieros.
Devuelve "hints": una explicación por métrica, en el MISMO orden, EXACTAMENTE 4-6 palabras cada una, ultra corta, sin repetir el número ni el nombre de la métrica. Ejemplo válido: "oscilación moderada, nada alarmante". Sin comas largas ni frases.
Devuelve "advice": máximo 2 frases cortas (menos de 30 palabras en total) con la acción concreta más útil ahora, mencionando porcentajes objetivo si hacen falta. Nada de jerga.`
    : `You are an investment advisor explaining in plain English to someone with no finance background.
Return "hints": one explanation per metric, SAME order, EXACTLY 4-6 words each, ultra short, without repeating the number or metric name. Valid example: "moderate swing, nothing alarming". No long phrases.
Return "advice": max 2 short sentences (under 30 words total) with the single most useful action now. No jargon.`;

  const prompt = `Riesgo: ${input.riskLevel}
Valor total: ${input.totalValue.toFixed(0)} ${input.currency}
Ganancia anual estimada: ${input.annualGain.toFixed(0)} ${input.currency}
Mayor posición: ${input.topPosition ? `${input.topPosition.name} (${input.topPosition.pct.toFixed(0)}%)` : "n/d"}
Distribución actual vs objetivo:
${input.buckets.map((b) => `- ${b.label}: ${b.current.toFixed(0)}% (objetivo ${b.target}%)`).join("\n")}
Métricas (en orden):
${input.metrics.map((m, i) => `${i + 1}. ${m.label} = ${m.value}`).join("\n")}`;

  const result = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system,
    prompt,
    temperature: 0.6,
    output: Output.object({ schema: insightSchema }),
  });

  return result.output;
}
