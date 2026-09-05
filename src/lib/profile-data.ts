import type { Profile } from "@/hooks/use-profile";
import { suggestedFilters } from "@/lib/city-suggestions";
import { lifestyleCities, monthlyCost, yearsToFreedom } from "@/lib/lifestyle-cities";

import {
  buildPlan,
  cities,
  compact,
  lifestyles,
  money,
  netWorth,
  totalAssets,
  totalIncome,
  type NorthPlan,
} from "@/lib/onboarding";

export type DerivedMonth = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
  investments: number;
};

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
// Variación determinista para que la serie histórica no sea una línea plana.
const WOBBLE = [0.94, 1.06, 0.98, 1.12, 0.9, 1.04, 1.01, 0.93, 1.08, 0.97, 1.05, 1.0];

export type Dataset = {
  currency: string;
  fmt: (n: number) => string;
  fmtCompact: (n: number) => string;
  months: DerivedMonth[];
  current: DerivedMonth;
  previous: DerivedMonth;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  assets: { name: string; value: number; color: string; key: string }[];
  liabilities: { name: string; value: number; color: string }[];
  plan: NorthPlan;
  retirement: {
    balance: number;
    monthlyContribution: number;
    returnAnnualized: number;
    currentAge: number;
    retireAge: number;
    contributionsYTD: number;
  };
  goals: { name: string; emoji: string; current: number; target: number; deadline: string; monthly: number; note?: string | undefined; displayCurrent?: number | undefined; displayTarget?: number | undefined; progressPct?: number | undefined }[];
  cashFlow: { income: { name: string; amount: number }[]; buckets: { name: string; amount: number; color: string }[] };
  cityCost: number | null;
  hasData: boolean;
};

