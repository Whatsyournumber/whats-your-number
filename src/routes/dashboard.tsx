import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, CalendarIcon, ChevronLeft, ChevronRight, Home, Pencil, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { EditableKpiCard } from "@/components/editable-kpi-card";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { TopCitiesPanel } from "@/components/top-cities";
import { CheckoutWelcome } from "@/components/checkout-welcome";
import { SubscriptionStatusBanner } from "@/components/subscription-status-banner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useIsMobile } from "@/hooks/use-mobile";
import { sameMerchant, useTransactions, type Tx } from "@/hooks/use-transactions";
import { useFixedExpenses, useSpendTarget } from "@/hooks/use-fixed-expenses";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { BUDGET_CATEGORIES } from "@/lib/budget-categories";
import { useIndexReturns } from "@/hooks/use-index-returns";
import { holdingValue, useHoldings, wealthTotals } from "@/hooks/use-holdings";
import { useQuotes } from "@/hooks/use-market";
import { usePrimaryGoal } from "@/hooks/use-primary-goal";
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { cn } from "@/lib/utils";
import { buildInsights, lifestyles, minMonthlyForRetirement, num } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";
import { buildRealMonths } from "@/lib/real-months";
import { readDemoSnapshot, type DemoSnapshot } from "@/lib/demo-snapshot";
import { translateGoalName, translateGoalNote } from "@/lib/i18n-data";
import { buildTravelDays, categorizeTxWithTravel } from "@/lib/categorize";

const EMPTY_MONEY_BUCKETS: Record<string, "needs" | "savings" | "wants" | "excluded"> = {};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — WhatsYournumber" },
      { name: "description", content: "Tu situación financiera completa en menos de 30 segundos: patrimonio, ingresos, gastos y ahorro." },
      { property: "og:title", content: "Dashboard — WhatsYournumber" },
      { property: "og:description", content: "Patrimonio neto, flujo libre, tasa de ahorro y metas en un solo panel." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

/** Años hasta alcanzar el objetivo con aportes mensuales y rendimiento anual. */
function yearsToTarget(target: number, current: number, monthly: number, annualReturn: number) {
  if (target <= 0) return 0;
  if (current >= target) return 0;
  if (monthly <= 0) return 99;
  const r = annualReturn / 100 / 12;
  let balance = current;
  for (let m = 1; m <= 12 * 80; m++) {
    balance = balance * (1 + r) + monthly;
    if (balance >= target) return Math.max(1, Math.round(m / 12));
  }
  return 99;
}

/** Cuota mensual estándar para un saldo, tasa y plazo en meses. */
function paymentFor(balance: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return balance / months;
  return (balance * r) / (1 - Math.pow(1 + r, -months));
}

const delta = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);

