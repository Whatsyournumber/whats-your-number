/**
 * My First Number — lógica de dominio compartida.
 * Planificador financiero familiar: no es banco, no es tarjeta, no es broker.
 */

export type Pocket = "gastar" | "ahorrar" | "crecer";

export type Member = {
  id: string;
  name: string;
  role: string;
  theme: string;
  avatar: string;
  age: number;
  currency: string;
  base_currency?: string;

  allowance_amount: number;
  allowance_frequency: string;
  split_spend: number;
  split_save: number;
  split_grow: number;
  xp: number;
  streak: number;
  onboarded: boolean;
};

export type FutureFund = {
  id: string;
  member_id: string;
  initial_balance: number;
  monthly_contribution: number;
  current_balance: number;
  target_age: number;
  expected_return: number;
  goal: string;
};

export type Task = {
  id: string;
  member_id: string;
  title: string;
  emoji: string;
  reward: number;
  frequency: string;
  status: string;
  completed_at: string | null;
  approved_at: string | null;
};

export type Wish = {
  id: string;
  member_id: string;
  title: string;
  emoji: string;
  price: number;
  saved: number;
  achieved: boolean;
};

export type Movement = {
  id: string;
  member_id: string;
  label: string;
  source: string;
  amount: number;
  pocket: string;
  occurred_at: string;
};

export type Holding = {
  id: string;
  member_id: string;
  name: string;
  emoji: string;
  value: number;
  growth: number;
};

export const POCKETS: {
  key: Pocket;
  label: string;
  labelEn: string;
  emoji: string;
  hint: string;
  hintEn: string;
}[] = [
  { key: "gastar", label: "Gastar", labelEn: "Spend", emoji: "🛍", hint: "Para disfrutar hoy.", hintEn: "To enjoy today." },
  { key: "ahorrar", label: "Ahorrar", labelEn: "Save", emoji: "🌱", hint: "Para sus próximos sueños.", hintEn: "For their next dreams." },
  { key: "crecer", label: "Hacer crecer", labelEn: "Grow", emoji: "📈", hint: "Para invertir pensando en el futuro.", hintEn: "To invest for the future." },
];

export type Lang2 = "es" | "en";

/** Etiqueta del bolsillo en el idioma activo. */
export function pocketLabel(key: string, lang: Lang2 = "es") {
  const p = POCKETS.find((x) => x.key === key);
  if (!p) return key;
  return lang === "en" ? p.labelEn : p.label;
}

export const WISH_IDEAS = [
  { emoji: "🎮", title: "Nintendo", titleEn: "Nintendo", price: 320 },
  { emoji: "🚲", title: "Bicicleta", titleEn: "Bike", price: 220 },
  { emoji: "💻", title: "Ordenador", titleEn: "Laptop", price: 700 },
  { emoji: "📱", title: "Teléfono", titleEn: "Phone", price: 450 },
  { emoji: "✈️", title: "Viaje", titleEn: "Trip", price: 600 },
  { emoji: "⚽", title: "Deporte", titleEn: "Sports gear", price: 120 },
  { emoji: "🎸", title: "Instrumento", titleEn: "Instrument", price: 260 },
  { emoji: "🎁", title: "Otro", titleEn: "Other", price: 100 },
];

export const FUND_GOALS = [
  "🎓 Universidad",
  "🏡 Primer apartamento",
  "💼 Emprender",
  "💰 Patrimonio inicial",
  "❤️ Otro",
];

const FUND_GOALS_EN: Record<string, string> = {
  "🎓 Universidad": "🎓 College",
  "🏡 Primer apartamento": "🏡 First apartment",
  "💼 Emprender": "💼 Start a business",
  "💰 Patrimonio inicial": "💰 Starting wealth",
  "❤️ Otro": "❤️ Other",
};

/** Traduce la meta del fondo (el valor guardado en base de datos sigue en ES). */
export function goalLabel(goal: string, lang: Lang2 = "es") {
  return lang === "en" ? (FUND_GOALS_EN[goal] ?? goal) : goal;
}

