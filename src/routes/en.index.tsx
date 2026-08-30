import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { HOME_FAQS, buildLandingFaqJsonLd } from "@/lib/landing-faqs";
import { Landing } from "@/routes/index";
import { useLanguage } from "@/hooks/use-language";

const TITLE = "Track Spending, Net Worth & Financial Freedom Number";
const DESCRIPTION =
  "Track income, expenses, net worth and investments, and discover how much you need for early retirement and financial freedom. Powered by AI | Start free";
const SOCIAL_TITLE = "Financial freedom has a number. What's yours?";
const SOCIAL_DESCRIPTION =
  "Track your spending, net worth and investments and discover how much you need to reach financial freedom. Powered by AI | Start free";

export const Route = createFileRoute("/en/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: SOCIAL_TITLE },
      { property: "og:description", content: SOCIAL_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://whatsyour-number.com/en" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SOCIAL_TITLE },
      { name: "twitter:description", content: SOCIAL_DESCRIPTION },
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
