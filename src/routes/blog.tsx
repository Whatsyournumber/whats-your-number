import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Your north" },
      {
        name: "description",
        content: "Ideas prácticas sobre patrimonio, cash flow, inversión y automatización financiera con IA.",
      },
      { property: "og:title", content: "Blog — Your north" },
      { property: "og:description", content: "Artículos sobre finanzas personales, inversión y IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Blog,
});

function Blog() {
  const t = useT();

  const posts = [
    {
      tag: t("Patrimonio", "Net worth"),
      date: t("12 jul 2026", "Jul 12, 2026"),
      title: t(
        "Cómo calcular tu patrimonio neto real (y por qué casi todos lo hacen mal)",
        "How to calculate your real net worth (and why almost everyone gets it wrong)",
      ),
      excerpt: t(
        "Activos menos pasivos suena simple, hasta que aparecen las deudas revolventes, los activos ilíquidos y la inflación.",
        "Assets minus liabilities sounds simple, until revolving debt, illiquid assets and inflation show up.",
      ),
    },
    {
      tag: t("Cash flow", "Cash flow"),
      date: t("28 jun 2026", "Jun 28, 2026"),
      title: t(
        "La regla del runway personal: cuántos meses aguantas sin ingresos",
        "The personal runway rule: how many months you can last without income",
      ),
      excerpt: t(
        "Una métrica de startups aplicada a tu vida: cómo medirla y cómo llevarla de 3 a 12 meses.",
        "A startup metric applied to your life: how to measure it and take it from 3 to 12 months.",
      ),
    },
    {
      tag: t("Inversión", "Investing"),
      date: t("9 jun 2026", "Jun 9, 2026"),
      title: t(
        "Tu portafolio contra el S&P 500: el benchmark que duele pero enseña",
        "Your portfolio vs. the S&P 500: the benchmark that hurts but teaches",
      ),
      excerpt: t(
        "Comparar rendimiento sin engañarte: costo base, dividendos, comisiones y sesgo de supervivencia.",
        "Comparing returns without fooling yourself: cost basis, dividends, fees and survivorship bias.",
      ),
    },
    {
      tag: t("IA", "AI"),
      date: t("21 may 2026", "May 21, 2026"),
      title: t(
        "Clasificación automática de gastos: qué puede y qué no puede hacer la IA",
        "Automatic expense classification: what AI can and can't do",
      ),
      excerpt: t(
        "Cómo entrenamos reglas híbridas para que un traspaso no se cuente como gasto nunca más.",
        "How we trained hybrid rules so a transfer never gets counted as an expense again.",
      ),
    },
    {
      tag: t("Retiro", "Retirement"),
      date: t("3 may 2026", "May 3, 2026"),
      title: t(
        "El número de tu libertad financiera, explicado sin humo",
        "Your financial freedom number, explained with no fluff",
      ),
      excerpt: t(
        "Tasa de retiro segura, secuencia de rendimientos y por qué tu tasa de ahorro pesa más que tu retorno.",
        "Safe withdrawal rate, sequence of returns, and why your savings rate matters more than your return.",
      ),
    },
    {
      tag: t("Hábitos", "Habits"),
      date: t("14 abr 2026", "Apr 14, 2026"),
      title: t(
        "Revisión financiera de 20 minutos al mes",
        "A 20-minute monthly financial review",
      ),
      excerpt: t(
        "El ritual mínimo viable para mantener tu norte sin convertirte en contador de tiempo completo.",
        "The minimum viable ritual to keep your north without becoming a full-time accountant.",
      ),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="pt-10 md:pt-16">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{t("Blog", "Blog")}</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            {t(
              "Ideas prácticas sobre patrimonio, gasto consciente, inversión y automatización con IA.",
              "Practical ideas about net worth, mindful spending, investing and AI automation.",
            )}
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.title} className="surface group flex flex-col p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-elevated px-2.5 py-1 text-primary">{post.tag}</span>
                <span>{post.date}</span>
              </div>
              <h2 className="mt-4 text-base font-semibold leading-snug">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                {t("Leer artículo", "Read article")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </article>
          ))}
        </section>

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
    </div>
  );
}
