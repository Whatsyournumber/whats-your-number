import type { SimGoal } from "@/lib/life-planner";

export type TemplateId =
  | "house_live"
  | "house_invest"
  | "startup"
  | "sell_company"
  | "car"
  | "education"
  | "wedding"
  | "kids"
  | "travel"
  | "invest"
  | "clothing"
  | "custom";

export type GoalField = {
  key: string;
  es: string;
  en: string;
  kind?: "money" | "number" | "year" | "percent";
  default: number;
};

export type GoalExtra = { es: string; en: string; value: number; money?: boolean };

export type GoalTemplate = {
  id: TemplateId;
  emoji: string;
  es: string;
  en: string;
  hintEs: string;
  hintEn: string;
  fields: GoalField[];
  /** Traduce las variables del template al motor de simulación. */
  derive: (v: Record<string, number>) => {
    kind: SimGoal["kind"];
    cost: number;
    monthly: number;
    payout?: number;
    payoutYears?: number;
    /** Valores calculados (p.ej. cuota de hipoteca) para mostrar en la UI. */
    extras?: GoalExtra[];
  };
};

const y = new Date().getFullYear();
const money = (key: string, es: string, en: string, def = 0): GoalField => ({ key, es, en, kind: "money", default: def });

/** Cuota mensual de un préstamo francés. */
export function pmt(principal: number, annualRatePct: number, years: number) {
  const p = Math.max(0, principal);
  const n = Math.max(0, Math.round(years * 12));
  if (!p || !n) return 0;
  const i = annualRatePct / 100 / 12;
  if (i <= 0) return p / n;
  return (p * i) / (1 - Math.pow(1 + i, -n));
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "house_live",
    emoji: "🏡",
    es: "Casa propia (para vivir)",
    en: "Own home (to live in)",
    hintEs: "Dejas de pagar alquiler pero asumes hipoteca.",
    hintEn: "You stop paying rent but take on a mortgage.",
    fields: [
      money("price", "Precio de la casa", "House price", 300000),
      money("down", "Entrada / inicial", "Down payment", 60000),
      { key: "rate", es: "Interés anual", en: "Annual interest", kind: "percent", default: 3.5 },
      { key: "years", es: "Años de hipoteca", en: "Mortgage term (years)", kind: "number", default: 30 },
      money("currentRent", "Alquiler que pagas hoy / mes", "Rent you pay today / month", 1100),
      money("costs", "Comunidad, IBI, mantenimiento / mes", "Fees & upkeep / month", 200),
    ],
    derive: (v) => {
      const mortgage = pmt((v['price'] ?? 0) - (v['down'] ?? 0), v['rate'] ?? 0, v['years'] ?? 0);
      return {
        kind: "boost",
        cost: v['down'] ?? 0,
        monthly: (v['currentRent'] ?? 0) - mortgage - (v['costs'] ?? 0),
        extras: [{ es: "Cuota hipoteca / mes", en: "Mortgage / month", value: mortgage, money: true }],
      };
    },
  },
  {
    id: "house_invest",
    emoji: "🏘️",
    es: "Casa para inversión",
    en: "Investment property",
    hintEs: "La alquilas: la renta compensa la hipoteca.",
    hintEn: "You rent it out: rent offsets the mortgage.",
    fields: [
      money("price", "Precio de la casa", "House price", 250000),
      money("down", "Entrada / inicial", "Down payment", 50000),
      { key: "rate", es: "Interés anual", en: "Annual interest", kind: "percent", default: 3.5 },
      { key: "years", es: "Años de hipoteca", en: "Mortgage term (years)", kind: "number", default: 25 },
      money("rent", "Renta que cobras / mes", "Rent income / month", 1400),
      money("costs", "Gastos y mantenimiento / mes", "Costs & upkeep / month", 150),
    ],
    derive: (v) => {
      const mortgage = pmt((v['price'] ?? 0) - (v['down'] ?? 0), v['rate'] ?? 0, v['years'] ?? 0);
      return {
        kind: "boost",
        cost: v['down'] ?? 0,
        monthly: (v['rent'] ?? 0) - mortgage - (v['costs'] ?? 0),
        extras: [{ es: "Cuota hipoteca / mes", en: "Mortgage / month", value: mortgage, money: true }],
      };
    },
  },
  {
    id: "startup",
    emoji: "🚀",
    es: "Hacer un negocio",
    en: "Start a business",
    hintEs: "Inviertes capital y generas ingresos mensuales.",
    hintEn: "You invest capital and generate monthly income.",
    fields: [
      money("investment", "Inversión inicial", "Initial investment", 20000),
      money("monthlyIncome", "Ingreso mensual estimado", "Estimated monthly income", 1000),
      money("monthlyCost", "Costes fijos / mes", "Fixed costs / month", 300),
      { key: "rampMonths", es: "Meses hasta rentabilidad", en: "Months to profitability", kind: "number", default: 12 },
    ],
    derive: (v) => {
      const net = (v['monthlyIncome'] ?? 0) - (v['monthlyCost'] ?? 0);
      const ramp = Math.max(0, v['rampMonths'] ?? 0);
      // Los meses de ramp-up se cargan como coste inicial adicional.
      const rampCost = ramp * Math.max(0, v['monthlyCost'] ?? 0);
      return {
        kind: "boost",
        cost: (v['investment'] ?? 0) + rampCost,
        monthly: net,
        extras: [
          { es: "Margen neto / mes", en: "Net margin / month", value: net, money: true },
          { es: "Caja quemada en ramp-up", en: "Cash burned in ramp-up", value: rampCost, money: true },
        ],
      };
    },
  },
  {
    id: "sell_company",
    emoji: "💼",
    es: "Vender mi empresa",
    en: "Sell my company",
    hintEs: "Salida futura: entra capital que se invierte y compone.",
    hintEn: "Future exit: capital comes in, gets invested and compounds.",
    fields: [
      money("valuation", "Valoración estimada", "Estimated valuation", 1000000),
      { key: "ownership", es: "% que te pertenece", en: "Your ownership %", kind: "percent", default: 100 },
      { key: "tax", es: "Impuestos sobre la venta %", en: "Tax on sale %", kind: "percent", default: 21 },
      { key: "exitYear", es: "Año de la venta", en: "Exit year", kind: "year", default: y + 5 },
      money("salaryLost", "Salario que dejas de recibir / mes", "Salary you stop earning / month", 0),
    ],
    derive: (v) => {
      const gross = ((v['valuation'] ?? 0) * (v['ownership'] ?? 0)) / 100;
      const netExit = gross * (1 - (v['tax'] ?? 0) / 100);
      return {
        kind: "boost",
        cost: 0,
        monthly: -(v['salaryLost'] ?? 0),
        payout: netExit,
        payoutYears: Math.max(0, (v['exitYear'] ?? y) - y),
        extras: [{ es: "Neto después de impuestos", en: "Net after tax", value: netExit, money: true }],
      };
    },
  },
  {
    id: "car",
    emoji: "🚗",
    es: "Comprar carro",
    en: "Buy a car",
    hintEs: "Entrada, cuota, seguro y mantenimiento.",
    hintEn: "Down payment, loan, insurance and upkeep.",
    fields: [
      money("price", "Precio del carro", "Car price", 35000),
      money("down", "Entrada / inicial", "Down payment", 7000),
      money("payment", "Cuota mensual", "Monthly payment", 450),
      money("upkeep", "Seguro + mantenimiento / mes", "Insurance + upkeep / month", 150),
    ],
    derive: (v) => ({
      kind: "boost",
      cost: v['down'] ?? 0,
      monthly: -((v['payment'] ?? 0) + (v['upkeep'] ?? 0)),
    }),
  },
  {
    id: "education",
    emoji: "🎓",
    es: "Carrera o máster",
    en: "Degree or master's",
    hintEs: "Inviertes en formación y subes tu salario después.",
    hintEn: "You invest in education and raise your salary afterwards.",
    fields: [
      money("tuition", "Coste total del programa", "Total program cost", 40000),
      { key: "years", es: "Duración (años)", en: "Duration (years)", kind: "number", default: 2 },
      money("livingCost", "Gasto extra / mes mientras estudias", "Extra cost / month while studying", 300),
      money("salaryUplift", "Aumento de salario después / mes", "Salary uplift afterwards / month", 900),
    ],
    derive: (v) => {
      const years = Math.max(0, v['years'] ?? 0);
      const studyCost = years * 12 * Math.max(0, v['livingCost'] ?? 0);
      const uplift = v['salaryUplift'] ?? 0;
      return {
        kind: "boost",
        cost: (v['tuition'] ?? 0) + studyCost,
        monthly: uplift,
        extras: [
          { es: "Inversión total", en: "Total investment", value: (v['tuition'] ?? 0) + studyCost, money: true },
          { es: "Retorno anual del salario", en: "Annual salary return", value: uplift * 12, money: true },
        ],
      };
    },
  },
  {
    id: "wedding",
    emoji: "💍",
    es: "Casarme",
    en: "Get married",
    hintEs: "Boda, luna de miel y cambio en los gastos del hogar.",
    hintEn: "Wedding, honeymoon and change in household costs.",
    fields: [
      money("wedding", "Coste de la boda", "Wedding cost", 25000),
      money("honeymoon", "Luna de miel", "Honeymoon", 6000),
      money("saved", "Ya ahorrado / aportes de familia", "Already saved / family help", 0),
      money("householdChange", "Cambio en gastos del hogar / mes (+ ahorras / − gastas)", "Household change / month (+ save / − spend)", 200),
    ],
    derive: (v) => ({
      kind: "boost",
      cost: Math.max(0, (v['wedding'] ?? 0) + (v['honeymoon'] ?? 0) - (v['saved'] ?? 0)),
      monthly: v['householdChange'] ?? 0,
    }),
  },
  {
    id: "kids",
    emoji: "👶",
    es: "Tener hijos",
    en: "Have children",
    hintEs: "Coste inicial y gasto mensual por hijo.",
    hintEn: "Upfront cost and monthly spend per child.",
    fields: [
      { key: "children", es: "Número de hijos", en: "Number of children", kind: "number", default: 1 },
      money("upfront", "Coste inicial por hijo", "Upfront cost per child", 8000),
      money("perChild", "Gasto mensual por hijo", "Monthly cost per child", 700),
      money("education", "Educación / mes por hijo", "Education / month per child", 400),
    ],
    derive: (v) => {
      const n = Math.max(0, v['children'] ?? 0);
      return {
        kind: "boost",
        cost: n * (v['upfront'] ?? 0),
        monthly: -n * ((v['perChild'] ?? 0) + (v['education'] ?? 0)),
      };
    },
  },
  {
    id: "travel",
    emoji: "✈️",
    es: "Viajar",
    en: "Travel",
    hintEs: "Se reparte el coste anual mes a mes.",
    hintEn: "Annual cost spread month by month.",
    fields: [
      { key: "trips", es: "Viajes por año", en: "Trips per year", kind: "number", default: 2 },
      money("perTrip", "Coste por viaje", "Cost per trip", 2500),
    ],
    derive: (v) => ({
      kind: "boost",
      cost: 0,
      monthly: -(((v['trips'] ?? 0) * (v['perTrip'] ?? 0)) / 12),
    }),
  },
  {
    id: "invest",
    emoji: "📈",
    es: "Invertir más",
    en: "Invest more",
    hintEs: "Aporte extra mensual que compone hasta tu número.",
    hintEn: "Extra monthly contribution compounding to your number.",
    fields: [
      money("lumpSum", "Aporte inicial", "Initial lump sum", 0),
      money("monthlyContribution", "Aporte extra / mes", "Extra contribution / month", 500),
      { key: "increase", es: "Aumento anual del aporte %", en: "Annual contribution increase %", kind: "percent", default: 0 },
    ],
    derive: (v) => ({
      kind: "boost",
      cost: -(v['lumpSum'] ?? 0),
      monthly: v['monthlyContribution'] ?? 0,
      extras: [
        { es: "Aporte anual", en: "Annual contribution", value: (v['monthlyContribution'] ?? 0) * 12, money: true },
      ],
    }),
  },
  {
    id: "clothing",
    emoji: "🛍️",
    es: "Compras y ropa",
    en: "Shopping & clothing",
    hintEs: "Gasto recurrente en ropa y accesorios.",
    hintEn: "Recurring spend on clothes and accessories.",
    fields: [money("monthlySpend", "Gasto mensual", "Monthly spend", 250)],
    derive: (v) => ({ kind: "boost", cost: 0, monthly: -(v['monthlySpend'] ?? 0) }),
  },
  {
    id: "custom",
    emoji: "✨",
    es: "Otros (libre)",
    en: "Other (custom)",
    hintEs: "Cualquier cosa: define coste y flujo mensual.",
    hintEn: "Anything: set cost and monthly flow.",
    fields: [
      money("cost", "Coste único", "One-off cost", 0),
      money("monthly", "Flujo mensual (+ suma / − resta)", "Monthly flow (+ adds / − subtracts)", 0),
      money("saved", "Fondo ya acumulado", "Already saved", 0),
    ],
    derive: (v) => ({ kind: "boost", cost: Math.max(0, (v['cost'] ?? 0) - (v['saved'] ?? 0)), monthly: v['monthly'] ?? 0 }),
  },
];


export const templateById = (id: string | undefined | null) =>
  GOAL_TEMPLATES.find((t) => t.id === id) ?? GOAL_TEMPLATES[GOAL_TEMPLATES.length - 1]!;

export const defaultValues = (t: GoalTemplate) =>
  Object.fromEntries(t.fields.map((f) => [f.key, f.default])) as Record<string, number>;

export type GoalMeta = {
  template: TemplateId;
  values: Record<string, number>;
  payout?: number | undefined;
  payoutYears?: number | undefined;
};

export function parseMeta(note: string | null): GoalMeta | null {
  if (!note) return null;
  try {
    const parsed = JSON.parse(note) as Partial<GoalMeta>;
    if (!parsed || typeof parsed !== "object" || !parsed.template) return null;
    return { template: parsed.template, values: parsed.values ?? {}, payout: parsed.payout, payoutYears: parsed.payoutYears };
  } catch {
    return null;
  }
}
