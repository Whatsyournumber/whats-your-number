import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/precios")({
  head: () => ({
    meta: [
      { title: "Precios — Your north" },
      {
        name: "description",
        content: "Planes de Your north: empieza gratis y escala a Pro o Patrimonio con IA, importación ilimitada y proyecciones.",
      },
      { property: "og:title", content: "Precios — Your north" },
      { property: "og:description", content: "Planes simples para ordenar tu patrimonio con IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mes",
    desc: "Para empezar a ordenar tus finanzas.",
    features: ["1 cuenta conectada", "5 importaciones al mes", "Análisis de gastos", "Presupuestos básicos"],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mes",
    desc: "Todo el sistema, con IA sin límites.",
    features: [
      "Cuentas ilimitadas",
      "Importación PDF y CSV ilimitada",
      "AI Advisor y detección de anomalías",
      "Portafolio y benchmark de mercado",
      "Simulador de retiro",
    ],
    cta: "Probar Pro",
    highlight: true,
  },
  {
    name: "Patrimonio",
    price: "$29",
    period: "/mes",
    desc: "Para patrimonios complejos y familias.",
    features: [
      "Todo lo de Pro",
      "Multi-moneda y activos alternativos",
      "Reportes trimestrales exportables",
      "Perfiles familiares compartidos",
      "Soporte prioritario",
    ],
    cta: "Hablar con nosotros",
    highlight: false,
  },
];

function Pricing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="pt-10 text-center md:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Sin permanencia, cancela cuando quieras
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Precios claros, como tus finanzas
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Empieza gratis y sube de plan cuando tu patrimonio lo pida.
          </p>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`surface relative flex flex-col p-6 ${plan.highlight ? "ring-1 ring-primary/50" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Popular
                </span>
              )}
              <h2 className="text-sm font-semibold">{plan.name}</h2>
              <div className="mt-3 flex items-end gap-1">
                <span className="numeric text-4xl font-semibold tracking-tight">{plan.price}</span>
                <span className="pb-1 text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlight ? "default" : "outline"}
                className="mt-8 w-full rounded-full"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  {plan.cta}
                </Link>
              </Button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
