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
import { AffiliateLanding } from "@/components/affiliate-landing";

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
        <AffiliateLanding />
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
