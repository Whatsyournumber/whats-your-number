import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarCheck,
  Gift,
  PiggyBank,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/finanzas-para-ninos")({
  head: () => ({
    meta: [
      { title: "Finanzas para niños — WhatsYournumber" },
      {
        name: "description",
        content:
          "El primer número de tus hijos: número de hoy, número del futuro, bolsillos de ahorro, sueños, tareas y cómo crece su dinero.",
      },
      { property: "og:title", content: "Finanzas para niños — WhatsYournumber" },
      {
        property: "og:description",
        content: "Un hub de números para niños: hoy, futuro, ahorro, sueños y tareas en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsFinanceLanding,
});

function KidPreview() {
  const t = useT();

  const pockets = [
    { label: t("Gastar", "Spend"), value: "€24", pct: 20 },
    { label: t("Ahorrar", "Save"), value: "€60", pct: 50 },
    { label: t("Invertir", "Invest"), value: "€24", pct: 20 },
    { label: t("Compartir", "Share"), value: "€12", pct: 10 },
  ];

  return (
    <div className="surface glow relative overflow-hidden p-6 md:p-8">
      <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="relative grid gap-4 md:grid-cols-2">
        <div className="surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("Número de hoy", "Today's number")}
          </p>
          <p className="numeric mt-2 text-4xl font-semibold">€120</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Ahorrando €10 por semana", "Saving €10 every week")}
          </p>
          <div className="mt-5 rounded-xl bg-primary/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-primary">
              {t("Número del futuro", "Future number")}
            </p>
            <p className="numeric mt-1 text-2xl font-semibold">€1,480</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("En 2 años si sigue así", "In 2 years if they keep going")}
            </p>
          </div>
        </div>

        <div className="surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("Bolsillos", "Pockets")}</p>
          <ul className="mt-4 space-y-3">
            {pockets.map((p) => (
              <li key={p.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="numeric font-medium">{p.value}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-elevated px-4 py-3">
            <span className="text-xs text-muted-foreground">{t("Sueño: bici nueva", "Dream: new bike")}</span>
            <span className="numeric text-xs font-medium text-primary">62%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KidsFinanceLanding() {
  const t = useT();

  const features = [
    {
      icon: Wallet,
      title: t("Número de hoy", "Today's number"),
      desc: t(
        "Cuánto dinero tiene disponible ahora mismo, explicado con lenguaje simple.",
        "How much money they have right now, explained in simple language.",
      ),
    },
    {
      icon: Rocket,
      title: t("Número del futuro", "Future number"),
      desc: t(
        "Proyecta a cuánto puede llegar su dinero si sigue ahorrando cada semana.",
        "Projects how far their money can go if they keep saving every week.",
      ),
    },
    {
      icon: PiggyBank,
      title: t("Bolsillos", "Pockets"),
      desc: t(
        "Separa el dinero en gastar, ahorrar, invertir y compartir.",
        "Splits money into spend, save, invest and share.",
      ),
    },
    {
      icon: Target,
      title: t("Sueños", "Dreams"),
      desc: t(
        "Metas visuales con barra de progreso: la bici, el viaje o el videojuego.",
        "Visual goals with progress bars: the bike, the trip or the video game.",
      ),
    },
    {
      icon: CalendarCheck,
      title: t("Tareas", "Chores"),
      desc: t(
        "Tareas de casa que se convierten en ingresos y en hábitos.",
        "Household chores that turn into income and habits.",
      ),
    },
    {
      icon: TrendingUp,
      title: t("Cómo crece tu dinero", "How money grows"),
      desc: t(
        "Interés compuesto explicado para niños, con gráficas que se entienden.",
        "Compound interest explained for kids, with charts they understand.",
      ),
    },
  ];

  const steps = [
    {
      title: t("1. Los papás activan el plan Familiar", "1. Parents activate the Family plan"),
      desc: t(
        "Desde WhatsYournumber creas el perfil de cada hijo en segundos.",
        "From WhatsYournumber you create each child's profile in seconds.",
      ),
    },
    {
      title: t("2. El niño entra a su pantalla", "2. The kid opens their screen"),
      desc: t(
        "Una interfaz simple, colorida y sin ruido: solo sus números.",
        "A simple, colorful, noise-free interface: just their numbers.",
      ),
    },
    {
      title: t("3. Aprende ahorrando de verdad", "3. They learn by really saving"),
      desc: t(
        "Cada tarea, sueño y bolsillo le enseña a decidir con su propio dinero.",
        "Every chore, dream and pocket teaches them to decide with their own money.",
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pt-16">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Para los más pequeños de la casa", "For the youngest in the house")}
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
            {t("Finanzas para niños", "Kids finance")}
            <span className="block text-primary">
              {t("su primer número, hoy", "their first number, today")}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            {t(
              "Todos sus números en una sola pantalla: número de hoy, número del futuro, bolsillos, sueños, tareas y cómo crece su dinero.",
              "All their numbers on one screen: today's number, future number, pockets, dreams, chores and how their money grows.",
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:gap-3"
            >
              {t("Activar plan Familiar", "Activate Family plan")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t("Crear cuenta gratis", "Create free account")}
            </Link>
          </div>
        </motion.section>

        <section className="mt-16">
          <KidPreview />
        </section>

        <section className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="surface p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            {t("Cómo funciona", "How it works")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="surface p-6">
                <h3 className="font-display text-base font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface glow relative mt-24 overflow-hidden p-10 text-center md:p-14">
          <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="relative">
            <Gift className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {t("Su primer número empieza hoy", "Their first number starts today")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t(
                "Incluido en el plan Familiar de WhatsYournumber: tú gestionas tu patrimonio, ellos aprenden con el suyo.",
                "Included in the WhatsYournumber Family plan: you manage your wealth, they learn with theirs.",
              )}
            </p>
            <Link
              to="/precios"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:gap-3"
            >
              {t("Ver plan Familiar", "See Family plan")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
