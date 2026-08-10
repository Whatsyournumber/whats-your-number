import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, CreditCard, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/precios")({
  head: () => ({
    meta: [
      { title: "Precios — WhatsYournumber" },
      {
        name: "description",
        content: "Planes de WhatsYournumber: empieza gratis, paga mensual o anual con descuento, y escala a Patrimonio para familias y activos complejos.",
      },
      { property: "og:title", content: "Precios — WhatsYournumber" },
      { property: "og:description", content: "Planes simples para ordenar tu patrimonio con IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

function yearlyTotal(monthly: number, discount: number) {
  return Math.round(monthly * 12 * (1 - discount));
}

function Pricing() {
  const t = useT();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const isYearly = billing === "yearly";

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyDiscount: 0,
      desc: t(
        "Descubre tu número en 30 segundos y ordena tus finanzas básicas.",
        "Discover your number in 30 seconds and organize your basic finances.",
      ),
      features: [
        t("Demo gratuito: tu número en 3 preguntas", "Free demo: your number in 3 questions"),
        t("1 cuenta conectada o manual", "1 connected or manual account"),
        t("5 importaciones de EEFF al mes", "5 statement imports per month"),
        t("Dashboard con tu número y cash flow", "Dashboard with your number and cash flow"),
        t("Análisis de gastos del mes", "Monthly expense analysis"),
        t("Presupuesto 40/40/20", "40/40/20 budget"),
      ],
      cta: t("Empezar gratis", "Start for free"),
      href: "/demo",
      highlight: false,
    },
    {
      name: "Pro",
      monthlyPrice: 12,
      yearlyPrice: yearlyTotal(12, 0.2),
      yearlyDiscount: 0.2,
      desc: t(
        "Todo el sistema financiero con IA ilimitada para acelerar tu libertad.",
        "The full financial OS with unlimited AI to speed up your freedom.",
      ),
      features: [
        t("Cuentas y bancos ilimitados", "Unlimited accounts and banks"),
        t("Importación PDF y CSV ilimitada", "Unlimited PDF and CSV imports"),
        t("AI Advisor: pregúntale lo que sea", "AI Advisor: ask anything"),
        t("Recomendaciones de ahorro inteligentes", "Smart savings recommendations"),
        t("Portafolio y benchmark de mercado", "Portfolio and market benchmark"),
        t("WhatsYournumber y simulador de retiro", "WhatsYournumber and retirement simulator"),
        t("Life Planner y Your next city", "Life Planner and Your next city"),
        t("Reportes mensuales automáticos", "Automatic monthly reports"),
      ],
      cta: t("Probar Pro 14 días gratis", "Try Pro 14 days free"),
      href: "/auth",
      search: { mode: "signup" },
      highlight: true,
    },
    {
      name: "Patrimonio",
      monthlyPrice: 29,
      yearlyPrice: yearlyTotal(29),
      desc: t(
        "Para patrimonios complejos, familias y quienes toman decisiones con datos.",
        "For complex net worths, families and data-driven decision makers.",
      ),
      features: [
        t("Todo lo de Pro", "Everything in Pro"),
        t("Multi-moneda avanzada EUR/USD/GBP", "Advanced multi-currency EUR/USD/GBP"),
        t("Activos alternativos: cripto, real estate, etc.", "Alternative assets: crypto, real estate, etc."),
        t("Reportes trimestrales exportables", "Exportable quarterly reports"),
        t("Perfiles familiares compartidos", "Shared family profiles"),
        t("Soporte prioritario en 24h", "Priority support within 24h"),
      ],
      cta: t("Hablar con nosotros", "Talk to us"),
      href: "/auth",
      search: { mode: "signup" },
      highlight: false,
    },
  ];

  const incentives = [
    {
      icon: Sparkles,
      title: t("Prueba Pro gratis 14 días", "Try Pro free for 14 days"),
      description: t(
        "Accede a todo el sistema con IA ilimitada. Cancela antes de que termine y no pagas nada.",
        "Get full access with unlimited AI. Cancel before it ends and pay nothing.",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("Garantía de devolución de 30 días", "30-day money-back guarantee"),
      description: t(
        "Si WhatsYournumber no te ayuda a ver tu dinero más claro, te devolvemos el 100%.",
        "If WhatsYournumber doesn't help you see your money clearly, we refund 100%.",
      ),
    },
    {
      icon: Zap,
      title: t("Se paga solo si ahorras", "It pays for itself if you save"),
      description: t(
        "Si Pro te ayuda a ahorrar solo $25 al mes, ya cubre más del doble de su costo anual.",
        "If Pro helps you save just $25/month, it already covers more than double its annual cost.",
      ),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="pt-10 text-center md:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("Sin permanencia, cancela cuando quieras", "No lock-in, cancel anytime")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {t("Un plan para cada etapa de tu libertad financiera", "A plan for every stage of your financial freedom")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            {t(
              "Empieza gratis con tu número y escala cuando quieras dominar tu patrimonio con IA.",
              "Start free with your number and scale when you want to master your net worth with AI.",
            )}
          </p>

          {/* Toggle mensual / anual */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billing === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Mensual", "Monthly")}
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billing === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Anual", "Yearly")}
            </button>
            <span className="rounded-full bg-positive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-positive-foreground">
              -20%
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              "El plan anual se factura en un solo pago y ahorra 2 meses al año.",
              "The yearly plan is billed in one payment and saves 2 months per year.",
            )}
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? t("/año", "/year") : t("/mes", "/mo");
            const equivalentMonthly = isYearly && plan.monthlyPrice > 0
              ? Math.round(plan.yearlyPrice / 12)
              : null;

            return (
              <div
                key={plan.name}
                className={`surface relative flex flex-col p-6 transition-colors ${
                  plan.highlight ? "bg-gradient-to-b from-primary/5 to-transparent ring-1 ring-primary/40" : ""
                }`}
              >
                {plan.highlight && (
                  <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    {t("Más popular", "Most popular")}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold">{plan.name}</h2>
                  {isYearly && plan.monthlyPrice > 0 && (
                    <span className="rounded-full border border-positive/30 bg-positive/10 px-2 py-0.5 text-[10px] font-semibold text-positive">
                      {t("Ahorras 20%", "Save 20%")}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="numeric text-4xl font-semibold tracking-tight">${price}</span>
                  <span className="pb-1 text-xs text-muted-foreground">{period}</span>
                </div>
                {equivalentMonthly && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      "Equivale a ${{month}}/mes",
                      "Equals ${{month}}/month",
                    ).replace("{{month}}", String(equivalentMonthly))}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
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
                  <Link to={plan.href} {...(plan.search ? { search: plan.search } : {})}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            );
          })}
        </section>

        {/* Incentivos de conversión */}
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {incentives.map((item) => (
            <div
              key={item.title}
              className="surface flex flex-col items-start gap-3 p-5 transition-colors hover:bg-elevated/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA final */}
        <section className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-elevated/80 to-background p-8 text-center md:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {t("¿Listo para conocer tu número?", "Ready to know your number?")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {t(
              "Empieza gratis en 30 segundos. Sin tarjeta, sin compromiso, solo claridad financiera.",
              "Start free in 30 seconds. No card, no commitment, just financial clarity.",
            )}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/demo">
                {t("Descubrir mi número gratis", "Discover my number free")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("Probar Pro 14 días gratis", "Try Pro 14 days free")}
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            {t("Sin tarjeta de crédito · Cancela cuando quieras", "No credit card · Cancel anytime")}
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
