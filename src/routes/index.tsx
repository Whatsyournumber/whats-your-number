import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Brain,
  Compass,
  FileText,
  LineChart,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your north — Tu CFO personal con IA" },
      {
        name: "description",
        content:
          "Consolida patrimonio, gastos, inversiones y cash flow en una sola plataforma. Sube tus estados de cuenta en PDF o CSV y deja que la IA clasifique todo.",
      },
      { property: "og:title", content: "Your north — Tu CFO personal con IA" },
      {
        property: "og:description",
        content: "Patrimonio, gastos, portafolio e insights con IA. Importa PDF y CSV en segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: FileText,
    title: "Importación inteligente",
    desc: "Sube el PDF de tu tarjeta o un CSV bancario. La IA extrae fecha, comercio, monto y categoría.",
  },
  {
    icon: PieChart,
    title: "Análisis de gastos",
    desc: "Categorías, subcategorías, comercios recurrentes y presupuestos vivos mes a mes.",
  },
  {
    icon: LineChart,
    title: "Patrimonio y portafolio",
    desc: "Activos, pasivos, asignación y rendimiento contra el mercado en un solo panel.",
  },
  {
    icon: Bot,
    title: "AI Advisor",
    desc: "Pregunta en lenguaje natural y recibe insights, anomalías y proyecciones de retiro.",
  },
];

const whyCards = [
  {
    icon: Compass,
    title: "Claridad total",
    desc: "Deja de perder el rastro entre apps, hojas de cálculo y PDFs. Tu panorama financiero completo en un solo lugar.",
  },
  {
    icon: Brain,
    title: "IA que trabaja por ti",
    desc: "Clasificación automática, detección de anomalías y respuestas a tus preguntas en lenguaje natural.",
  },
  {
    icon: Target,
    title: "Decisiones con propósito",
    desc: "Conecta tus gastos de hoy con tus metas de mañana: ahorro, inversión, retiro y estilo de vida.",
  },
  {
    icon: TrendingUp,
    title: "Crecimiento constante",
    desc: "Proyecciones de patrimonio, simuladores de retiro y seguimiento de tu portafolio contra el mercado.",
  },
];

const metrics = [
  { label: "Módulos", value: "10" },
  { label: "Clasificación IA", value: "PDF · CSV" },
  { label: "Datos cifrados", value: "100%" },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />

      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pt-16 text-center md:pt-24"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Tu family office personal, potenciado con IA
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            Encuentra tu rumbo con
            <span className="block bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              toda tu economía clara
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Patrimonio, gastos, cash flow, inversiones y retiro en una sola plataforma. Sube tus estados de cuenta y la
            IA hace el resto.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 rounded-full px-6">
              <Link to="/auth" search={{ mode: "signup" }}>
                Empieza gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/auth" search={{ mode: "login" }}>
                Ya tengo cuenta
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label} className="surface px-5 py-4 text-left">
                <p className="numeric text-xl font-semibold">{m.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="mt-24 md:mt-32">
          <div className="mb-10 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">¿Por qué Your north?</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Tu dinero, con dirección
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Deja de navegar a ciegas. Conecta cuentas, tarjetas e inversiones para ver por dónde entra, por dónde
              sale y hacia dónde crece.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {whyCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="surface group relative overflow-hidden p-6"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-elevated ring-1 ring-border">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-sm font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-24 md:mt-32">
          <div className="mb-8 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">Así se ve por dentro</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Un panel vivo, no una hoja de cálculo
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Cambia entre patrimonio, gastos y portafolio. Todo se actualiza en tiempo real conforme importas tus
              estados de cuenta.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <ProductPreview />
          </motion.div>
        </section>

        <section id="funciones" className="mt-24 scroll-mt-24 grid gap-4 md:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="surface p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated">
                <f.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h2 className="mt-4 text-sm font-semibold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-24 md:mt-32">
          <div className="mb-10 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">Lo que dicen</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Personas que ya encontraron su norte
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((r, i) => (
              <motion.figure
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="surface flex flex-col p-6"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">“{r.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-primary ring-1 ring-border">
                    {r.initials}
                  </span>
                  <span className="text-xs">
                    <span className="block font-medium text-foreground">{r.name}</span>
                    <span className="text-muted-foreground">{r.role}</span>
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>


        <section className="surface mt-16 flex flex-wrap items-center gap-6 p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Tus archivos se guardan cifrados y privados: solo tú puedes verlos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Autenticación con email o Google.</p>
          </div>
          <Button asChild className="ml-auto rounded-full">
            <Link to="/auth" search={{ mode: "signup" }}>
              Crear mi cuenta
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
