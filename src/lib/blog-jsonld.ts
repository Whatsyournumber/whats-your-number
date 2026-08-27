import { getAuthor } from "@/lib/blog-authors";
import { getPost } from "@/lib/blog-posts";

const SITE = "https://whatsyour-number.com";
const FALLBACK_IMAGE = `${SITE}/og-cover.jpg`;

/** Absolute URL for an asset path emitted by the bundler. */
export function absoluteUrl(path: string | undefined) {
  if (!path) return FALLBACK_IMAGE;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** ISO date (YYYY-MM-DD) derived from the article's English date label. */
export function postIsoDate(slug: string) {
  const post = getPost(slug);
  if (!post) return undefined;
  const parsed = new Date(post.date.en);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

/** Full schema.org Article JSON-LD for a blog post in the given language. */
export function buildArticleJsonLd(slug: string, lang: "es" | "en") {
  const post = getPost(slug);
  if (!post) return null;
  const author = getAuthor(slug);
  const url = lang === "en" ? `${SITE}/en/blog/${slug}` : `${SITE}/blog/${slug}`;
  const published = postIsoDate(slug);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title[lang].slice(0, 110),
    name: post.title[lang],
    description: post.excerpt[lang],
    image: [absoluteUrl(post.image)],
    inLanguage: lang === "en" ? "en" : "es",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.keyword[lang],
    articleSection: post.tag[lang],
    wordCount: post.sections.reduce(
      (acc, s) => acc + s.paragraphs.reduce((a, p) => a + p[lang].split(/\s+/).length, 0),
      0,
    ),
    ...(published ? { datePublished: published, dateModified: published } : {}),
    author: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role[lang],
      description: author.bio[lang],
    },
    publisher: {
      "@type": "Organization",
      name: "WhatsYournumber",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og-cover.jpg` },
    },
  };
}
