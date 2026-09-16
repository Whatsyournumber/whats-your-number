// TEMP preview route — onboarding summary check. Remove after review.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { buildPlan, emptyLife, emptyOnboarding } from "@/lib/onboarding";
import { SummaryScreen } from "@/routes/onboarding";

export const Route = createFileRoute("/summary-check")({
  head: () => ({
    meta: [{ title: "Resumen del onboarding" }, { name: "robots", content: "noindex" }],
  }),
  component: SummaryCheckPage,
});

function SummaryCheckPage() {
  const navigate = useNavigate();
  const data = {
    ...emptyOnboarding,
    full_name: "Oscar Alvarez",
    age: 33,
    retirement_age: 60,
    monthly_income: 3000,
    partner_income: 1800,
    side_income: 500,
    assets_cash: 8000,
    assets_bank: 15000,
    assets_invested: 22000,
    assets_crypto: 3000,
    assets_property: 120000,
    mortgage_balance: 90000,
    mortgage_rate: 2,
    mortgage_term: 15,
    spend_housing: 900,
    spend_utilities: 180,
    spend_groceries: 500,
    spend_transport: 150,
    spend_insurance: 120,
    spend_gym: 45,
    spend_subscriptions: 60,
    spend_restaurants: 220,
    spend_travel: 180,
    spend_shopping: 140,
    spend_leisure: 90,
  };
  const life = { ...emptyLife, marital_status: "En pareja", analysis_scope: "pareja" };
  const plan = buildPlan({ ...data, ...life });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <SummaryScreen
        data={data}
        life={life}
        plan={plan}
        currency="EUR"
        onEdit={() => navigate({ to: "/dashboard" })}
        onEnter={() => navigate({ to: "/dashboard" })}
      />
    </div>
  );
}
