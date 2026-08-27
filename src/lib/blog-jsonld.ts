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

/** schema.org BreadcrumbList for a blog post (Home → Blog → Article). */
export function buildBreadcrumbJsonLd(slug: string, lang: "es" | "en") {
  const post = getPost(slug);
  if (!post) return null;
  const home = lang === "en" ? `${SITE}/en` : SITE;
  const blog = lang === "en" ? `${SITE}/en/blog` : `${SITE}/blog`;
  const article = lang === "en" ? `${SITE}/en/blog/${slug}` : `${SITE}/blog/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "en" ? "Home" : "Inicio",
        item: home,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blog,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title[lang],
        item: article,
      },
    ],
  };
}

/** schema.org BreadcrumbList for the blog index (Home → Blog). */
export function buildBlogIndexBreadcrumbJsonLd(lang: "es" | "en") {
  const home = lang === "en" ? `${SITE}/en` : SITE;
  const blog = lang === "en" ? `${SITE}/en/blog` : `${SITE}/blog`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "en" ? "Home" : "Inicio",
        item: home,
      },
      { "@type": "ListItem", position: 2, name: "Blog", item: blog },
    ],
  };
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

type Faq = { q: { es: string; en: string }; a: { es: string; en: string } };

/** FAQ pairs used for FAQPage schema (helps AI/GEO answer engines). */
const POST_FAQ: Record<string, Faq[]> = {
  "boring-business-comprar-libertad-financiera": [
    {
      q: { es: "¿Qué es un boring business?", en: "What is a boring business?" },
      a: {
        es: "Un negocio sencillo y poco glamuroso —lavandería, vending, self storage, agencia de ventas o house flipping— con demanda estable, clientes recurrentes y flujo de caja predecible, fácil de automatizar con tecnología e IA.",
        en: "A simple, unglamorous business — laundromat, vending, self storage, sales agency or house flipping — with stable demand, recurring customers and predictable cash flow that is easy to automate with technology and AI.",
      },
    },
    {
      q: { es: "¿Con cuánto dinero puedo empezar un boring business?", en: "How much money do I need to start a boring business?" },
      a: {
        es: "Desde 0–500 USD con una agencia de growth marketing centrada solo en ventas, 2.000–8.000 USD en vending especializado, 40.000–150.000 USD en una lavandería automática y desde 150.000 USD en self storage.",
        en: "From $0–500 with a sales-only growth marketing agency, $2,000–8,000 for specialized vending, $40,000–150,000 for a self-service laundromat and from $150,000 for self storage.",
      },
    },
    {
      q: { es: "¿Es mejor comprar un negocio o crearlo desde cero?", en: "Is it better to buy a business or start one from scratch?" },
      a: {
        es: "Comprar un negocio rentable (estrategia ETA, Entrepreneurship Through Acquisition) suele tener mejores probabilidades: ya existen clientes, ingresos y procesos. Solo necesitas mejorarlo un 10–20 % con digitalización, IA y mejor marketing.",
        en: "Buying a profitable business (the ETA strategy, Entrepreneurship Through Acquisition) usually has better odds: customers, revenue and processes already exist. You only need to improve it by 10–20% with digitization, AI and better marketing.",
      },
    },
    {
      q: { es: "¿Cómo acelera un boring business mi libertad financiera?", en: "How does a boring business speed up financial freedom?" },
      a: {
        es: "Aumenta tu tasa de ahorro. Con un objetivo de 900.000 € y 1.000 €/mes de ahorro tardarías unos 33 años; añadir 2.000 €/mes de caja reinvertida baja el plazo a unos 18 años.",
        en: "It raises your savings rate. With a €900,000 goal and €1,000/month saved you would need roughly 33 years; adding €2,000/month of reinvested cash cuts it to about 18 years.",
      },
    },
  ],
};

/** schema.org FAQPage for articles that have curated question/answer pairs. */
export function buildFaqJsonLd(slug: string, lang: "es" | "en") {
  const faqs = POST_FAQ[slug];
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q[lang],
      acceptedAnswer: { "@type": "Answer", text: f.a[lang] },
    })),
  };
}
