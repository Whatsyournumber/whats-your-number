import { createFileRoute } from "@tanstack/react-router";

import { SummaryScreen } from "@/routes/onboarding";
import {
  buildPlan,
  emptyLife,
  emptyOnboarding,
  estimateDesiredIncome,
  type LifeData,
} from "@/lib/onboarding";

export const Route = createFileRoute("/summary-check")({
  validateSearch: (search: Record<string, unknown>) => ({
    full: String(search.full ?? "Oscar Alvarez"),
  }),
  component: Check,
});

function Check() {
  const { full } = Route.useSearch();
  const life: LifeData = {
    ...emptyLife,
    goal: "libertad",
    city: "Madrid",
    marital_status: "Soltero",
    children: "0",
    plans_children: "No",
    lifestyle: "comodo",
    travel_frequency: "1-2",
    housing: "alquiler",
  };
  const data = {
    ...emptyOnboarding,
    full_name: full,
    age: 35,
    currency: "EUR",
    country: "España",
    income_salary: 3000,
    monthly_expenses: 1600,
    fixed_housing: 900,
    fixed_utilities: 120,
    fixed_groceries: 350,
    fixed_transport: 120,
    fixed_insurance: 60,
    fixed_subscriptions: 40,
    fixed_restaurants: 220,
    fixed_travel: 180,
    assets_cash: 2000,
    assets_bank: 12000,
    assets_retirement: 8000,
    retire_age: 60,
    expected_return: 7,
    withdrawal_rate: 4,
    desired_retirement_income: estimateDesiredIncome(life, { currency: "EUR" }),
  };
  const plan = buildPlan(data);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <SummaryScreen
        data={data}
        life={life}
        plan={plan}
        currency="EUR"
        onEnter={() => {}}
        onEdit={() => {}}
      />
    </div>
  );
}
