// Demo dataset for the Personal Finance OS. All amounts in USD.
// Replace with Lovable Cloud queries when the backend is enabled.

export type Month = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
  investments: number;
};

export const months: Month[] = [
  { month: "2025-09", label: "Sep", income: 14200, expenses: 8420, savings: 5780, netWorth: 486000, investments: 3800 },
  { month: "2025-10", label: "Oct", income: 14200, expenses: 9140, savings: 5060, netWorth: 496400, investments: 3600 },
  { month: "2025-11", label: "Nov", income: 15100, expenses: 9860, savings: 5240, netWorth: 508900, investments: 4100 },
  { month: "2025-12", label: "Dic", income: 19800, expenses: 12470, savings: 7330, netWorth: 527300, investments: 5200 },
  { month: "2026-01", label: "Ene", income: 14600, expenses: 8210, savings: 6390, netWorth: 541800, investments: 4400 },
  { month: "2026-02", label: "Feb", income: 14600, expenses: 7890, savings: 6710, netWorth: 552100, investments: 4600 },
  { month: "2026-03", label: "Mar", income: 15400, expenses: 9320, savings: 6080, netWorth: 566900, investments: 4800 },
  { month: "2026-04", label: "Abr", income: 14600, expenses: 10240, savings: 4360, netWorth: 574200, investments: 3900 },
  { month: "2026-05", label: "May", income: 16900, expenses: 8760, savings: 8140, netWorth: 592800, investments: 5600 },
  { month: "2026-06", label: "Jun", income: 14600, expenses: 8030, savings: 6570, netWorth: 608400, investments: 5100 },
  { month: "2026-07", label: "Jul", income: 15200, expenses: 11480, savings: 3720, netWorth: 619700, investments: 4200 },
  { month: "2026-08", label: "Ago", income: 16400, expenses: 8940, savings: 7460, netWorth: 641250, investments: 5900 },
];

export const current = months[months.length - 1]!;
export const previous = months[months.length - 2]!;

export type CategoryKey =
  | "vivienda"
  | "alimentacion"
  | "restaurantes"
  | "transporte"
  | "viajes"
  | "compras"
  | "salud"
  | "suscripciones"
  | "bancario"
  | "otros";

export type Category = {
  key: CategoryKey;
  name: string;
  emoji: string;
  color: string;
  amount: number;
  previous: number;
  budget: number;
  subcategories: { name: string; amount: number }[];
};

export const categories: Category[] = [
  {
    key: "vivienda",
    name: "Vivienda",
    emoji: "🏠",
    color: "var(--color-chart-1)",
    amount: 2480,
    previous: 2480,
    budget: 2600,
    subcategories: [
      { name: "Hipoteca", amount: 1850 },
      { name: "Servicios", amount: 380 },
      { name: "Mantenimiento", amount: 250 },
    ],
  },
  {
    key: "alimentacion",
    name: "Alimentación",
    emoji: "🍽",
    color: "var(--color-chart-2)",
    amount: 940,
    previous: 1020,
    budget: 1000,
    subcategories: [
      { name: "Supermercado", amount: 720 },
      { name: "Mercado local", amount: 140 },
      { name: "Delivery despensa", amount: 80 },
    ],
  },
  {
    key: "restaurantes",
    name: "Restaurantes",
    emoji: "🍷",
    color: "var(--color-chart-3)",
    amount: 1180,
    previous: 860,
    budget: 900,
    subcategories: [
      { name: "Cenas", amount: 640 },
      { name: "Café", amount: 210 },
      { name: "Delivery", amount: 330 },
    ],
  },
  {
    key: "transporte",
    name: "Transporte",
    emoji: "🚗",
    color: "var(--color-chart-4)",
    amount: 520,
    previous: 610,
    budget: 600,
    subcategories: [
      { name: "Combustible", amount: 260 },
      { name: "Taxis", amount: 160 },
      { name: "Parking", amount: 100 },
    ],
  },
  {
    key: "viajes",
    name: "Viajes",
    emoji: "✈️",
    color: "var(--color-chart-5)",
    amount: 2050,
    previous: 3100,
    budget: 1500,
    subcategories: [
      { name: "Vuelos", amount: 980 },
      { name: "Hotel", amount: 760 },
      { name: "Experiencias", amount: 310 },
    ],
  },
  {
    key: "compras",
    name: "Compras",
    emoji: "🛍",
    color: "var(--color-chart-6)",
    amount: 780,
    previous: 690,
    budget: 700,
    subcategories: [
      { name: "Ropa", amount: 420 },
      { name: "Tecnología", amount: 260 },
      { name: "Hogar", amount: 100 },
    ],
  },
  {
    key: "salud",
    name: "Salud",
    emoji: "❤️",
    color: "var(--color-chart-7)",
    amount: 410,
    previous: 380,
    budget: 450,
    subcategories: [
      { name: "Seguro", amount: 240 },
      { name: "Gimnasio", amount: 110 },
      { name: "Farmacia", amount: 60 },
    ],
  },
  {
    key: "suscripciones",
    name: "Suscripciones",
    emoji: "📺",
    color: "var(--color-chart-8)",
    amount: 268,
    previous: 232,
    budget: 250,
    subcategories: [
      { name: "Streaming", amount: 78 },
      { name: "Software", amount: 142 },
      { name: "IA", amount: 48 },
    ],
  },
  {
    key: "bancario",
    name: "Bancario",
    emoji: "🏦",
    color: "var(--color-chart-2)",
    amount: 152,
    previous: 168,
    budget: 200,
    subcategories: [
      { name: "Comisiones", amount: 92 },
      { name: "Intereses", amount: 60 },
    ],
  },
  {
    key: "otros",
    name: "Otros",
    emoji: "📌",
    color: "var(--color-chart-8)",
    amount: 160,
    previous: 140,
    budget: 200,
    subcategories: [{ name: "Varios", amount: 160 }],
  },
];

