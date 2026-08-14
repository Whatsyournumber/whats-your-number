import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Crown,
  DollarSign,
  Layers,
  Link2,
  Shield,
  Sparkles,
  Star,
  UserPlus,
  Wallet,
} from "lucide-react";

import affiliatesHero from "@/assets/affiliates-hero.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";

const RATE = 30;

function Sparkline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" aria-hidden="true">
      <polyline
        points="0,36 12,32 24,34 36,26 48,29 60,20 72,23 84,14 96,16 108,7 120,2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function AffiliateLanding({ cta }: { cta?: ReactNode }) {
  const t = useT();

  const heroBadges = [
    { icon: BadgePercent, title: t("30% recurrente", "30% recurring"), sub: t("de por vida", "for life") },
    { icon: Crown, title: t("Plan Pro gratis", "Free Pro plan"), sub: t("12 meses", "12 months") },
    { icon: Shield, title: t("Cookie 60 días", "60-day cookie"), sub: t("para atribución", "for attribution") },
  ];

  const perks = [
    {
      icon: Layers,
      title: t("Acceso completo a la plataforma", "Full access to the platform"),
      body: t("Multimoneda, hipoteca, inversiones y más.", "Multi-currency, mortgage, investments and more."),
    },
    {
      icon: Sparkles,
      title: t("Asesor de IA incluido", "AI advisor included"),
      body: t("Tu mejor aliado para decidir mejor.", "Your best ally to decide better."),
    },
    {
      icon: BarChart3,
      title: t("Recursos listos para convertir", "Resources ready to convert"),
      body: t("Banners, emails, templates y más.", "Banners, emails, templates and more."),
    },
    {
      icon: DollarSign,
      title: t("Pagos confiables y sin mínimos", "Reliable payouts, no minimums"),
      body: t("Pagos mensuales por PayPal o transferencia.", "Monthly payouts via PayPal or bank transfer."),
    },
  ];

  const steps = [
    {
      icon: Link2,
      title: t("Crea tu enlace", "Create your link"),
      body: t(
        "Te damos un enlace único con tu código. Puedes compartirlo en redes, newsletter, YouTube, WhatsApp o con tus clientes.",
        "We give you a unique link with your code. Share it on social, your newsletter, YouTube, WhatsApp or with your clients.",
      ),
    },
    {
      icon: UserPlus,
      title: t("Alguien se registra", "Someone signs up"),
      body: t(
        "Guardamos su código durante 60 días. Si esa persona crea su cuenta en ese periodo, queda vinculada a ti automáticamente.",
        "We store the code for 60 days. If that person creates an account within that window, they're automatically linked to you.",
      ),
    },
    {
      icon: DollarSign,
      title: t("Cobra cada mes", "Earn every month"),
      body: t(
        `Cuando pagan su plan, ganas el ${RATE}% de cada cobro. No es una sola vez: se repite mientras la suscripción siga activa.`,
        `When they pay their plan, you earn ${RATE}% of every charge. Not just once: it repeats while the subscription stays active.`,
      ),
    },
    {
      icon: Wallet,
      title: t("Te pagamos", "We pay you"),
      body: t(
        "Ves tus clics, registros y comisiones en tu panel. Pagamos por transferencia o PayPal a partir de 50 US$ acumulados.",
        "Track clicks, sign-ups and commissions in your dashboard. We pay by transfer or PayPal from 50 US$ accrued.",
      ),
    },
  ];

  const examples = [
    { plan: "Pro", price: 7, label: t("Mensual", "Monthly") },
    { plan: "Pro", price: 60, label: t("Anual", "Yearly") },
    { plan: "Familiar", price: 19, label: t("Mensual", "Monthly") },
    { plan: "Familiar", price: 160, label: t("Anual", "Yearly") },
  ];

  return (
    <div className="space-y-4">
      {/* HERO */}
      <section className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <img
            src={affiliatesHero}
            alt={t(
              "Dos personas sonriendo mientras revisan sus ganancias de afiliado",
              "Two people smiling while reviewing their affiliate earnings",
            )}
            className="h-full w-full object-cover"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 22%, #000 55%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 78%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 22%, #000 55%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 78%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          />
        </div>


        <div className="relative grid gap-0 lg:grid-cols-2">
          <div className="p-6 sm:p-10">
            <Badge variant="outline" className="rounded-full border-primary/40 uppercase tracking-[0.16em] text-primary">
              {t("Programa de afiliados", "Affiliate program")}
            </Badge>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {t("Gana ", "Earn ")}
              <span className="text-primary">{RATE}%</span>
              {t(" recurrente recomendando la libertad financiera.", " recurring by recommending financial freedom.")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(
                "Únete gratis, comparte tu enlace y cobra cada mes por cada suscripción activa que traigas.",
                "Join for free, share your link and get paid every month for every active subscription you bring.",
              )}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {heroBadges.map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-2.5">
                  <span className="inline-flex rounded-full border border-border bg-background/70 p-2 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-xs font-semibold">{title}</span>
                    <span className="block text-[11px] text-muted-foreground">{sub}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {cta ?? (
                <>
                  <Button asChild size="lg" className="rounded-full">
                    <Link to="/auth" search={{ mode: "signup", next: "/afiliados" }}>
                      {t("Quiero ser afiliado", "I want to be an affiliate")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/auth" search={{ mode: "login", next: "/afiliados" }}>
                      {t("Ya tengo cuenta", "I already have an account")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              {t("Gratis, sin tarjeta. Tu enlace queda listo en un minuto.", "Free, no card. Your link is ready in a minute.")}
            </p>
          </div>

          <div className="relative min-h-[240px] pb-4 lg:min-h-[460px]">
            <img
              src={affiliatesHero}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover lg:hidden"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)",
              }}
            />


            <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-border/60 bg-background/85 p-4 backdrop-blur sm:left-auto sm:right-6 sm:w-[300px]">
              <p className="text-xs text-muted-foreground">
                {t("Tus ganancias estimadas este mes", "Your estimated earnings this month")}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
                $2,846<span className="text-lg text-muted-foreground">.40 USD</span>
              </p>
              <Badge className="mt-2 rounded-full bg-primary/15 text-primary hover:bg-primary/15">
                +32% {t("vs. mes anterior", "vs. last month")}
              </Badge>
              <Sparkline className="mt-3 h-10 w-full text-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="rounded-3xl border border-border/60 bg-elevated/30 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold leading-snug">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <SectionTitle
          title={t("Cómo funciona", "How it works")}
          description={t(
            "Recomienda y gana comisión recurrente. Nosotros cobramos, facturamos y damos soporte.",
            "Recommend and earn recurring commission. We handle billing, invoicing and support.",
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="relative rounded-2xl border border-border/60 bg-elevated/40 p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-primary/60 lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* EARNINGS */}
      <section>
        <SectionTitle
          title={t("Cuánto ganas", "What you earn")}
          description={t(
            `Comisión del ${RATE}% recurrente sobre el importe neto de cada suscripción que traigas.`,
            `A recurring ${RATE}% commission on the net amount of every subscription you bring.`,
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {examples.map((e) => (
            <div key={`${e.plan}-${e.label}`} className="rounded-2xl border border-border/60 bg-elevated/40 p-4">
              <p className="text-xs text-muted-foreground">
                {e.plan} · {e.label}
              </p>
              <p className="mt-2 flex items-baseline gap-2 text-sm">
                <span className="font-semibold">{e.price} US$</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-semibold text-primary">{((e.price * RATE) / 100).toFixed(2)} US$</span>
              </p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t("por cada pago", "per payment")}</p>
                <Sparkline className="h-6 w-16 text-primary/70" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-3 rounded-2xl border border-border/60 bg-elevated/30 p-4">
          <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold">
              {t(
                "Ejemplo real: con 20 clientes en Pro mensual ganas 42 US$ cada mes, mes tras mes.",
                "Real example: with 20 Pro monthly customers you earn 42 US$ every month, month after month.",
              )}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t(
                "Las comisiones se confirman tras el periodo de reembolso y se anulan si el cliente pide devolución. No se permite spam, marca registrada en anuncios, ni auto-referidos.",
                "Commissions are confirmed after the refund window and are voided if the customer refunds. No spam, no brand bidding on ads, no self-referrals.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-3xl border border-border/60 bg-elevated/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {t("Construyamos libertad financiera juntos.", "Let's build financial freedom together.")}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {t(
                "Ayuda a más personas a tomar el control de su dinero y haz crecer tus ingresos.",
                "Help more people take control of their money and grow your income.",
              )}
            </p>
          </div>
          {cta ?? (
            <Button asChild size="lg" className="rounded-full">
              <Link to="/auth" search={{ mode: "signup", next: "/afiliados" }}>
                {t("Quiero mi enlace de afiliado", "I want my affiliate link")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {[
            t("Gratis", "Free"),
            t("Sin tarjeta", "No card"),
            t("Aprobación inmediata", "Instant approval"),
          ].map((label) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <BadgePercent className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