export const TASK_IDEAS = [
  { emoji: "🛏", title: "Hacer la cama", titleEn: "Make the bed", reward: 1 },
  { emoji: "🐕", title: "Pasear al perro", titleEn: "Walk the dog", reward: 2 },
  { emoji: "📚", title: "Leer 20 minutos", titleEn: "Read 20 minutes", reward: 2 },
  { emoji: "🧺", title: "Ordenar la habitación", titleEn: "Tidy the room", reward: 3 },
  { emoji: "🍽", title: "Poner la mesa", titleEn: "Set the table", reward: 1 },
  { emoji: "🌿", title: "Regar las plantas", titleEn: "Water the plants", reward: 1 },
];

export const RETURN_OPTIONS = [4, 5, 7, 8];

export const DISCLAIMER =
  "Estas son simulaciones basadas en hipótesis de rentabilidad y no garantizan resultados futuros.";

export const DISCLAIMER_EN =
  "These are simulations based on return assumptions and do not guarantee future results.";

export function disclaimer(lang: Lang2 = "es") {
  return lang === "en" ? DISCLAIMER_EN : DISCLAIMER;
}

/** Locale activo para formatear importes (lo fija el proveedor de idioma). */
let moneyLocale = "es-ES";
export function setMoneyLocale(locale: string) {
  moneyLocale = locale;
}

/** Factor de conversión activo (moneda base de los datos → moneda mostrada). */
let fxFactor = 1;
export function setFxFactor(factor: number) {
  fxFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
}
export function getFxFactor() {
  return fxFactor;
}

export function money(value: number, currency = "EUR", compact = false) {
  const amount = (value || 0) * fxFactor;
  return new Intl.NumberFormat(moneyLocale, {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: compact ? 1 : amount % 1 === 0 ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(amount);
}



/** Proyección con aportes mensuales y capitalización mensual. */
export function projectFund(
  initial: number,
  monthly: number,
  fromAge: number,
  toAge: number,
  annualReturn: number,
) {
  const years = Math.max(0, toAge - fromAge);
  const r = annualReturn / 100 / 12;
  const points: { age: number; label: string; total: number; aportes: number }[] = [];
  let balance = initial;
  let contributed = initial;
  points.push({ age: fromAge, label: `${fromAge}`, total: balance, aportes: contributed });
  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + r) + monthly;
      contributed += monthly;
    }
    points.push({
      age: fromAge + year,
      label: `${fromAge + year}`,
      total: Math.round(balance),
      aportes: Math.round(contributed),
    });
  }
  const final = points[points.length - 1] ?? { total: initial, aportes: initial };
  return {
    points,
    today: initial,
    future: Math.round(final.total),
    contributed: Math.round(final.aportes),
    growth: Math.round(final.total - final.aportes),
  };
}

export function pocketTotals(movements: Movement[]) {
  const totals: Record<Pocket, number> = { gastar: 0, ahorrar: 0, crecer: 0 };
  for (const m of movements) {
    const key = (m.pocket as Pocket) in totals ? (m.pocket as Pocket) : "gastar";
    totals[key] += Number(m.amount) || 0;
  }
  return totals;
}

export function splitAmount(amount: number, member: Pick<Member, "split_spend" | "split_save" | "split_grow">) {
  const gastar = Math.round(amount * (member.split_spend / 100) * 100) / 100;
  const ahorrar = Math.round(amount * (member.split_save / 100) * 100) / 100;
  const crecer = Math.round((amount - gastar - ahorrar) * 100) / 100;
  return { gastar, ahorrar, crecer };
}