export const totalExpenses = categories.reduce((s, c) => s + c.amount, 0);

export type Merchant = {
  name: string;
  category: CategoryKey;
  amount: number;
  transactions: number;
};

export const topMerchants: Merchant[] = [
  { name: "Iberia", category: "viajes", amount: 980, transactions: 2 },
  { name: "Mercadona", category: "alimentacion", amount: 612, transactions: 11 },
  { name: "Hotel Casa Bonay", category: "viajes", amount: 760, transactions: 1 },
  { name: "Sushi Kaito", category: "restaurantes", amount: 384, transactions: 4 },
  { name: "Apple", category: "compras", amount: 260, transactions: 2 },
  { name: "Uber", category: "transporte", amount: 160, transactions: 14 },
  { name: "OpenAI", category: "suscripciones", amount: 48, transactions: 2 },
  { name: "Netflix", category: "suscripciones", amount: 24, transactions: 1 },
];

export type Txn = {
  id: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  category: CategoryKey;
  subcategory: string;
  tag?: string;
  excluded?: boolean;
};

export const transactions: Txn[] = [
  { id: "t1", date: "2026-08-28", merchant: "Iberia", description: "MAD-BCN vuelo", amount: 412, currency: "USD", category: "viajes", subcategory: "Vuelos", tag: "España 2026" },
  { id: "t2", date: "2026-08-27", merchant: "Hotel Casa Bonay", description: "3 noches Barcelona", amount: 760, currency: "USD", category: "viajes", subcategory: "Hotel", tag: "España 2026" },
  { id: "t3", date: "2026-08-26", merchant: "Sushi Kaito", description: "Cena", amount: 128, currency: "USD", category: "restaurantes", subcategory: "Cenas", tag: "España 2026" },
  { id: "t4", date: "2026-08-25", merchant: "Mercadona", description: "Supermercado semanal", amount: 96, currency: "USD", category: "alimentacion", subcategory: "Supermercado" },
  { id: "t5", date: "2026-08-24", merchant: "Coinbase", description: "Compra BTC 0.02", amount: 1350, currency: "USD", category: "bancario", subcategory: "Inversión", excluded: true },
  { id: "t6", date: "2026-08-23", merchant: "Interactive Brokers", description: "Compra VWCE", amount: 2200, currency: "USD", category: "bancario", subcategory: "Inversión", excluded: true },
  { id: "t7", date: "2026-08-22", merchant: "Uber", description: "Traslado aeropuerto", amount: 38, currency: "USD", category: "transporte", subcategory: "Taxis", tag: "España 2026" },
  { id: "t8", date: "2026-08-21", merchant: "OpenAI", description: "ChatGPT Pro", amount: 24, currency: "USD", category: "suscripciones", subcategory: "IA" },
  { id: "t9", date: "2026-08-20", merchant: "Pago Tarjeta Visa", description: "Transferencia interna", amount: 3100, currency: "USD", category: "bancario", subcategory: "Pago tarjeta", excluded: true },
  { id: "t10", date: "2026-08-19", merchant: "Apple", description: "Magic Keyboard", amount: 149, currency: "USD", category: "compras", subcategory: "Tecnología" },
];