function greeting(t: (es: string, en: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("Buenos días", "Good morning");
  if (h < 20) return t("Buenas tardes", "Good afternoon");
  return t("Buenas noches", "Good evening");
}

const lifestyleLabelEn: Record<string, string> = {
  minimalista: "minimalist",
  comodo: "comfortable",
  premium: "premium",
  lujo: "luxury",
};

const maritalLabelEn: Record<string, string> = {
  Soltero: "single",
  "En pareja": "in a relationship",
  Casado: "married",
  Divorciado: "divorced",
};

function lifestyleSubtitle(profile: ReturnType<typeof useProfile>["profile"], t: (es: string, en: string) => string) {
  const style = lifestyles.find((l) => l.value === profile.lifestyle)?.label.toLowerCase() ?? t("cómodo", "comfortable");
  const status = profile.marital_status || t("soltero", "single");
  const styleEn = lifestyleLabelEn[profile.lifestyle] ?? "comfortable";
  const statusEn = maritalLabelEn[profile.marital_status] ?? "single";
  return t(`Estilo de vida ${style}, ${status.toLowerCase()}`, `${styleEn} lifestyle, ${statusEn}`);
}

/** "Para estilo de vida cómodo, no te alcanza" — cuando los ingresos no cubren la ciudad. */
function lifestyleShortfallSubtitle(profile: ReturnType<typeof useProfile>["profile"], t: (es: string, en: string) => string) {
  const style = lifestyles.find((l) => l.value === profile.lifestyle)?.label.toLowerCase() ?? "cómodo";
  const styleEn = lifestyleLabelEn[profile.lifestyle] ?? "comfortable";
  return t(`Para estilo de vida ${style}, no te alcanza`, `For a ${styleEn} lifestyle, it's not enough`);
}

function Dashboard() {
  const t = useT();
  const { lang } = useLanguage();
  const isMobile = useIsMobile();
  // En móvil el eje y los márgenes se comprimen para que el gráfico use todo el ancho.
  const axisW = isMobile ? 44 : 78;
  const chartMargin = isMobile ? { left: 0, right: 4, top: 8 } : { left: 4, right: 8, top: 8 };

  const { profile, isLoading, save } = useProfile();
  const { user: authUser } = useAuth();
  const profileUserId = authUser?.id ?? "anon";
  const { primary } = usePrimaryGoal();
  const { transactions } = useTransactions();
  const d = buildDataset(profile);
  // Análisis de hogar: los números incluyen a la pareja cuando así se eligió.
  const household =
    (profile.marital_status === "Casado" || profile.marital_status === "En pareja") &&
    profile.analysis_scope === "pareja";
  const fixed = useFixedExpenses();
  const { rules } = useCategories();
  const { lines: budgetLines } = useSpendBudgets();
  const { target: spendTarget, hasTarget: hasSpendTarget } = useSpendTarget();
  // Total de tu plan de gasto mensual (onboarding / Registro de gastos).
  const spendPlanMonthlyTotal = useMemo(() => {
    const sum = budgetLines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);
    if (sum > 0) return sum;
    return hasSpendTarget && spendTarget > 0 ? spendTarget : 0;
  }, [budgetLines, hasSpendTarget, spendTarget]);
  // Gastos fijos del plan (categorías esenciales con día de cobro): son gasto
  // real del mes aunque todavía no se registre ninguna compra.
  const planFixed = useMemo(() => {
    const list = budgetLines.filter((l) => {
      const cat = BUDGET_CATEGORIES.find((c) => c.id === l.id);
      const group = cat?.group ?? l.group;
      return Number(l.amount) > 0 && (l.dueDay ?? 0) >= 1 && group === "essentials";
    });
    const aliases = new Set<string>();
    for (const line of list) {
      const cat = BUDGET_CATEGORIES.find((c) => c.id === line.id);
      for (const word of [line.label, cat?.es, cat?.en, ...(line.keywords ?? []), ...(cat?.aliases ?? [])]) {
        const clean = (word ?? "").trim().toLowerCase();
        if (clean.length > 2) aliases.add(clean);
      }
    }
    return {
      total: list.reduce((sum, line) => sum + Number(line.amount), 0),
      // Evita contar dos veces el mismo gasto fijo suelto y su línea del plan.
      isDuplicate: (name: string) => {
        const clean = name.replace(/^\p{Extended_Pictographic}\s*/u, "").trim().toLowerCase();
        if (clean.length < 3) return false;
        return [...aliases].some((alias) => clean === alias || clean.includes(alias) || alias.includes(clean));
      },
    };
  }, [budgetLines]);
  const { live: indexLive } = useIndexReturns();
  const { holdings } = useHoldings();
  const holdingSymbols = holdings
    .filter((h) => h.ticker && (h.quantity > 0 || h.cost_basis > 0 || h.manual_value > 0))
    .map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries((holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]));

  // Patrimonio vivo: cuando hay detalle de activos se recalcula con precios de
  // mercado en tiempo real (mismo total que /patrimonio); si no, se usa el perfil.
  const liveNetWorth = (() => {
    if (!holdings.length) return d.netWorth;
    const wt = wealthTotals(holdings, prices);
    const futureTotal = holdings
      .filter((h) => h.kind === "future")
      .reduce((s, h) => s + Math.round(holdingValue(h, prices) * (h.probability / 100)), 0);
    const assets =
      wt.assets_cash + wt.assets_bank + wt.assets_retirement + wt.assets_etf + wt.assets_stocks + wt.assets_crypto + wt.assets_property + futureTotal;
    return assets - wt.liabilities;
  })();

  // Aportes/compras de activos agrupados por el mes real en que se registraron,
  // igual que en /patrimonio, para que el mes actual refleje el ahorro aportado.
  const holdingContributions = (() => {
    const map: Record<string, number> = {};
    for (const h of holdings) {
      if (h.kind === "debt") continue;
      const date = h.created_at;
      if (!date) continue;
      const key = String(date).slice(0, 7);
      const value = h.manual_value || h.cost_basis || 0;
      if (!value) continue;
      map[key] = (map[key] ?? 0) + value;
    }
    return map;
  })();

  const realMonths = buildRealMonths(transactions, liveNetWorth, { contributions: holdingContributions });
  const dayChange: Record<string, number> = Object.fromEntries(
    (holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.changePct ?? 0]),
  );

  // Métricas reales del portafolio (mismo cálculo que /portafolio).
  const portfolioPositions = holdings
    .filter((h) => ["etf", "stock", "crypto", "other", "bond", "tbill", "note", "structured", "reit", "future", "retirement", "cash", "bank", "money_market"].includes(h.kind))
    .map((h) => {
      const value = holdingValue(h, prices);
      const tk = h.ticker?.toUpperCase();
      const marketCost = h.cost_basis > 0 ? h.cost_basis : 0;
      let marketGrowth: number | null = null;
      if (tk && marketCost > 0 && value > 0) marketGrowth = (value - marketCost) / marketCost;
      else if (tk && dayChange[tk] !== undefined) marketGrowth = dayChange[tk] / 100;
      const growth = marketGrowth !== null ? marketGrowth : (h.expected_return || 7) / 100;
      const cost = h.cost_basis > 0 ? h.cost_basis : Math.round(value / (1 + growth));
      const ret = cost > 0 ? ((value - cost) / cost) * 100 : growth * 100;
      return { value, cost, ret, kind: h.kind };
    })
    .filter((h) => h.value > 0);
  // Rentabilidad del portafolio: promedio ponderado de los activos que SÍ tienen
  // rentabilidad (mismo cálculo que /portafolio, para que ambas páginas coincidan).
  const returnRows = portfolioPositions.filter((h) => Math.abs(h.ret) >= 0.05);
  const returnBase = returnRows.reduce((sum, h) => sum + h.value, 0);
  const portfolioReturn = returnBase
    ? returnRows.reduce((sum, h) => sum + h.ret * h.value, 0) / returnBase
    : 0;


  // Sin históricos importados (EEFF) la serie empieza en el mes en que se creó la
  // cuenta: no inventamos meses anteriores a que la persona empezara a usar la app.
  const accountStartKey = authUser?.created_at ? String(authUser.created_at).slice(0, 7) : "";
  const baseMonths = (() => {
    const source = realMonths ?? d.months;
    if (realMonths || !accountStartKey) return source;
    const trimmed = source.filter((m) => (m.month ?? "") >= accountStartKey);
    return trimmed.length ? trimmed : source.slice(-1);
  })();

  const months = baseMonths.map((month, i, arr) => {
    const expenses = month.expenses + (realMonths ? fixed.total : 0);
    // El último mes siempre refleja el patrimonio vivo (precios de mercado incluidos).
    const netWorth = i === arr.length - 1 ? liveNetWorth : month.netWorth;
    return { ...month, expenses, income: d.income, savings: d.income - expenses, netWorth };
  });

  // Selector de mes (por defecto el mes pasado completo).
  // Sin EEFF importados la serie es una estimación y solo el último mes refleja
  // exactamente los datos del perfil, así que ese es el mes por defecto.
  const monthKeys = months.map((m, i) => (m as { month?: string }).month ?? `idx-${i}`);
  const lastKey = monthKeys[monthKeys.length - 1] ?? "";
  const defaultKey = (() => {
    if (!realMonths) return lastKey;
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return monthKeys.includes(key) ? key : lastKey || key;
  })();

  const [monthKey, setMonthKey] = useState<string | null>(null);
  const activeKey = monthKey && monthKeys.includes(monthKey) ? monthKey : defaultKey;
  const activeIndex = Math.max(0, monthKeys.indexOf(activeKey));
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasHistory = Boolean(realMonths && realMonths.length > 1);
  const current = months[activeIndex] ?? months[months.length - 1] ?? d.current;
  const previous = months[activeIndex - 1] ?? current;
  const { fmt, fmtCompact, plan } = d;

  // Mismo cálculo de “Ahorro / inversiones” que Distribución del dinero.
  // Respeta las categorías editadas por la persona y separa la meta de retiro.
  const { value: moneyBuckets } = useSyncedSetting<Record<string, "needs" | "savings" | "wants" | "excluded">>(
    "whatsyournumber:money-rule-categories",
    EMPTY_MONEY_BUCKETS,
  );
  const monthlyDistribution = useMemo(() => {
    const clean = (name: string) => name.replace(/^\p{Extended_Pictographic}\s*/u, "").trim();
    const isWant = (name: string) =>
      /viaje|restaur|delivery|ocio|salida|night|deporte|gym|gimnasio|compra|ropa|tecnolog|app|suscrip|hobb|lifestyle|belleza|regalo|mascota|entreten|pet|stay|whatsyournumber|marketing/i.test(name);
    const isSaving = (name: string) => /ahorro|inver|saving|invest|broker|etf|fondo|bolsa|crypto|cripto/i.test(name);
    const bucketFor = (name: string) => moneyBuckets[clean(name)] ?? (isSaving(name) ? "savings" : isWant(name) ? "wants" : "needs");
    const monthTransactions = transactions.filter((tx) => tx.tx_date?.slice(0, 7) === activeKey);
    if (!monthTransactions.length) {
      // Sin gastos registrados este mes, el gasto real son los gastos fijos del
      // plan (ahorro e inversión no cuentan como gasto). Los variables se suman
      // a medida que la persona los registra.
      const fixedOnly = fixed.items
        .filter((item) => bucketFor(item.name) !== "savings" && !planFixed.isDuplicate(item.name))
        .reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0) + planFixed.total;
      const fallbackExpenses = d.cashFlow.buckets[0]!.amount + d.cashFlow.buckets[1]!.amount;
      const expenses = fixedOnly > 0 ? fixedOnly : fallbackExpenses;
      // Potencial de ahorro = ingresos − gastos (puede ser negativo).
      return { expenses, savings: d.income - expenses };
    }
    const statementIncome = monthTransactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = statementIncome > 0 ? statementIncome : d.income;
    const customCategories = budgetLines
      .filter((line) => line.id.startsWith("custom:"))
      .map((line) => {
        const label = (line.label ?? line.id.slice(7)).trim();
        return { label, aliases: [label, ...(line.keywords ?? [])].map((word) => word.trim().toLowerCase()).filter((word) => word.length > 2) };
      });
    const fixedRows = fixed.items
      .filter((item) => Number(item.amount) > 0)
      .map((item) => ({ amount: Math.abs(Number(item.amount)).toFixed(2), name: item.name }));
    const isFixedTransaction = (tx: Tx) => fixedRows.some(
      (row) => row.amount === Math.abs(Number(tx.amount)).toFixed(2) && (sameMerchant(row.name, tx.merchant) || sameMerchant(row.name, tx.description)),
    );
    const travelDays = buildTravelDays(monthTransactions as Tx[], rules);
    // Los gastos fijos del plan (con día de cobro) siempre cuentan como gasto
    // del mes; los fijos sueltos solo si no repiten una línea del plan.
    const looseFixed = fixed.items.filter((item) => !planFixed.isDuplicate(item.name));
    let needs = looseFixed.filter((item) => bucketFor(item.name) === "needs").reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0) + planFixed.total;
    let wants = looseFixed.filter((item) => bucketFor(item.name) === "wants").reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
    let savings = looseFixed.filter((item) => bucketFor(item.name) === "savings").reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
    const retirementFund = holdings
      .filter((holding) => holding.kind === "retirement")
      .reduce((sum, holding) => sum + Math.max(0, Number(holding.monthly_contribution) || 0), 0);
    const retirementFundBucket = bucketFor("Fondo de retiro");
    if (retirementFundBucket === "needs") needs += retirementFund;
    else if (retirementFundBucket === "wants") wants += retirementFund;
    else if (retirementFundBucket === "savings") savings += retirementFund;
    for (const tx of monthTransactions) {
      if (tx.amount >= 0 || isFixedTransaction(tx as Tx)) continue;
      const merchant = (tx.merchant ?? "").trim().toLowerCase();
      const custom = customCategories.find((item) => item.aliases.some((alias) => merchant === alias || merchant.includes(alias) || alias.includes(merchant)))?.label;
      const category = custom ?? categorizeTxWithTravel(tx as Tx, rules, travelDays);
      const bucket = bucketFor(category);
      const amount = Math.abs(tx.amount);
      if (bucket === "needs") needs += amount;
      else if (bucket === "wants") wants += amount;
      else if (bucket === "savings" || (moneyBuckets[clean(category)] === undefined && isSaving(`${category} ${tx.merchant ?? ""}`))) savings += amount;
    }
    return {
      expenses: needs + wants,
      savings: savings + Math.max(0, totalIncome - needs - wants - savings),
    };
  }, [activeKey, budgetLines, d.cashFlow.buckets, d.income, fixed.items, holdings, moneyBuckets, planFixed, rules, transactions]);
  const monthlySavings = monthlyDistribution.savings;
  const monthlyExpenses = monthlyDistribution.expenses;
  const spendPlanUsed = hasSpendTarget && spendTarget > 0
    ? Math.round((monthlyExpenses / spendTarget) * 100)
    : 0;
  // El plan se supera cuando el gasto real pasa del objetivo del mes.
  const spendPlanOver = spendPlanUsed > 100;
  const spendPlanBadge = spendPlanOver
    ? "bg-negative/12 text-negative"
    : "bg-positive/12 text-positive";
  const spendPlanHint = hasSpendTarget && spendTarget > 0
    ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="shrink-0">
             <span className="sm:hidden">{t("Tu plan mensual es", "Your monthly plan is")}</span>
             {/* Versión corta solo para tablet. */}
             <span className="hidden sm:inline lg:hidden">{t("Plan mensual", "Monthly plan")}</span>
             <span className="hidden lg:inline">{t("Tu plan de gastos mensual es", "Your monthly spending plan is")}</span>
          </span>
          <span className="shrink-0 text-foreground">{fmt(spendTarget)}</span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 font-semibold", spendPlanBadge)}>
             {spendPlanOver ? t("Excedido", "Over") : t("Vas al", "You're at")} {spendPlanUsed}%
          </span>
        </span>
      )
    : undefined;

  // Rango completo del mes seleccionado, para la etiqueta del calendario.
  const activeDate = /^\d{4}-\d{2}$/.test(activeKey)
    ? new Date(Number(activeKey.slice(0, 4)), Number(activeKey.slice(5, 7)) - 1, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const rangeStart = activeDate;
  const rangeEnd = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0);
  const dayFmt = (date: Date) =>
    date.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");
  const monthRangeLabel = `${dayFmt(rangeStart)} — ${dayFmt(rangeEnd)}`;
  const [pickerYear, setPickerYear] = useState(activeDate.getFullYear());

  // Snapshot del demo gratuito: se usa solo si el perfil aún no tiene cifras.
  const [demo, setDemo] = useState<DemoSnapshot | null>(null);
  useEffect(() => setDemo(readDemoSnapshot()), []);

  const swr = Math.min(15, Math.max(1, profile.withdrawal_rate || 7)) / 100;
  const desiredIncome =
    plan.desiredIncome > 0 ? plan.desiredIncome : current.expenses > 0 ? current.expenses : demo?.monthlySpend ?? 0;
  const baseTargetNumber = plan.targetCapital > 0 ? plan.targetCapital : (desiredIncome * 12) / swr;
  const baseNumberNetWorth = liveNetWorth > 0 ? liveNetWorth : demo?.netWorth ?? 0;
  const baseMonthlyContribution = current.savings > 0 ? current.savings : demo?.monthlyInvest ?? 0;

  // Mínimo mensual para llegar a tu número a la edad de retiro que elegiste
  // en el onboarding (S&P 500 · 10%, interés compuesto mensual).
  // Todas las inversiones y la liquidez, excluyendo únicamente inmuebles y
  // deudas. Completa cada rubro con Mis datos cuando aún no tiene posiciones
  // detalladas, igual que el cálculo de Retiro.
  const investableBuckets = [
    { kinds: ["cash"], fallback: profile.assets_cash },
    { kinds: ["bank", "money_market"], fallback: profile.assets_bank },
    { kinds: ["retirement"], fallback: profile.assets_retirement },
    { kinds: ["etf", "other", "bond", "tbill", "note", "structured", "reit", "future"], fallback: profile.assets_etf },
    { kinds: ["stock"], fallback: profile.assets_stocks },
    { kinds: ["crypto"], fallback: profile.assets_crypto },
  ];
  const investableAssets = investableBuckets.reduce((total, bucket) => {
    const rows = holdings.filter((holding) => bucket.kinds.includes(holding.kind));
    return total + (rows.length > 0 ? rows.reduce((sum, holding) => sum + holdingValue(holding, prices), 0) : bucket.fallback);
  }, 0);
  // La tarjeta Cartera usa exactamente el mismo capital invertible que Tu Número
  // y el tab de Retiro: todos los activos financieros, sin inmuebles ni deudas.
  const portfolioValue = investableAssets;
  const retireAgeChosen = d.retirement.retireAge;
  const retireYearsLeft = retireAgeChosen > d.retirement.currentAge ? retireAgeChosen - d.retirement.currentAge : 0;
  const minRetirementMonthly = minMonthlyForRetirement({
    target: baseTargetNumber,
    invested: investableAssets,
    years: Math.max(1, retireYearsLeft),
  });
  // Mismo número que muestra WhatsYournumber en la tarjeta de aporte mensual:
  // el que guardaste ahí, o el sugerido al 10% del S&P 500 si todavía no elegiste.
  const savedRetirementMonthly =
    (profile.retirement_monthly_contribution || 0) > 0
      ? Math.round(profile.retirement_monthly_contribution)
      : 0;
  const retirementMonthlyGoal = savedRetirementMonthly || minRetirementMonthly;
  const retirementHint = (() => {
    if (retireYearsLeft <= 0 || baseTargetNumber <= 0) return undefined;
    const pill = (n: number | string, tone: string) => (
      <span className={cn("rounded-full px-1.5 py-0.5 font-semibold", tone)}>{n}</span>
    );
    if (retirementMonthlyGoal > 0) {
      const tone = "bg-positive/12 text-positive";
      const line = (cls: string, pre: [string, string], mid: [string, string]) => (
        <span className={cn("inline-flex items-center gap-1", cls)}>
          {t(pre[0], pre[1])}
          {pill(retireAgeChosen, tone)}
          {t(mid[0], mid[1])}
          {pill(fmt(retirementMonthlyGoal), tone)}
          {t("/mes", "/mo")}
        </span>
      );
      return (
        <>
          {line("sm:hidden", ["Retiro a los ", "Retire at "], [" · invierte ", " · invest "])}
          {line("hidden sm:inline-flex lg:hidden", ["Retiro ", "Retire "], [" · invierte ", " · invest "])}
          {line("hidden lg:inline-flex", ["Retiro a los ", "To retire at "], [" · debes invertir ", " · invest "])}
        </>
      );
    }
    const tone = "bg-positive/12 text-positive";
    const covered = (cls: string, pre: [string, string], tail: [string, string]) => (
      <span className={cn("inline-flex items-center gap-1", cls)}>
        {t(pre[0], pre[1])}
        {pill(retireAgeChosen, tone)}
        {t(tail[0], tail[1])}
      </span>
    );
    return (
      <>
        {covered("sm:hidden", ["Retiro a los ", "Retire at "], [" · cubierto", " · covered"])}
        {covered("hidden sm:inline-flex lg:hidden", ["Retiro ", "Retire "], [" · cubierto", " · covered"])}
        {covered("hidden lg:inline-flex", ["Tu retiro a los ", "Retiring at "], [" ya está cubierto", " is already covered"])}
      </>
    );
  })();


  // Si el usuario eligió una meta principal en Life Planner, "Tu Número" refleja esa meta.
  const targetNumber = primary ? primary.cost : baseTargetNumber;
  const monthlyContribution = primary ? primary.monthly : baseMonthlyContribution;
  // La barra es la misma que la de WhatsYournumber: capital invertible (sin
  // viviendas ni deudas) frente a tu número, no el patrimonio neto completo.
  const numberProgressBase = primary ? primary.saved : investableAssets;
  const numberProgress =
    targetNumber > 0 ? Math.min(100, Math.max(0, (numberProgressBase / targetNumber) * 100)) : 0;
  const numberYearsLeft = primary
    ? yearsToTarget(primary.cost, primary.saved, primary.monthly, profile.expected_return || 7)
    : plan.targetCapital > 0
      ? plan.yearsLeft
      : yearsToTarget(baseTargetNumber, baseNumberNetWorth, baseMonthlyContribution, profile.expected_return || 7);
  const usingDemo = !primary && plan.targetCapital <= 0 && baseTargetNumber > 0;

  const [mortgage, setMortgage] = useState({ balance: 0, rate: 0, term: 0 });
  useEffect(() => {
    let stored = { balance: 0, rate: 0, term: 0 };
    try {
      // Clave por cuenta: una cuenta nueva no hereda la hipoteca de otra.
      const raw = window.localStorage.getItem(`whatsyournumber:mortgage:${profileUserId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        stored = {
          balance: Number(parsed?.balance) || 0,
          rate: Number(parsed?.rate) || 0,
          term: Number(parsed?.term) || 0,
        };
      }
    } catch {
      /* ignore */
    }
    // Datos del onboarding como base cuando aún no hay simulación guardada
    const fromProfile = {
      balance: Number(profile.mortgage_balance) || 0,
      rate: Number(profile.mortgage_rate) || 0,
      term: Number(profile.mortgage_term) || 0,
    };
    stored = {
      balance: stored.balance || fromProfile.balance || Math.max(0, Number(profile.liabilities) || 0),
      rate: stored.rate || fromProfile.rate,
      term: stored.term || fromProfile.term,
    };
    setMortgage(stored);
  }, [profileUserId, profile.liabilities, profile.mortgage_balance, profile.mortgage_rate, profile.mortgage_term]);

  const mortgageBalance = mortgage.balance;
  const mortgagePayment =
    mortgage.balance > 0 && mortgage.rate > 0 && mortgage.term > 0
      ? paymentFor(mortgage.balance, mortgage.rate, mortgage.term * 12)
      : 0;
  const mortgageHint =
    mortgage.balance > 0 && mortgage.rate > 0 && mortgage.term > 0
      ? t(
          `${mortgage.rate.toFixed(1)}% • ${mortgage.term} ${mortgage.term === 1 ? "año" : "años"} • ${fmt(mortgagePayment)}/mes`,
          `${mortgage.rate.toFixed(1)}% • ${mortgage.term} ${mortgage.term === 1 ? "year" : "years"} • ${fmt(mortgagePayment)}/mo`,
        )
      : t("Ver simulador", "Open simulator");
  // Tasa de ahorro = ahorro real del mes / salario (misma base que las tarjetas).
  const savingsRate = d.income > 0 ? (monthlySavings / d.income) * 100 : 0;

  // Mínimo aceptable para ahorrar o invertir: 20% del ingreso.

  const incomeHint = (() => {
    if (d.income <= 0) return t("Ingreso mensual estimado", "Estimated monthly income");
    if (d.income > monthlyExpenses) {
      const rate = savingsRate;
      if (rate >= 20) {
        return (
          <span className="inline-flex items-center gap-1.5">
            {t("Puedes ahorrar/invertir", "You can save/invest")} <span className="rounded-full bg-positive/12 px-2 py-0.5 font-semibold text-positive">{rate.toFixed(0)}%</span> {t("de tu ingreso", "of your income")}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5">
          {t("Solo", "Only")} <span className="rounded-full bg-negative/12 px-2 py-0.5 font-semibold text-negative">{rate.toFixed(0)}%</span>
          {t(" · genera extra para el ", " · find extra for the ")}<span className="rounded-full bg-negative/12 px-2 py-0.5 font-semibold text-negative">20%</span>
        </span>
      );
    }
    const deficit = current.expenses - current.income;
    const planYears = retireYearsLeft;
    return (
      <span className="inline-flex items-center gap-1.5">
        {t("Faltan", "Short")} <span className="rounded-full bg-negative/12 px-2 py-0.5 font-semibold text-negative">{fmt(deficit)}</span>
        {planYears > 0
          ? t(
              `/mes para tu plan de retiro en ${planYears}\u00a0${planYears === 1 ? "año" : "años"}`,
              `/mo for your retirement plan in ${planYears}\u00a0${planYears === 1 ? "year" : "years"}`,
            )
          : t("/mes · necesitas extra", "/mo · you need extra")}
      </span>
    );
  })();

  // "Ahorraste X%" con un decimal (coma en ES, punto en EN) frente al mínimo del 20%.
  const savingsRateHint = (() => {
    const pill = (text: string, good: boolean) => (
      <span className={cn("rounded-full px-2 py-0.5 font-semibold", good ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative")}>
        {text}
      </span>
    );
    if (current.income <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5">
          {t("Mínimo", "Minimum")} {pill("20%", false)} {t("del ingreso", "of income")}
        </span>
      );
    }
    if (savingsRate < 0) {
      return (
        <span className="inline-flex items-center gap-1.5">
          {t("Perdiste", "You lost")} {pill(`${num(Math.abs(savingsRate), 1)}%`, false)} {t("· busca extra para el", "· find extra for the")} {pill("20%", false)}
        </span>
      );
    }
    const good = savingsRate >= 20;
    return (
      <span className="inline-flex items-center gap-1.5">
        {t("Pudieras ahorrar", "You could save")} {pill(`${num(savingsRate, 1)}%`, good)}
        {good && (
          /* En tablet se resume a la primera parte para que no se corte. */
          <span className="md:hidden lg:inline-flex items-center gap-1.5">
            {t("· Por encima del", "· Above the")} {pill("20%", true)} {t("mínimo", "minimum")}
          </span>
        )}
      </span>
    );
  })();


  const insights = buildInsights(plan, profile, profile, d.currency, lang);
  const firstName = (profile.full_name || "").trim().split(" ")[0];

  // El título, subtítulo y textos del panel cambian según el objetivo elegido.
  const goalMode = plan.mode;
  const priority = (profile as { priority?: string }).priority || "libertad";
  const goalNote = ((profile as { goal_note?: string }).goal_note || "").trim();
  const headerSubtitle = isMobile
    ? goalMode === "home"
      ? t("Tu objetivo: comprar tu casa.", "Your goal: buy your home.")
      : goalMode === "business"
        ? priority === "otro" && goalNote
          ? t(`Tu objetivo: ${goalNote}.`, `Your goal: ${goalNote}.`)
          : t("Tu objetivo: crecer tu negocio.", "Your goal: grow your business.")
        : priority === "patrimonio"
          ? t("Tu objetivo: crecer tu patrimonio.", "Your goal: grow your wealth.")
          : priority === "gastos"
            ? t("Tu objetivo: controlar tus gastos.", "Your goal: control your spending.")
            : priority === "organizar"
              ? t("Tu objetivo: organizar tus finanzas.", "Your goal: organize your finances.")
              : t("Tu objetivo: tu libertad financiera.", "Your goal: financial freedom.")
    : goalMode === "home"
      ? t("Tus números. Tu progreso. Tu objetivo de comprar tu casa.", "Your numbers. Your progress. Your goal to buy your home.")
      : goalMode === "business"
        ? priority === "otro" && goalNote
          ? t(`Tus números. Tu progreso. Tu objetivo: ${goalNote}.`, `Your numbers. Your progress. Your goal: ${goalNote}.`)
          : t("Tus números. Tu progreso. Tu objetivo de crecer tu negocio.", "Your numbers. Your progress. Your goal to grow your business.")
        : priority === "patrimonio"
          ? t("Tus números. Tu progreso. Tu objetivo de crecer tu patrimonio.", "Your numbers. Your progress. Your goal to grow your wealth.")
          : priority === "gastos"
            ? t("Tus números. Tu progreso. Tu objetivo de controlar tus gastos.", "Your numbers. Your progress. Your goal to control your spending.")
            : priority === "organizar"
              ? t("Tus números. Tu progreso. Tu objetivo de organizar tus finanzas.", "Your numbers. Your progress. Your goal to organize your finances.")
              : t("Tus números. Tu progreso. Tu objetivo de alcanzar tu libertad financiera.", "Your numbers. Your progress. Your goal to reach financial freedom.");
  const numberTitle = primary
    ? primary.name
    : goalMode === "home"
      ? t("Tu entrada", "Your down payment")
      : goalMode === "business"
        ? priority === "otro"
          ? t("Tu objetivo", "Your goal")
          : t("Tu negocio", "Your business")
        : t("Tu Número", "Your Number");
  const numberDescription = primary
    ? t("Capital para tu meta principal", "Capital for your primary goal")
    : goalMode === "home"
      ? t("Capital para la entrada de tu vivienda", "Capital for your home down payment")
      : goalMode === "business"
        ? priority === "otro"
          ? `${t("Capital para llegar a tu objetivo", "Capital to reach your goal")}${goalNote ? `: ${goalNote}` : ""}`
          : t("Capital para montar tu negocio", "Capital to launch your business")
        : priority === "patrimonio"
          ? t("Hasta dónde puede crecer tu patrimonio", "How far your wealth can grow")
          : priority === "gastos"
            ? t("El capital que necesitas para vivir libre del sistema", "The capital you need to live free from the system")
            : priority === "organizar"
              ? t("El número que ordena tu dinero", "The number that organizes your money")
              : t(`Libertad estimada a los ${plan.freedomAge} años`, `Freedom estimated at age ${plan.freedomAge}`);


  return (
    <PageShell>
      <CheckoutWelcome />
      <SubscriptionStatusBanner className="mb-4" />
      <PageHeader
        eyebrow={activeDate.toLocaleDateString(lang, { month: "long", year: "numeric" })}
        title={firstName ? `${greeting(t)} ${firstName}` : greeting(t)}
        subtitle={headerSubtitle}
        actions={
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-full">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs md:text-sm">{monthRangeLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" collisionPadding={12} className="w-[min(92vw,20rem)] p-3">
              <div className="mb-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear((y) => y - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{pickerYear}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear((y) => y + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, m) => {
                  const key = `${pickerYear}-${String(m + 1).padStart(2, "0")}`;
                  const available = monthKeys.includes(key);
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant={key === activeKey ? "default" : "ghost"}
                      disabled={!available}
                      className={cn(
                        "rounded-lg capitalize",
                        key === activeKey && "bg-emerald-500/90 text-white hover:bg-emerald-600",
                      )}
                      onClick={() => {
                        setMonthKey(key);
                        setPickerOpen(false);
                      }}
                    >
                      {new Date(pickerYear, m, 1).toLocaleDateString(lang, { month: "short" }).replace(/\./g, "")}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("Solo meses con datos disponibles.", "Only months with available data.")}
              </p>
            </PopoverContent>
          </Popover>
        }
      />

      {!isLoading && !d.hasData && (
        <div className="surface flex flex-wrap items-center gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "Aún no tenemos tus cifras. Completa o edita tu perfil para que toda la app se recalcule.",
              "We don't have your numbers yet. Complete or edit your profile so the whole app recalculates.",
            )}
          </p>
          <Button asChild size="sm" className="ml-auto rounded-full">
            <Link to="/mi-perfil">{t("Editar mis datos", "Edit my data")}</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link to="/patrimonio" className="block transition-transform hover:-translate-y-0.5">
          <KpiCard
            label={t("Patrimonio neto", "Net worth")}
            value={fmt(current.netWorth)}
            {...(hasHistory && targetNumber <= 0 ? { delta: delta(current.netWorth, previous.netWorth) } : {})}
            {...(targetNumber > 0
              ? {
                  hint: (
                    <>
                      <span className="numeric font-semibold text-positive">{numberProgress.toFixed(1)}%</span>{" "}
                      {t("de tu libertad financiera", "of your financial freedom")}
                    </>
                  ),
                  hintClassName: "whitespace-normal text-balance",
                }
              : hasHistory
                ? { hint: t("vs mes anterior", "vs last month") }
                : {})}
            icon={Wallet}
            accent
            index={0}
          />
        </Link>
        <EditableKpiCard
          label={household ? t("Ingresos (en pareja)", "Income (as a couple)") : t("Ingresos", "Income")}
          value={fmt(current.income)}
          editHref="/mi-perfil"
          hint={incomeHint}
          hintClassName="leading-snug text-balance"
          icon={Banknote}
          index={1}
        />
        <Link to="/gastos" className="block transition-transform hover:-translate-y-0.5">
          <KpiCard
            label={t("Gastos", "Expenses")}
            value={fmt(monthlyExpenses)}
            {...(spendPlanHint ? { hint: spendPlanHint } : {})}
            inverse
            icon={TrendingUp}
            index={2}
          />
        </Link>
        <Link to="/cash-flow" className="block transition-transform hover:-translate-y-0.5">
          <KpiCard
            label={t("Ahorro", "Savings")}
            value={fmt(monthlySavings)}
            {...(retirementHint ? { hint: retirementHint } : {})}
            icon={PiggyBank}
            index={3}
          />
        </Link>
        <Link to="/cash-flow" className="block transition-transform hover:-translate-y-0.5">
          <KpiCard label={t("Tasa de ahorro", "Savings rate")} value={`${savingsRate.toFixed(0)}%`} hint={savingsRateHint} icon={ArrowUpRight} index={4} />
        </Link>
        <Link to="/hipoteca" className="block transition-transform hover:-translate-y-0.5">
          <KpiCard
            label={t("Hipoteca", "Mortgage")}
            value={fmt(mortgageBalance)}
            hint={mortgageHint}
            inverse
            icon={Home}
            index={5}
          />
        </Link>
      </div>






      <div className="grid gap-4 lg:grid-cols-5">
        
        <Panel title={t("Evolución de cuál tu número", "Evolution of your number")} description={t("Avance hacia tu número de retiro", "Advance toward your retirement number")} className="lg:col-span-3" bleedMobile>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={months} margin={chartMargin}>
              <defs>
                <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="70%" stopColor="var(--color-chart-1)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={axisW} fontSize={isMobile ? 9 : 10} domain={[0, (dataMax: number) => Math.max(dataMax, targetNumber) * 1.08]} />
              <Tooltip content={<ChartTooltip />} />
              {targetNumber > 0 && (
                <ReferenceLine
                  y={targetNumber}
                  stroke="var(--color-chart-2)"
                  strokeDasharray="4 4"
                  label={{ value: `WhatsYournumber · ${fmtCompact(targetNumber)}`, position: "insideTopRight", fill: "var(--color-muted-foreground)", fontSize: 11 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="netWorth"
                name={t("Acumulado", "Accumulated")}
                stroke="var(--color-chart-1)"
                strokeWidth={3}
                fill="url(#nw)"
                activeDot={{ r: 5, stroke: "var(--color-background)", strokeWidth: 2, fill: "var(--color-chart-1)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={numberTitle} description={numberDescription} className="flex h-full flex-col lg:col-span-2">
          <div className="flex h-full flex-1 flex-col gap-4">
            <div>
              <p
                className={cn(
                  "numeric mt-1 truncate text-ellipsis whitespace-nowrap font-semibold leading-tight",
                  fmt(targetNumber).length > 22 ? "text-base" : fmt(targetNumber).length > 16 ? "text-lg" : "text-2xl",
                )}
                title={fmt(targetNumber)}
              >
                {fmt(targetNumber)}
              </p>
              {usingDemo && (
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {t("Calculado con tu demo. Edita tus datos para afinarlo.", "Based on your demo. Edit your data to refine it.")}
                </p>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("Progreso", "Progress")}</span>
                <span className="numeric font-medium">{numberProgress.toFixed(1)}%</span>
              </div>
              <Progress value={numberProgress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="rounded-xl bg-elevated/60 p-2">
                <p className="min-h-[22px] text-balance text-[10px] leading-tight text-muted-foreground">
                  {t("Monto mensual deseado", "Desired monthly amount")}
                </p>
                <p className="numeric mt-1 truncate text-lg font-semibold" title={`${fmt(targetNumber > 0 ? (targetNumber * swr) / 12 : 0)}${t("/mes", "/mo")}`}>
                  {fmt(targetNumber > 0 ? (targetNumber * swr) / 12 : 0)}
                </p>
              </div>
              <div className="rounded-xl bg-elevated/60 p-2">
                <p className="min-h-[22px] text-balance text-[10px] leading-tight text-muted-foreground">
                  {t("Años restantes para retirarte", "Years left to retire")}
                </p>
                <p className="numeric mt-1 truncate text-lg font-semibold">{numberYearsLeft}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="sm" className="w-full rounded-full">
                <Link to="/retiro">{t("Ver mi número", "See my number")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full rounded-full">
                <Link to="/mi-perfil">{t("Editar mis datos", "Edit my data")}</Link>
              </Button>
            </div>
            <p className="mt-auto text-xs leading-snug text-muted-foreground/75 sm:text-[13px]">
              * {t("basado en el estilo de vida que escogiste", "based on the lifestyle you chose")}
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("Ingresos vs gastos", "Income vs expenses")} className="lg:col-span-2" bleedMobile>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={months} margin={chartMargin} barGap={2}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={axisW} fontSize={isMobile ? 9 : 10} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.28 }} />
              <Bar dataKey="income" name={t("Ingresos", "Income")} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name={t("Gastos", "Expenses")} fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={t("Evolución del ahorro", "Savings evolution")} bleedMobile>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={months} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={axisW} fontSize={isMobile ? 9 : 10} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="savings"
                name={t("Ahorro", "Savings")}
                stroke="var(--color-chart-4)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, stroke: "var(--color-background)", strokeWidth: 2, fill: "var(--color-chart-4)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <TopCitiesPanel profile={profile} netWorth={liveNetWorth} monthlySavings={d.savings} fmt={fmt} currency={d.currency} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("Tus metas financieras", "Your financial goals")}
          description={t("Tu progreso hacia lo que te importa.", "Your progress toward what matters.")}
          actions={
            <Button asChild size="sm" variant="outline" className="gap-1 rounded-full">
              <Link to="/mi-perfil">
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Cambiar meta", "Change goal")}</span>
              </Link>
            </Button>
          }
        >
          <ul className="space-y-1">
            {d.goals.map((g) => {
              const isEmergency = g.name === "Fondo de emergencia";
              const isYourNumber = g.name === "Your Number";
              // El fondo de emergencia = 6 meses de tu plan de gasto mensual; sin plan, se usa el gasto del perfil.
              const targetBase = isYourNumber
                ? targetNumber
                : isEmergency && spendPlanMonthlyTotal > 0
                  ? Math.round(spendPlanMonthlyTotal * 6)
                  : g.target;
              const left = isYourNumber ? numberProgressBase : (g.displayCurrent ?? g.current);
              const right = isYourNumber ? targetNumber : (g.displayTarget ?? targetBase);
              const pct = isYourNumber
                ? numberProgress
                : (g.progressPct ?? (targetBase > 0 ? Math.min(100, (left / targetBase) * 100) : 0));
              const remaining = Math.max(0, right - left);
              const portfolioRate = (() => {
                // El rendimiento de la cartera excluye cripto y ETF para reflejar la ganancia operativa neta.
                const investKinds = ["stock", "other", "bond", "tbill", "note", "structured"];
                const list = holdings.filter((h) => investKinds.includes(h.kind));
                let totalValue = 0;
                let weightedReturn = 0;
                for (const h of list) {
                  const value = holdingValue(h, prices);
                  if (value <= 0) continue;
                  const tk = h.ticker?.toUpperCase();
                  const marketCost = h.cost_basis > 0 ? h.cost_basis : 0;
                  let marketGrowth: number | null = null;
                  if (tk && marketCost > 0 && value > 0) {
                    marketGrowth = (value - marketCost) / marketCost;
                  } else if (tk && dayChange[tk] !== undefined) {
                    marketGrowth = dayChange[tk] / 100;
                  }
                  const growth = marketGrowth !== null ? marketGrowth : (h.expected_return || 7) / 100;
                  totalValue += value;
                  weightedReturn += value * growth;
                }
                if (totalValue > 0) return (weightedReturn / totalValue) * 100;
                return profile.expected_return || 7;
              })();
              const years = yearsToTarget(right, left, g.monthly, portfolioRate);

              const isCityGoal = g.emoji === "🌍";
              // Ciudad: verde solo si tus ingresos cubren el coste de vivir allí.
              const cityReached = isCityGoal && (g.displayTarget ?? 1) > 0 && (g.displayCurrent ?? 0) >= (g.displayTarget ?? 1);

              let subtitle: string;
              if (isEmergency) {
                subtitle = t("6 meses de tus gastos mensuales", "6 months of your monthly expenses");
              } else if (isCityGoal) {
                subtitle = cityReached ? lifestyleSubtitle(profile, t) : lifestyleShortfallSubtitle(profile, t);
              } else if (pct >= 100) {
                subtitle = t("Meta alcanzada", "Goal reached");
              } else if (g.note) {
                subtitle = translateGoalNote(g.note, lang);
              } else if (remaining > 0 && years > 0) {
                const yearsLabel = years >= 99 ? "+99" : String(years);
                subtitle = t(
                  `Te faltan ${fmtCompact(remaining)} · ~ ${yearsLabel} años al ritmo actual`,
                  `You need ${fmtCompact(remaining)} · ~ ${yearsLabel} years at current pace`,
                );
              } else {
                subtitle = t("En camino", "On track");
              }

              const sp500Rate = indexLive['sp500']?.cagr10y ?? indexLive['sp500']?.ytdPct ?? 10;

              const goalBarColor = (value: number) =>
                value >= 75 ? "bg-positive" : value >= 50 ? "bg-warning" : "bg-negative";

              if (g.name === "Cartera de inversión") {
                const noInvestments = portfolioValue <= 0;
                const diff = portfolioReturn - sp500Rate;
                const progress = noInvestments
                  ? 0
                  : sp500Rate > 0
                    ? Math.min(100, Math.max(0, (portfolioReturn / sp500Rate) * 100))
                    : 0;
                const diffText = noInvestments ? "0%" : `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
                const diffColor = noInvestments ? "text-muted-foreground" : diff >= 0 ? "text-positive" : "text-negative";
                return (
                  <li key={g.name}>
                    <Link to="/portafolio" className="group flex items-start gap-2.5 rounded-2xl p-1.5 transition-colors hover:bg-elevated/40">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-elevated/60 text-lg">
                        {g.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 truncate font-medium">{translateGoalName(g.name, lang)}</span>
                          <span className={cn("numeric ml-auto shrink-0 text-sm font-semibold", diffColor)}>
                            {diffText}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {noInvestments
                            ? <>{fmtCompact(portfolioValue)} {t("invertidos", "invested")}</>
                            : <>{fmtCompact(portfolioValue)} {t(`al ${portfolioReturn.toFixed(1)}%`, `at ${portfolioReturn.toFixed(1)}%`)}</>}
                        </p>
                        <Progress value={progress} indicatorClassName={goalBarColor(progress)} className="mt-1.5 h-1.5" />
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {noInvestments
                            ? t("Comienza a invertir el 20% de tus ingresos", "Start investing 20% of your income")
                            : t(`vs ${sp500Rate.toFixed(1)}% S&P 500`, `vs ${sp500Rate.toFixed(1)}% S&P 500`)}
                        </p>

                      </div>
                    </Link>
                  </li>
                );
              }

              const goalTextColor = isCityGoal
                ? cityReached
                  ? "text-positive"
                  : "text-negative"
                : pct >= 75
                  ? "text-positive"
                  : pct >= 50
                    ? "text-warning"
                    : "text-negative";
              const goalHref = isCityGoal ? "/ciudades" : g.name === "Fondo de emergencia" ? "/mi-perfil" : "/retiro";

              return (
                <li key={g.name}>
                  <Link to={goalHref} className="group flex items-start gap-2.5 rounded-2xl p-1.5 transition-colors hover:bg-elevated/40">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-elevated/60 text-lg">
                      {g.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate font-medium">{translateGoalName(g.name, lang)}</span>
                        <span className={cn("numeric ml-auto shrink-0 text-sm font-semibold", goalTextColor)}>
                          {pct.toFixed(0)}%
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fmtCompact(left)} {t("de", "of")} {fmtCompact(right)}
                      </p>
                      <Progress
                        value={pct}
                        indicatorClassName={isCityGoal ? (cityReached ? "bg-positive" : "bg-negative") : goalBarColor(pct)}
                        className="mt-1.5 h-1.5"
                      />
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>


        <Panel title={t("Insights", "Insights")} description={t("Generados con tu plan", "Generated from your plan")}>
          <ul className="space-y-2">
            {insights.map((text) => (
              <li key={text} className="rounded-xl bg-elevated/60 p-3 text-sm text-muted-foreground">
                {text}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
