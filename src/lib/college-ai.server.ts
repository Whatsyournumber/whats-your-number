import { streamText } from "ai";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type CollegeAdviceInput = {
  lang: "es" | "en";
  childName: string;
  childAge: number;
  currency: string;
  budget: number;
  interests: string;
  affordable: { name: string; city: string; country: string; total: number; rank: number }[];
  stretch: { name: string; city: string; country: string; total: number; rank: number; gap: number }[];
  monthlyExtraFor1: number;
};

const SYSTEM_ES = `Eres Buddy, el asesor educativo de My First Number. Hablas a un padre/madre sobre el futuro universitario de su hijo/a.
Responde SIEMPRE en español, en markdown muy breve (máximo 130 palabras).
Formato:
- Una frase inicial con el veredicto del presupuesto (usa la cifra).
- 3 viñetas: las mejores opciones que YA puede pagar y por qué encajan con sus intereses.
- 1 viñeta "Para estirar el plan:" con la universidad soñada y cuánto falta o cuánto más aportar al mes.
Usa solo universidades del contexto. No inventes cifras. Termina con una acción concreta.`;

const SYSTEM_EN = `You are Buddy, the education advisor of My First Number, talking to a parent about their child's university future.
ALWAYS answer in English, very short markdown (max 130 words).
Format:
- One opening sentence with the budget verdict (quote the figure).
- 3 bullets: best options they can already afford and why they fit the interests.
- 1 bullet "To stretch the plan:" with the dream school and the gap or extra monthly contribution.
Only use universities from the context. Never invent figures. End with one concrete action.`;

export async function generateCollegeAdvice(input: CollegeAdviceInput): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const list = (
    rows: { name: string; city: string; country: string; total: number; rank: number; gap?: number }[],
  ) =>
    rows
      .slice(0, 8)
      .map(
        (r) =>
          `- ${r.name} (${r.city}, ${r.country}): coste total ${Math.round(r.total)} ${input.currency}, ranking #${r.rank}${
            r.gap ? `, faltan ${Math.round(r.gap)} ${input.currency}` : ""
          }`,
      )
      .join("\n") || "- (ninguna)";

  const context = `Hijo/a: ${input.childName}, ${input.childAge} años.
Capital disponible para estudiar: ${Math.round(input.budget)} ${input.currency}.
Intereses: ${input.interests || "sin definir"}.
Aporte mensual extra necesario para alcanzar la primera opción fuera de presupuesto: ${Math.round(
    input.monthlyExtraFor1,
  )} ${input.currency}/mes.

Universidades DENTRO del presupuesto:
${list(input.affordable)}

Universidades FUERA del presupuesto (sueño):
${list(input.stretch)}`;

  const result = streamText({
    model: gateway("google/gemini-3.6-flash"),
    system: `${input.lang === "en" ? SYSTEM_EN : SYSTEM_ES}\n\nContexto:\n${context}`,
    messages: [
      {
        role: "user" as const,
        content:
          input.lang === "en"
            ? "Where can my child study with this money?"
            : "¿Dónde puede estudiar mi hijo/a con este dinero?",
      },
    ],
    onError: ({ error }) => console.error("[college-ai] stream error", error),
  });

  let text = "";
  for await (const chunk of result.textStream) text += chunk;
  if (!text.trim()) throw new Error("La IA no devolvió respuesta. Inténtalo de nuevo.");
  return text.trim();
}
