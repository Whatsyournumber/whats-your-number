import { comfortableCostEur } from "./city-cost";
import { convertAmount } from "./fx";
import { SUPPORTED_CURRENCY_CODES } from "@/lib/fx";
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
  fixed_housing: number;
  fixed_utilities: number;
  fixed_insurance: number;
  fixed_transport: number;
  fixed_education: number;
  fixed_subscriptions: number;
  fixed_savings: number;
  fixed_other: number;
  assets_cash: number;
  assets_bank: number;
  assets_retirement: number;
  assets_etf: number;
  assets_stocks: number;
  assets_crypto: number;
  assets_property: number;
  liabilities: number;
  mortgage_balance: number;
  mortgage_rate: number;
  mortgage_term: number;
  retire_age: number;
  desired_retirement_income: number;
  expected_return: number;
  withdrawal_rate: number;
  retirement_monthly_contribution: number;
  priority: string;
  risk_profile: string;
  home_price: number;
  down_payment_pct: number;
  business_target: number;
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
  monthly_expenses: 0,
  monthly_savings: 0,
  fixed_housing: 0,
  fixed_utilities: 0,
  fixed_insurance: 0,
  fixed_transport: 0,
  fixed_education: 0,
  fixed_subscriptions: 0,
  fixed_savings: 0,
  fixed_other: 0,
  assets_cash: 0,
  assets_bank: 0,
  assets_retirement: 0,
  assets_etf: 0,
  assets_stocks: 0,
  assets_crypto: 0,
  assets_property: 0,
  liabilities: 0,
  mortgage_balance: 0,
  mortgage_rate: 3,
  mortgage_term: 20,
  retire_age: 60,
  desired_retirement_income: 0,
  expected_return: 7,
  withdrawal_rate: 7,
  retirement_monthly_contribution: 0,

  priority: "",
  risk_profile: "",
  home_price: 0,
  down_payment_pct: 20,
  business_target: 0,
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
  freedomAge: number;
  progress: number;
  /** "home" = entrada de la primera vivienda, "business" = capital para montar un negocio. */
  mode: "freedom" | "home" | "business";
  homePrice: number;
  downPayment: number;
  businessTarget: number;
  monthlyToGoal: number;
  monthsToGoal: number;
};

/** Capital needed using the user's safe withdrawal rate (default 4%) on the desired annual income. */
export function buildPlan(d: OnboardingData): NorthPlan {
  const income = totalIncome(d);
  const expenses = d.monthly_expenses;
  const savings = d.monthly_savings || Math.max(0, income - expenses);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const age = d.age ?? 30;
  const yearsLeft = Math.max(0, d.retire_age - age);
  const swr = Math.min(15, Math.max(1, d.withdrawal_rate || 7)) / 100;
  const desiredIncome = d.desired_retirement_income || expenses || 0;

  // Objetivo "primera vivienda": Your Number es la entrada (down payment) que necesitas.
  const homeMode = d.priority === "vivienda" && (d.home_price || 0) > 0;
  const homePrice = Math.max(0, d.home_price || 0);
  const downPct = Math.min(100, Math.max(1, d.down_payment_pct || 20));
  // Entrada + costes de compra estimados (~10% impuestos y gastos).
  const downPayment = homeMode ? homePrice * (downPct / 100) * 1.1 : 0;
  // Objetivo "montar mi negocio": Your Number es el capital que necesitas levantar.
  const businessTarget = Math.max(0, d.business_target || 0);
  const businessMode = !homeMode && (d.priority === "negocio" || d.priority === "otro") && businessTarget > 0;
  const liquid = Math.max(0, d.assets_cash + d.assets_bank);
  const goalAmount = homeMode ? downPayment : businessMode ? businessTarget : 0;
  const missingGoal = Math.max(0, goalAmount - liquid);
  const monthsToGoal = goalAmount > 0 && savings > 0 ? Math.ceil(missingGoal / savings) : 0;

  const targetCapital = goalAmount > 0 ? goalAmount : (desiredIncome * 12) / swr;


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
    desiredIncome: desiredIncome,
    targetCapital,
    projected,
    probability,
    freedomAge: freedomAgeEstimate(d, targetCapital) ?? d.retire_age,
    progress:
      targetCapital > 0
        ? Math.min(100, Math.max(0, ((goalAmount > 0 ? liquid : Math.max(0, netWorth(d))) / targetCapital) * 100))
        : 0,
    mode: homeMode ? "home" : businessMode ? "business" : "freedom",
    homePrice,
    downPayment,
    businessTarget,
    // Ahorro mensual necesario para lograrlo en 3 años.
    monthlyToGoal: goalAmount > 0 ? missingGoal / 36 : 0,
    monthsToGoal,
  };
}

