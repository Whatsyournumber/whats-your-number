import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Crosshair,
  FileText,
  Globe,
  Home,
  LineChart,
  Lock,
  PieChart,
  Route as RouteIcon,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";




import ctaLifestyle from "@/assets/cta-lifestyle.jpg";
import heroManLaptopAsset from "@/assets/hero-man-laptop.jpg.asset.json";


import { useLiveCount, formatCount } from "@/components/live-count";
import { RotatingAvatars } from "@/components/rotating-avatars";
import { ProductPreview } from "@/components/product-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useLanguage, useT } from "@/hooks/use-language";
import { HOME_FAQS, buildLandingFaqJsonLd } from "@/lib/landing-faqs";
import { useEffect } from "react";

/** Renderiza la descripción resaltando la frase clave con una línea de gradiente sutil. */
function HighlightDesc({ desc, highlight }: { desc: string; highlight?: string }) {
  if (!highlight || !desc.includes(highlight)) return <>{desc}</>;
  const idx = desc.indexOf(highlight);
  return (
    <>
      {desc.slice(0, idx)}
      <span className="relative">
        {highlight}
        <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20" />
      </span>
      {desc.slice(idx + highlight.length)}
    </>
  );
}

const META_TITLE_ES = "Controla tus Gastos, Patrimonio y Libertad Financiera";
const META_DESC_ES =
  "Controla tus gastos e ingresos, patrimonio e inversiones, y descubre cuánto necesitas para tu retiro y libertad financiera. Potenciado por IA | Comienza ya";
const SOCIAL_TITLE_ES = "La libertad financiera tiene un número. ¿Cuál es el tuyo?";
const SOCIAL_DESC_ES =
  "Controla tus gastos, patrimonio e inversiones y descubre cuánto necesitas para alcanzar tu libertad financiera. Potenciado por IA | Comienza ya";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: META_TITLE_ES },
      { name: "description", content: META_DESC_ES },
      { property: "og:title", content: SOCIAL_TITLE_ES },
      { property: "og:description", content: SOCIAL_DESC_ES },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SOCIAL_TITLE_ES },
      { name: "twitter:description", content: SOCIAL_DESC_ES },
      { property: "og:url", content: "https://whatsyour-number.com" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "es-ES", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "es-MX", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "es-AR", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "es-CO", href: "https://whatsyour-number.com" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com" },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "Blog de WhatsYourNumber",
        href: "https://whatsyour-number.com/api/public/rss",
      },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "WhatsYourNumber Blog (EN)",
        href: "https://whatsyour-number.com/api/public/rss?lang=en",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://whatsyour-number.com/#organization",
              name: "WhatsYourNumber",
              url: "https://whatsyour-number.com",
              logo: "https://whatsyour-number.com/og-cover.jpg",
              slogan: "La libertad financiera tiene un número",
              knowsLanguage: ["es", "en"],
              areaServed: [
                { "@type": "Country", name: "España" },
                { "@type": "Country", name: "México" },
                { "@type": "Country", name: "Argentina" },
                { "@type": "Country", name: "Colombia" },
                { "@type": "Country", name: "Chile" },
                { "@type": "Country", name: "Estados Unidos" },
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://whatsyour-number.com/#website",
              url: "https://whatsyour-number.com",
              name: "WhatsYourNumber",
              inLanguage: ["es-ES", "en-US"],
              publisher: { "@id": "https://whatsyour-number.com/#organization" },
            },
            {
              "@type": "SoftwareApplication",
              name: "WhatsYourNumber",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              inLanguage: ["es-ES", "en-US"],
              url: "https://whatsyour-number.com",
              publisher: { "@id": "https://whatsyour-number.com/#organization" },
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(buildLandingFaqJsonLd(HOME_FAQS, "es")),
      },
    ],
  }),

  component: Landing,
});

