import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Buddy, Button, Card } from "@/components/mfn-ui";
import { KidPage, PageTitle } from "@/components/kid-page";
import { money, type Member } from "@/lib/mfn";
import { useSetPlan, useSubscription } from "@/hooks/use-mfn";
import { activePlan, kidLimit, planLabel } from "@/lib/mfn-plan";
import { useI18n } from "@/lib/mfn-i18n";

export const Route = createFileRoute("/_authenticated/kid/suscripcion")({
  head: () => ({
    meta: [
      { title: "Suscripción | My First Number" },
      {
        name: "description",
        content:
          "Elige el plan de My First Number: gratis, Familia o Patrimonio, y gestiona tu suscripción.",
      },
      { property: "og:title", content: "Suscripción | My First Number" },
      {
        property: "og:description",
        content: "Planes para construir el patrimonio futuro de tus hijos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <KidPage>{(member) => <Subscription member={member} />}</KidPage>,
});

type Plan = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  period: string;
  periodEn: string;
  icon: typeof Crown;
  highlight?: boolean;
  features: string[];
  featuresEn: string[];
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Explorador",
    nameEn: "Explorer",
    price: 0,
    period: "para siempre",
    periodEn: "forever",
    icon: Sparkles,
    features: ["1 perfil de niño", "Mesada y bolsillos", "Tareas y deseos", "Fondo del Futuro básico"],
    featuresEn: ["1 child profile", "Allowance and pockets", "Tasks and wishes", "Basic Future Fund"],
  },
  {
    id: "family",
    name: "Familia",
    nameEn: "Family",
    price: 4.99,
    period: "al mes",
    periodEn: "per month",
    icon: Crown,
    highlight: true,
    features: [
      "Hasta 2 perfiles de niño",
      "Buddy IA con retos semanales",
      "Proyecciones a 18, 21, 25 y 30 años",
      "Informes para padres",
    ],
    featuresEn: [
      "Up to 2 child profiles",
      "AI Buddy with weekly challenges",
      "Projections at 18, 21, 25 and 30 years",
      "Reports for parents",
    ],
  },
  {
    id: "wealth",
    name: "Patrimonio",
    nameEn: "Wealth",
    price: 9.99,
    period: "al mes",
    periodEn: "per month",
    icon: Crown,
    features: [
      "Todo lo de Familia",
      "Cartera de inversión detallada",
      "Aportes automáticos",
      "Soporte prioritario",
    ],
    featuresEn: [
      "Everything in Family",
      "Detailed investment portfolio",
      "Automatic contributions",
      "Priority support",
    ],
  },
];

function Subscription({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { data: subscription } = useSubscription();
  const setPlan = useSetPlan();
  const current = activePlan(subscription);
  const maxKids = kidLimit(subscription);
  const currentLabel = planLabel(current, lang === "en" ? "en" : "es");

  return (
    <div className="space-y-6">
      <PageTitle
        emoji="💳"
        title={t("Suscripción", "Subscription")}
        subtitle={t(
          "Elige cuánto quieres acelerar el futuro de tu familia.",
          "Choose how much you want to speed up your family's future.",
        )}
      />
      <Buddy>
        {t(
          `Ahora mismo ${member.name} usa el plan `,
          `Right now ${member.name} uses the `,
        )}
        <strong>{currentLabel}</strong>
        {t(
          ` (incluye ${maxKids} ${maxKids === 1 ? "perfil" : "perfiles"} de niño). Se gestiona desde tu cuenta de WhatsYourNumber.`,
          ` plan (includes ${maxKids} child ${maxKids === 1 ? "profile" : "profiles"}). It is managed from your WhatsYourNumber account.`,
        )}
      </Buddy>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === current;
          return (
            <Card
              key={plan.id}
              className={plan.highlight ? "ring-2 ring-primary" : ""}
            >
              <div className="flex min-w-0 items-center gap-2">
                <plan.icon className="h-4 w-4 shrink-0 text-primary" />
                <p className="truncate font-display text-lg font-semibold text-foreground">
                  {lang === "en" ? plan.nameEn : plan.name}
                </p>
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-foreground">
                {money(plan.price, member.currency)}
              </p>
              <p className="text-xs text-muted-foreground">{lang === "en" ? plan.periodEn : plan.period}</p>
              <ul className="mt-4 space-y-2">
                {(lang === "en" ? plan.featuresEn : plan.features).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <span className="inline-flex rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                    {t("Plan actual", "Current plan")}
                  </span>
                ) : (
                  <Button
                    disabled={setPlan.isPending}
                    onClick={() =>
                      setPlan.mutate(plan.id as "free" | "family" | "wealth", {
                        onSuccess: (res) =>
                          toast.success(
                            t(
                              `Plan ${plan.name} activado`,
                              `${plan.nameEn} plan activated`,
                            ),
                            {
                              description: t(
                                `Ahora puedes tener ${res.kid_limit} ${res.kid_limit === 1 ? "perfil" : "perfiles"} de niño.`,
                                `You can now have ${res.kid_limit} child ${res.kid_limit === 1 ? "profile" : "profiles"}.`,
                              ),
                            },
                          ),
                        onError: () =>
                          toast.error(t("No se pudo cambiar el plan", "Could not change plan")),
                      })
                    }
                  >
                    {setPlan.isPending
                      ? t("Activando…", "Activating…")
                      : `${t("Elegir", "Choose")} ${lang === "en" ? plan.nameEn : plan.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <p className="font-display text-base font-semibold text-foreground">{t("Facturación", "Billing")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "Sin método de pago guardado. Cuando actives un plan podrás ver aquí tus facturas y cancelar en un clic.",
            "No payment method saved. Once you activate a plan you'll be able to see your invoices here and cancel in one click.",
          )}
        </p>
      </Card>
    </div>
  );
}