export const excludedTypes = [
  "Bitcoin",
  "ETFs",
  "Acciones",
  "Fondos",
  "AFP",
  "Paybis",
  "QuasiCash",
  "Transferencias entre cuentas",
  "Pago de tarjetas",
  "Compra de activos",
];

export type AssetGroup = {
  name: string;
  kind: "asset" | "liability";
  value: number;
  change: number;
  color: string;
  items: { name: string; value: number }[];
};

export const assetGroups: AssetGroup[] = [
  {
    name: "Efectivo",
    kind: "asset",
    value: 42600,
    change: 3.1,
    color: "var(--color-chart-6)",
    items: [
      { name: "Cuenta corriente", value: 18600 },
      { name: "Cuenta ahorro", value: 24000 },
    ],
  },
  {
    name: "Bancos e inversiones líquidas",
    kind: "asset",
    value: 68400,
    change: 1.8,
    color: "var(--color-chart-2)",
    items: [
      { name: "Depósito 12m", value: 40000 },
      { name: "Money market", value: 28400 },
    ],
  },
  {
    name: "AFP / Retiro",
    kind: "asset",
    value: 128900,
    change: 2.4,
    color: "var(--color-chart-4)",
    items: [{ name: "Fondo A", value: 128900 }],
  },
  {
    name: "ETFs",
    kind: "asset",
    value: 184300,
    change: 5.2,
    color: "var(--color-chart-1)",
    items: [
      { name: "VWCE", value: 96400 },
      { name: "CSPX", value: 62300 },
      { name: "AGGH", value: 25600 },
    ],
  },
  {
    name: "Acciones",
    kind: "asset",
    value: 74200,
    change: 6.9,
    color: "var(--color-chart-3)",
    items: [
      { name: "NVDA", value: 31200 },
      { name: "AAPL", value: 22800 },
      { name: "MSFT", value: 20200 },
    ],
  },
  {
    name: "Cripto",
    kind: "asset",
    value: 58850,
    change: 9.4,
    color: "var(--color-chart-5)",
    items: [
      { name: "BTC", value: 44200 },
      { name: "ETH", value: 14650 },
    ],
  },
  {
    name: "Propiedades",
    kind: "asset",
    value: 420000,
    change: 0.6,
    color: "var(--color-chart-7)",
    items: [{ name: "Depto. Providencia", value: 420000 }],
  },
  {
    name: "Hipoteca",
    kind: "liability",
    value: 296000,
    change: -0.9,
    color: "var(--color-negative)",
    items: [{ name: "Hipoteca 20 años", value: 296000 }],
  },
  {
    name: "Préstamos",
    kind: "liability",
    value: 40000,
    change: -2.2,
    color: "var(--color-negative)",
    items: [{ name: "Crédito automotriz", value: 40000 }],
  },
];

export const totalAssets = assetGroups.filter((g) => g.kind === "asset").reduce((s, g) => s + g.value, 0);
export const totalLiabilities = assetGroups.filter((g) => g.kind === "liability").reduce((s, g) => s + g.value, 0);
export const netWorth = totalAssets - totalLiabilities;

export type Holding = {
  ticker: string;
  name: string;
  type: "ETF" | "Acción" | "Cripto" | "Cash";
  units: number;
  avgCost: number;
  price: number;
  dividends: number;
};