function DemoCard() {
  const t = useT();

  const steps = [
    { label: t("Gasto mensual ideal", "Ideal monthly spending"), value: "€5,000" },
    { label: t("Patrimonio hoy", "Net worth today"), value: "€350,000" },
    { label: t("Tu número", "Your number"), value: "€1.5M" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
      className="mt-24 md:mt-32"
    >
      <div className="mb-10 text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          {t("Descubre tu número", "Discover your number")}
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {t("La libertad financiera tiene un número. ¿Cuál es el tuyo?", "Financial freedom has a number. What's yours?")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {t("Conoce tu número. Comienza a vivir libremente.", "Know your number. Live freely.")}
        </p>
      </div>



      <Link to={demoTo} search={{ start: 1 }} className="group block">
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
                {t("Probar ahora gratis", "Try now for free")} <ArrowRight className="h-4 w-4" />
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
                <span className="relative font-display text-6xl font-bold leading-none text-primary">?</span>
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

export function Landing() {
  const t = useT();
  const { lang } = useLanguage();
  const demoTo = lang === "en" ? "/en/demo" : "/demo";
  const liveCount = useLiveCount(1200);
  const { user, loading: authLoading } = useAuth();
  const { isPatrimonio, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  const loading = authLoading || subscriptionLoading;

  useEffect(() => {
    if (loading || !user) return;
    // Solo redirige la primera vez tras iniciar sesión; si el usuario vuelve
    // al home a propósito (logo), se queda aquí.
    if (sessionStorage.getItem("wyn_chooser_seen") === "1") return;
    sessionStorage.setItem("wyn_chooser_seen", "1");
    // El plan Familiar siempre entra por el selector de perfiles.
    navigate({ to: isPatrimonio ? "/ninos" : "/dashboard", replace: true });
  }, [loading, user, isPatrimonio, navigate]);

  const features = [
    {
      icon: PieChart,
      title: t("Análisis de tus gastos", "Your Spending Analysis"),
      desc: t(
        "Sube tus estados de cuenta y en menos de 30 segundos la IA categoriza cada movimiento, compara, detecta sobrecostos y te dice exactamente dónde puedes ahorrar.",
        "Upload your statements and in under 30 seconds the AI categorizes every transaction, compares, detects overspending and tells you exactly where you can save.",
      ),
      highlight: t("detecta sobrecostos", "detects overspending"),
    },
    {
      icon: Home,
      title: t("Análisis de tu hipoteca", "Your Mortgage Analysis"),
      desc: t(
        "No pagues más intereses de los necesarios. Entiende el verdadero costo de tu hipoteca, compara tasas, simula pagos anticipados y descubre cuánto dinero puedes ahorrar.",
        "Don't pay more interest than necessary. Understand the true cost of your mortgage, compare rates, simulate early payments and find out how much money you can save.",
      ),
      highlight: t("No pagues más", "Don't pay more"),
    },
    {
      icon: LineChart,
      title: t("Tu Patrimonio & Portfolio", "Investment & Net Worth Tracker"),
      desc: t(
        "Por fin entiende cuánto vales. Organiza todo tu patrimonio en un solo lugar, sigue tus activos en tiempo real y analiza su rendimiento, riesgo e ingresos pasivos.",
        "Finally understand how much you're worth. Organize all your wealth in one place, track your assets in real time and analyze their performance, risk and passive income.",
      ),
      highlight: t("cuánto vales", "how much you're worth"),
    },
    {
      icon: RouteIcon,
      title: t("Tu Plan de Vida", "Your Life Plan"),
      desc: t(
        "Simula las decisiones más importantes de tu vida —comprar, emprender, casarte, mudarte— y ve cómo impactan tu patrimonio y retiro.",
        "Simulate life's biggest decisions —buying, starting a business, marrying, moving— and see how they impact your wealth and retirement.",
      ),
      highlight: t("Simula las decisiones", "Simulate the decisions"),
    },
    {
      icon: Globe,
      title: t("Tu Próxima Ciudad", "Your Next City"),
      desc: t(
        "Comparador de costo de vida con más de 150 ciudades: salarios, impuestos, clima y seguridad. Encuentra dónde tu dinero rinde más.",
        "Cost of living comparison across 150+ cities: salaries, taxes, climate and safety. Find where your money goes further.",
      ),
      highlight: t("tu dinero rinde más", "your money goes further"),
    },
    {
      icon: Bot,
      title: t("Tu Copiloto Financiero IA", "Your AI Financial Copilot"),
      desc: t(
        "Importa tus estados de cuenta y conversa con la IA en lenguaje natural. Recibe análisis e insights sobre tus gastos, patrimonio y metas.",
        "Import your statements and chat with AI in plain language. Get analysis and insights on your spending, wealth and goals.",
      ),
      highlight: t("análisis e insights", "analysis and insights"),
    },
  ];

  const panelChips = [
    t("Portafolio en vivo", "Live portfolio"),
    t("Análisis de tus gastos", "Your Spending Analysis"),
    t("Análisis de tu hipoteca", "Your Mortgage Analysis"),
    t("Cash flow 40/40/20", "40/40/20 cash flow"),
    t("Tu Plan de Vida", "Your Life Plan"),
    t("Tu Próxima Ciudad", "Your Next City"),
  ];

  const whyCards = [
    {
      icon: PieChart,
      number: "01",
      titleLight: t("Entiende dónde va", "Understand where"),
      titleAccent: t("tu dinero.", "your money goes."),
      desc: t(
        "Carga tus estados financieros y obtén claridad sobre tus gastos en menos de 30 segundos.",
        "Upload your financial statements and get clarity on your spending in under 30 seconds.",
      ),
    },
    {
      icon: Target,
      number: "02",
      titleLight: t("Descubre cuándo", "Discover when"),
      titleAccent: t("puedes dejar de trabajar.", "you can stop working."),
      desc: t(
        "Usa la calculadora de patrimonio y jubilación para conocer el capital que necesitas para vivir de tus rendimientos y cuánto te falta para llegar.",
        "Use the net worth and retirement calculator to know the capital you need to live off your returns and how far you are from getting there.",
      ),
    },
    {
      icon: Bot,
      number: "03",
      titleLight: t("Pregúntale a tu", "Ask your"),
      titleAccent: t("IA Financial Advisor.", "AI Financial Advisor."),
      desc: t(
        "Tu asesor conoce tus números, analiza escenarios y te ayuda a tomar mejores decisiones financieras.",
        "Your advisor knows your numbers, analyzes scenarios and helps you make better financial decisions.",
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

      <div className="absolute inset-x-0 top-0 z-30">
        <SiteHeader />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 md:pb-12">

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative left-1/2 w-screen -translate-x-1/2"
        >
          {/* Full-bleed editorial photo, fused with the background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] md:block lg:w-[54%]"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0.75) 52%, #000 90%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0.75) 52%, #000 90%)",
            }}

          >
            <img
              src={heroManLaptopAsset.url}
              alt={t("cuál es tu número para retiro", "what is your number for retirement")}
              width={1536}
              height={1024}
              className="h-full w-full object-cover object-[18%_78%] md:object-[20%_82%] lg:object-[22%_86%]"
              loading="eager"
              fetchPriority="high"
            />
            {/* Soft edge blur for premium fusion */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-[22%]"
              style={{
                background:
                  "linear-gradient(to right, var(--background) 0%, transparent 100%)",
                filter: "blur(28px)",
                WebkitFilter: "blur(28px)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/30" />
          </motion.div>

          {/* Mobile: the photo is the top of the background itself */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[46vh] min-h-[320px] md:hidden"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
            }}
          >
            <img
              src={heroManLaptopAsset.url}
              alt={t("cuál es tu número para retiro", "what is your number for retirement")}
              aria-hidden
              className="h-full w-full object-cover object-[70%_28%]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/20" />
          </div>



          <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl pb-8 pt-[46vh] text-center md:max-w-[56%] md:pb-12 md:pt-28 md:text-left lg:max-w-2xl lg:pb-16 lg:pt-44">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur md:text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {t("Tu family office personal, potenciado con IA", "Your personal family office, powered by AI")}
              </span>
              <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:mx-0 md:text-[2.15rem] lg:text-6xl">
                {t("Todo tu dinero", "All your money")}
                <span className="block bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                  {t("entendido en 30 segundos", "understood in 30 seconds")}
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground md:mx-0 md:text-sm lg:text-base">
                {t(
                  "Controla tus gastos e ingresos, patrimonio e inversiones, y descubre cuánto necesitas para tu retiro y libertad financiera. Todo en un solo lugar, potenciado por IA.",
                  "Track your income and expenses, net worth and investments, and discover how much you need for retirement and financial freedom. All in one place, powered by AI.",
                )}
              </p>


              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Button asChild size="lg" className="gap-2 rounded-full px-6">
                  <Link to={demoTo} search={{ start: 1 }}>
                    {t("Descubre tu número", "Discover your number")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    {t("Empieza gratis", "Start for free")}
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
                <RotatingAvatars />
                <span className="text-sm text-muted-foreground">
                  {t(
                    `+${formatCount(liveCount, "es")} personas ya descubrieron su número`,
                    `+${formatCount(liveCount, "en")} people already found their number`,
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* Soft bottom fade into next section */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-56 md:h-72"
            style={{
              background:
                "linear-gradient(to top, var(--background) 0%, color-mix(in oklab, var(--background) 75%, transparent) 28%, color-mix(in oklab, var(--background) 35%, transparent) 58%, transparent 100%)",
            }}
          />
        </motion.section>

        <section>




          <div className="mb-8 mt-4 text-center md:mt-6">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {t("¿Por qué WhatsYourNumber?", "Why WhatsYourNumber?")}
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {t("Tu dinero. Tu número. Tu plan.", "Your money. Your number. Your plan.")}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-xs text-muted-foreground sm:text-sm md:whitespace-nowrap">
              {t(
                "Sabe dónde estás, cuánto necesitas y cómo llegar.",
                "Know where you are, how much you need and how to get there.",
              )}
            </p>

          </div>


          <div className="grid gap-4 text-left md:grid-cols-3">
            {whyCards.map((card, i) => (
              <motion.div
                key={card.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/20 hover:bg-card/70"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background ring-1 ring-primary/20 shadow-sm">
                  <card.icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
                </div>

                <div className="relative mt-4">
                  <h3 className="min-h-[3.5rem] text-lg font-semibold leading-snug tracking-tight">
                    <span className="text-foreground">{card.titleLight}</span>
                    <br />
                    <span className="text-primary">{card.titleAccent}</span>
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-relaxed text-muted-foreground/80">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 h-0.5 w-8 rounded-full bg-primary/80 transition-all duration-300 group-hover:w-12" />
              </motion.div>
            ))}
          </div>

        </section>





        <section className="relative mt-24 md:mt-32">
          <div className="wealth-gradient pointer-events-none absolute left-1/2 top-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />

          <div className="relative mb-8 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {t("Así se ve por dentro", "This is what it looks like inside")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Un panel vivo, no una hoja de cálculo", "A living dashboard, not a spreadsheet")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t(
                "Patrimonio, gastos, portafolio, retiro y tus próximas decisiones de vida. Todo se recalcula en tiempo real conforme importas tus estados de cuenta.",
                "Net worth, spending, portfolio, retirement and your next life decisions. Everything recalculates in real time as you import your statements.",
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {panelChips.map((chip, i) => (
                <span
                  key={chip}
                  className={
                    "rounded-full border border-border/60 bg-card/50 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur" +
                    (i === panelChips.length - 1 ? " hidden md:inline-block" : "")
                  }
                >
                  {chip}
                </span>
              ))}
            </div>

          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[28px] border border-white/[0.07] bg-card/40 p-2 shadow-2xl backdrop-blur md:p-3"
          >
            <div className="flex items-center gap-2 px-3 pb-2 pt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-negative/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-positive/40" />
              <span className="mx-auto rounded-full bg-elevated/70 px-3 py-1 text-[10px] text-muted-foreground">
                {t("Tu propio dashboard a tu medida en 1 click", "Your own tailored dashboard in 1 click")}
              </span>
            </div>
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
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              {t(
                "Cuéntanos tu objetivo —libertad financiera, tu primera hipoteca, crear un negocio, estudiar un MBA, mudarte de país o tener el control de tu dinero. La IA te muestra el camino para alcanzarlo.",
                "Tell us your goal —financial freedom, your first mortgage, starting a business, an MBA, moving abroad or taking control of your money. Built for personal finance for families, the AI shows you the path to reach it.",
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
                alt={t("finanzas personales para familias", "personal finance for families")}
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
                  <span className="sm:hidden">{t("Descúbrelo gratis en 30 segundos.", "Find out free in 30 seconds.")}</span>
                  <span className="hidden sm:inline">
                    {t(
                      "Tu número para retiro en 3 preguntas: descúbrelo gratis en 30 segundos.",
                      "Your retirement number in 3 questions: find out free in 30 seconds.",
                    )}
                  </span>
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="gap-2 rounded-full px-6">
                    <Link to={demoTo} search={{ start: 1 }}>
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      <HighlightDesc desc={f.desc} highlight={f.highlight} />
                    </p>
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
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t(
                "Historias reales de usuarios que pasaron de la confusión a la claridad financiera.",
                "Real stories from users who moved from confusion to financial clarity.",
              )}
            </p>
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

        <FaqSection
          faqs={HOME_FAQS}
          eyebrow={t("Preguntas frecuentes", "FAQ")}
          title={t("Todo lo que necesitas saber", "Everything you need to know")}
          subtitle={t(
            "Respuestas claras sobre cómo calcular tu número, proteger tus datos y usar WhatsYournumber en familia.",
            "Clear answers on how to calculate your number, protect your data, and use WhatsYournumber as a family.",
          )}
        />

        <section className="surface mt-10 md:mt-14 flex flex-wrap items-center gap-6 p-8">
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

      <SiteFooter />
    </div>
  );
}
