import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Check, Link2, MousePointerClick, Users, Wallet, Loader2, BadgePercent, Sparkles } from "lucide-react";
import { toast } from "sonner";

import affiliatesHero from "@/assets/affiliates-hero.jpg";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useT } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useMyAffiliate } from "@/hooks/use-affiliate";
import { AffiliateExplainer } from "@/components/affiliate-explainer";
import { joinAffiliateProgram, updateMyAffiliate } from "@/utils/affiliates.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

export const Route = createFileRoute("/afiliados")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Programa de afiliados — WhatsYournumber" },
      {
        name: "description",
        content: "Comparte tu enlace de afiliado, sigue tus clics, registros y comisiones en tiempo real.",
      },
      { property: "og:title", content: "Programa de afiliados — WhatsYournumber" },
      { property: "og:description", content: "Gana comisión recurrente por cada usuario que llega con tu enlace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AffiliatesPage,
});

const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} US$`;
const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function AffiliatesPage() {
  const t = useT();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { affiliate, clicks, referrals, commissions, pending, paid, loading } = useMyAffiliate();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = affiliate ? `${origin}/?ref=${affiliate.code}` : "";

  const join = async () => {
    setBusy(true);
    try {
      await joinAffiliateProgram({
        data: {
          displayName: user?.user_metadata?.["full_name"] ?? "",
          payoutEmail: payoutEmail || user?.email || "",
          environment: getPaddleEnvironment(),
        },
      });
      await qc.invalidateQueries({ queryKey: ["affiliate"] });
      await qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success(
        t("¡Ya eres afiliado! Tu enlace está listo y tu plan Pro activado.", "You're an affiliate! Your link is ready and your Pro plan is active."),
      );
    } catch {
      toast.error(t("No pudimos crear tu cuenta de afiliado.", "We couldn't create your affiliate account."));
    } finally {
      setBusy(false);
    }
  };

  const savePayout = async () => {
    setBusy(true);
    try {
      await updateMyAffiliate({ data: { payoutEmail, displayName: affiliate?.display_name ?? "" } });
      await qc.invalidateQueries({ queryKey: ["affiliate"] });
      toast.success(t("Datos de pago guardados", "Payout details saved"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("Enlace copiado", "Link copied"));
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-elevated/30">
          <div className="grid items-stretch gap-0 lg:grid-cols-2">
            <div className="p-6 sm:p-10">
              <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                {t("Programa de afiliados", "Affiliate program")}
              </Badge>
              <h1 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t("Gana 30% recurrente recomendando ", "Earn a recurring 30% recommending ")}
                <span className="text-primary">WhatsYournumber</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "Únete gratis, comparte tu enlace y cobra cada mes por cada suscripción activa que traigas. Además te regalamos el plan Pro 12 meses.",
                  "Join for free, share your link and get paid every month for every active subscription you bring. Plus we gift you 12 months of Pro.",
                )}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: BadgePercent, label: t("30% recurrente", "30% recurring") },
                  { icon: Sparkles, label: t("Plan Pro gratis", "Free Pro plan") },
                  { icon: Users, label: t("Cookie 60 días", "60-day cookie") },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/auth" search={{ mode: "signup", next: "/afiliados" }}>
                    {t("Registrarme como afiliado", "Sign up as an affiliate")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/auth" search={{ mode: "login", next: "/afiliados" }}>
                    {t("Ya tengo cuenta", "I already have an account")}
                  </Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("Gratis, sin tarjeta. Tu enlace queda listo en un minuto.", "Free, no card. Your link is ready in a minute.")}
              </p>
            </div>

            <div className="relative min-h-[220px] lg:min-h-[420px]">
              <img
                src={affiliatesHero}
                alt={t(
                  "Dos personas sonriendo mientras revisan sus ganancias de afiliado",
                  "Two people smiling while reviewing their affiliate earnings",
                )}
                width={1280}
                height={960}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/25 lg:to-transparent" />
            </div>
          </div>
        </section>

        <div className="mt-4">
          <AffiliateExplainer />
        </div>

        <Panel
          className="mt-4"
          title={t("¿Listo para empezar?", "Ready to start?")}
          description={t("Crea tu cuenta gratis y activa tu enlace en un minuto.", "Create your free account and activate your link in a minute.")}
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <Link to="/auth" search={{ mode: "signup", next: "/afiliados" }}>
                {t("Registrarme como afiliado", "Sign up as an affiliate")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/auth" search={{ mode: "login", next: "/afiliados" }}>
                {t("Ya tengo cuenta", "I already have an account")}
              </Link>
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (!affiliate) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={t("Programa de afiliados", "Affiliate program")}
          title={t("Gana con cada persona que invitas", "Earn from everyone you invite")}
          subtitle={t(
            "Recibes una comisión recurrente sobre cada suscripción que llegue con tu enlace. Nosotros cobramos, facturamos y damos soporte.",
            "Get a recurring commission on every subscription that comes through your link. We handle billing, invoicing and support.",
          )}
        />
        <AffiliateExplainer />
        <Panel
          className="mt-4"
          title={t("Activa tu enlace y tu Pro gratis", "Activate your link and free Pro")}
          description={t(
            "Toma menos de un minuto, es gratis e incluye 12 meses del plan Pro.",
            "It takes less than a minute, it's free and includes 12 months of the Pro plan.",
          )}
        >
          <div className="grid gap-3 sm:max-w-md">
            <Input
              value={payoutEmail}
              onChange={(e) => setPayoutEmail(e.target.value)}
              placeholder={t("Email para recibir tus pagos", "Email to receive your payouts")}
            />
            <Button disabled={busy} onClick={() => void join()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {t("Crear mi enlace de afiliado", "Create my affiliate link")}
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Programa de afiliados", "Affiliate program")}
        title={t("Tu enlace y tus ganancias", "Your link and earnings")}
        subtitle={t(
          "Comisión del {r}% recurrente sobre cada suscripción activa que traigas.",
          "A recurring {r}% commission on every active subscription you bring.",
        ).replace("{r}", String(affiliate.commission_rate))}
      />

      <Panel title={t("Tu enlace", "Your link")} description={t("Compártelo donde quieras.", "Share it anywhere.")}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={link} className="font-mono text-xs sm:text-sm" />
          <Button onClick={() => void copy()} className="shrink-0">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {t("Copiar", "Copy")}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Tu código:", "Your code:")} <span className="font-mono text-foreground">{affiliate.code}</span>
          {affiliate.status !== "active" && (
            <Badge variant="secondary" className="ml-2">
              {t("pausado", "paused")}
            </Badge>
          )}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t(
            "Como afiliado tienes el plan Pro incluido durante 12 meses para usar y demostrar el producto.",
            "As an affiliate you get the Pro plan included for 12 months to use and demo the product.",
          )}
        </p>
      </Panel>



      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("Clics en tu enlace", "Link clicks")} value={String(clicks)} icon={MousePointerClick} accent index={0} />
        <KpiCard label={t("Registros", "Sign-ups")} value={String(referrals.length)} icon={Users} index={1} />
        <KpiCard
          label={t("Clientes de pago", "Paying customers")}
          value={String(referrals.filter((r) => r.status === "subscribed").length)}
          icon={Wallet}
          index={2}
        />
        <KpiCard label={t("Comisión pendiente", "Pending commission")} value={money(pending)} icon={Wallet} index={3} />
      </div>

      <Panel
        className="mt-4"
        title={t("Comisiones", "Commissions")}
        description={`${t("Pagado", "Paid")}: ${money(paid)} · ${t("Pendiente", "Pending")}: ${money(pending)}`}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Fecha", "Date")}</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>{t("Base", "Base")}</TableHead>
                <TableHead>%</TableHead>
                <TableHead>{t("Comisión", "Commission")}</TableHead>
                <TableHead>{t("Estado", "Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="numeric text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                  <TableCell>{c.product_id.replace("_plan", "")}</TableCell>
                  <TableCell className="numeric">{money(Number(c.base_amount))}</TableCell>
                  <TableCell className="numeric">{Number(c.commission_rate)}%</TableCell>
                  <TableCell className="numeric font-medium">{money(Number(c.commission_amount))}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                      {c.status === "paid" ? t("pagada", "paid") : t("pendiente", "pending")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("Todavía sin comisiones", "No commissions yet")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel
        className="mt-4"
        title={t("Datos de pago", "Payout details")}
        description={t("Dónde te enviamos tus comisiones.", "Where we send your commissions.")}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:max-w-lg">
          <Input
            value={payoutEmail || affiliate.payout_email || ""}
            onChange={(e) => setPayoutEmail(e.target.value)}
            placeholder="email@ejemplo.com"
          />
          <Button variant="outline" disabled={busy} onClick={() => void savePayout()} className="shrink-0">
            {t("Guardar", "Save")}
          </Button>
        </div>
      </Panel>
    </PageShell>
  );
}
