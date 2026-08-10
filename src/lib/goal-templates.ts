import type { SimGoal } from "@/lib/life-planner";

export type TemplateId =
  | "startup"
  | "house_invest"
  | "house_live"
  | "car"
  | "travel"
  | "clothing"
  | "kids"
  | "custom";

export type GoalField = {
  key: string;
  es: string;
  en: string;
  kind?: "money" | "number" | "year";
  default: number;
};

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
  };
};

const y = new Date().getFullYear();
const money = (key: string, es: string, en: string, def = 0): GoalField => ({ key, es, en, kind: "money", default: def });

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "startup",
    emoji: "🚀",
    es: "Proyecto con inversión",
    en: "Project / startup",
    hintEs: "Inviertes capital, generas ingresos y quizá lo vendes.",
    hintEn: "You invest capital, generate income and maybe exit.",
    fields: [
      money("investment", "Inversión inicial", "Initial investment", 20000),
      money("monthlyIncome", "Ingreso mensual estimado", "Estimated monthly income", 1000),
      { key: "exitYear", es: "Año de venta (0 = no vender)", en: "Exit year (0 = no exit)", kind: "year", default: y + 5 },
      money("exitValue", "Valor de venta estimado", "Estimated exit value", 150000),
    ],
    derive: (v) => ({
      kind: "boost",
      cost: v['investment'] ?? 0,
      monthly: v['monthlyIncome'] ?? 0,
      payout: v['exitYear'] ? (v['exitValue'] ?? 0) : 0,
      payoutYears: v['exitYear'] ? Math.max(0, (v['exitYear'] ?? y) - y) : 0,
    }),
  },
  {
    id: "house_invest",
    emoji: "🏘️",
    es: "Comprar casa (inversión)",
    en: "Buy house (investment)",
    hintEs: "La alquilas: la renta compensa la hipoteca.",
    hintEn: "You rent it out: rent offsets the mortgage.",
    fields: [
      money("price", "Precio de la casa", "House price", 250000),
      money("down", "Entrada / inicial", "Down payment", 50000),
      money("mortgage", "Cuota hipoteca / mes", "Mortgage / month", 1100),
      money("rent", "Renta que cobras / mes", "Rent income / month", 1400),
      money("costs", "Gastos y mantenimiento / mes", "Costs & upkeep / month", 150),
    ],
    derive: (v) => ({
      kind: "boost",
      cost: v['down'] ?? 0,
      monthly: (v['rent'] ?? 0) - (v['mortgage'] ?? 0) - (v['costs'] ?? 0),
    }),
  },
  {
    id: "house_live",
    emoji: "🏡",
    es: "Comprar casa (para vivir)",
    en: "Buy house (to live in)",
    hintEs: "Dejas de pagar alquiler pero asumes hipoteca.",
    hintEn: "You stop paying rent but take on a mortgage.",
    fields: [
      money("price", "Precio de la casa", "House price", 300000),
      money("down", "Entrada / inicial", "Down payment", 60000),
      money("mortgage", "Cuota hipoteca / mes", "Mortgage / month", 1300),
      money("currentRent", "Alquiler que pagas hoy / mes", "Rent you pay today / month", 1100),
      money("costs", "Comunidad, IBI, mantenimiento / mes", "Fees & upkeep / month", 200),
    ],
    derive: (v) => ({
      kind: "boost",
      cost: v['down'] ?? 0,
      monthly: (v['currentRent'] ?? 0) - (v['mortgage'] ?? 0) - (v['costs'] ?? 0),
    }),
  },
  {
    id: "car",
    emoji: "🚗",
    es: "Carro",
    en: "Car",
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
    id: "travel",
    emoji: "✈️",
    es: "Viajes al año",
    en: "Trips per year",
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
    id: "clothing",
    emoji: "🛍️",
    es: "Compra de ropa",
    en: "Clothing",
    hintEs: "Gasto recurrente en ropa y accesorios.",
    hintEn: "Recurring spend on clothes and accessories.",
    fields: [money("monthlySpend", "Gasto mensual", "Monthly spend", 250)],
    derive: (v) => ({ kind: "boost", cost: 0, monthly: -(v['monthlySpend'] ?? 0) }),
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
    id: "custom",
    emoji: "✨",
    es: "Otra meta (libre)",
    en: "Custom goal",
    hintEs: "Cualquier cosa: define coste y flujo mensual.",
    hintEn: "Anything: set cost and monthly flow.",
    fields: [
      money("cost", "Coste único", "One-off cost", 0),
      money("monthly", "Flujo mensual (+ suma / − resta)", "Monthly flow (+ adds / − subtracts)", 0),
      money("saved", "Fondo ya acumulado", "Already saved", 0),
    ],
    derive: (v) => ({ kind: "boost", cost: v['cost'] ?? 0, monthly: v['monthly'] ?? 0 }),
  },
];

export const templateById = (id: string | undefined | null) =>
  GOAL_TEMPLATES.find((t) => t.id === id) ?? GOAL_TEMPLATES[GOAL_TEMPLATES.length - 1]!;

export const defaultValues = (t: GoalTemplate) =>
  Object.fromEntries(t.fields.map((f) => [f.key, f.default])) as Record<string, number>;

export type GoalMeta = { template: TemplateId; values: Record<string, number>; payout?: number; payoutYears?: number };

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
