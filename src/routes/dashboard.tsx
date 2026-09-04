import { useEffect, useState } from "react";
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
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTransactions } from "@/hooks/use-transactions";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useIndexReturns } from "@/hooks/use-index-returns";
import { holdingValue, useHoldings } from "@/hooks/use-holdings";
import { useQuotes } from "@/hooks/use-market";
import { usePrimaryGoal } from "@/hooks/use-primary-goal";
import { cn } from "@/lib/utils";
import { buildInsights, lifestyles } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";
import { buildRealMonths } from "@/lib/real-months";
import { readDemoSnapshot, type DemoSnapshot } from "@/lib/demo-snapshot";
import { translateGoalName, translateGoalNote } from "@/lib/i18n-data";

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

function Dashboard() {
  const t = useT();
  const { lang } = useLanguage();
  const isMobile = useIsMobile();
  // En móvil el eje y los márgenes se comprimen para que el gráfico use todo el ancho.
  const axisW = isMobile ? 44 : 78;
  const chartMargin = isMobile ? { left: 0, right: 4, top: 8 } : { left: 4, right: 8, top: 8 };

  const { profile, isLoading, save } = useProfile();
  const { primary } = usePrimaryGoal();
  const { transactions } = useTransactions();
  const d = buildDataset(profile);
  const realMonths = buildRealMonths(transactions, d.netWorth);
  const fixed = useFixedExpenses();
  const { live: indexLive } = useIndexReturns();
  const { holdings } = useHoldings();
  const holdingSymbols = holdings.filter((h) => h.ticker && h.quantity > 0).map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries((holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]));
  const dayChange: Record<string, number> = Object.fromEntries(
    (holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.changePct ?? 0]),
  );
  const months = (realMonths ?? d.months).map((month) => {
    const expenses = month.expenses + (realMonths ? fixed.total : 0);
    return { ...month, expenses, income: d.income, savings: d.income - expenses };
  });

  // Selector de mes (por defecto el mes pasado completo).
  const monthKeys = months.map((m, i) => (m as { month?: string }).month ?? `idx-${i}`);
  const defaultKey = (() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    return monthKeys.includes(key) ? key : monthKeys[monthKeys.length - 1] ?? key;
  })();
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const activeKey = monthKey && monthKeys.includes(monthKey) ? monthKey : defaultKey;
  const activeIndex = Math.max(0, monthKeys.indexOf(activeKey));
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasHistory = Boolean(realMonths && realMonths.length > 1);
  const current = months[activeIndex] ?? months[months.length - 1] ?? d.current;
  const previous = months[activeIndex - 1] ?? current;
  const { fmt, fmtCompact, plan } = d;

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
  const baseNumberNetWorth = d.netWorth > 0 ? d.netWorth : demo?.netWorth ?? 0;
  const baseMonthlyContribution = current.savings > 0 ? current.savings : demo?.monthlyInvest ?? 0;

  // Si el usuario eligió una meta principal en Life Planner, "Tu Número" refleja esa meta.
  const targetNumber = primary ? primary.cost : baseTargetNumber;
  const numberNetWorth = primary ? primary.saved : baseNumberNetWorth;
  const monthlyContribution = primary ? primary.monthly : baseMonthlyContribution;
  const numberProgress = targetNumber > 0 ? Math.min(100, Math.max(0, (numberNetWorth / targetNumber) * 100)) : 0;
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
      const raw = window.localStorage.getItem("whatsyournumber:mortgage");
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
      balance: stored.balance || fromProfile.balance || Number(profile.liabilities) || 0,
      rate: stored.rate || fromProfile.rate,
      term: stored.term || fromProfile.term,
    };
    setMortgage(stored);
  }, [profile.liabilities, profile.mortgage_balance, profile.mortgage_rate, profile.mortgage_term]);

  const mortgageBalance = mortgage.balance;
  const mortgagePayment =
    mortgage.balance > 0 && mortgage.rate > 0 && mortgage.term > 0
      ? paymentFor(mortgage.balance, mortgage.rate, mortgage.term * 12)
      : 0;
  const mortgageHint =
    mortgage.rate > 0 && mortgage.term > 0
      ? t(
          `${mortgage.rate.toFixed(1)}% • ${mortgage.term} ${mortgage.term === 1 ? "año" : "años"} • ${fmt(mortgagePayment)}/mes`,
          `${mortgage.rate.toFixed(1)}% • ${mortgage.term} ${mortgage.term === 1 ? "year" : "years"} • ${fmt(mortgagePayment)}/mo`,
        )
      : t("Ver simulador", "Open simulator");
  const savingsRate = current.income > 0 ? (current.savings / current.income) * 100 : 0;
  const prevRate = previous.income > 0 ? (previous.savings / previous.income) * 100 : 0;
  const insights = buildInsights(plan, profile, profile, d.currency, lang);
  const firstName = (profile.full_name || "").trim().split(" ")[0];

  // El título, subtítulo y textos del panel cambian según el objetivo elegido.
  const goalMode = plan.mode;
  const priority = (profile as { priority?: string }).priority || "libertad";
  const goalNote = ((profile as { goal_note?: string }).goal_note || "").trim();
  const headerSubtitle = isMobile
    ? goalMode === "home"
      ? t("Tus números. Tu progreso. Tu objetivo: comprar tu casa.", "Your numbers. Your progress. Your goal: buy your home.")
      : goalMode === "business"
        ? priority === "otro" && goalNote
          ? t(`Tus números. Tu progreso. Tu objetivo: ${goalNote}.`, `Your numbers. Your progress. Your goal: ${goalNote}.`)
          : t("Tus números. Tu progreso. Tu objetivo: crecer tu negocio.", "Your numbers. Your progress. Your goal: grow your business.")
        : priority === "patrimonio"
          ? t("Tus números. Tu progreso. Tu objetivo: crecer tu patrimonio.", "Your numbers. Your progress. Your goal: grow your wealth.")
          : priority === "gastos"
            ? t("Tus números. Tu progreso. Tu objetivo: controlar tus gastos.", "Your numbers. Your progress. Your goal: control your spending.")
            : priority === "organizar"
              ? t("Tus números. Tu progreso. Tu objetivo: organizar tus finanzas.", "Your numbers. Your progress. Your goal: organize your finances.")
              : t("Tus números. Tu progreso. Tu objetivo: alcanzar tu libertad financiera.", "Your numbers. Your progress. Your goal: reach financial freedom.")
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
            ? t("El capital que te da control total", "The capital that gives you total control")
            : priority === "organizar"
              ? t("El número que ordena tu dinero", "The number that organizes your money")
              : t(`Libertad estimada a los ${plan.freedomAge} años`, `Freedom estimated at age ${plan.freedomAge}`);
  const numberLabel = primary
    ? t("Meta principal", "Primary goal")
    : goalMode === "home"
      ? t("Entrada objetivo", "Target down payment")
      : goalMode === "business"
        ? t("Capital objetivo", "Target capital")
        : priority === "patrimonio"
          ? t("Patrimonio objetivo", "Target wealth")
          : priority === "gastos"
            ? t("Capital de control", "Control capital")
            : priority === "organizar"
              ? t("Número organizador", "Organizing number")
              : "Your Number";
  const numberHint = primary
    ? `${primary.emoji} ${t("Meta activa", "Active goal")}`
    : goalMode === "home"
      ? t("Para comprar tu vivienda", "To buy your home")
      : goalMode === "business"
        ? priority === "otro" && goalNote
          ? t(`Para ${goalNote}`, `For ${goalNote}`)
          : t("Para arrancar tu negocio", "To start your business")
        : priority === "patrimonio"
          ? t("Para hacer crecer tu patrimonio", "To grow your wealth")
          : priority === "gastos"
            ? t("Para controlar tus gastos mensuales", "To control your monthly spending")
            : priority === "organizar"
              ? t("Para organizar tus finanzas", "To organize your finances")
              : t(`Para vivir con ${fmt(desiredIncome)} al mes`, `To live on ${fmt(desiredIncome)} a month`);


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
                      className="rounded-lg capitalize"
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
            {...(hasHistory ? { delta: delta(current.netWorth, previous.netWorth), hint: t("vs mes anterior", "vs last month") } : {})}
            icon={Wallet}
            accent
            index={0}
          />
        </Link>
        <EditableKpiCard
          label={t("Ingresos", "Income")}
          value={fmt(current.income)}
          editHref="/mi-perfil"
          {...(hasHistory ? { delta: delta(current.income, previous.income) } : {})}
          icon={Banknote}
          index={1}
        />
        <KpiCard label={t("Gastos", "Expenses")} value={fmt(current.expenses)} {...(hasHistory ? { delta: delta(current.expenses, previous.expenses) } : {})} inverse icon={TrendingUp} index={2} />
        <KpiCard label={t("Ahorro", "Savings")} value={fmt(current.savings)} {...(hasHistory ? { delta: delta(current.savings, previous.savings) } : {})} icon={PiggyBank} index={3} />
        <KpiCard label={t("Tasa de ahorro", "Savings rate")} value={`${savingsRate.toFixed(0)}%`} {...(hasHistory ? { delta: savingsRate - prevRate } : {})} icon={ArrowUpRight} index={4} />
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






      <div className="grid gap-4 lg:grid-cols-3">
        
        <Panel title={t("Evolución de cuál tu número", "Evolution of your number")} description={t("Avance hacia tu número de retiro", "Advance toward your retirement number")} descriptionClassName="line-clamp-1 sm:line-clamp-none" className="lg:col-span-2" bleedMobile>
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

        <Panel title={numberTitle} description={numberDescription}>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{numberLabel}</p>
              <p
                className={cn(
                  "numeric mt-1 truncate text-ellipsis whitespace-nowrap font-semibold leading-tight",
                  fmt(targetNumber).length > 22 ? "text-base" : fmt(targetNumber).length > 16 ? "text-lg" : "text-2xl",
                )}
                title={fmt(targetNumber)}
              >
                {fmt(targetNumber)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{numberHint}</p>

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
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-elevated/60 p-3">
                <p className="text-xs text-muted-foreground">{t("Años restantes", "Years left")}</p>
                <p className="numeric mt-1 text-lg font-semibold">{numberYearsLeft}</p>
              </div>
              <div className="rounded-xl bg-elevated/60 p-3">
                <p className="text-xs text-muted-foreground">{t("Probabilidad", "Probability")}</p>
                <p className="numeric mt-1 text-lg font-semibold">{plan.probability}%</p>
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

      <TopCitiesPanel profile={profile} netWorth={d.netWorth} monthlySavings={d.savings} fmt={fmt} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("Tus metas financieras", "Your financial goals")}
          description={t("Tu progreso hacia lo que te importa.", "Your progress toward what matters.")}
          actions={
            <Button asChild size="sm" variant="outline" className="gap-1 rounded-full">
              <Link to="/life-planner">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Añadir meta", "Add goal")}</span>
              </Link>
            </Button>
          }
        >
          <ul className="space-y-1">
            {d.goals.map((g) => {
              const pct = g.progressPct ?? (g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0);
              const left = g.displayCurrent ?? g.current;
              const right = g.displayTarget ?? g.target;
              const remaining = Math.max(0, right - left);
              const portfolioRate = (() => {
                const investKinds = ["etf", "stock", "crypto", "other", "bond", "tbill", "note", "structured"];
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

              let subtitle: string;
              if (isCityGoal) {
                subtitle = lifestyleSubtitle(profile, t);
              } else if (pct >= 100) {
                if (g.name === "Fondo de emergencia") {
                  const monthsCovered = Math.round(left / Math.max(1, d.expenses));
                  subtitle = t(
                    `Min 6 meses de tu salario - ${monthsCovered} meses cubiertos`,
                    `Min 6 months of your salary - ${monthsCovered} months covered`,
                  );
                } else {
                  subtitle = t("Meta alcanzada", "Goal reached");
                }
              } else if (g.note) {
                subtitle = translateGoalNote(g.note, lang);
              } else if (remaining > 0 && years > 0 && years < 99) {
                subtitle = t(
                  `Te faltan ${fmtCompact(remaining)} • ~ ${years} años al ritmo actual`,
                  `You need ${fmtCompact(remaining)} • ~ ${years} years at current pace`,
                );
              } else {
                subtitle = t("En camino", "On track");
              }

              const sp500Rate = indexLive['sp500']?.cagr10y ?? indexLive['sp500']?.ytdPct ?? 10;

              const goalBarColor = (value: number) =>
                value >= 75 ? "bg-positive" : value >= 50 ? "bg-warning" : "bg-negative";

              if (g.name === "Cartera de inversión") {
                const diff = portfolioRate - sp500Rate;
                const progress = sp500Rate > 0 ? Math.min(100, Math.max(0, (portfolioRate / sp500Rate) * 100)) : 0;
                const diffText = `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`;
                const diffColor = diff >= 0 ? "text-positive" : "text-negative";
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
                          {fmtCompact(g.current)} {t(`al ${portfolioRate.toFixed(0)}%`, `at ${portfolioRate.toFixed(0)}%`)}
                        </p>
                        <Progress value={progress} indicatorClassName={goalBarColor(progress)} className="mt-1.5 h-1.5" />
                        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                          {t(`vs ${sp500Rate.toFixed(0)}% S&P 500`, `vs ${sp500Rate.toFixed(0)}% S&P 500`)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              }

              const goalTextColor = pct >= 75 ? "text-positive" : pct >= 50 ? "text-warning" : "text-negative";

              return (
                <li key={g.name}>
                  <Link to="/retiro" className="group flex items-start gap-2.5 rounded-2xl p-1.5 transition-colors hover:bg-elevated/40">
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
                      <Progress value={pct} indicatorClassName={goalBarColor(pct)} className="mt-1.5 h-1.5" />
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{subtitle}</p>
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