export function money(v: number, currency = "USD") {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0);
}

export function currencySymbol(currency = "USD") {
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).formatToParts(1);
  return parts.find((p) => p.type === "currency")?.value ?? "$";
}

export function compact(v: number, currency = "USD") {
  const n = Number.isFinite(v) ? v : 0;
  const s = currencySymbol(currency);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const round = (x: number) => (x >= 100 ? Math.round(x).toString() : x.toFixed(1).replace(/\.0$/, ""));
  if (abs >= 1_000_000_000) return `${sign}${s}${round(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}${s}${round(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${s}${round(abs / 1_000)}K`;
  return `${sign}${s}${Math.round(abs)}`;
}

/**
 * Acorta un importe ya formateado ("1.458.600 US$") a "1,46M US$" para que nunca
 * se corte con puntos suspensivos en las tarjetas.
 */
export function shortenMoneyString(text: string): string {
  return text.replace(/-?\d[\d.,\s]*\d|-?\d/g, (match) => {
    const cleaned = match.replace(/\s/g, "");
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    const decimalSep = lastDot > lastComma ? "." : lastComma > lastDot ? "," : "";
    let intPart = cleaned;
    if (decimalSep) {
      const idx = cleaned.lastIndexOf(decimalSep);
      const decimals = cleaned.slice(idx + 1);
      const hasMoreGroups = /[.,]/.test(cleaned.slice(0, idx));
      const isAllZeros = decimals.length > 0 && decimals.split("").every((c) => c === "0");
      // separador de miles si tiene 3 dígitos y (hay más grupos o son puros ceros)
      if (!(decimals.length === 3 && (hasMoreGroups || isAllZeros))) {
        intPart = cleaned.slice(0, idx);
      }
    }
    const n = Number(intPart.replace(/[.,]/g, ""));
    if (!Number.isFinite(n)) return match;
    const sign = cleaned.startsWith("-") ? "-" : "";
    const abs = Math.abs(n);
    const round = (x: number) => {
      const v = x >= 100 ? Math.round(x) : Math.round(x * 10) / 10;
      return String(v).replace(".", ",");
    };
    if (abs >= 1_000_000_000) return `${sign}${round(abs / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${sign}${round(abs / 1_000_000)}M`;
    if (abs >= 100_000) return `${sign}${round(abs / 1_000)}K`;
    return match;
  });
}



/* ─────────── Onboarding premium: objetivos, ciudades y estilo de vida ─────────── */

export type LifeData = {
  goal: string;
  goal_note: string;
  city: string;
  marital_status: string;
  children: string;
  plans_children: string;
  lifestyle: string;
  travel_frequency: string;
  housing: string;
};

export const emptyLife: LifeData = {
  goal: "",
  goal_note: "",
  city: "",
  marital_status: "",
  children: "",
  plans_children: "",
  lifestyle: "",
  travel_frequency: "",
  housing: "",
};

export const goals = [
  { value: "libertad", emoji: "💰", label: "Alcanzar la libertad financiera" },
  { value: "patrimonio", emoji: "📈", label: "Hacer crecer mi patrimonio" },
  { value: "gastos", emoji: "💳", label: "Entender y controlar mis gastos" },
  { value: "organizar", emoji: "💼", label: "Organizar mejor mi dinero" },
  { value: "vivienda", emoji: "🏡", label: "Ahorrar para una vivienda" },
  { value: "negocio", emoji: "🚀", label: "Montar mi negocio" },
  { value: "otro", emoji: "✍️", label: "Otro objetivo (escríbelo)" },
];

export const maritalOptions = ["Soltero", "En pareja", "Casado", "Divorciado"];
export const childrenOptions = ["0", "1", "2", "3+"];
export const plansChildrenOptions = ["Sí", "No", "No estoy seguro"];

