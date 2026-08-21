import { createFileRoute } from "@tanstack/react-router";
import { blogPosts } from "@/lib/blog-posts";

const SITE = "https://www.whatsyour-number.com";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toAbsolute(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  return `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Public RSS feed of the blog. Lets social schedulers (Publer, Metricool,
 * IFTTT, Make…) auto-publish new articles to the LinkedIn company page and
 * other channels without any custom integration.
 * Usage: /api/public/rss  ·  /api/public/rss?lang=en
 */
export const Route = createFileRoute("/api/public/rss")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const lang = url.searchParams.get("lang") === "en" ? "en" : "es";

        const items = blogPosts
          .map((post) => {
            const link = `${SITE}/blog/${post.slug}`;
            const image = toAbsolute(post.image);
            const pubDate = new Date(post.date.en ?? post.date.es);
            return `    <item>
      <title>${esc(post.title[lang])}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${(Number.isNaN(pubDate.getTime()) ? new Date() : pubDate).toUTCString()}</pubDate>
      <category>${esc(post.tag[lang])}</category>
      <description>${esc(post.excerpt[lang])}</description>
      <enclosure url="${esc(image)}" type="image/jpeg" />
      <media:content url="${esc(image)}" medium="image" />
    </item>`;
          })
          .join("\n");

        const title =
          lang === "en"
            ? "WhatsYourNumber — Personal finance blog"
            : "WhatsYourNumber — Blog de finanzas personales";
        const description =
          lang === "en"
            ? "Wealth, freedom number, investing and family finance, explained simply."
            : "Patrimonio, número de libertad, inversión y finanzas familiares, explicados de forma simple.";

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/api/public/rss?lang=${lang}" rel="self" type="application/rss+xml" />
    <description>${esc(description)}</description>
    <language>${lang === "en" ? "en" : "es"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
