import { createFileRoute } from "@tanstack/react-router";

import { BlogIndex, BLOG_TITLE, BLOG_DESCRIPTION } from "@/routes/blog";
import { buildBlogCollectionJsonLd, buildBlogIndexBreadcrumbJsonLd } from "@/lib/blog-jsonld";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: BLOG_TITLE },
      { name: "description", content: BLOG_DESCRIPTION },
      { property: "og:title", content: BLOG_TITLE },
      { property: "og:description", content: BLOG_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: BLOG_TITLE },
      { name: "twitter:description", content: BLOG_DESCRIPTION },
      { property: "og:url", content: "https://whatsyour-number.com/blog" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com/blog" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com/blog" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en/blog" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com/blog" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(buildBlogIndexBreadcrumbJsonLd("es")) },
      { type: "application/ld+json", children: JSON.stringify(buildBlogCollectionJsonLd("es")) },
    ],
  }),
  component: BlogIndex,
});
