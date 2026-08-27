import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useEffect } from "react";

import { Landing } from "@/routes/index";
import { useLanguage } from "@/hooks/use-language";

const TITLE = "Personal Finance AI | Track Spending, Net Worth & Retirement";
const DESCRIPTION =
  "Track your spending, investments, net worth and cash flow in one place. See how every financial decision moves you closer to or further from your retirement number.";

export const Route = createFileRoute("/en")({
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
  }),
  component: EnglishLanding,
});

function EnglishLanding() {
  const matches = useMatches();
  const { lang, setLang } = useLanguage();

  // La URL /en fuerza el idioma inglés al entrar.
  useEffect(() => {
    if (lang !== "en") setLang("en");
  }, [lang, setLang]);

  // Rutas hijas (/en/blog, /en/blog/$slug, /en/finanzas-para-ninos) se renderizan vía Outlet.
  const isChild = matches.some((m) => m.routeId.startsWith("/en/"));
  if (isChild) return <Outlet />;
  return <Landing />;
}
