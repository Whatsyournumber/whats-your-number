export type OnboardingData = {
  full_name: string;
  age: number | null;
  country: string;
  country_code: string;
  currency: string;
  timezone: string;
  income_salary: number;
  income_bonus: number;
  income_rent: number;
  income_other: number;
  monthly_expenses: number;
  monthly_savings: number;
  assets_cash: number;
  assets_bank: number;
  assets_retirement: number;
  assets_etf: number;
  assets_stocks: number;
  assets_crypto: number;
  assets_property: number;
  liabilities: number;
  retire_age: number;
  desired_retirement_income: number;
  expected_return: number;
  priority: string;
  risk_profile: string;
};

export const emptyOnboarding: OnboardingData = {
  full_name: "",
  age: null,
  country: "",
  country_code: "",
  currency: "USD",
  timezone: "",
  income_salary: 0,
  income_bonus: 0,
  income_rent: 0,
  income_other: 0,
  monthly_expenses: 2000,
  monthly_savings: 0,
  assets_cash: 0,
  assets_bank: 0,
  assets_retirement: 0,
  assets_etf: 0,
  assets_stocks: 0,
  assets_crypto: 0,
  assets_property: 0,
  liabilities: 0,
  retire_age: 60,
  desired_retirement_income: 5000,
  expected_return: 7,
  priority: "",
  risk_profile: "",
};

export type Country = { name: string; code: string; currency: string; tz: string };

export const countries: Country[] = [
  { name: "Argentina", code: "AR", currency: "ARS", tz: "America/Argentina/Buenos_Aires" },
  { name: "Bolivia", code: "BO", currency: "BOB", tz: "America/La_Paz" },
  { name: "Brasil", code: "BR", currency: "BRL", tz: "America/Sao_Paulo" },
  { name: "Canadá", code: "CA", currency: "CAD", tz: "America/Toronto" },
  { name: "Chile", code: "CL", currency: "CLP", tz: "America/Santiago" },
  { name: "Colombia", code: "CO", currency: "COP", tz: "America/Bogota" },
  { name: "Costa Rica", code: "CR", currency: "CRC", tz: "America/Costa_Rica" },
  { name: "Ecuador", code: "EC", currency: "USD", tz: "America/Guayaquil" },
  { name: "El Salvador", code: "SV", currency: "USD", tz: "America/El_Salvador" },
  { name: "España", code: "ES", currency: "EUR", tz: "Europe/Madrid" },
  { name: "Estados Unidos", code: "US", currency: "USD", tz: "America/New_York" },
  { name: "Francia", code: "FR", currency: "EUR", tz: "Europe/Paris" },
  { name: "Guatemala", code: "GT", currency: "GTQ", tz: "America/Guatemala" },
  { name: "Honduras", code: "HN", currency: "HNL", tz: "America/Tegucigalpa" },
  { name: "Italia", code: "IT", currency: "EUR", tz: "Europe/Rome" },
  { name: "México", code: "MX", currency: "MXN", tz: "America/Mexico_City" },
  { name: "Nicaragua", code: "NI", currency: "NIO", tz: "America/Managua" },
  { name: "Panamá", code: "PA", currency: "USD", tz: "America/Panama" },
  { name: "Paraguay", code: "PY", currency: "PYG", tz: "America/Asuncion" },
  { name: "Perú", code: "PE", currency: "PEN", tz: "America/Lima" },
  { name: "Portugal", code: "PT", currency: "EUR", tz: "Europe/Lisbon" },
  { name: "Reino Unido", code: "GB", currency: "GBP", tz: "Europe/London" },
  { name: "República Dominicana", code: "DO", currency: "DOP", tz: "America/Santo_Domingo" },
  { name: "Suiza", code: "CH", currency: "CHF", tz: "Europe/Zurich" },
  { name: "Uruguay", code: "UY", currency: "UYU", tz: "America/Montevideo" },
  { name: "Venezuela", code: "VE", currency: "VES", tz: "America/Caracas" },
];

export const priorities = [
  { value: "patrimonio", label: "Construir patrimonio", emoji: "🏛️" },
  { value: "ahorro", label: "Ahorrar más", emoji: "🌱" },
  { value: "retiro_temprano", label: "Retirarme temprano", emoji: "🏝️" },
  { value: "casa", label: "Comprar una casa", emoji: "🏠" },
  { value: "pasivos", label: "Generar ingresos pasivos", emoji: "💫" },
  { value: "gastos", label: "Controlar mis gastos", emoji: "🎯" },
  { value: "invertir", label: "Invertir mejor", emoji: "📈" },
];

export const riskProfiles = [
  { value: "conservador", label: "Conservador", desc: "Priorizo proteger lo que tengo. Menos volatilidad, crecimiento estable." },
  { value: "moderado", label: "Moderado", desc: "Balance entre crecimiento y estabilidad. El punto medio clásico." },
  { value: "agresivo", label: "Agresivo", desc: "Acepto volatilidad alta a cambio de mayor crecimiento a largo plazo." },
];

export function totalIncome(d: OnboardingData) {
  return d.income_salary + d.income_bonus + d.income_rent + d.income_other;
}

export function totalAssets(d: OnboardingData) {
  return (
    d.assets_cash + d.assets_bank + d.assets_retirement + d.assets_etf + d.assets_stocks + d.assets_crypto + d.assets_property
  );
}

export function netWorth(d: OnboardingData) {
  return totalAssets(d) - d.liabilities;
}

export type NorthPlan = {
  netWorth: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  retireAge: number;
  yearsLeft: number;
  desiredIncome: number;
  targetCapital: number;
  projected: number;
  probability: number;
};

/** Capital needed using a 4% safe withdrawal rate on the desired annual income. */
export function buildPlan(d: OnboardingData): NorthPlan {
  const income = totalIncome(d);
  const expenses = d.monthly_expenses;
  const savings = d.monthly_savings || Math.max(0, income - expenses);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const age = d.age ?? 30;
  const yearsLeft = Math.max(0, d.retire_age - age);
  const targetCapital = (d.desired_retirement_income * 12) / 0.04;

  const r = d.expected_return / 100;
  const monthlyR = r / 12;
  const n = yearsLeft * 12;
  const nw = Math.max(0, netWorth(d));
  const future = nw * Math.pow(1 + monthlyR, n);
  const contributions = monthlyR > 0 ? savings * ((Math.pow(1 + monthlyR, n) - 1) / monthlyR) : savings * n;
  const projected = future + contributions;

  const ratio = targetCapital > 0 ? projected / targetCapital : 1;
  // Smooth S-curve estimate, capped between 5% and 95% — it is an estimate, not a guarantee.
  const probability = Math.round(Math.min(95, Math.max(5, 100 / (1 + Math.exp(-6 * (ratio - 0.85))))));

  return {
    netWorth: netWorth(d),
    income,
    expenses,
    savings,
    savingsRate,
    retireAge: d.retire_age,
    yearsLeft,
    desiredIncome: d.desired_retirement_income,
    targetCapital,
    projected,
    probability,
  };
}

export function money(v: number, currency = "USD") {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0);
}

export function compact(v: number, currency = "USD") {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: currency || "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(v) ? v : 0);
}
