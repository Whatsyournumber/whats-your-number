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
import affiliatesHow from "@/assets/affiliates-howitworks.jpg";
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
    { icon: Crown, title: t("Plan Pro gratis", "Free Pro plan"), sub: t("con 3 amigos", "with 3 friends") },
    
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

  const tiers = [
    {
      tier: t("Empezando", "Getting started"),
      refs: 50,
      plan: t("Plan Familiar", "Family plan"),
      monthly: 285,
    },
    {
      tier: t("Creciendo", "Growing"),
      refs: 150,
      plan: t("Plan Familiar", "Family plan"),
      monthly: 855,
    },
    {
      tier: t("Consolidado", "Established"),
      refs: 300,
      plan: t("Plan mixto", "Mixed plans"),
      monthly: 1425,
    },
    {
      tier: t("Top afiliado", "Top affiliate"),
      refs: 500,
      plan: t("Plan mixto", "Mixed plans"),
      monthly: 2850,
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* HERO */}
      <section className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        <div className="pointer-events-none absolute inset-y-0 -right-[12vw] hidden w-[70%] lg:block">
          <img
            src={affiliatesHero}
            alt={t(
              "Dos personas sonriendo mientras revisan sus ganancias de afiliado",
              "Two people smiling while reviewing their affiliate earnings",
            )}
            className="h-full w-full object-cover"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, #000 50%, #000 62%, rgba(0,0,0,0.4) 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 74%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, #000 50%, #000 62%, rgba(0,0,0,0.4) 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 74%, transparent 100%)",
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
            <h1 className="mt-5 max-w-[13ch] font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {t("Gana ", "Earn ")}
              <span className="text-primary">{RATE}%</span>
              {t(" recurrente y gana dinero pasivo", " recurring and earn passive income")}
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
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate whitespace-nowrap text-xs font-semibold">{title}</span>
                    <span className="line-clamp-2 block text-[11px] text-muted-foreground">{sub}</span>
                  </span>

                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {cta ?? (
                <>
                  <Button asChild size="lg" className="rounded-full">
                    <Link to="/auth" search={{ mode: "signup", next: "/afiliados", flow: "affiliate" }}>
                      {t("Quiero ser afiliado", "I want to be an affiliate")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/auth" search={{ mode: "login", next: "/afiliados", flow: "affiliate" }}>
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
      <section id="como-funciona" className="relative scroll-mt-24">
        <div className="grid lg:grid-cols-2">
          {/* Photo */}
          <div className="relative min-h-[260px] lg:min-h-full">
            <img
              src={affiliatesHow}
              loading="lazy"
              width={1024}
              height={1024}
              alt={t(
                "Afiliada sonriendo mientras comparte su enlace desde su laptop",
                "Affiliate smiling while sharing her link from her laptop",
              )}
              className="h-full w-full object-cover"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, #000 25%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.25) 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 12%, #000 35%, #000 65%, rgba(0,0,0,0.6) 88%, transparent 100%), linear-gradient(to left, #000 88%, transparent 100%)",
                maskImage:
                  "linear-gradient(to right, #000 25%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.25) 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 12%, #000 35%, #000 65%, rgba(0,0,0,0.6) 88%, transparent 100%), linear-gradient(to left, #000 88%, transparent 100%)",
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
              }}
            />
            <div className="absolute bottom-5 left-5 hidden rounded-2xl border border-border/60 bg-background/85 p-3 backdrop-blur sm:block">
              <p className="text-[11px] text-muted-foreground">{t("Comisión recurrente", "Recurring commission")}</p>
              <p className="font-display text-xl font-semibold text-primary">
                {RATE}%<span className="text-xs text-muted-foreground"> /mes</span>
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="p-5 sm:p-6">
            <SectionTitle
              title={t("Cómo funciona", "How it works")}
              description={t(
                "Recomienda y gana comisión recurrente. Nosotros cobramos, facturamos y damos soporte.",
                "Recommend and earn recurring commission. We handle billing, invoicing and support.",
              )}
            />
            <div className="space-y-3">
              {steps.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-2xl border border-border/50 bg-background/40 p-3.5 transition-colors hover:border-primary/40"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-sm font-semibold">{title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EARNINGS */}
      <section id="como-ganas" className="scroll-mt-24">
        <SectionTitle
          title={t("Cuánto puedes ganar al mes", "What you can earn per month")}
          description={t(
            `Comisión del ${RATE}% recurrente. Mientras más suscripciones activas traigas, más crecen tus ingresos cada mes.`,
            `A recurring ${RATE}% commission. The more active subscriptions you bring, the more your monthly income grows.`,
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((e) => (
            <div
              key={e.tier}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-elevated/40 p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                  {e.tier}
                </Badge>
                <Sparkline className="h-5 w-14 text-primary/60" />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                {e.monthly.toLocaleString("en-US")}<span className="text-sm text-muted-foreground"> US$/mes</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {e.refs} {t("suscripciones activas", "active subscriptions")} · {e.plan}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {t("Recurrente, mes tras mes", "Recurring, month after month")}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-3 rounded-2xl border border-border/60 bg-elevated/30 p-4">
          <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold">
              {t(
                "Ejemplo real: con 150 familias activas ganas 855 US$ cada mes, sin hacer nada extra.",
                "Real example: with 150 active families you earn 855 US$ every month, with no extra effort.",
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
              <Link to="/auth" search={{ mode: "signup", next: "/afiliados", flow: "affiliate" }}>
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
