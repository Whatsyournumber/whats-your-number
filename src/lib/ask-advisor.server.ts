import { streamText } from "ai";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type AskAdvisorInput = {
  question: string;
  lang: "es" | "en";
  context: string;
  history: { role: "user" | "assistant"; content: string }[];
};

const SYSTEM_ES = `Eres el AI Advisor de WhatsYournumber, un asesor de finanzas personales experto, cercano y directo.
Respondes SIEMPRE en español, en markdown muy breve (máximo ~150 palabras), con viñetas cuando ayude.
Puedes responder CUALQUIER pregunta de finanzas personales: presupuesto, ahorro, deudas, hipoteca, inversión, fondos indexados, impuestos generales, retiro, fondo de emergencia, seguros, compras grandes, independencia financiera.
Si la pregunta se relaciona con los datos del usuario, úsalos y cita cifras concretas. Si no hay datos suficientes, responde igual con criterio general y di qué dato falta.
Nunca inventes cifras del usuario que no estén en el contexto. Termina con una acción concreta.
No des recomendaciones de valores concretos como consejo garantizado; recuerda brevemente que es información educativa solo si la pregunta es de inversión.`;

const SYSTEM_EN = `You are the AI Advisor of WhatsYournumber, an expert, direct and friendly personal finance advisor.
ALWAYS answer in English, in very short markdown (max ~150 words), using bullets when helpful.
You can answer ANY personal finance question: budgeting, saving, debt, mortgage, investing, index funds, general taxes, retirement, emergency fund, insurance, big purchases, financial independence.
If the question relates to the user's data, use it and quote concrete figures. If data is missing, still answer with general judgement and say what data is missing.
Never invent user figures that aren't in the context. End with one concrete action.
Don't give specific security picks as guaranteed advice; briefly note it's educational information only when the question is about investing.`;

export async function generateAdvisorAnswer(input: AskAdvisorInput): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const gateway = createLovableAiGatewayProvider(apiKey);

  let streamError: unknown = null;

  const result = streamText({
    model: gateway("google/gemini-3.6-flash"),
    system: `${input.lang === "en" ? SYSTEM_EN : SYSTEM_ES}\n\nDatos financieros del usuario (contexto):\n${input.context}`,
    messages: [...input.history.slice(-8), { role: "user" as const, content: input.question }],
    onError: ({ error }) => {
      streamError = error;
      console.error("[ask-advisor] stream error", error);
    },
  });

  let text = "";
  try {
    for await (const chunk of result.textStream) text += chunk;
  } catch (error) {
    streamError = streamError ?? error;
  }

  if (!text.trim()) {
    const message = streamError instanceof Error ? streamError.message : String(streamError ?? "");
    if (/429|rate limit/i.test(message)) {
      throw new Error(
        input.lang === "en"
          ? "Too many requests right now. Please try again in a moment."
          : "Demasiadas solicitudes ahora mismo. Inténtalo en un momento.",
      );
    }
    if (/402|credit/i.test(message)) {
      throw new Error(
        input.lang === "en"
          ? "AI credits are exhausted. Please add credits to continue."
          : "Se agotaron los créditos de IA. Añade créditos para continuar.",
      );
    }
    throw new Error(
      message ||
        (input.lang === "en" ? "The AI returned no answer." : "La IA no devolvió respuesta."),
    );
  }

  return text;
}
