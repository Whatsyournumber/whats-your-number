import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(3000),
  lang: z.enum(["es", "en", "auto"]).default("auto"),
});

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("TTS not configured", { status: 500 });

        let data: z.infer<typeof schema>;
        try {
          data = schema.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text:
                      data.lang === "en"
                        ? `Say in a warm, natural tone in English: ${data.text}`
                        : data.lang === "es"
                          ? `Di con un tono cálido y natural en español: ${data.text}`
                          : `Detect the language of the following text and say it aloud in a warm, natural tone in that same language: ${data.text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
            },
            stream_format: "audio",
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const err = await upstream.text().catch(() => "");
          return new Response(err || `TTS failed: ${upstream.status}`, { status: upstream.status || 502 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: { "Content-Type": "audio/wav", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
