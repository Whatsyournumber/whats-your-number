import { Fragment, type ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, ExternalLink, HelpCircle, List, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage, useT } from "@/hooks/use-language";
import { blogPosts, getPost, postCharts, postExtras, postQuotes, sectionId } from "@/lib/blog-posts";
import { BlogChartBlock } from "@/components/blog-chart";
import { getAuthor } from "@/lib/blog-authors";
import { BlogSidebar } from "@/components/blog-sidebar";
import { BlogTracker } from "@/components/blog-tracker";
import { postCategory } from "@/lib/blog-categories";
import { absoluteUrl, buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, getPostFaqs, postIsoDate } from "@/lib/blog-jsonld";
import { getPostLinks, type PostLinks } from "@/lib/blog-links";


export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { slug: post.slug };
  },
  head: ({ params }) => {
    const post = getPost(params.slug);
    const title = post ? `${post.title.es} — WhatsYournumber` : "Artículo — WhatsYournumber";
    const description = post?.excerpt.es ?? "Artículos sobre finanzas personales, inversión y IA.";
    const author = getAuthor(params.slug);
    const url = `https://whatsyour-number.com/blog/${params.slug}`;
    const image = absoluteUrl(post?.image);
    const published = postIsoDate(params.slug);
    const jsonLd = buildArticleJsonLd(params.slug, "es");
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: description.slice(0, 158) },
        { name: "author", content: author.name },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:locale", content: "es_ES" },
        { property: "article:author", content: author.name },
        ...(published
          ? [
              { property: "article:published_time", content: published },
              { property: "article:modified_time", content: published },
            ]
          : []),
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "es", href: url },
        { rel: "alternate", hrefLang: "en", href: `https://whatsyour-number.com/en/blog/${params.slug}` },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
      scripts: [jsonLd, buildBreadcrumbJsonLd(params.slug, "es"), buildFaqJsonLd(params.slug, "es")]
        .filter(Boolean)
        .map((data) => ({ type: "application/ld+json", children: JSON.stringify(data) })),
    };
  },
  component: BlogArticle,
});

function BlogArticle() {
  const { slug } = Route.useParams();
  return <BlogArticleView slug={slug} />;
}

type InlineCandidate = {
  key: string;
  needles: string[];
  render: (matched: string) => ReactNode;
};

/** Full label plus shorter "core" variants (last 3 and last 2 words) to maximise matches. */
function needleVariants(label: string): string[] {
  const words = label.split(/\s+/);
  const variants = [label];
  if (words.length > 3) variants.push(words.slice(-3).join(" "));
  if (words.length > 2) variants.push(words.slice(-2).join(" "));
  return variants;
}

function linkifyInline(
  text: string,
  candidates: InlineCandidate[],
  used: Set<string>,
): ReactNode {
  const available = candidates.filter((c) => !used.has(c.key));
  let best: { idx: number; len: number; cand: InlineCandidate } | null = null;
  const lower = text.toLowerCase();
  for (const cand of available) {
    for (const needle of cand.needles) {
      const idx = lower.indexOf(needle.toLowerCase());
      if (idx !== -1 && (!best || idx < best.idx)) {
        best = { idx, len: needle.length, cand };
        break;
      }
    }
  }
  if (!best) return text;
  used.add(best.cand.key);
  const before = text.slice(0, best.idx);
  const matched = text.slice(best.idx, best.idx + best.len);
  const after = text.slice(best.idx + best.len);
  return (
    <>
      {before}
      {best.cand.render(matched)}
      {linkifyInline(after, candidates, used)}
    </>
  );
}