export const lifestyles = [
  { value: "minimalista", emoji: "🌱", label: "Minimalista", desc: "Lo esencial, sin excesos.", factor: 0.75 },
  { value: "comodo", emoji: "🙂", label: "Cómodo", desc: "Vida tranquila y sin apuros.", factor: 1 },
  { value: "premium", emoji: "✨", label: "Premium", desc: "Buenos restaurantes, buenos viajes.", factor: 1.45 },
  { value: "lujo", emoji: "👑", label: "Lujo", desc: "Sin límites relevantes de gasto.", factor: 2.1 },
];

export const travelOptions = [
  { value: "nunca", label: "Nunca", extra: 0 },
  { value: "1-2", label: "1-2", extra: 150 },
  { value: "3-5", label: "3-5", extra: 400 },
  { value: "5+", label: "Más de 5", extra: 800 },
];

export const housingOptions = [
  { value: "pagada", emoji: "🏠", label: "Sí, totalmente pagada" },
  { value: "hipoteca", emoji: "🏦", label: "Sí, con hipoteca" },
  { value: "alquiler", emoji: "🏢", label: "Vivo de alquiler" },
  { value: "ns", emoji: "🤷", label: "Prefiero no responder" },
];

/** Coste de vida mensual estimado para una pareja/persona con estilo "cómodo". */
export type City = { name: string; country: string; currency: string; cost: number };

export const cities: City[] = [
  { name: "Madrid", country: "España", currency: "EUR", cost: 2600 },
  { name: "Barcelona", country: "España", currency: "EUR", cost: 2800 },
  { name: "Valencia", country: "España", currency: "EUR", cost: 2200 },
  { name: "Málaga", country: "España", currency: "EUR", cost: 2300 },
  { name: "Lisboa", country: "Portugal", currency: "EUR", cost: 2400 },
  { name: "Oporto", country: "Portugal", currency: "EUR", cost: 2100 },
  { name: "París", country: "Francia", currency: "EUR", cost: 3600 },
  { name: "Milán", country: "Italia", currency: "EUR", cost: 3000 },
  { name: "Berlín", country: "Alemania", currency: "EUR", cost: 3000 },
  { name: "Ámsterdam", country: "Países Bajos", currency: "EUR", cost: 3600 },
  { name: "Zúrich", country: "Suiza", currency: "CHF", cost: 5200 },
  { name: "Londres", country: "Reino Unido", currency: "GBP", cost: 4200 },
  { name: "Dubái", country: "Emiratos Árabes", currency: "AED", cost: 3800 },
  { name: "Nueva York", country: "Estados Unidos", currency: "USD", cost: 5000 },
  { name: "Miami", country: "Estados Unidos", currency: "USD", cost: 4200 },
  { name: "Austin", country: "Estados Unidos", currency: "USD", cost: 3400 },
  { name: "Ciudad de México", country: "México", currency: "MXN", cost: 1800 },
  { name: "Bogotá", country: "Colombia", currency: "COP", cost: 1400 },
  { name: "Medellín", country: "Colombia", currency: "COP", cost: 1300 },
  { name: "Santiago", country: "Chile", currency: "CLP", cost: 1900 },
  { name: "Buenos Aires", country: "Argentina", currency: "ARS", cost: 1600 },
  { name: "Lima", country: "Perú", currency: "PEN", cost: 1500 },
  { name: "São Paulo", country: "Brasil", currency: "BRL", cost: 1900 },
  { name: "Montevideo", country: "Uruguay", currency: "UYU", cost: 1800 },
  { name: "Panamá", country: "Panamá", currency: "USD", cost: 2000 },
  { name: "Bali", country: "Indonesia", currency: "IDR", cost: 1500 },
  { name: "Bangkok", country: "Tailandia", currency: "THB", cost: 1700 },
  { name: "Tokio", country: "Japón", currency: "JPY", cost: 3000 },
];

/** Ingreso mensual objetivo al alcanzar la libertad financiera. */
/**
 * Estima el gasto/ingreso mensual objetivo. Los costes de ciudad están en EUR,
 * así que el resultado se convierte a la moneda del perfil con la tasa del día.
 */
