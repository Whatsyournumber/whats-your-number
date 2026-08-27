/**
 * Checklist SEO / GEO calculado sobre los artículos del blog.
 * Se usa en el back office (/admin/blog) para ver de un vistazo qué falta.
 */

import { blogPosts, postCharts, postExtras, postQuotes, type BlogPost } from "@/lib/blog-posts";
import { getPostFaqs } from "@/lib/blog-jsonld";
import { getPostLinks } from "@/lib/blog-links";
import { MIN_KEYWORDS_PER_POST, MIN_KEYWORD_VOLUME, postKeywords } from "@/lib/blog-keywords";

export type Lang = "es" | "en";

export const MIN_WORDS = 3000;
export const MIN_IMAGES = 3;

export type CheckKey =
  | "words"
  | "images"
  | "charts"
  | "table"
  | "quotes"
  | "case"
  | "faq"
  | "links"
  | "keywords"
  | "alt"
  | "insight";

export type CheckResult = {
  key: CheckKey;
  label: { es: string; en: string };
  ok: boolean;
  detail: string;
};

export type PostAudit = {
  slug: string;
  title: string;
  words: number;
  images: number;
  score: number;
  checks: CheckResult[];
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function postWordCount(post: BlogPost, lang: Lang): number {
  let total = countWords(post.intro[lang]) + countWords(post.takeaway[lang]);
  for (const section of post.sections) {
    total += countWords(section.heading[lang]);
    for (const p of section.paragraphs) total += countWords(p[lang]);
    for (const b of section.bullets ?? []) total += countWords(b[lang]);
    for (const sub of section.subsections ?? []) {
      total += countWords(sub.heading[lang]);
      for (const p of sub.paragraphs ?? []) total += countWords(p[lang]);
      for (const b of sub.bullets ?? []) total += countWords(b[lang]);
    }
  }
  return total;
}

export function postImageCount(post: BlogPost): number {
  const sectionImages = post.sections.filter((s) => Boolean(s.image)).length;
  const extraImage = postExtras[post.slug]?.image2 ? 1 : 0;
  return 1 + sectionImages + extraImage;
}

function hasCase(post: BlogPost): boolean {
  return post.sections.some(
    (s) => /caso real/i.test(s.heading.es) || /real case/i.test(s.heading.en),
  );
}

export function auditPost(post: BlogPost, lang: Lang): PostAudit {
  const words = postWordCount(post, lang);
  const images = postImageCount(post);
  const charts = postCharts[post.slug]?.length ?? 0;
  const quotes = postQuotes[post.slug]?.length ?? 0;
  const table = Boolean(postExtras[post.slug]?.table);
  const faqs = getPostFaqs(post.slug)?.length ?? 0;
  const postLinks = getPostLinks(post.slug);
  const links = postLinks ? postLinks.internal.length + 1 : 0;
  const altOk = Boolean(post.imageAlt?.[lang]) && post.sections.every((s) => !s.image || Boolean(s.imageAlt?.[lang]));
  const metaOk =
    post.title[lang].length > 0 &&
    post.title[lang].length <= 70 &&
    post.excerpt[lang].length > 60 &&
    post.excerpt[lang].length <= 200;

  const checks: CheckResult[] = [
    {
      key: "words",
      label: { es: `Mínimo ${MIN_WORDS} palabras`, en: `At least ${MIN_WORDS} words` },
      ok: words >= MIN_WORDS,
      detail: `${words.toLocaleString("es-ES")} palabras`,
    },
    {
      key: "images",
      label: { es: `Mínimo ${MIN_IMAGES} imágenes`, en: `At least ${MIN_IMAGES} images` },
      ok: images >= MIN_IMAGES,
      detail: `${images} imágenes`,
    },
    {
      key: "charts",
      label: { es: "Gráficas interactivas", en: "Interactive charts" },
      ok: charts >= 1,
      detail: `${charts}`,
    },
    {
      key: "table",
      label: { es: "Tabla comparativa", en: "Comparison table" },
      ok: table,
      detail: table ? "sí" : "falta",
    },
    {
      key: "quotes",
      label: { es: "Citas de expertos", en: "Expert quotes" },
      ok: quotes >= 2,
      detail: `${quotes}`,
    },
    {
      key: "case",
      label: { es: "Caso de éxito real", en: "Real success case" },
      ok: hasCase(post),
      detail: hasCase(post) ? "sí" : "falta",
    },
    {
      key: "faq",
      label: { es: "FAQ + schema", en: "FAQ + schema" },
      ok: faqs >= 3,
      detail: `${faqs} preguntas`,
    },
    {
      key: "insight",
      label: { es: "Cierre \"Nuestra visión\" + CTA", en: '"Our insight" close + CTA' },
      ok: post.takeaway[lang].trim().length > 120,
      detail: post.takeaway[lang].trim().length > 120 ? "sí" : "falta",
    },
    {
      key: "links",
      label: { es: "Enlaces internos + externo", en: "Internal + external links" },
      ok: links >= 2,
      detail: `${links}`,
    },
  ];

  const passed = checks.filter((c) => c.ok).length;
  return {
    slug: post.slug,
    title: post.title[lang],
    words,
    images,
    score: Math.round((passed / checks.length) * 100),
    checks,
  };
}

export function auditAllPosts(lang: Lang): PostAudit[] {
  return blogPosts.map((post) => auditPost(post, lang)).sort((a, b) => a.score - b.score);
}
