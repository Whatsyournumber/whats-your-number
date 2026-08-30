import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { KIDS_FAQS, buildLandingFaqJsonLd } from "@/lib/landing-faqs";
import { KidsFinanceLanding } from "@/routes/finanzas-para-ninos";
import { useLanguage } from "@/hooks/use-language";

const TITLE = "Finance for Kids | Saving, Investing & Allowance";
const DESCRIPTION =
  "Plan how much your child could have by 18 for college, build their first portfolio, manage allowance and chores, and teach them the value of money | Start free";

export const Route = createFileRoute("/en/finanzas-para-ninos")({
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
      { property: "og:url", content: "https://whatsyour-number.com/en/finanzas-para-ninos" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com/en/finanzas-para-ninos" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com/finanzas-para-ninos" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en/finanzas-para-ninos" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com/finanzas-para-ninos" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildLandingFaqJsonLd(KIDS_FAQS, "en")),
      },
    ],
  }),
  component: EnglishKidsLanding,
});

function EnglishKidsLanding() {
  const { lang, setLang } = useLanguage();

  // La URL /en/* fuerza el idioma inglés al entrar.
  useEffect(() => {
    if (lang !== "en") setLang("en");
  }, [lang, setLang]);

  return <KidsFinanceLanding />;
}
