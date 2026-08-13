import { createFileRoute } from "@tanstack/react-router";
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

const KID_APP_URL = "https://myfirstnumber.lovable.app/kid/numero";

export const Route = createFileRoute("/my-first-number")({
  head: () => ({
    meta: [
      { title: "My First Number — Educación financiera para niños" },
      {
        name: "description",
        content:
          "El primer número de tus hijos: número de hoy, número del futuro, bolsillos de ahorro, sueños, tareas y cómo crece su dinero.",
      },
      { property: "og:title", content: "My First Number — Educación financiera para niños" },
      {
        property: "og:description",
        content: "Un hub de números para niños: hoy, futuro, ahorro, sueños y tareas en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyFirstNumberLanding,
});

function MyFirstNumberLanding() {
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
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            My First Number
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            {t(
              "Todos sus números en una sola pantalla: número de hoy, número del futuro, bolsillos, sueños, tareas y cómo crece su dinero.",
              "All their numbers on one screen: today's number, future number, pockets, dreams, chores and how their money grows.",
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={KID_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:gap-3"
            >
              {t("Abrir My First Number", "Open My First Number")} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/precios"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t("Ver plan Familiar", "See Family plan")}
            </a>
          </div>
        </motion.section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <a
              href={KID_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:gap-3"
            >
              {t("Entrar a My First Number", "Go to My First Number")} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
