import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const expenseSchema = z.object({
  merchant: z.string(),
  amount: z.number(),
  date: z.string().nullable(),
  category: z.string(),
});

export type ParsedExpense = z.infer<typeof expenseSchema>;

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const extFor = (mime: string) => {
  const base = mime.split(";")[0] ?? "";
  if (base.includes("wav")) return "wav";
  if (base.includes("mpeg") || base.includes("mp3")) return "mp3";
  if (base.includes("mp4") || base.includes("m4a")) return "mp4";
  if (base.includes("ogg")) return "ogg";
  return "webm";
};

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Pasa el audio del usuario a texto con el modelo de transcripción del gateway. */
export async function transcribeExpenseAudio(apiKey: string, base64: string, mimeType: string) {
  const bytes = base64ToBytes(base64);
  const audioType = mimeType.startsWith("video/") ? "audio/webm" : mimeType || "audio/webm";
  const form = new FormData();
  form.append("model", "google/gemini-3.5-transcribe");
  form.append("file", new Blob([bytes], { type: audioType }), `nota.${extFor(audioType)}`);

  const response = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`[${response.status}] ${await response.text().catch(() => "")}`);
  }
  const data = (await response.json()) as { text?: string };
  return (data.text ?? "").trim();
}

function prompt(categories: string[], currency: string, today: string) {
  return [
    "Eres un asistente que registra gastos personales.",
    `Hoy es ${today}. La moneda del usuario es ${currency}.`,
    `Devuelve la categoría ELEGIDA de esta lista exacta: ${categories.join(", ")}.`,
    "amount siempre positivo (el gasto). date en formato YYYY-MM-DD; si no se menciona usa hoy.",
    "merchant: el comercio o concepto corto, sin adjetivos.",
  ].join(" ");
}

/** Interpreta una nota de voz ya transcrita y la convierte en un gasto. */
export async function parseExpenseFromText(
  apiKey: string,
  text: string,
  categories: string[],
  currency: string,
  today: string,
): Promise<ParsedExpense> {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const { output } = await generateText({
    model: gateway("google/gemini-3.5-flash"),
    system: prompt(categories, currency, today),
    prompt: `Extrae el gasto de esta frase: "${text}"`,
    output: Output.object({ schema: expenseSchema }),
  });
  return output as ParsedExpense;
}

/** Lee la foto de un recibo y devuelve comercio, total, fecha y categoría. */
export async function parseExpenseFromReceipt(
  apiKey: string,
  base64: string,
  mimeType: string,
  categories: string[],
  currency: string,
  today: string,
): Promise<ParsedExpense> {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const { output } = await generateText({
    model: gateway("google/gemini-3.5-flash"),
    system: prompt(categories, currency, today),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Lee este recibo o ticket y devuelve el TOTAL pagado, el comercio, la fecha del ticket y la categoría.",
          },
          { type: "image", image: base64, mediaType: mimeType || "image/jpeg" },
        ],
      },
    ],
    output: Output.object({ schema: expenseSchema }),
  });
  return output as ParsedExpense;
}
