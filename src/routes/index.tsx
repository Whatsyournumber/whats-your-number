import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Crosshair,
  FileText,
  LineChart,
  Lock,
  PieChart,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";



import ctaLifestyle from "@/assets/cta-lifestyle.jpg";
import { BrandLogo } from "@/components/brand-logo";
import { ProductPreview } from "@/components/product-preview";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhatsYournumber — Tu CFO personal con IA" },
      {
        name: "description",
        content:
          "Consolida patrimonio, gastos, inversiones y cash flow en una sola plataforma. Sube tus estados de cuenta en PDF o CSV y deja que la IA clasifique todo.",
      },
      { property: "og:title", content: "WhatsYournumber — Tu CFO personal con IA" },
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

function DemoCard() {
  const t = useT();

  const steps = [
    { label: t("Gasto mensual ideal", "Ideal monthly spending"), value: "€5,000" },
    { label: t("Patrimonio hoy", "Net worth today"), value: "€350,000" },
    { label: t("Inversión mensual", "Monthly investment"), value: "€2,000" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
      className="mt-16"
    >
      <Link to="/demo" search={{ start: 1 }} className="group block">
        <div className="surface glow relative overflow-hidden p-8 transition-transform duration-300 hover:scale-[1.01] md:p-12">
          <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="max-w-md text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Demo gratis", "Free demo")}
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {t("Descubre tu número en 30 segundos", "Discover your number in 30 seconds")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(
                  "3 preguntas. Sin registro. Sin conectar bancos. Solo tu ritmo, tu patrimonio y tu meta.",
                  "3 questions. No sign-up. No bank connections. Just your pace, your net worth and your goal.",
                )}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all group-hover:gap-3">
                {t("Probar ahora", "Try now")} <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="relative flex h-52 w-52 shrink-0 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/15 blur-3xl" />
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full border border-primary/30"
                  initial={{ width: 120, height: 120, opacity: 0.6 }}
                  animate={{ width: 208, height: 208, opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity, delay: i, ease: "easeOut" }}
                />
              ))}
              <motion.span
                className="absolute h-44 w-44 rounded-full border border-dashed border-primary/25"
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-40 w-40 items-center justify-center rounded-full bg-elevated ring-1 ring-border transition-transform duration-300 group-hover:scale-105"
              >
                <span className="absolute inset-3 rounded-full ring-1 ring-primary/40" />
                <Target className="absolute h-24 w-24 text-primary/20" strokeWidth={1} />
                <BrandLogo className="relative h-12 w-12" />
              </motion.div>
            </div>

          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="surface px-4 py-3 text-center"
              >
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="numeric mt-1 text-lg font-semibold">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Link>
    </motion.section>
  );
}