/** Convierte las respuestas del onboarding en todos los números que muestra la app. */
export function buildDataset(p: Profile): Dataset {
  const currency = p.currency || "EUR";
  const fmt = (n: number) => money(n, currency);
  const fmtCompact = (n: number) => compact(n, currency);

  const income = totalIncome(p);
  const expenses = p.monthly_expenses;
  const savings = p.monthly_savings || Math.max(0, income - expenses);
  const nw = netWorth(p);
  const assetsTotal = totalAssets(p);
  const invested = p.assets_etf + p.assets_stocks + p.assets_crypto + p.assets_retirement;
  const monthlyInvest = Math.round(savings * (assetsTotal > 0 ? Math.min(0.85, invested / assetsTotal) : 0.6));

  // Serie de 12 meses reconstruida hacia atrás desde el patrimonio actual.
  const r = p.expected_return / 100 / 12;
  const now = new Date();
  const back: number[] = [nw];
  for (let i = 1; i < 12; i++) {
    const prev = (back[i - 1]! - savings) / (1 + r);
    back.push(prev);
  }
  const months: DerivedMonth[] = back
    .slice()
    .reverse()
    .map((value, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const isCurrent = i === 11;
      const w = WOBBLE[i]!;
      // El mes actual refleja exactamente los datos del perfil (salario + alquileres + bonos + otros).
      const mIncome = isCurrent ? Math.round(income) : Math.round(income * (0.97 + (w - 1) * 0.6));
      const mExpenses = isCurrent ? Math.round(expenses) : Math.round(expenses * w);
      return {
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: MONTH_LABELS[d.getMonth()]!,
        income: mIncome,
        expenses: mExpenses,
        savings: isCurrent ? Math.round(savings) : Math.max(0, mIncome - mExpenses),
        netWorth: Math.round(value),
        investments: Math.round(monthlyInvest * (isCurrent ? 1 : w)),
      };
    });


  const current = months[months.length - 1]!;
  const previous = months[months.length - 2] ?? current;

  const assets = [
    { key: "assets_cash", name: "Efectivo", value: p.assets_cash, color: "var(--color-chart-1)" },
    { key: "assets_bank", name: "Cuentas bancarias", value: p.assets_bank, color: "var(--color-chart-2)" },
    { key: "assets_retirement", name: "Fondo de retiro", value: p.assets_retirement, color: "var(--color-chart-3)" },
    { key: "assets_etf", name: "ETFs / fondos", value: p.assets_etf, color: "var(--color-chart-4)" },
    { key: "assets_stocks", name: "Acciones", value: p.assets_stocks, color: "var(--color-chart-5)" },
    { key: "assets_crypto", name: "Cripto", value: p.assets_crypto, color: "var(--color-chart-6, var(--color-chart-1))" },
    { key: "assets_property", name: "Propiedades", value: p.assets_property, color: "var(--color-chart-7, var(--color-chart-2))" },
  ].filter((a) => a.value > 0);

  const liabilities = p.liabilities > 0 ? [{ name: "Deudas", value: p.liabilities, color: "var(--color-negative)" }] : [];

  const plan = buildPlan(p);
  const city = cities.find((c) => c.name === p.city) ?? null;
  const lifestyleFactor = lifestyles.find((l) => l.value === p.lifestyle)?.factor ?? 1;

  const yearsToGoal = Math.max(1, plan.freedomAge - (p.age ?? 30));
  const year = now.getFullYear();

  // Presupuesto real de la ciudad donde quieres vivir y camino hasta tu número allí.
  const cityFilters = suggestedFilters(p);
  const liveCity = p.city ? lifestyleCities.find((c) => c.name.toLowerCase() === p.city.toLowerCase()) ?? null : null;
  const cityMonthly = liveCity
    ? monthlyCost(liveCity, cityFilters.stage, cityFilters.comfort)
    : city
      ? Math.round(city.cost * lifestyleFactor)
      : null;
  // Sin ciudad elegida usamos los gastos reales de la persona, nunca un valor fijo.
  const cityMonthlySafe = cityMonthly ?? Math.round(expenses);

  const cityTarget = Math.round((cityMonthlySafe * 12) / 0.07);
  const cityYears = yearsToFreedom(Math.max(0, nw), savings, cityMonthlySafe * 12, p.expected_return || 7);
  const cityCapacitySafe = Math.max(0, income - cityMonthlySafe);
  const yearsToNumberSafe = yearsToFreedom(Math.max(0, nw), cityCapacitySafe, plan.targetCapital * ((p.withdrawal_rate || 7) / 100), p.expected_return || 7);




  const goals = [
    {
      name: "Your Number",
      emoji: "🏔",
      current: Math.max(0, nw),
      target: plan.targetCapital,
      deadline: String(year + yearsToGoal),
      monthly: savings,
    },
    {
      name: "Fondo de emergencia",
      emoji: "🛟",
      current: p.assets_cash + p.assets_bank,
      target: Math.max(1, p.income_salary) * 6,
      deadline: String(year + 1),
      monthly: Math.round(savings * 0.2),
    },
    {
      name: "Cartera de inversión",
      emoji: "📈",
      current: p.assets_etf + p.assets_stocks + p.assets_crypto,
      target: Math.max(1, plan.targetCapital * 0.6),
      deadline: String(year + Math.max(2, Math.round(yearsToGoal * 0.7))),
      monthly: monthlyInvest,
    },
    {
      name: p.city ? `Vivir en ${p.city}` : "Retiro anticipado",
      emoji: p.city ? "🌍" : "🌅",
      current: Math.max(0, nw),
      target: cityTarget,
      deadline: String(year + (cityYears ?? yearsToGoal)),
      monthly: savings,
      displayCurrent: income,
      displayTarget: cityMonthlySafe,
      progressPct: income >= cityMonthlySafe ? 100 : Math.min(100, Math.round((cityMonthlySafe / Math.max(1, income)) * 100)),
      note: p.city
        ? `${p.city}: ${fmt(cityMonthlySafe)}/mes · ${
            income >= cityMonthlySafe ? "ya puedes vivir allí" : `ahorro ${fmt(cityCapacitySafe)}/mes`
          }`
        : `Ciudad objetivo: ${fmt(cityMonthlySafe)}/mes`,
    },
  ];




  const incomeLines = [
    { name: "Salario", amount: p.income_salary },
    { name: "Bonos", amount: p.income_bonus },
    { name: "Alquileres", amount: p.income_rent },
    { name: "Otros ingresos", amount: p.income_other },
  ].filter((l) => l.amount > 0);

  const fixed = Math.round(expenses * 0.55);
  const lifestyleSpend = Math.max(0, expenses - fixed);
  const free = Math.max(0, income - expenses - monthlyInvest);

  return {
    currency,
    fmt,
    fmtCompact,
    months,
    current,
    previous,
    income,
    expenses,
    savings,
    savingsRate: plan.savingsRate,
    netWorth: nw,
    totalAssets: assetsTotal,
    totalLiabilities: p.liabilities,
    assets,
    liabilities,
    plan,
    retirement: {
      balance: p.assets_retirement,
      // Si el usuario fijó un aporte mensual en el simulador, se respeta;
      // si no, se estima como el 30% de su ahorro mensual.
      monthlyContribution:
        p.retirement_monthly_contribution > 0
          ? Math.round(p.retirement_monthly_contribution)
          : Math.round(savings * 0.3),
      returnAnnualized: p.expected_return,
      currentAge: p.age ?? 30,
      retireAge: p.retire_age,
      contributionsYTD:
        (p.retirement_monthly_contribution > 0
          ? Math.round(p.retirement_monthly_contribution)
          : Math.round(savings * 0.3)) * 12,
    },
    goals,
    cashFlow: {
      income: incomeLines,
      buckets: [
        { name: "Gastos fijos", amount: fixed, color: "var(--color-chart-2)" },
        { name: "Lifestyle", amount: lifestyleSpend, color: "var(--color-chart-3)" },
        { name: "Inversiones", amount: monthlyInvest, color: "var(--color-chart-1)" },
        { name: "Flujo libre", amount: free, color: "var(--color-chart-4)" },
      ],
    },
    cityCost: city?.cost ?? null,
    hasData: assetsTotal > 0 || income > 0 || expenses > 0,
  };
}

export function projectRetirementFrom(monthly: number, returnRate: number, years: number, start: number, fromAge: number) {
  const out: { year: number; value: number; contributed: number }[] = [];
  let value = start;
  let contributed = start;
  const r = returnRate / 100 / 12;
  for (let y = 0; y <= Math.max(0, years); y++) {
    out.push({ year: fromAge + y, value: Math.round(value), contributed: Math.round(contributed) });
    for (let m = 0; m < 12; m++) {
      value = value * (1 + r) + monthly;
      contributed += monthly;
    }
  }
  return out;
}
