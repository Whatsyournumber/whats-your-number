import { NoObjectGeneratedError, Output, generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

type AnySupabase = {
  from: (table: string) => any;
  storage: { from: (bucket: string) => any };
};

const txSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().nullable(),
      merchant: z.string(),
      description: z.string().nullable(),
      amount: z.number(),
      currency: z.string().nullable(),
      category: z.string().nullable(),
      subcategory: z.string().nullable(),
      excluded: z.boolean(),
    }),
  ),
  summary: z.string(),
});

const SYSTEM = `Eres un analista financiero que extrae movimientos de estados de cuenta bancarios, de tarjeta o de capturas de pantalla de apps bancarias.
El documento puede estar en CUALQUIER idioma (español, inglés, portugués, francés, alemán, italiano, catalán, neerlandés, polaco, turco, árabe, chino, japonés, coreano, ruso, etc.)
y en cualquier alfabeto. Detecta el idioma automáticamente, interpreta encabezados y etiquetas locales (fecha/date/data/datum, importe/amount/valor/montant/Betrag, cargo/débito/debit/Soll,
abono/crédito/credit/Haben, saldo/balance) y normaliza formatos locales: fechas DD/MM/AAAA, MM/DD/AAAA, DD.MM.AAAA, meses escritos en su idioma; números con coma decimal (1.234,56)
o punto decimal (1,234.56); símbolos y códigos de moneda (€, $, £, R$, ₺, ¥, CHF, MXN...) y sufijos de signo como "-", "(...)", "DR"/"CR".
Devuelve cada movimiento con: fecha (YYYY-MM-DD), comercio, descripción, monto (negativo = gasto, positivo = ingreso/abono),
moneda ISO, categoría y subcategoría SIEMPRE en español (ej. Vivienda, Alimentación, Transporte, Lifestyle, Salud, Suscripciones,
Inversiones, Ingresos), y excluded=true cuando el movimiento NO es un gasto real: traspasos entre cuentas, pagos de tarjeta,
compra de activos o inversiones. Conserva el nombre del comercio tal cual aparece. Máximo 200 movimientos. Escribe un resumen de 1-2 frases en español.`;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export async function processStatementForUser(
  supabase: AnySupabase,
  userId: string,
  statementId: string,
): Promise<{ inserted: number; summary: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const { data: statement, error: stErr } = await supabase
    .from("statements")
    .select("*")
    .eq("id", statementId)
    .eq("user_id", userId)
    .maybeSingle();
  if (stErr) throw new Error(stErr.message);
  if (!statement) throw new Error("Archivo no encontrado.");

  await supabase.from("statements").update({ status: "processing", error_message: null }).eq("id", statementId);

  try {
    const { data: blob, error: dlErr } = await supabase.storage
      .from("statements")
      .download(statement.storage_path as string);
    if (dlErr || !blob) throw new Error(dlErr?.message ?? "No pudimos leer el archivo.");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const fileName = (statement.file_name as string).toLowerCase();
    const fileType = (statement.file_type as string) || "";
    const isPdf = fileType.includes("pdf") || fileName.endsWith(".pdf");
    const isImage =
      fileType.startsWith("image/") || /\.(png|jpe?g|webp|heic|heif)$/.test(fileName);

    const imageMediaType = fileType.startsWith("image/")
      ? fileType
      : fileName.endsWith(".png")
        ? "image/png"
        : fileName.endsWith(".webp")
          ? "image/webp"
          : fileName.endsWith(".heic") || fileName.endsWith(".heif")
            ? "image/heic"
            : "image/jpeg";

    const content = isImage
      ? [
          {
            type: "text" as const,
            text: [
              "Esta imagen es una captura de pantalla de una app bancaria, de tarjeta o de una lista de gastos.",
              "Léela como OCR: recorre la pantalla de arriba hacia abajo y extrae TODAS las filas de movimientos visibles, una por una, sin omitir ninguna.",
              "Cada fila suele tener: comercio (texto principal), fecha o etiqueta de día ('Hoy', 'Ayer', 'Today', un nombre de mes), y un importe a la derecha.",
              "Si el importe aparece en rojo, con '-', entre paréntesis o bajo un encabezado de gastos, es un GASTO (monto negativo). Si está en verde o con '+', es un ingreso (positivo).",
              "Si una fila no muestra fecha explícita, usa la fecha del encabezado o separador de sección visible arriba de esa fila; si no hay ninguna, deja date en null pero NO descartes el movimiento.",
              "Ignora saldos totales, encabezados y botones; solo devuelve movimientos.",
              "Es obligatorio devolver al menos todos los movimientos legibles de la captura.",
            ].join(" "),
          },
          {
            type: "image" as const,
            image: toBase64(bytes),
            mediaType: imageMediaType,
          },
        ]

      : isPdf
      ? [
          { type: "text" as const, text: "Extrae todos los movimientos de este estado de cuenta." },
          {
            type: "file" as const,
            data: toBase64(bytes),
            mediaType: "application/pdf",
            filename: statement.file_name as string,
          },
        ]
      : [
          {
            type: "text" as const,
            text: `Extrae todos los movimientos de este archivo (${statement.file_name}):\n\n${new TextDecoder().decode(
              bytes,
            ).slice(0, 120_000)}`,
          },
        ];

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3.5-flash");

    let parsed: z.infer<typeof txSchema>;
    try {
      const { output } = await generateText({
        model,
        system: SYSTEM,
        messages: [{ role: "user", content }],
        output: Output.object({ schema: txSchema }),
      });
      parsed = output;
    } catch (error) {
      console.error("[statements] AI extraction failed", error);
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("La IA no pudo interpretar el archivo. Prueba con un PDF o CSV más limpio.");
      }
      throw error;
    }

    const rows = parsed.transactions.slice(0, 200).map((t) => ({
      user_id: userId,
      statement_id: statementId,
      tx_date: t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : null,
      merchant: t.merchant || "Sin comercio",
      description: t.description,
      amount: Number.isFinite(t.amount) ? t.amount : 0,
      currency: (t.currency || "USD").toUpperCase().slice(0, 3),
      category: t.category,
      subcategory: t.subcategory,
      excluded: Boolean(t.excluded),
    }));

    await supabase.from("imported_transactions").delete().eq("statement_id", statementId);
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("imported_transactions").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }

    await supabase
      .from("statements")
      .update({ status: "processed", summary: parsed.summary, transactions_count: rows.length })
      .eq("id", statementId);

    return { inserted: rows.length, summary: parsed.summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await supabase.from("statements").update({ status: "error", error_message: message }).eq("id", statementId);
    throw new Error(message);
  }
}