export const holdings: Holding[] = [
  { ticker: "VWCE", name: "Vanguard FTSE All-World", type: "ETF", units: 780, avgCost: 98.4, price: 123.6, dividends: 1240 },
  { ticker: "CSPX", name: "iShares Core S&P 500", type: "ETF", units: 92, avgCost: 512.2, price: 677.2, dividends: 0 },
  { ticker: "AGGH", name: "iShares Global Aggregate", type: "ETF", units: 5100, avgCost: 4.72, price: 5.02, dividends: 620 },
  { ticker: "NVDA", name: "NVIDIA", type: "Acción", units: 160, avgCost: 118.5, price: 195.0, dividends: 60 },
  { ticker: "AAPL", name: "Apple", type: "Acción", units: 92, avgCost: 178.3, price: 247.8, dividends: 210 },
  { ticker: "MSFT", name: "Microsoft", type: "Acción", units: 42, avgCost: 372.1, price: 480.9, dividends: 180 },
  { ticker: "BTC", name: "Bitcoin", type: "Cripto", units: 0.62, avgCost: 48200, price: 71290, dividends: 0 },
  { ticker: "ETH", name: "Ethereum", type: "Cripto", units: 3.8, avgCost: 2810, price: 3855, dividends: 0 },
  { ticker: "USD", name: "Cash disponible", type: "Cash", units: 42600, avgCost: 1, price: 1, dividends: 0 },
];

export const benchmark = [
  { label: "Sep", portfolio: 0, sp500: 0 },
  { label: "Oct", portfolio: 2.1, sp500: 1.8 },
  { label: "Nov", portfolio: 4.6, sp500: 3.4 },
  { label: "Dic", portfolio: 6.2, sp500: 5.1 },
  { label: "Ene", portfolio: 9.4, sp500: 6.8 },
  { label: "Feb", portfolio: 11.2, sp500: 8.2 },
  { label: "Mar", portfolio: 10.1, sp500: 7.4 },
  { label: "Abr", portfolio: 13.8, sp500: 9.9 },
  { label: "May", portfolio: 17.4, sp500: 12.1 },
  { label: "Jun", portfolio: 19.9, sp500: 13.6 },
  { label: "Jul", portfolio: 22.6, sp500: 15.2 },
  { label: "Ago", portfolio: 26.4, sp500: 17.1 },
];

export const retirement = {
  balance: 128900,
  contributionsYTD: 9600,
  employerYTD: 4200,
  returnYTD: 8.9,
  returnAnnualized: 6.4,
  monthlyContribution: 1200,
  currentAge: 34,
  retireAge: 62,
};

export function projectRetirement(monthly: number, returnRate: number, years: number, start: number) {
  const data: { year: number; value: number; contributed: number }[] = [];
  let value = start;
  let contributed = start;
  const r = returnRate / 100 / 12;
  for (let y = 0; y <= years; y++) {
    data.push({ year: retirement.currentAge + y, value: Math.round(value), contributed: Math.round(contributed) });
    for (let m = 0; m < 12; m++) {
      value = value * (1 + r) + monthly;
      contributed += monthly;
    }
  }
  return data;
}

export const cashFlow = {
  income: [
    { name: "Salario", amount: 12400 },
    { name: "Consultoría", amount: 2800 },
    { name: "Dividendos", amount: 1200 },
  ],
  buckets: [
    { name: "Gastos fijos", amount: 3462, color: "var(--color-chart-2)" },
    { name: "Lifestyle", amount: 4278, color: "var(--color-chart-3)" },
    { name: "Inversiones", amount: 5900, color: "var(--color-chart-1)" },
    { name: "Flujo libre", amount: 2760, color: "var(--color-chart-4)" },
  ],
};

export const lifestyle = {
  trips: [
    { name: "Barcelona", tag: "España 2026", total: 2310, nights: 6, city: "Barcelona" },
    { name: "Lisboa", tag: "Portugal 2026", total: 1480, nights: 4, city: "Lisboa" },
    { name: "Nueva York", tag: "NY 2026", total: 3960, nights: 5, city: "Nueva York" },
  ],
  restaurants: [
    { name: "Sushi Kaito", visits: 4, total: 384 },
    { name: "Bar Cañete", visits: 2, total: 246 },
    { name: "Osaka", visits: 3, total: 318 },
    { name: "Café Nube", visits: 12, total: 168 },
  ],
  subscriptions: [
    { name: "OpenAI", amount: 24, since: "2024-02" },
    { name: "Netflix", amount: 24, since: "2021-06" },
    { name: "Spotify", amount: 12, since: "2019-03" },
    { name: "Figma", amount: 45, since: "2023-09" },
    { name: "Notion", amount: 20, since: "2022-01" },
    { name: "iCloud", amount: 10, since: "2018-05" },
  ],
  breakdown: [
    { name: "Viajes", amount: 2050 },
    { name: "Restaurantes", amount: 1180 },
    { name: "Compras", amount: 780 },
    { name: "Entretenimiento", amount: 268 },
  ],
};

