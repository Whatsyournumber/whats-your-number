import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { DemoNinosPage } from "@/components/demo-ninos-page";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

const TITLE = "Calculadora de Ahorro para la Universidad de tu Hijo";
const DESCRIPTION =
  "Calcula cuánto ahorrar e invertir cada mes para construir el fondo universitario que tu hijo necesitará a los 18 años | Gratis y sin registro";

const ES_URL = "https://whatsyour-number.com/calculadora-ahorro-universidad";

export const Route = createFileRoute("/calculadora-ahorro-universidad")({
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
      { rel: "alternate", hrefLang: "x-default", href: ES_URL },
    ],
  }),
  component: DemoNinosPage,
});
