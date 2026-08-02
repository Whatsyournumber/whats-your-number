import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";

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

const posts = [
  {
    tag: "Patrimonio",
    date: "12 jul 2026",
    title: "Cómo calcular tu patrimonio neto real (y por qué casi todos lo hacen mal)",
    excerpt:
      "Activos menos pasivos suena simple, hasta que aparecen las deudas revolventes, los activos ilíquidos y la inflación.",
  },
  {
    tag: "Cash flow",
    date: "28 jun 2026",
    title: "La regla del runway personal: cuántos meses aguantas sin ingresos",
    excerpt: "Una métrica de startups aplicada a tu vida: cómo medirla y cómo llevarla de 3 a 12 meses.",
  },
  {
    tag: "Inversión",
    date: "9 jun 2026",
    title: "Tu portafolio contra el S&P 500: el benchmark que duele pero enseña",
    excerpt: "Comparar rendimiento sin engañarte: costo base, dividendos, comisiones y sesgo de supervivencia.",
  },
  {
    tag: "IA",
    date: "21 may 2026",
    title: "Clasificación automática de gastos: qué puede y qué no puede hacer la IA",
    excerpt: "Cómo entrenamos reglas híbridas para que un traspaso no se cuente como gasto nunca más.",
  },
  {
    tag: "Retiro",
    date: "3 may 2026",
    title: "El número de tu libertad financiera, explicado sin humo",
    excerpt: "Tasa de retiro segura, secuencia de rendimientos y por qué tu tasa de ahorro pesa más que tu retorno.",
  },
  {
    tag: "Hábitos",
    date: "14 abr 2026",
    title: "Revisión financiera de 20 minutos al mes",
    excerpt: "El ritual mínimo viable para mantener tu norte sin convertirte en contador de tiempo completo.",
  },
];

function Blog() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="pt-10 md:pt-16">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Blog</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Ideas prácticas sobre patrimonio, gasto consciente, inversión y automatización con IA.
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
                Leer artículo
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </article>
          ))}
        </section>

        <section className="surface mt-12 flex flex-wrap items-center gap-4 p-8">
          <p className="text-sm text-muted-foreground">
            ¿Quieres aplicar todo esto en tu propio panel? Crea tu cuenta y empieza hoy.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Empezar gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