function makeInlineLinker(links: PostLinks | null, lang: "es" | "en") {
  const candidates: InlineCandidate[] = [];
  if (links) {
    for (const l of links.internal) {
      const to = lang === "en" ? (l.enTo ?? l.to) : l.to;
      const all = [l.label, ...(l.aliases ?? [])];
      candidates.push({
        key: `in:${l.to}`,
        needles: all.flatMap((a) => needleVariants(a[lang])),
        render: (m) => (
          <Link
            to={to}
            className="font-bold text-primary transition-colors hover:text-primary/80"
          >
            {m}
          </Link>
        ),
      });
    }
    candidates.push({
      key: "ext",
      needles: [links.external.label, ...(links.external.aliases ?? [])].flatMap((a) =>
        needleVariants(a[lang]),
      ),
      render: (m) => (
        <a
          href={links.external.href}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex items-baseline gap-1 font-bold text-primary transition-colors hover:text-primary/80"
        >
          {m}
          <ExternalLink className="h-3 w-3 self-center" />
        </a>
      ),
    });
  }
  const used = new Set<string>();
  return (text: string): ReactNode =>
    candidates.length === 0 ? text : linkifyInline(text, candidates, used);
}

export function BlogArticleView({ slug }: { slug: string }) {
  const t = useT();
  const { lang } = useLanguage();
  const post = getPost(slug);

  if (!post) return null;

  const extras = postExtras[post.slug];
  const charts = postCharts[post.slug] ?? [];
  const quotes = postQuotes[post.slug] ?? [];
  const author = getAuthor(post.slug);
  const faqs = getPostFaqs(post.slug);
  const links = getPostLinks(post.slug);
  const linkify = makeInlineLinker(links, lang);

  // Cumulative paragraph count after each section
  const cumulative: number[] = [];
  post.sections.reduce((acc, s, i) => {
    const next = acc + s.paragraphs.length;
    cumulative[i] = next;
    return next;
  }, 0);
  const last = post.sections.length - 1;
  const findAfter = (minParas: number, from: number) => {
    for (let i = from; i <= last; i += 1) {
      if (cumulative[i]! >= minParas) return i;
    }
    return last;
  };
  // second image after at least 3 paragraphs
  const imageIndex = findAfter(3, 0);
  // table at least 3 more paragraphs after the second image
  const tableIndex = Math.min(last, Math.max(findAfter(cumulative[imageIndex]! + 3, imageIndex + 1), imageIndex + 1));

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const isKids = postCategory(post.slug)?.id === "ninos";
  const demoTo = isKids ? "/demo-ninos" : "/demo";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <BlogTracker slug={post.slug} lang={lang} />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Volver al blog", "Back to blog")}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">

        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-elevated px-2.5 py-1 font-medium text-primary">{post.tag[lang]}</span>
            <span>{post.date[lang]}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readMinutes} min
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {post.title[lang]}
          </h1>
        </header>

        <figure className="surface mt-8 overflow-hidden">
          <img
            src={post.image}
            alt={post.imageAlt[lang]}
            width={1200}
            height={750}
            className="h-full w-full object-cover"
          />
        </figure>

        {post.toc && (
          <nav className="surface mt-8 p-6" aria-label={t("Índice del artículo", "Table of contents")}>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <List className="h-3.5 w-3.5" /> {t("Índice", "Contents")}
            </p>
            <ol className="mt-4 space-y-2">
              {post.sections.map((section, i) => (
                <li key={section.heading.en} className="flex gap-3 text-[15px] leading-snug">
                  <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">{i + 1}.</span>
                  <a
                    href={`#${sectionId(section.heading.en)}`}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {section.heading[lang]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <p className="mt-8 text-base leading-relaxed text-muted-foreground">{linkify(post.intro[lang])}</p>

        <article className="mt-10 space-y-10">
          {post.sections.map((section, i) => (
            <Fragment key={section.heading.en}>
              <section id={sectionId(section.heading.en)} className="scroll-mt-24">
                <h2 className="font-display text-xl font-semibold tracking-tight">{section.heading[lang]}</h2>
                <div className="mt-3 space-y-4">
                  {section.paragraphs.map((p) => (
                    <p key={p.en} className="text-[15px] leading-relaxed text-muted-foreground">
                      {linkify(p[lang])}
                    </p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((b) => (
                      <li key={b.en} className="flex gap-2 text-[15px] leading-relaxed text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {b[lang]}
                      </li>
                    ))}
                  </ul>
                )}
                {section.image && (
                  <figure className="surface mt-6 overflow-hidden">
                    <img
                      src={section.image}
                      alt={section.imageAlt?.[lang] ?? section.heading[lang]}
                      loading="lazy"
                      width={1200}
                      height={750}
                      className="h-full w-full object-cover"
                    />
                    {section.imageCaption && (
                      <figcaption className="border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
                        {section.imageCaption[lang]}
                      </figcaption>
                    )}
                  </figure>
                )}
                {section.subsections?.map((sub) => (
                  <div key={sub.heading.en} className="mt-6">
                    <h3 className="font-display text-base font-semibold tracking-tight">{sub.heading[lang]}</h3>
                    {sub.paragraphs?.map((p) => (
                      <p key={p.en} className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                        {linkify(p[lang])}
                      </p>
                    ))}
                    {sub.bullets && (
                      <ul className="mt-3 space-y-2">
                        {sub.bullets.map((b) => (
                          <li key={b.en} className="flex gap-2 text-[15px] leading-relaxed text-muted-foreground">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                            {b[lang]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>


              {charts
                .filter((c) => c.after === i)
                .map((c) => (
                  <BlogChartBlock key={c.id} chart={c} />
                ))}

              {quotes
                .filter((q) => q.after === i)
                .map((q) => (
                  <figure key={q.author} className="surface relative overflow-hidden px-6 py-5">
                    <span className="absolute left-0 top-0 h-full w-1 bg-primary/70" />
                    <blockquote className="font-display text-[17px] leading-relaxed text-foreground">
                      “{q.text[lang]}”
                    </blockquote>
                    <figcaption className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{q.author}</span> · {q.role[lang]}
                    </figcaption>
                  </figure>
                ))}

              {extras && i === imageIndex && (
                <figure className="surface overflow-hidden">
                  <img
                    src={extras.image2}
                    alt={extras.image2Alt[lang]}
                    loading="lazy"
                    width={1200}
                    height={750}
                    className="h-full w-full object-cover"
                  />
                  <figcaption className="border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
                    {extras.image2Caption[lang]}
                  </figcaption>
                </figure>
              )}

              {extras && i === tableIndex && (
                  <figure className="surface overflow-hidden">
                    <figcaption className="flex flex-wrap items-baseline gap-2 border-b border-border/50 px-5 py-4">
                      <span className="font-display text-sm font-semibold">{extras.table.title[lang]}</span>
                      {extras.table.note && (
                        <span className="text-xs text-muted-foreground">{extras.table.note[lang]}</span>
                      )}
                    </figcaption>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-[13px]">
                        <thead>
                          <tr className="bg-elevated/60">
                            {extras.table.columns.map((c) => (
                              <th
                                key={c.en}
                                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground"
                              >
                                {c[lang]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {extras.table.rows.map((row) => (
                            <tr
                              key={row.cells[0]?.en ?? ""}
                              className={`border-t border-border/40 ${row.highlight ? "bg-primary/10" : ""}`}
                            >
                              {row.cells.map((cell, ci) => (
                                <td
                                  key={cell.en}
                                  className={`px-4 py-3 align-top ${
                                    ci === 0
                                      ? "font-medium"
                                      : row.highlight
                                        ? "font-medium text-primary"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {cell[lang]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </figure>
              )}
            </Fragment>
          ))}
        </article>

        {faqs.length > 0 && (
          <section className="mt-12" aria-label={t("Preguntas frecuentes", "Frequently asked questions")}>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {t("Preguntas frecuentes", "Frequently asked questions")}
            </h2>
            <div className="mt-4 space-y-3">
              {faqs.map((f) => (
                <details key={f.q.en} className="surface group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-start gap-2 text-[15px] font-medium leading-snug">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-display text-[15px] font-semibold">{f.q[lang]}</h3>
                  </summary>
                  <p className="mt-3 pl-6 text-[15px] leading-relaxed text-muted-foreground">{f.a[lang]}</p>
                </details>
              ))}
            </div>
          </section>
        )}



        <aside className="surface glow mt-12 flex gap-3 p-6">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {t("Nuestra visión", "Our insight")}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{post.takeaway[lang]}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t(
                "Lo único que cambia el resultado es verlo con tus propios números: ",
                "The only thing that changes the outcome is seeing it with your own numbers: ",
              )}
              <Link to={demoTo} search={{ start: 1 }} className="font-medium text-primary hover:text-primary/80">
                {isKids
                  ? t("prueba el demo para tu hijo", "try the demo for your child")
                  : t("pruébalo en el demo", "try it in the demo")}
              </Link>
              {t(" o descubre ", " or discover ")}
              <Link to="/" className="font-medium text-primary hover:text-primary/80">
                {t("cómo funciona WhatsYournumber", "how WhatsYournumber works")}
              </Link>
              {"."}
            </p>
          </div>
        </aside>

        <section
          className="surface mt-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-start"
          itemScope
          itemType="https://schema.org/Person"
          aria-label={t("Autor del artículo", "Article author")}
        >
          <img
            src={author.photo}
            alt={`${author.name}, ${author.role[lang]} — ${t("autora/autor en WhatsYournumber", "author at WhatsYournumber")}`}
            loading="lazy"
            width={816}
            height={816}
            itemProp="image"
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
          />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              {t("Escrito por", "Written by")}
            </p>
            <p className="mt-1 font-display text-lg font-semibold" itemProp="name">
              {author.name}
            </p>
            <p className="text-xs text-muted-foreground" itemProp="jobTitle">
              {author.role[lang]}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground" itemProp="description">
              {author.bio[lang]}
            </p>
          </div>
        </section>


        <section className="surface glow mt-8 p-7">
          <p className="font-display text-lg font-semibold leading-snug">
            {isKids
              ? t(
                  "Prueba el demo gratis y descubre el número de tu hijo a los 18",
                  "Try the free demo and discover your child's number at 18",
                )
              : t(
                  "Prueba el demo gratis y entiende tu libertad financiera",
                  "Try the free demo and understand your financial freedom",
                )}
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {isKids
              ? t(
                  "Haz el demo gratis en minutos: calcula cuánto tendrá tu hijo invirtiendo en el S&P 500 al 10% anual. Si ya tienes cuenta, entra y continúa donde lo dejaste.",
                  "Take the free demo in minutes: calculate what your child will have investing in the S&P 500 at 10% a year. Already have an account? Sign in and pick up where you left off.",
                )
              : t(
                  "Haz el demo gratis en minutos: calcula tu patrimonio, tu runway y tu número sin pagar nada. Si ya tienes cuenta, entra y continúa donde lo dejaste.",
                  "Take the free demo in minutes: calculate your net worth, runway and number at no cost. Already have an account? Sign in and pick up where you left off.",
                )}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to={demoTo}
              search={{ start: 1 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {isKids
                ? t("Hacer el demo para tu hijo", "Try the demo for your child")
                : t("Hacer el demo gratis", "Try the free demo")}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {t("Iniciar sesión", "Sign in")}
            </Link>
          </div>
        </section>


        <section className="mt-12">
          <h2 className="text-sm font-semibold">{t("Sigue leyendo", "Keep reading")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <a
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="surface group overflow-hidden"
              >
                <img
                  src={r.image}
                  alt={r.imageAlt[lang]}
                  loading="lazy"
                  width={1200}
                  height={750}
                  className="h-28 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <p className="p-4 text-sm font-medium leading-snug">{r.title[lang]}</p>
              </a>
            ))}
          </div>
        </section>
        </div>

        <aside className="lg:pt-[42px]">
          <BlogSidebar activeCategory={postCategory(post.slug)?.id} />
        </aside>
        </div>
      </main>


      <SiteFooter />
    </div>
  );
}
