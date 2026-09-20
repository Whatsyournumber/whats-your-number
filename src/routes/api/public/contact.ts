import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const TOPICS = ["general", "custom_plan", "support", "affiliate", "press"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(120).optional(),
  topic: z.enum(TOPICS),
  plan: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10).max(4000),
  lang: z.enum(["es", "en"]),
  website: z.string().max(200).optional(),
});

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
        }

        const parsed = contactSchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "invalid_input" }, { status: 422 });
        }

        const data = parsed.data;

        // Trampa para bots: si el campo oculto viene relleno, se descarta el envío
        // pero respondemos éxito para no darle pistas a un script automático.
        if (data.website) return Response.json({ ok: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("contact_messages").insert({
          name: data.name,
          email: data.email,
          company: data.company ?? null,
          topic: data.topic,
          plan: data.plan ?? null,
          message: data.message,
          lang: data.lang,
          source: "web",
        });

        if (error) {
          console.error("Saving contact message failed", error.message);
          return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
