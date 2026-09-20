import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const expenseSchema = z.object({
  merchant: z.string(),
  amount: z.number(),
  date: z.string().nullable(),
  category: z.string(),
});

/** Recibo: además del total, el detalle de los productos comprados. */
export const receiptSchema = expenseSchema.extend({
  items: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      category: z.string(),
    }),
  ),
});

export type ParsedExpense = z.infer<typeof expenseSchema>;
export type ParsedReceipt = z.infer<typeof receiptSchema>;

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
export async function transcribeExpenseAudio(
  apiKey: string,
  base64: string,
  mimeType: string,
) {
  const bytes = base64ToBytes(base64);
  const audioType = mimeType.startsWith("video/") ? "audio/webm" : mimeType || "audio/webm";
  const fileName = `nota.${extFor(audioType)}`;

  // La IA entiende cualquier idioma: transcribimos lo que se hable y luego
  // parseExpenseFromText lo normaliza al idioma de la app (inglés o español).
  const tryModel = async (model: string) => {
    try {
      const form = new FormData();
      form.append("model", model);
      // Sin "language": el modelo detecta solo; la app admite inglés o español.
      form.append("file", new Blob([bytes as unknown as BlobPart], { type: audioType }), fileName);


      const response = await fetch(`${GATEWAY}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!response.ok) {
        console.error(`[voz] ${model} ${response.status}`, await response.text().catch(() => ""));
        return "";
      }
      const data = (await response.json()) as { text?: string };
      return (data.text ?? "").trim();
    } catch (error) {
      console.error(`[voz] ${model} fallo`, error);
      return "";
    }
  };

  const primary = await tryModel("google/gemini-3.5-transcribe");
  if (primary) return primary;

  const secondary = await tryModel("openai/gpt-4o-transcribe");
  if (secondary) return secondary;

  // Plan C: el modelo multimodal escucha el audio directamente.
  try {
    const gateway = createLovableAiGatewayProvider(apiKey);
    const { text } = await generateText({
      model: gateway("google/gemini-3.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Transcribe literally this audio in the language actually spoken (it can be any language). Return only the text, no quotes or comments. If there is no speech, return empty.",
            },

            { type: "file", data: base64, mediaType: audioType },
          ],
        },
      ],
    });
    return (text ?? "").trim();
  } catch (error) {
    console.error("[voz] multimodal fallo", error);
    return "";
  }
}



function prompt(categories: string[], currency: string, today: string, lang: "es" | "en" = "es") {
  return [
    "Eres un asistente que registra gastos personales.",
    `Hoy es ${today}. La moneda del usuario es ${currency}.`,
    `Devuelve la categoría ELEGIDA de esta lista exacta: ${categories.join(", ")}.`,
    "amount siempre positivo (el gasto). date en formato YYYY-MM-DD; si no se menciona usa hoy.",
    "merchant: el comercio o concepto corto, sin adjetivos.",
    lang === "en"
      ? "The input can be in ANY language or script (Arabic, French, Chinese, Japanese, Russian, Hebrew, Thai...): always write merchant and any free text in ENGLISH, translating it faithfully. Transliterate proper names/brands into the Latin alphabet. Never return text in the original script."
      : "La entrada puede estar en CUALQUIER idioma o alfabeto (árabe, francés, chino, japonés, ruso, hebreo, tailandés...): escribe merchant y cualquier texto libre en ESPAÑOL, traduciéndolo fielmente. Transcribe nombres propios y marcas al alfabeto latino. Nunca devuelvas texto en el alfabeto original.",
    "Interpreta fechas en cualquier formato local (DD/MM/AAAA, MM/DD/AAAA, calendarios o meses escritos en otro idioma) y conviértelas a YYYY-MM-DD.",
    "Interpreta números en cualquier formato local: coma o punto decimal, separadores de miles, y dígitos arábigo-índicos (٠١٢٣٤٥٦٧٨٩) o de otros sistemas. Devuelve amount como número decimal con punto.",
  ].join(" ");
}

/** Interpreta una nota de voz ya transcrita (en cualquier idioma) y la convierte en un gasto en el idioma de la app. */
export async function parseExpenseFromText(
  apiKey: string,
  text: string,
  categories: string[],
  currency: string,
  today: string,
  lang: "es" | "en" = "es",
): Promise<ParsedExpense> {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const { output } = await generateText({
    model: gateway("google/gemini-3.5-flash"),
    system: prompt(categories, currency, today, lang),
    prompt: `Extrae el gasto de esta frase: "${text}"`,
    output: Output.object({ schema: expenseSchema }),
  });
  return output as ParsedExpense;
}

/** Lee la foto de un recibo: total, comercio, fecha, categoría y el detalle de la compra. */
export async function parseExpenseFromReceipt(
  apiKey: string,
  base64: string,
  mimeType: string,
  categories: string[],
  currency: string,
  today: string,
  lang: "es" | "en" = "es",
): Promise<ParsedReceipt> {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const { output } = await generateText({
    model: gateway("google/gemini-3.5-flash"),
    system: [
      prompt(categories, currency, today, lang),
      "items: una línea por cada producto o servicio que aparezca en el ticket, con su nombre, su importe pagado (positivo, con descuentos aplicados) y la categoría de la lista que mejor le corresponda.",
      lang === "en"
        ? "Receipts may be written in any language or script (Arabic, French, Chinese, Japanese, Russian, Hebrew, Thai...). Translate every item name and the merchant into ENGLISH; never keep the original script. Keep the product recognizable (e.g. 'خبز' -> 'Bread', 'Pain au chocolat' -> 'Chocolate croissant')."
        : "El ticket puede estar en cualquier idioma o alfabeto (árabe, francés, chino, japonés, ruso, hebreo, tailandés...). Traduce al ESPAÑOL el nombre de cada producto y el comercio; nunca dejes el alfabeto original. Mantén el producto reconocible (p. ej. 'خبز' -> 'Pan', 'Pain au chocolat' -> 'Napolitana de chocolate').",
      "Lee también tickets escritos de derecha a izquierda y con dígitos locales; si el importe está en otra moneda, devuelve el número tal cual aparece sin convertirlo.",
      "No incluyas subtotales, impuestos, propinas ni el total como items. Si el ticket no muestra el detalle, devuelve items vacío.",
    ].join(" "),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Lee este recibo o ticket, esté en el idioma que esté: devuelve el TOTAL pagado, el comercio, la fecha, la categoría y el desglose de cada producto comprado con su importe, todo traducido al idioma de la app.",
          },
          { type: "image", image: base64, mediaType: mimeType || "image/jpeg" },
        ],
      },
    ],
    output: Output.object({ schema: receiptSchema }),
  });
  return output as ParsedReceipt;
}
