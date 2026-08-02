import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  FileText,
  LineChart,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finance OS — Tu CFO personal con IA" },
      {
        name: "description",
        content:
          "Consolida patrimonio, gastos, inversiones y cash flow en una sola plataforma. Sube tus estados de cuenta en PDF o CSV y deja que la IA clasifique todo.",
      },
      { property: "og:title", content: "Finance OS — Tu CFO personal con IA" },
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

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-6">
        <div className="wealth-gradient flex h-9 w-9 items-center justify-center rounded-xl">
          <Wallet className="h-4 w-4 text-background" />
        </div>
        <span className="font-display text-sm font-semibold">Finance OS</span>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/dashboard">Ir al dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/auth" search={{ mode: "login" }}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Crear cuenta
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

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
            Todo tu dinero,
            <span className="block bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              entendido en 30 segundos
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

        <section className="mt-20 grid gap-4 md:grid-cols-2">
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
