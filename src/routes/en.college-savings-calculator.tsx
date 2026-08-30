import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { DemoNinosPage } from "@/components/demo-ninos-page";
import { useLanguage } from "@/hooks/use-language";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

const TITLE = "College Savings Calculator for Your Child";
const DESCRIPTION =
  "Calculate how much to save and invest each month to build the college fund your child will need by age 18 | Free, no sign-up";

const EN_URL = "https://whatsyour-number.com/en/college-savings-calculator";
const ES_URL = "https://whatsyour-number.com/calculadora-ahorro-universidad";

export const Route = createFileRoute("/en/college-savings-calculator")({
  validateSearch: demoSearchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { property: "og:url", content: EN_URL },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: EN_URL },
      { rel: "alternate", hrefLang: "es", href: ES_URL },
      { rel: "alternate", hrefLang: "en", href: EN_URL },
      { rel: "alternate", hrefLang: "x-default", href: ES_URL },
    ],
  }),
  component: EnglishKidsDemoPage,
});

function EnglishKidsDemoPage() {
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (lang !== "en") setLang("en");
  }, [lang, setLang]);

  return <DemoNinosPage />;
}
