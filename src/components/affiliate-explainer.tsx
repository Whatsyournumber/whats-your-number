import { Link2, Users, Wallet, BadgePercent, Sparkles } from "lucide-react";

import { Panel } from "@/components/page";
import { useT } from "@/hooks/use-language";

const RATE = 30;

export function AffiliateExplainer({ rate = RATE }: { rate?: number }) {
  const t = useT();

  const steps = [
    {
      icon: Link2,
      title: t("1. Crea tu enlace", "1. Create your link"),
      body: t(
        "Te damos un enlace único con tu código. Puedes compartirlo en redes, newsletter, YouTube, WhatsApp o con tus clientes.",
        "We give you a unique link with your code. Share it on social, your newsletter, YouTube, WhatsApp or with your clients.",
      ),
    },
    {
      icon: Users,
      title: t("2. Alguien se registra", "2. Someone signs up"),
      body: t(
        "Guardamos tu código durante 60 días. Si esa persona crea su cuenta en ese periodo, queda vinculada a ti automáticamente.",
        "We store your code for 60 days. If that person creates an account within that window, they're automatically linked to you.",
      ),
    },
    {
      icon: BadgePercent,
      title: t("3. Cobras cada mes", "3. You earn every month"),
      body: t(
        `Cuando pagan su plan, ganas el ${rate}% de cada cobro. No es una sola vez: se repite mientras la suscripción siga activa.`,
        `When they pay their plan, you earn ${rate}% of every charge. Not just once: it repeats while the subscription stays active.`,
      ),
    },
    {
      icon: Wallet,
      title: t("4. Te pagamos", "4. We pay you"),
      body: t(
        "Ves tus clics, registros y comisiones en tu panel. Pagamos por transferencia o PayPal a partir de 50 US$ acumulados.",
        "Track clicks, sign-ups and commissions in your dashboard. We pay by bank transfer or PayPal from 50 US$ accrued.",
      ),
    },
  ];

  const examples = [
    { plan: "Pro", price: 7, label: t("mensual", "monthly") },
    { plan: "Pro", price: 60, label: t("anual", "yearly") },
    { plan: "Patrimonio", price: 19, label: t("mensual", "monthly") },
    { plan: "Patrimonio", price: 160, label: t("anual", "yearly") },
  ];

  return (
    <div className="space-y-4">
      <Panel
        title={t("Cómo funciona", "How it works")}
        description={t(
          "Recomienda WhatsYournumber y gana comisión recurrente. Nosotros cobramos, facturamos y damos soporte.",
          "Recommend WhatsYournumber and earn recurring commission. We handle billing, invoicing and support.",
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-elevated/40 p-4">
              <span className="inline-flex rounded-lg border border-border bg-background p-2 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title={t("Cuánto ganas", "What you earn")}
        description={t(
          `Comisión estándar del ${rate}% recurrente sobre el importe neto de cada suscripción que traigas.`,
          `Standard ${rate}% recurring commission on the net amount of every subscription you bring.`,
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {examples.map((e) => (
            <div key={`${e.plan}-${e.label}`} className="rounded-xl border border-border/60 bg-elevated/40 p-4">
              <p className="text-xs text-muted-foreground">
                {e.plan} · {e.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {e.price} US$ →{" "}
                <span className="text-lg font-semibold text-primary">
                  {((e.price * rate) / 100).toFixed(2)} US$
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("por cada pago", "per payment")}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {t(
            "Ejemplo: con 20 clientes en Pro mensual ganas 42 US$ cada mes, mes tras mes. Las comisiones se confirman tras el periodo de reembolso y se anulan si el cliente pide devolución. No se permite spam, marca registrada en anuncios, ni auto-referidos.",
            "Example: with 20 Pro monthly customers you earn 42 US$ every month, month after month. Commissions are confirmed after the refund window and are voided if the customer refunds. No spam, no brand bidding on ads, no self-referrals.",
          )}
        </p>
      </Panel>
    </div>
  );
}
