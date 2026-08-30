import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { DemoPage } from "./demo";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

export const Route = createFileRoute("/calculadora-libertad-financiera")({
  validateSearch: demoSearchSchema,
  head: () => ({
    meta: [
      { title: "Calculadora de Libertad Financiera | Descubre tu Número" },
      {
        name: "description",
        content:
          "Calcula cuánto capital necesitas para vivir de tus inversiones y alcanzar tu libertad financiera. Responde 3 preguntas en 30 segundos. Gratis y sin registro.",
      },
      { property: "og:title", content: "Calculadora de Libertad Financiera | Descubre tu Número" },
      {
        property: "og:description",
        content:
          "Calcula cuánto capital necesitas para vivir de tus inversiones y alcanzar tu libertad financiera. 3 preguntas, 30 segundos, gratis y sin registro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://whatsyour-number.com/calculadora-libertad-financiera" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com/calculadora-libertad-financiera" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com/calculadora-libertad-financiera" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en/demo" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com/calculadora-libertad-financiera" },
    ],
  }),
  component: DemoPage,
});