export function bySource(movements: Movement[]) {
  const map = new Map<string, number>();
  for (const m of movements) map.set(m.source, (map.get(m.source) ?? 0) + Number(m.amount));
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function monthlySavingPace(movements: Movement[]) {
  const saving = movements.filter((m) => m.pocket === "ahorrar");
  if (saving.length === 0) return 0;
  const months = new Set(saving.map((m) => m.occurred_at.slice(0, 7))).size || 1;
  return saving.reduce((sum, m) => sum + Number(m.amount), 0) / months;
}

export function wishForecast(wish: Wish, pace: number) {
  const missing = Math.max(0, Number(wish.price) - Number(wish.saved));
  const progress = wish.price > 0 ? Math.min(100, (Number(wish.saved) / Number(wish.price)) * 100) : 0;
  const months = pace > 0 ? missing / pace : Infinity;
  const weeksSaved = pace > 0 ? (missing / (pace + 10)) * 4.3 : Infinity;
  const soonerWeeks =
    Number.isFinite(months) && Number.isFinite(weeksSaved)
      ? Math.max(1, Math.round(months * 4.3 - weeksSaved))
      : 2;
  return { missing, progress, months, soonerWeeks };
}

export const THEME_ATTR = "data-kid-theme";
export const ACTIVE_PROFILE_KEY = "mfn.active-profile";

export function seedHoldings(base: number) {
  return [
    { name: "S&P 500", emoji: "📈", value: Math.round(base * 0.45), growth: 7.4 },
    { name: "ETF Mundial", emoji: "🌍", value: Math.round(base * 0.3), growth: 6.1 },
    { name: "Tecnología", emoji: "💻", value: Math.round(base * 0.15), growth: 9.2 },
    { name: "Cash", emoji: "💵", value: Math.round(base * 0.1), growth: 1.5 },
  ];
}

export const BUDDY_LINES_EN = [
  "Today your money worked for you.",
  "Saving this week will bring your dream closer.",
  "Your wealth grew while you were playing.",
  "A parent just added money to your Future Fund.",
  "Every coin you keep today is worth more tomorrow.",
];

export function buddyLines(lang: Lang2 = "es") {
  return lang === "en" ? BUDDY_LINES_EN : BUDDY_LINES;
}

export const BUDDY_LINES = [
  "Hoy tu dinero trabajó por ti.",
  "Ahorrar esta semana hará que tu sueño llegue antes.",
  "Tu patrimonio creció aunque estabas jugando.",
  "Papá acaba de añadir dinero a tu Fondo del Futuro.",
  "Cada euro que guardas hoy vale más mañana.",
];

/* ── Calculadora "Mi Número" para padres ───────────────────────────── */

export type Vehicle = {
  key: string;
  emoji: string;
  name: string;
  nameEn: string;
  hint: string;
  hintEn: string;
  min: number;
  max: number;
  rate: number;
  /** Fuente de la hipótesis de rentabilidad. */
  source: string;
  sourceEn: string;
};

/** Hipótesis de rentabilidad anual nominal por vehículo (educativas, no consejo financiero). */
export const VEHICLES: Vehicle[] = [
  { key: "dpf", emoji: "🏦", name: "Banco / DPF", nameEn: "Bank / CD", hint: "Depósito a plazo fijo", hintEn: "Fixed-term deposit", min: 3, max: 5, rate: 4, source: "Tasas de depósitos a plazo fijo de bancos (3-5% nominal)", sourceEn: "Bank fixed-term deposit rates (3-5% nominal)" },
  { key: "bonos", emoji: "📄", name: "Bonos", nameEn: "Bonds", hint: "Renta fija", hintEn: "Fixed income", min: 5, max: 7, rate: 6, source: "Renta fija global / bonos corporativos grado de inversión (5-7%)", sourceEn: "Global fixed income / investment-grade bonds (5-7%)" },
  { key: "sp500", emoji: "🇺🇸", name: "S&P 500", nameEn: "S&P 500", hint: "Histórico largo plazo", hintEn: "Long-term historical", min: 8, max: 10, rate: 10, source: "Retorno histórico nominal del S&P 500 con dividendos reinvertidos, ~10% anual desde 1957", sourceEn: "S&P 500 historical nominal return with dividends reinvested, ~10% per year since 1957" },
  { key: "nasdaq", emoji: "💻", name: "Nasdaq 100", nameEn: "Nasdaq 100", hint: "Tecnología, más volátil", hintEn: "Tech, more volatile", min: 10, max: 15, rate: 13, source: "Retorno histórico nominal del Nasdaq 100, ~13% anual desde 1986 (mayor volatilidad)", sourceEn: "Nasdaq 100 historical nominal return, ~13% per year since 1986 (higher volatility)" },
  { key: "cripto", emoji: "🪙", name: "Cripto", nameEn: "Crypto", hint: "Muy volátil, alto riesgo", hintEn: "Very volatile, high risk", min: 15, max: 30, rate: 20, source: "Bitcoin histórico (2015-2025) recortado con fuerte descuento por volatilidad; escenario muy incierto", sourceEn: "Bitcoin history (2015-2025) heavily discounted for volatility; highly uncertain scenario" },
];


/** Meses hasta la edad objetivo (mínimo 1). */
export function monthsUntil(fromAge: number, toAge: number) {
  return Math.max(1, Math.round((toAge - fromAge) * 12));
}

/** Valor futuro de un capital inicial + aporte mensual. */
export function futureValue(initial: number, monthly: number, months: number, annualReturn: number) {
  const r = annualReturn / 100 / 12;
  if (r === 0) return initial + monthly * months;
  const growth = Math.pow(1 + r, months);
  return initial * growth + monthly * ((growth - 1) / r);
}

/** Aporte mensual necesario para alcanzar un objetivo. */
export function monthlyNeeded(
  target: number,
  initial: number,
  months: number,
  annualReturn: number,
) {
  const r = annualReturn / 100 / 12;
  const growth = r === 0 ? 1 : Math.pow(1 + r, months);
  const fromInitial = initial * growth;
  const remaining = target - fromInitial;
  if (remaining <= 0) return 0;
  const factor = r === 0 ? months : (growth - 1) / r;
  return Math.max(0, remaining / factor);
}

/** Comparativa de vehículos para un objetivo dado. */
export function compareVehicles(
  target: number,
  initial: number,
  monthly: number,
  months: number,
) {
  return VEHICLES.map((v) => {
    const future = futureValue(initial, monthly, months, v.rate);
    const need = monthlyNeeded(target, initial, months, v.rate);
    return {
      ...v,
      future: Math.round(future),
      needed: Math.round(need * 100) / 100,
      gap: Math.round(future - target),
      reaches: future >= target,
      contributed: Math.round(initial + monthly * months),
      progress: target > 0 ? Math.min(1, future / target) : 0,
    };
  });
}

/** Serie de crecimiento anual por vehículo (para el gráfico comparativo). */
export function vehicleSeries(
  initial: number,
  monthly: number,
  fromAge: number,
  toAge: number,
) {
  const years = Math.max(1, Math.round(toAge - fromAge));
  const points: Record<string, number | string>[] = [];
  for (let y = 0; y <= years; y++) {
    const point: Record<string, number | string> = {
      age: Math.round((fromAge + y) * 10) / 10,
      label: `${Math.round(fromAge + y)}`,
    };
    for (const v of VEHICLES) {
      point[v.key] = Math.round(futureValue(initial, monthly, y * 12, v.rate));
    }
    points.push(point);
  }
  return points;
}

/** Meses necesarios para alcanzar el objetivo (null si nunca con estos datos). */
export function monthsToTarget(
  target: number,
  initial: number,
  monthly: number,
  annualReturn: number,
  maxMonths = 12 * 80,
) {
  if (initial >= target) return 0;
  let balance = initial;
  const r = annualReturn / 100 / 12;
  for (let m = 1; m <= maxMonths; m++) {
    balance = balance * (1 + r) + monthly;
    if (balance >= target) return m;
  }
  return null;
}

/** "12 años y 4 meses" a partir de meses. */
export function humanDuration(months: number | null, lang: Lang2 = "es") {
  const en = lang === "en";
  if (months === null) return en ? "not with these numbers" : "nunca con estos datos";
  if (months === 0) return en ? "you already have it" : "ya lo tienes";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yy = en ? (y === 1 ? "1 year" : `${y} years`) : y === 1 ? "1 año" : `${y} años`;
  const mm = en ? (m === 1 ? "1 month" : `${m} months`) : m === 1 ? "1 mes" : `${m} meses`;
  if (y === 0) return mm;
  if (m === 0) return yy;
  return en ? `${yy} and ${mm}` : `${yy} y ${mm}`;
}
