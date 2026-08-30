import { createFileRoute, Link, Outlet, useMatches, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage, useT } from "@/hooks/use-language";
import { blogPosts } from "@/lib/blog-posts";
import { blogCategories, postsByCategory } from "@/lib/blog-categories";
import { buildBlogCollectionJsonLd, buildBlogIndexBreadcrumbJsonLd } from "@/lib/blog-jsonld";


const TITLE = "Blog de Finanzas Personales | Ahorro, Inversiones y Negocios";
const DESCRIPTION =
  "Aprende sobre finanzas personales, ahorro, inversiones, patrimonio, jubilación y negocios. Guías prácticas para tomar mejores decisiones financieras y alcanzar tu número de retiro.";

export const BLOG_TITLE = TITLE;
export const BLOG_DESCRIPTION = DESCRIPTION;

// Layout puro: el head (canonical/hreflang) vive en las rutas hoja para
// evitar canonicals duplicadas y conflictos de hreflang en /blog/$slug.
export const Route = createFileRoute("/blog")({
  component: () => <Outlet />,
});


export function BlogIndex() {
  const t = useT();
  const { lang } = useLanguage();
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>;
  const rawCat = typeof search?.['cat'] === "string" ? (search['cat'] as string) : null;
  const activeCatMeta = blogCategories.find((c) => c.id === rawCat);
  const activeCat = activeCatMeta?.id ?? null;
  const blogHref = lang === "en" ? "/en/blog" : "/blog";
  const articleHref = (slug: string) => `${blogHref}/${slug}`;

  const featured = blogPosts[0]!;
  const listed = activeCat ? postsByCategory(activeCat) : blogPosts.slice(1);




  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="pt-10 md:pt-16">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
            {t("Aprende con nosotros", "Learn with us")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {activeCatMeta ? activeCatMeta.label[lang] : t("Blog", "Blog")}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            {activeCatMeta
              ? activeCatMeta.description[lang]
              : t(
                  "Ideas prácticas sobre patrimonio, gasto consciente, inversión y libertad financiera.",
                  "Practical ideas about net worth, mindful spending, investing and financial freedom.",
                )}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={blogHref}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCat
                  ? "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  : "border-primary bg-primary/10 text-primary"
              }`}
            >
              {t("Todo", "All")}
            </a>
            {blogCategories.map((c) => (
              <a
                key={c.id}
                href={`${blogHref}?cat=${c.id}`}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeCat === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {c.label[lang]}
              </a>
            ))}
          </div>
        </section>

        <div className="mt-2">


        {/* Destacado */}
        {!activeCat && (
        <a

          href={articleHref(featured.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="surface group mt-10 grid overflow-hidden md:grid-cols-2"
        >
          <div className="relative h-56 overflow-hidden md:h-full md:min-h-[320px]">
            <img
              src={featured.image}
              alt={featured.imageAlt[lang]}
              width={1200}
              height={750}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent md:bg-gradient-to-r" />
          </div>
          <div className="flex flex-col justify-center p-7 md:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-elevated px-2.5 py-1 font-medium text-primary">{featured.tag[lang]}</span>
              <span>{featured.date[lang]}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {featured.readMinutes} min
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight md:text-3xl">
              {featured.title[lang]}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featured.excerpt[lang]}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("Leer artículo", "Read article")}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </a>
        )}


        <section className="mt-6 grid gap-5 md:grid-cols-2">
          {listed.map((post) => (

            <a
              key={post.slug}
              href={articleHref(post.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="surface group flex flex-col overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.imageAlt[lang]}
                  loading="lazy"
                  width={1200}
                  height={750}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">
                  {post.tag[lang]}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.date[lang]}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readMinutes} min
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold leading-snug">{post.title[lang]}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt[lang]}</p>
                <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  {t("Leer artículo", "Read article")}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </a>
          ))}
        </section>

        {listed.length === 0 && (
          <p className="surface mt-6 p-8 text-sm text-muted-foreground">
            {t("Pronto publicaremos artículos de esta categoría.", "We'll publish articles in this category soon.")}
          </p>
        )}
        </div>



        <section className="surface mt-12 flex flex-wrap items-center gap-4 p-8">
          <p className="text-sm text-muted-foreground">
            {t(
              "¿Quieres aplicar todo esto en tu propio panel? Crea tu cuenta y empieza hoy.",
              "Want to apply all this in your own dashboard? Create your account and start today.",
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
      </main>

      <SiteFooter />
    </div>
  );
}