function Landing() {
  const t = useT();

  const features = [
    {
      icon: FileText,
      title: t("Importación inteligente", "Smart import"),
      desc: t(
        "Sube el PDF de tu tarjeta o un CSV bancario. La IA extrae fecha, comercio, monto y categoría.",
        "Upload your card's PDF or a bank CSV. The AI extracts date, merchant, amount and category.",
      ),
    },
    {
      icon: PieChart,
      title: t("Análisis de gastos", "Spending analysis"),
      desc: t(
        "Categorías, subcategorías, comercios recurrentes y presupuestos vivos mes a mes.",
        "Categories, subcategories, recurring merchants and live budgets month after month.",
      ),
    },
    {
      icon: LineChart,
      title: t("Patrimonio y portafolio", "Net worth and portfolio"),
      desc: t(
        "Activos, pasivos, asignación y rendimiento contra el mercado en un solo panel.",
        "Assets, liabilities, allocation and performance against the market in a single view.",
      ),
    },
    {
      icon: Bot,
      title: "AI Advisor",
      desc: t(
        "Pregunta en lenguaje natural y recibe insights, anomalías y proyecciones de retiro.",
        "Ask in plain language and get insights, anomalies and retirement projections.",
      ),
    },
  ];

  const whyCards = [
    {
      icon: ScanEye,
      title: t("Claridad total", "Total clarity"),
      desc: t(
        "Toda tu información financiera en un solo panel.",
        "All your financial information in one place.",
      ),
    },
    {
      icon: Sparkles,
      title: "AI Advisor",
      desc: t(
        "Clasifica automáticamente y detecta dónde ahorrar.",
        "Automatically classifies and spots where to save.",
      ),
    },
    {
      icon: Crosshair,
      title: t("Tu número, siempre", "Your number, always"),
      desc: t(
        "Sabe cuánto necesitas para ser libre y qué tan cerca estás.",
        "Know how much you need to be free and how close you are.",
      ),
    },
  ];




  const reviews = [
    {
      name: "Mariana Robles",
      role: t("Fundadora de agencia · CDMX", "Agency founder · Mexico City"),
      initials: "MR",
      quote: t(
        "Antes tenía tres hojas de cálculo y cero claridad. Subí seis meses de estados de cuenta y en minutos vi a dónde se iba realmente mi dinero.",
        "I used to have three spreadsheets and zero clarity. I uploaded six months of statements and in minutes saw where my money was really going.",
      ),
    },
    {
      name: "Diego Fernández",
      role: t("Ingeniero de software · Madrid", "Software engineer · Madrid"),
      initials: "DF",
      quote: t(
        "El módulo de portafolio comparado con el S&P 500 me hizo cambiar dos posiciones. Es la primera app de finanzas que se siente hecha para pensar, no solo para registrar.",
        "The portfolio module compared to the S&P 500 made me change two positions. It's the first finance app that feels built for thinking, not just recording.",
      ),
    },
    {
      name: "Camila Ortiz",
      role: t("Médica · Bogotá", "Doctor · Bogotá"),
      initials: "CO",
      quote: t(
        "La IA detectó suscripciones que llevaba dos años pagando sin usar. Se pagó sola el primer mes y ahora reviso mi patrimonio en cinco minutos.",
        "The AI detected subscriptions I'd been paying for two years without using. It paid for itself the first month and now I review my net worth in five minutes.",
      ),
    },
  ];

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
            {t("Tu family office personal, potenciado con IA", "Your personal family office, powered by AI")}
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            {t("Todo tu dinero", "All your money")}
            <span className="block bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              {t("entendido en 30 segundos", "understood in 30 seconds")}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            {t(
              "Patrimonio, gastos, cash flow, inversiones y retiro en una sola plataforma. Sube tus estados de cuenta y la IA hace el resto.",
              "Net worth, spending, cash flow, investments and retirement in a single platform. Upload your statements and let the AI do the rest.",
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 rounded-full px-6">
              <Link to="/demo" search={{ start: 1 }}>
                {t("Descubre tu número", "Discover your number")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("Empieza gratis", "Start for free")}
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Gratis y sin registro · 3 preguntas · 30 segundos", "Free, no sign-up · 3 questions · 30 seconds")}
          </p>
        </motion.section>

        <section className="mt-16 md:mt-20">
          <div className="mb-8 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {t("¿Por qué WhatsYournumber?", "Why WhatsYournumber?")}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {whyCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-card/40 p-6 backdrop-blur-sm transition-colors hover:bg-card/60"
              >
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-elevated/40 ring-1 ring-primary/10 transition-all group-hover:ring-primary/30">
                  <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <card.icon className="relative h-5 w-5 text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{card.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground/80">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>



        <section className="mt-24 md:mt-32">

          <div className="mb-8 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {t("Así se ve por dentro", "This is what it looks like inside")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Un panel vivo, no una hoja de cálculo", "A living dashboard, not a spreadsheet")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t(
                "Cambia entre patrimonio, gastos y portafolio. Todo se actualiza en tiempo real conforme importas tus estados de cuenta.",
                "Switch between net worth, spending and portfolio. Everything updates in real time as you import your statements.",
              )}
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




        <section id="funciones" className="mt-24 scroll-mt-24 md:mt-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {t("Cómo funciona", "How it works")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Tu dinero, con dirección", "Your money, with direction")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t(
                "Deja de navegar a ciegas. Conecta cuentas, tarjetas e inversiones para ver por dónde entra, por dónde sale y hacia dónde crece.",
                "Stop navigating blind. Connect accounts, cards and investments to see where it comes in, where it goes out and where it's growing.",
              )}
            </p>
          </motion.div>

          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="surface glow relative overflow-hidden"
            >
              <img
                src={ctaLifestyle}
                alt={t(
                  "Pareja revisando sus finanzas en casa con WhatsYournumber",
                  "Couple reviewing their finances at home with WhatsYournumber",
                )}
                loading="lazy"
                width={1280}
                height={960}
                className="h-full min-h-[420px] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
                <h3 className="max-w-sm font-display text-2xl font-semibold tracking-tight md:text-3xl">
                  {t("¿Cuál es tu número?", "What's your number?")}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {t(
                    "Responde 3 preguntas y descúbrelo gratis en 30 segundos.",
                    "Answer 3 questions and find out free in 30 seconds.",
                  )}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="gap-2 rounded-full px-6">
                    <Link to="/demo" search={{ start: 1 }}>
                      {t("Probar demo gratis", "Try free demo")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                    <Link to="/auth" search={{ mode: "signup" }}>
                      {t("Crear mi cuenta", "Create my account")}
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="surface flex gap-4 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elevated">
                    <f.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </section>

        <DemoCard />

        <section className="mt-24 md:mt-32">

          <div className="mb-10 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {t("Lo que dicen", "What people say")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Personas que ya encontraron su número", "People who already found their number")}
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
              {t(
                "Tus archivos se guardan cifrados y privados: solo tú puedes verlos.",
                "Your files are stored encrypted and private: only you can see them.",
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("Autenticación con email o proveedor seguro.", "Authentication via email or a secure provider.")}
            </p>
          </div>
          <Button asChild className="ml-auto rounded-full">
            <Link to="/auth" search={{ mode: "signup" }}>
              {t("Crear mi cuenta", "Create my account")}
            </Link>
          </Button>
        </section>




      </main>
    </div>
  );
}
