import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, CreditCard, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { PricingComparison, PricingFaq } from "@/components/pricing-comparison";
import { PromoCodeRedeem } from "@/components/promo-code-redeem";
import { SiteFooter } from "@/components/site-footer";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useT } from "@/hooks/use-language";
import { getPendingCheckoutPlan, setPendingCheckoutPlan } from "@/lib/pending-checkout";
import { useRegionalPricing } from "@/hooks/use-regional-pricing";
import { formatMoney, monthlyEquivalent } from "@/lib/pricing-tiers";
import { clearPendingDiscount, getPendingDiscount, type PendingDiscount } from "@/lib/pending-discount";


type PricingSearch = {
  plan?: "familiar" | "pro" | "free";
};

export const Route = createFileRoute("/precios")({
  validateSearch: (search: Record<string, unknown>): PricingSearch => {
    const plan = search["plan"];
    return {
      plan: plan === "familiar" || plan === "pro" || plan === "free" ? plan : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Precios — WhatsYournumber" },
      {
        name: "description",
        content: "Planes de WhatsYournumber: empieza gratis, paga mensual o anual con descuento, y escala al plan Familiar para familias y activos complejos.",
      },
      { property: "og:title", content: "Precios — WhatsYournumber" },
      { property: "og:description", content: "Planes simples para ordenar tu patrimonio con IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://whatsyour-number.com/precios" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://whatsyour-number.com/precios" }],
  }),
  component: Pricing,
});

function Pricing() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan: planParam } = Route.useSearch();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const { openCheckout, loading } = usePaddleCheckout();
  const resumedCheckout = useRef(false);
  const [discount, setDiscount] = useState<PendingDiscount | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    planParam === "familiar" ? "Familiar" : planParam === "pro" ? "Pro" : null,
  );
  const { prices, currency } = useRegionalPricing();

  useEffect(() => {
    setDiscount(getPendingDiscount());
  }, []);


  const isYearly = billing === "yearly";

  type PricingPlan = {
    name: string;
    monthlyPrice: number | null;
    yearlyPrice: number | null;
    priceId: string | null;
    contact?: boolean;
    desc: string;
    features: string[];
    cta: string;
    href?: string;
    highlight: boolean;
  };

  const plans: PricingPlan[] = [
    {
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      priceId: null,
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
        t("Life Planner", "Life Planner"),
        t("Your next city", "Your next city"),
      ],
      cta: t("Empezar gratis", "Start for free"),
      href: "/calculadora-libertad-financiera",
      highlight: false,
    },
    {
      name: "Pro",
      monthlyPrice: prices.pro.monthly,
      yearlyPrice: prices.pro.yearly,
      priceId: isYearly ? "pro_yearly" : "pro_monthly",
      desc: t(
        "Todo el sistema financiero con IA ilimitada para acelerar tu libertad.",
        "The full financial OS with unlimited AI to speed up your freedom.",
      ),
      features: [
        t("Todo lo de Free", "Everything in Free"),
        t("Cuentas y bancos ilimitados", "Unlimited accounts and banks"),
        t("Importación PDF y CSV ilimitada en 30s", "Unlimited PDF and CSV imports in 30s"),
        t("AI Advisor: pregúntale lo que sea", "AI Advisor: ask anything"),
        t("Recomendaciones de ahorro inteligentes", "Smart savings recommendations"),
        t("Multi-moneda avanzada EUR/USD/GBP", "Advanced multi-currency EUR/USD/GBP"),
        t("Activos alternativos: cripto, real estate, etc.", "Alternative assets: crypto, real estate, etc."),
        t("Trackea todo tu portfolio en tiempo real", "Track your whole portfolio in real time"),
        t("Análisis de hipoteca: paga y gasta menos", "Mortgage analysis: pay and spend less"),
        t("WhatsYournumber acorde con tu objetivo", "WhatsYournumber tailored to your goal"),
        t("Simulador de retiro temprano", "Early retirement simulator"),
        t("Portafolio y benchmark de mercado", "Portfolio and market benchmark"),
        t("Reportes mensuales automáticos", "Automatic monthly reports"),
      ],
      cta: t("Empezar con Pro", "Get started with Pro"),
      highlight: true,
    },
    {
      name: "Familiar",
      monthlyPrice: prices.family.monthly,
      yearlyPrice: prices.family.yearly,
      priceId: isYearly ? "patrimonio_yearly" : "patrimonio_monthly",
      desc: t(
        "Ordena el patrimonio de tu familia y construye el futuro financiero de tus hijos.",
        "Organize your family's wealth and build your children's financial future.",
      ),
      features: [
        t("Todo lo de Pro", "Everything in Pro"),
        t("Hasta 3 perfiles familiares", "Up to 3 family profiles"),
        t("Plan de ahorro e inversión para cada hijo", "Savings and investment plan for each child"),
        t("Simulador de universidad y educación", "College and education simulator"),
        t("Meta de patrimonio a los 18 años de tu hijo", "Net worth goal by your child's 18th birthday"),
        t("Tareas que enseñan: tus hijos aprenden ahorrando por sus sueños", "Tasks that teach: your kids learn by saving toward their dreams"),
        t("Sueños alcanzables: ven cuánto les falta para cada meta", "Dreams within reach: they see how close they are to each goal"),
        t("Controles de acceso para tus hijos", "Access controls for your children"),
        t("Soporte prioritario en 24h", "Priority support within 24h"),
      ],
      cta: t("Empezar con Familiar", "Get started with Familiar"),
      highlight: false,
    },
    {
      name: "Corporativo",
      monthlyPrice: null,
      yearlyPrice: null,
      priceId: null,
      contact: true,
      desc: t(
        "Planning patrimonial B2B.\nReportes bajo tu marca.\nEscalabilidad para tu equipo.",
        "B2B wealth planning.\nBranded reports.\nScalable for your team.",
      ),
      features: [
        t("Todo lo de Familiar para cada miembro", "Everything in Familiar for each member"),
        t("Licencias por volumen para tu equipo", "Volume licensing for your team"),
        t("Ideal para brokers, financial planners y family offices", "Built for brokers, financial planners and family offices"),
        t("Onboarding y workshops para empleados", "Onboarding and employee workshops"),
        t("Dashboard agregado y anonimizado de RRHH", "Aggregated, anonymized HR dashboard"),
        t("Marca blanca para asesores y bancos", "White label for advisors and banks"),
        t("Reportes personalizados bajo tu branding", "Branded reports under your identity"),
        t("API y webhooks para integrar con tu CRM", "API and webhooks to integrate with your CRM"),
        t("Integración SSO y soporte dedicado", "SSO integration and dedicated support"),
        t("Account manager y SLA garantizado", "Account manager and guaranteed SLA"),
      ],
      cta: t("Contactar", "Contact us"),
      href: "mailto:hello@whatsyour-number.com?subject=Plan%20Corporativo%20B2B",
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

  const handleCta = (plan: (typeof plans)[number]) => {
    if (!plan.priceId) return;
    const selectedPlan = plan.name === "Familiar" ? "familiar" : "pro";
    setPendingCheckoutPlan(selectedPlan);
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    const checkoutOptions: {
      priceId: string;
      quantity: number;
      customerEmail?: string;
      customData?: Record<string, string>;
      successUrl?: string;
      discountCode?: string;
    } = {
      priceId: plan.priceId,
      quantity: 1,
      customData: { selectedPlan },
      successUrl: `${window.location.origin}/checkout/success?plan=${selectedPlan}`,
    };
    if (user.email) checkoutOptions.customerEmail = user.email;
    if (discount?.code) checkoutOptions.discountCode = discount.code;
    void openCheckout(checkoutOptions);
  };


  useEffect(() => {
    if (!user || resumedCheckout.current) return;
    const pendingPlan = getPendingCheckoutPlan();
    if (!pendingPlan) return;
    const selected = plans.find((plan) =>
      pendingPlan === "familiar" ? plan.name === "Familiar" : plan.name === "Pro",
    );
    if (!selected) return;
    resumedCheckout.current = true;
    handleCta(selected);
  }, [user]);


  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <PaymentTestModeBanner />
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="pt-10 text-center md:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("Sin permanencia, cancela cuando quieras", "No lock-in, cancel anytime")}
          </span>

          {discount ? (
            <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-medium">
                {t(
                  `Código ${discount.code}: ${discount.label} de descuento se aplicará en el pago`,
                  `Code ${discount.code}: ${discount.label} off will be applied at checkout`,
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearPendingDiscount();
                  setDiscount(null);
                }}
                className="ml-1 text-primary/60 underline-offset-2 hover:text-primary hover:underline"
              >
                {t("Quitar", "Remove")}
              </button>
            </div>
          ) : null}

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
                billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Mensual", "Monthly")}
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Anual · 2 meses gratis", "Yearly · 2 months free")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              "El plan anual se factura en un solo pago: pagas 10 meses y usas 12.",
              "The yearly plan is billed in one payment: pay for 10 months, use 12.",
            )}
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isContact = "contact" in plan && plan.contact;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? t("/año", "/year") : t("/mes", "/mo");
            const equivalentMonthly =
              !isContact && isYearly && (plan.monthlyPrice ?? 0) > 0 && plan.yearlyPrice != null
                ? monthlyEquivalent(plan.yearlyPrice, currency)
                : null;
            const isFamily = plan.name === "Familiar";
            const yearlyBadge = isFamily
              ? t("3 meses gratis · 25% OFF", "3 months free · 25% OFF")
              : t("2 meses gratis · 17% OFF", "2 months free · 17% OFF");

            const isSelected = selectedPlan === plan.name;

            return (
              <div
                key={plan.name}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlan(isSelected ? null : plan.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedPlan(isSelected ? null : plan.name);
                  }
                }}
                className={`surface relative flex cursor-pointer flex-col p-6 transition-all ${
                  plan.highlight && selectedPlan !== "Familiar"
                    ? "bg-gradient-to-b from-primary/5 to-transparent ring-1 ring-primary/40"
                    : ""
                } ${
                  isSelected
                    ? "bg-positive/[0.04] ring-1 ring-positive/50 shadow-[0_0_24px_-6px_hsl(var(--positive)/0.35)]"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    {t("Más popular", "Most popular")}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold">{plan.name}</h2>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                  {isContact ? (
                    <span className="numeric text-3xl font-semibold tracking-tight">
                      {t("A medida", "Custom")}
                    </span>
                  ) : (
                    <>
                      <span className="numeric text-4xl font-semibold tracking-tight">{formatMoney(price ?? 0, currency)}</span>
                      <span className="pb-1 text-xs text-muted-foreground">{period}</span>
                      {equivalentMonthly && (
                        <span className="pb-1 text-xs text-muted-foreground">
                          {t("· equivale a {{month}}/mes", "· equals {{month}}/month").replace("{{month}}", equivalentMonthly)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!isContact && isYearly && (plan.monthlyPrice ?? 0) > 0 && (
                  <span className="mt-2 inline-flex w-fit rounded-full border border-positive/30 bg-positive/10 px-2 py-0.5 text-[10px] font-semibold text-positive">
                    {yearlyBadge}
                  </span>
                )}

                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.priceId ? (
                  <Button
                    variant={plan.highlight || isSelected ? "default" : "outline"}
                    className={`mt-8 w-full rounded-full ${
                      isSelected && !plan.highlight
                        ? "bg-positive text-positive-foreground hover:bg-positive/90"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCta(plan);
                    }}
                    disabled={loading}
                  >
                    {plan.cta}
                  </Button>
                ) : isContact ? (
                  <Button
                    asChild
                    variant={isSelected ? "default" : "outline"}
                    className={`mt-8 w-full rounded-full ${
                      isSelected ? "bg-positive text-positive-foreground hover:bg-positive/90" : ""
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant={plan.highlight || isSelected ? "default" : "outline"}
                    className={`mt-8 w-full rounded-full ${
                      isSelected && !plan.highlight
                        ? "bg-positive text-positive-foreground hover:bg-positive/90"
                        : ""
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to={plan.name === "Free" ? "/calculadora-libertad-financiera" : "/auth"} search={plan.name === "Free" ? {} : { mode: "signup" }}>
                      {plan.cta}
                    </Link>
                  </Button>
                )}
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

        <PricingComparison />

        <PricingFaq />

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
              <Link to="/calculadora-libertad-financiera" search={{ start: 1 }}>
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
          <div className="mx-auto mt-8 max-w-md text-left">
            <PromoCodeRedeem />
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
