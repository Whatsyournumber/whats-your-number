import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { HOME_FAQS, buildLandingFaqJsonLd } from "@/lib/landing-faqs";
import { Landing } from "@/routes/index";
import { useLanguage } from "@/hooks/use-language";

const TITLE = "What Is Your Number for Retirement? | Financial Freedom Calculator";
const DESCRIPTION =
  "Discover what is your number for retirement with the Financial Freedom Calculator. The personal income and expense tracker, net worth and retirement calculator, and investment and net worth tracker built for personal finance for families.";

export const Route = createFileRoute("/en/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://whatsyour-number.com/en" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com/en" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildLandingFaqJsonLd(HOME_FAQS, "en")),
      },
    ],
  }),
  component: EnglishLanding,
});

function EnglishLanding() {
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (lang !== "en") setLang("en");
  }, [lang, setLang]);

  return <Landing />;
}