export function estimateDesiredIncome(
  life: LifeData,
  extra: { children?: string; currency?: string } = {},
) {
  const city = cities.find((c) => c.name === life.city);
  // Si la ciudad no está en el catálogo curado, estimamos su coste de vida cómodo.
  const base = city?.cost ?? (life.city ? comfortableCostEur({ name: life.city }) : 2600);
  const factor = lifestyles.find((l) => l.value === life.lifestyle)?.factor ?? 1;
  const travel = travelOptions.find((t) => t.value === life.travel_frequency)?.extra ?? 0;
  const kids = (extra.children ?? life.children) === "1" ? 1 : (extra.children ?? life.children) === "2" ? 2 : (extra.children ?? life.children) === "3+" ? 3 : 0;
  // Un hijo planeado cuenta a media ponderación (aún no está en el hogar).
  const plannedKids = life.plans_children === "Sí" ? 0.5 : 0;
  const partner = life.marital_status === "Casado" || life.marital_status === "En pareja" ? 1.35 : 1;
  const housing = life.housing === "pagada" ? 0.78 : 1;
  const eur = base * factor * partner * housing + travel + (kids + plannedKids) * 450;
  const target = (extra.currency || "EUR").toUpperCase();
  const value = convertAmount(eur, "EUR", target);
  // Redondeo proporcional a la magnitud (50 en EUR/USD, 1.000 en MXN/JPY, etc.).
  const step = value >= 1_000_000 ? 50_000 : value >= 100_000 ? 5_000 : value >= 20_000 ? 500 : 50;
  return Math.round(value / step) * step;
}

export function buildInsights(
  plan: NorthPlan,
  d: OnboardingData,
  life: LifeData,
  currency: string,
  lang: "es" | "en" = "es",
) {
  const en = lang === "en";
  const out: string[] = [];
  const liquid = d.assets_cash + d.assets_bank;
  const assets = totalAssets(d);
  const cashPct = assets > 0 ? Math.round((liquid / assets) * 100) : 0;
  const yearsSaved = Math.max(1, Math.round(plan.yearsLeft * 0.12));

  out.push(
    en
      ? `By cutting your monthly spending by 8%, you'd reach your goal about ${yearsSaved} ${yearsSaved === 1 ? "year" : "years"} earlier.`
      : `Reduciendo tus gastos mensuales un 8%, alcanzarías tu objetivo aproximadamente ${yearsSaved} ${yearsSaved === 1 ? "año" : "años"} antes.`,
  );
  if (cashPct >= 25) {
    out.push(
      en
        ? `Right now ${cashPct}% of your net worth sits in cash. Consider whether that mix fits your goals and risk tolerance.`
        : `Actualmente el ${cashPct}% de tu patrimonio está en efectivo. Considera si esa distribución encaja con tus objetivos y tu tolerancia al riesgo.`,
    );
  } else {
    out.push(
      en
        ? `Your net worth is well diversified: only ${cashPct}% stays in cash, the rest works for you.`
        : `Tu patrimonio está bien diversificado: solo el ${cashPct}% permanece en efectivo, el resto trabaja para ti.`,
    );
  }
  out.push(
    en
      ? `At your current saving and investing pace, you're projected to hit your goal at age ${plan.freedomAge} (${money(plan.projected, currency)} estimated).`
      : `Con el ritmo actual de ahorro e inversión, estás proyectado para alcanzar tu objetivo a los ${plan.freedomAge} años (${money(plan.projected, currency)} estimados).`,
  );
  if (life.city) {
    const style = lifestyles.find((l) => l.value === life.lifestyle)?.label.toLowerCase() ?? (en ? "comfortable" : "cómodo");
    out.push(
      en
        ? `Living in ${life.city} with a ${style} lifestyle implies a target of ${money(plan.desiredIncome, currency)} per month.`
        : `Vivir en ${life.city} con un estilo ${style} implica un objetivo de ${money(plan.desiredIncome, currency)} al mes.`,
    );
  }
  return out.slice(0, 3);
}


/** Edad estimada en la que el capital alcanza el objetivo, con el ritmo actual. */
export function freedomAgeEstimate(d: OnboardingData, target: number) {
  const age = d.age ?? 30;
  const monthlyR = d.expected_return / 100 / 12;
  let capital = Math.max(0, netWorth(d));
  const savings = d.monthly_savings;
  let months = 0;
  while (capital < target && months < 12 * 60) {
    capital = capital * (1 + monthlyR) + savings;
    months += 1;
  }
  return months >= 12 * 60 ? null : Math.round(age + months / 12);
}

