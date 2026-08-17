import { Fragment } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, List, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage, useT } from "@/hooks/use-language";
import { blogPosts, getPost, postExtras, sectionId } from "@/lib/blog-posts";

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
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BlogArticle,
});

function BlogArticle() {
  const { slug } = Route.useParams();
  const t = useT();
  const { lang } = useLanguage();
  const post = getPost(slug);

  if (!post) return null;

  const extras = postExtras[post.slug];
  const midPoint = Math.max(0, Math.ceil(post.sections.length / 2) - 1);

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-24">
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Volver al blog", "Back to blog")}
        </Link>

        <header className="mt-6">
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
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{post.intro[lang]}</p>
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

        <article className="mt-10 space-y-10">
          {post.sections.map((section, i) => (
            <Fragment key={section.heading.en}>
              <section id={sectionId(section.heading.en)} className="scroll-mt-24">
                <h2 className="font-display text-xl font-semibold tracking-tight">{section.heading[lang]}</h2>
                <div className="mt-3 space-y-4">
                  {section.paragraphs.map((p) => (
                    <p key={p.en} className="text-[15px] leading-relaxed text-muted-foreground">
                      {p[lang]}
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
              </section>

              {extras && i === midPoint && (
                <>
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
                </>
              )}
            </Fragment>
          ))}
        </article>


        <aside className="surface glow mt-12 flex gap-3 p-6">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {t("Para llevar", "Takeaway")}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{post.takeaway[lang]}</p>
          </div>
        </aside>

        <section className="surface mt-8 flex flex-wrap items-center gap-4 p-7">
          <p className="text-sm text-muted-foreground">
            {t(
              "¿Quieres entender tu libertad financiera con tus datos reales? Crea tu cuenta y calcula tu número en minutos.",
              "Want to understand your financial freedom with your real data? Create your account and calculate your number in minutes.",
            )}
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t("Empezar gratis", "Start for free")} <ArrowRight className="h-4 w-4" />
          </Link>
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
      </main>

      <SiteFooter />
    </div>
  );
}