export type Goal = {
  name: string;
  emoji: string;
  current: number;
  target: number;
  deadline: string;
  monthly: number;
};

export const goals: Goal[] = [
  { name: "Patrimonio $1M", emoji: "🏔", current: 641250, target: 1000000, deadline: "2031", monthly: 6500 },
  { name: "Retiro anticipado", emoji: "🌅", current: 128900, target: 600000, deadline: "2043", monthly: 1200 },
  { name: "Cartera ETF", emoji: "📈", current: 184300, target: 300000, deadline: "2029", monthly: 3200 },
  { name: "Fondo de emergencia", emoji: "🛟", current: 42600, target: 50000, deadline: "2026", monthly: 900 },
  { name: "Viaje Japón 2027", emoji: "🗾", current: 3400, target: 9000, deadline: "2027", monthly: 450 },
];

export type Insight = {
  type: "positive" | "warning" | "neutral";
  title: string;
  detail: string;
};

export const insights: Insight[] = [
  { type: "positive", title: "Tu patrimonio subió 3.5%", detail: "De $619.700 a $641.250 en agosto. Tu mejor mes del año." },
  { type: "positive", title: "Tu ahorro aumentó 100%", detail: "Pasaste de $3.720 a $7.460. Tasa de ahorro: 45%." },
  { type: "warning", title: "Restaurantes +37% vs julio", detail: "Gastaste $1.180 contra un presupuesto de $900." },
  { type: "warning", title: "Nueva suscripción detectada", detail: "OpenAI $24/mes desde el 21 de agosto." },
  { type: "warning", title: "Posible cobro duplicado", detail: "Uber $38 aparece dos veces el 22 de agosto." },
  { type: "neutral", title: "Los viajes representan 23%", detail: "$2.050 de $8.940 en gastos totales del mes." },
  { type: "neutral", title: "El gasto fijo representa 39%", detail: "Vivienda, salud y suscripciones sobre el total." },
  { type: "positive", title: "Podrías ahorrar $420 al mes", detail: "Consolidando suscripciones y delivery recurrente." },
];

export const upcomingPayments = [
  { name: "Hipoteca", amount: 1850, date: "01 Sep", emoji: "🏠" },
  { name: "Seguro salud", amount: 240, date: "03 Sep", emoji: "❤️" },
  { name: "Tarjeta Visa", amount: 1420, date: "05 Sep", emoji: "💳" },
  { name: "Colegio / cursos", amount: 380, date: "08 Sep", emoji: "🎓" },
  { name: "Suscripciones", amount: 135, date: "12 Sep", emoji: "📺" },
];

export const heatmap = Array.from({ length: 35 }, (_, i) => ({
  day: i + 1,
  amount: Math.round(Math.abs(Math.sin(i * 1.7) * 420) + (i % 7 === 5 ? 220 : 20)),
}));

export const rules = [
  { match: "IBERIA*", category: "Viajes", sub: "Vuelos", learned: true },
  { match: "MERCADONA", category: "Alimentación", sub: "Supermercado", learned: false },
  { match: "COINBASE", category: "Excluir → Patrimonio", sub: "Cripto", learned: true },
  { match: "IB LLC", category: "Excluir → Patrimonio", sub: "ETFs", learned: true },
  { match: "UBER *TRIP", category: "Transporte", sub: "Taxis", learned: false },
];

export const accounts = [
  { name: "Cuenta corriente", bank: "Santander", type: "Débito", balance: 18600, last4: "4821" },
  { name: "Cuenta ahorro", bank: "Santander", type: "Ahorro", balance: 24000, last4: "9930" },
  { name: "Visa Signature", bank: "BCI", type: "Crédito", balance: -1420, last4: "1188" },
  { name: "Broker", bank: "Interactive Brokers", type: "Inversión", balance: 258500, last4: "7742" },
];

export const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);

export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