export type CurrencyOption = { code: string; label: string; symbol: string };

/** Símbolos comunes; el resto usa el propio código ISO. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "\u20AC", GBP: "\u00A3", JPY: "\u00A5", CNY: "\u00A5", KRW: "\u20A9",
  INR: "\u20B9", RUB: "\u20BD", TRY: "\u20BA", BRL: "R$", MXN: "$", ARS: "$", CLP: "$",
  COP: "$", UYU: "$", DOP: "$", PEN: "S/", PYG: "\u20B2", BOB: "Bs", HNL: "L", NIO: "C$",
  CRC: "\u20A1", GTQ: "Q", VES: "Bs", CAD: "$", AUD: "$", NZD: "$", HKD: "$", SGD: "$",
  TWD: "NT$", PHP: "\u20B1", THB: "\u0E3F", VND: "\u20AB", ILS: "\u20AA", NGN: "\u20A6",
  ZAR: "R", PLN: "z\u0142", CZK: "K\u010D", HUF: "Ft", SEK: "kr", NOK: "kr", DKK: "kr",
  UAH: "\u20B4", KZT: "\u20B8", CHF: "CHF",
};

/** Monedas mostradas primero por ser las más usadas por los usuarios. */
const PRIORITY_CURRENCIES = [
  "EUR", "USD", "GBP", "CHF", "MXN", "COP", "CLP", "ARS", "UYU", "PEN", "BRL", "CAD",
  "DOP", "GTQ", "CRC", "PYG", "BOB", "HNL", "NIO", "VES",
];

function currencyLabel(code: string): string {
  try {
    const dn = new Intl.DisplayNames(["es"], { type: "currency" });
    const name = dn.of(code);
    if (name && name !== code) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    /* Intl no disponible: se usa el código */
  }
  return code;
}

/** Todas las monedas soportadas por el motor de conversión, con las comunes arriba. */
export const currencies: CurrencyOption[] = (() => {
  const rest = SUPPORTED_CURRENCY_CODES.filter((c) => !PRIORITY_CURRENCIES.includes(c));
  const ordered = [...PRIORITY_CURRENCIES.filter((c) => SUPPORTED_CURRENCY_CODES.includes(c)), ...rest];
  return ordered.map((code) => ({
    code,
    label: currencyLabel(code),
    symbol: CURRENCY_SYMBOLS[code] ?? code,
  }));
})();

/** Gastos fijos declarados en el onboarding, listos para la pestaña de Gastos. */
export const FIXED_FIELDS = [
  { key: "fixed_housing", es: "Hipoteca / Alquiler", en: "Mortgage / Rent", emoji: "\u{1F3E0}" },
  { key: "fixed_savings", es: "Fondo de ahorro", en: "Savings fund", emoji: "\u{1F4B0}" },
  { key: "fixed_utilities", es: "Servicios (luz, agua, internet)", en: "Utilities (power, water, internet)", emoji: "\u{1F4A1}" },
  { key: "fixed_insurance", es: "Seguros (salud, hogar, auto)", en: "Insurance (health, home, car)", emoji: "\u{1F6E1}\uFE0F" },
  { key: "fixed_transport", es: "Transporte", en: "Transport", emoji: "\u{1F697}" },
  { key: "fixed_education", es: "Educaci\u00f3n / Colegios", en: "Education / School", emoji: "\u{1F393}" },
  { key: "fixed_subscriptions", es: "Suscripciones", en: "Subscriptions", emoji: "\u{1F4F1}" },
  { key: "fixed_other", es: "Otros gastos fijos", en: "Other fixed expenses", emoji: "\u{1F9FE}" },
] as const satisfies readonly { key: keyof OnboardingData; es: string; en: string; emoji: string }[];

export function totalFixedExpenses(d: Pick<OnboardingData, (typeof FIXED_FIELDS)[number]["key"]>) {
  return FIXED_FIELDS.reduce((s, f) => s + (Number(d[f.key]) || 0), 0);
}
