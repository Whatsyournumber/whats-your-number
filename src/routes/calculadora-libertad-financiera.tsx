import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { DemoPage } from "@/components/demo-page";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

const TITLE = "Calculadora de Libertad Financiera | Descubre tu Número";
const DESCRIPTION =
  "Calcula cuánto capital necesitas para vivir de tus inversiones y alcanzar tu libertad financiera. Responde 3 preguntas en 30 segundos. Gratis y sin registro.";

const ES_URL = "https://whatsyour-number.com/calculadora-libertad-financiera";
const EN_URL = "https://whatsyour-number.com/en/demo";

export const Route = createFileRoute("/calculadora-libertad-financiera")({
  validateSearch: demoSearchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { property: "og:url", content: ES_URL },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: ES_URL },
      { rel: "alternate", hrefLang: "es", href: ES_URL },
      { rel: "alternate", hrefLang: "en", href: EN_URL },
      { rel: "alternate", hrefLang: "x-default", href: ES_URL },
    ],
  }),
  component: DemoPage,
});
