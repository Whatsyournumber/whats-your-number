import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useEffect } from "react";

import { BlogIndex } from "@/routes/blog";
import { useLanguage } from "@/hooks/use-language";
import { buildBlogCollectionJsonLd, buildBlogIndexBreadcrumbJsonLd } from "@/lib/blog-jsonld";

const TITLE = "Personal Finance Blog | Saving, Investing & Business";
const DESCRIPTION =
  "Learn about personal finance, saving, investing, net worth, retirement and business. Practical guides to make better financial decisions and reach your retirement number.";

export const Route = createFileRoute("/en/blog")({
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
      { property: "og:url", content: "https://whatsyour-number.com/en/blog" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com/en/blog" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com/blog" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en/blog" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com/blog" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(buildBlogIndexBreadcrumbJsonLd("en")) },
      { type: "application/ld+json", children: JSON.stringify(buildBlogCollectionJsonLd("en")) },
    ],
  }),
  component: EnglishBlogLayout,
});

function EnglishBlogLayout() {
  const matches = useMatches();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (lang !== "en") setLang("en");
  }, [lang, setLang]);

  const isChild = matches.some((m) => m.routeId.startsWith("/en/blog/"));
  if (isChild) return <Outlet />;
  return <BlogIndex />;
}
