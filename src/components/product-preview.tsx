import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Baby,
  BarChart3,
  Bot,
  Briefcase,
  Building,
  Car,
  Coffee,
  FileText,
  Globe,
  LineChart,
  MapPin,
  PieChart,
  Plane,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-language";

const netWorth = [
  { m: "Ene", v: 182 },
  { m: "Feb", v: 191 },
  { m: "Mar", v: 188 },
  { m: "Abr", v: 205 },
  { m: "May", v: 219 },
  { m: "Jun", v: 233 },
  { m: "Jul", v: 248 },
];

const spend = [
  { m: "Ene", v: 3.2, c: 2.9 },
  { m: "Feb", v: 2.8, c: 2.9 },
  { m: "Mar", v: 3.6, c: 2.9 },
  { m: "Abr", v: 3.1, c: 2.9 },
  { m: "May", v: 2.6, c: 2.9 },
  { m: "Jun", v: 2.9, c: 2.9 },
];

const portfolio = [
  { m: "Ene", you: 12, spy: 8 },
  { m: "Feb", you: 14, spy: 9 },
  { m: "Mar", you: 11, spy: 7 },
  { m: "Abr", you: 16, spy: 10 },
  { m: "May", you: 19, spy: 11 },
  { m: "Jun", you: 18, spy: 12 },
];

const retirement = [
  { m: "2026", v: 248 },
  { m: "2029", v: 402 },
  { m: "2032", v: 611 },
  { m: "2035", v: 892 },
  { m: "2038", v: 1270 },
];

const cashFlowData = [
  { label: "Necesidades / Needs", value: 40, color: "var(--color-primary)" },
  { label: "Ahorro + Inversión / Save + Invest", value: 40, color: "var(--color-positive)" },
  { label: "Deseos / Wants", value: 20, color: "var(--color-chart-3)" },
];

const spendCategories = [
  { name: "Mercado", value: 32, color: "var(--color-primary)" },
  { name: "Restaurantes", value: 18, color: "var(--color-chart-2)" },
  { name: "Salidas", value: 14, color: "var(--color-chart-3)" },
  { name: "Compras", value: 12, color: "var(--color-chart-4)" },
  { name: "Viajes", value: 10, color: "var(--color-chart-5)" },
  { name: "Transporte", value: 9, color: "var(--color-muted-foreground)" },
  { name: "App Marketing", value: 5, color: "var(--color-destructive)" },
];

const pieColors = ["var(--color-primary)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

const lifeGoals = [
  { title: "Vender mi empresa", titleEn: "Sell my company", impact: "-3.4 años", impactEn: "-3.4 years", value: "-€500k", color: "positive" },
  { title: "Venta de Aleph", titleEn: "Aleph exit", impact: "-1.4 años", impactEn: "-1.4 years", value: "-€200k", color: "positive" },
  { title: "Viajes al año", titleEn: "Yearly trips", impact: "+2.3 años", impactEn: "+2.3 years", value: "+€18k/año", color: "negative" },
  { title: "Tener hijos", titleEn: "Have children", impact: "+11 meses", impactEn: "+11 months", value: "+€1.2k/mes", color: "negative" },
];

const cities = [
  { name: "Madrid", score: 87, cost: "€2.8k", tag: "Base actual", tagEn: "Current base" },
  { name: "Barcelona", score: 84, cost: "€2.9k", tag: "Costa y cultura", tagEn: "Coast and culture" },
  { name: "Lisboa", score: 82, cost: "€2.4k", tag: "Visa nómada", tagEn: "Nomad visa" },
];

const retirementTable = [
  { year: "2026", age: "38", capital: "€248k", monthly: "—" },
  { year: "2030", age: "42", capital: "€540k", monthly: "—" },
  { year: "2034", age: "46", capital: "€920k", monthly: "€6.1k" },
  { year: "2038", age: "50", capital: "€1.50M", monthly: "€10.0k" },
];

export function ProductPreview() {
  const t = useT();

  const views = [
    { id: "patrimonio", label: t("Patrimonio", "Net Worth"), icon: LineChart },
    { id: "gastos", label: t("Gastos", "Spending"), icon: BarChart3 },
    { id: "portafolio", label: t("Portafolio", "Portfolio"), icon: TrendingUp },
    { id: "cashflow", label: "40/40/20", icon: Wallet },
    { id: "lifeplanner", label: "Life Planner", icon: Route },
    { id: "nextcity", label: t("Your next city", "Your next city"), icon: Globe },
    { id: "whatsyournumber", label: "WhatsYournumber", icon: Target },
  ] as const;

  const kpis: Record<(typeof views)[number]["id"], { kpi: string; delta: string; sub: string }> = {
    patrimonio: { kpi: "€248,300", delta: t("+6.4% este mes", "+6.4% this month"), sub: t("Patrimonio neto", "Net worth") },
    gastos: { kpi: "€2,940", delta: t("−11% vs. mes previo", "−11% vs. last month"), sub: t("Gasto variable + fijos", "Variable + fixed spending") },
    portafolio: { kpi: "+18.2%", delta: t("vs. S&P 500 +12.1%", "vs. S&P 500 +12.1%"), sub: t("Rentabilidad anualizada", "Annualized return") },
    cashflow: { kpi: "€2,000", delta: t("40% ahorro/inversión", "40% save/invest"), sub: t("Cash flow mensual", "Monthly cash flow") },
    lifeplanner: { kpi: "12.4", delta: t("años hasta el retiro", "years to retirement"), sub: t("Con todas tus decisiones", "With all your decisions") },
    nextcity: { kpi: "Madrid", delta: "87/100", sub: t("Tu top ciudad ahora", "Your top city now") },
    whatsyournumber: { kpi: "€1.50M", delta: t("al 8% anual", "at 8% yearly"), sub: t("Tu número de libertad", "Your freedom number") },
  };

  const insights = [
    {
      icon: Sparkles,
      text: t("Detecté 3 suscripciones sin uso: ahorras $84/mes.", "I found 3 unused subscriptions: you save $84/mo."),
    },
    {
      icon: FileText,
      text: t("142 movimientos clasificados desde tu PDF en 9 segundos.", "142 transactions classified from your PDF in 9 seconds."),
    },
    {
      icon: TrendingUp,
      text: t("Si mantienes este ritmo, llegas a tu número 2 años antes.", "At this pace, you reach your number 2 years earlier."),
    },
  ];

  const [active, setActive] = useState<(typeof views)[number]["id"]>("patrimonio");
  const [insight, setInsight] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((cur) => {
        const i = views.findIndex((v) => v.id === cur);
        return views[(i + 1) % views.length]!.id;
      });
      setInsight((i) => (i + 1) % insights.length);
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = views.find((v) => v.id === active)!;
  const kpi = kpis[active];
  const Insight = insights[insight]!;

  const allocation = [
    { name: t("ETFs", "ETFs"), v: 46 },
    { name: t("Acciones", "Stocks"), v: 24 },
    { name: t("Cripto", "Crypto"), v: 12 },
    { name: t("Efectivo", "Cash"), v: 18 },
  ];

  return (
    <div className="surface glow relative overflow-hidden p-4 md:p-6">
      <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {views.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setActive(v.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                active === v.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-elevated text-muted-foreground hover:bg-elevated/80 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          );
        })}
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-[11px] text-muted-foreground md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          {t("En vivo", "Live")}
        </span>
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={view.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <p className="numeric mt-1 text-3xl font-semibold tracking-tight">{kpi.kpi}</p>
              <p className={cn("mt-1 text-xs", active === "gastos" || active === "lifeplanner" ? "text-primary" : "text-positive")}>
                {kpi.delta}
              </p>

              <div className="mt-4 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  {active === "patrimonio" ? (
                    <AreaChart data={netWorth}>
                      <defs>
                        <linearGradient id="pp-net" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "var(--color-foreground)" }}
                        formatter={(v) => [`€${v}k`, t("Patrimonio", "Net worth")]}
                      />
                      <Area type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#pp-net)" />
                    </AreaChart>
                  ) : active === "gastos" ? (
                    <BarChart data={spend}>
                      <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "var(--color-foreground)" }}
                        formatter={(v) => [`€${v}k`, t("Gasto", "Spending")]}
                      />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
                      <Bar dataKey="c" radius={[6, 6, 0, 0]} fill="var(--color-muted-foreground)" opacity={0.25} />
                    </BarChart>
                  ) : active === "portafolio" ? (
                    <ReLineChart data={portfolio}>
                      <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "var(--color-foreground)" }}
                      />
                      <Line type="monotone" dataKey="you" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} name={t("Tú", "You")} />
                      <Line type="monotone" dataKey="spy" stroke="var(--color-muted-foreground)" strokeWidth={2} strokeDasharray="4 4" dot={false} name="S&P 500" />
                    </ReLineChart>
                  ) : active === "cashflow" ? (
                    <BarChart data={cashFlowData} layout="vertical">
                      <XAxis type="number" hide domain={[0, 40]} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {cashFlowData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : active === "lifeplanner" ? (
                    <div className="grid h-full grid-cols-2 gap-3">
                      {lifeGoals.map((goal, i) => (
                        <motion.div
                          key={goal.title}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className={cn(
                            "flex flex-col justify-between rounded-xl p-3 ring-1",
                            goal.color === "positive"
                              ? "bg-positive/10 ring-positive/20"
                              : "bg-negative/10 ring-negative/20",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {goal.title.includes("empresa") || goal.titleEn.includes("company") ? <Building className="h-3.5 w-3.5" /> : goal.title.includes("Aleph") ? <Briefcase className="h-3.5 w-3.5" /> : goal.title.includes("Viajes") || goal.titleEn.includes("trips") ? <Plane className="h-3.5 w-3.5" /> : <Baby className="h-3.5 w-3.5" />}
                            <span className="text-xs font-medium">{t(goal.title, goal.titleEn)}</span>
                          </div>
                          <div className="mt-2">
                            <p className={cn("numeric text-lg font-semibold", goal.color === "positive" ? "text-positive" : "text-negative")}>
                              {goal.value}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{t(goal.impact, goal.impactEn)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : active === "nextcity" ? (
                    <div className="flex h-full flex-col justify-between gap-3">
                      {cities.map((city, i) => (
                        <motion.div
                          key={city.name}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-center gap-3 rounded-xl bg-background/50 p-3 ring-1 ring-border"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{city.name}</span>
                              <span className="numeric rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{city.score}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {t(city.tag, city.tagEn)} · {city.cost}/mes
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <AreaChart data={retirement}>
                      <defs>
                        <linearGradient id="pp-ret" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "var(--color-foreground)" }}
                        formatter={(v) => [`€${v}k`, t("Capital", "Capital")]}
                      />
                      <Area type="monotone" dataKey="v" stroke="var(--color-positive)" strokeWidth={2.5} fill="url(#pp-ret)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 rounded-xl bg-background/50 p-3 ring-1 ring-border">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Bot className="h-3.5 w-3.5 text-primary" />
              {t("AI Advisor", "AI Advisor")}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={insight}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="mt-1.5 flex items-start gap-2 text-xs text-foreground"
              >
                <Insight.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {Insight.text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="wait">
            {active === "gastos" ? (
              <motion.div
                key="spend-breakdown"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">{t("Distribución del mes", "This month's breakdown")}</p>
                <div className="mt-2 h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={spendCategories} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2} stroke="none">
                        {spendCategories.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {spendCategories.map((a) => (
                    <li key={a.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                      {a.name}
                      <span className="numeric ml-auto text-foreground">{a.value}%</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : active === "cashflow" ? (
              <motion.div
                key="cashflow-summary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">{t("Flujo del mes", "Monthly flow")}</p>
                <div className="mt-3 space-y-3">
                  {[
                    { label: t("Necesidades", "Needs"), value: "€2,000", pct: "40%", color: "bg-primary" },
                    { label: t("Ahorro + Inversión", "Save + Invest"), value: "€2,000", pct: "40%", color: "bg-positive" },
                    { label: t("Deseos", "Wants"), value: "€1,000", pct: "20%", color: "bg-chart-3" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="numeric text-foreground">{row.value}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium text-primary-foreground", row.color)}>{row.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-background/50 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">{t("Ingreso mensual", "Monthly income")}</p>
                  <p className="numeric mt-1 text-xl font-semibold">€5,000</p>
                </div>
              </motion.div>
            ) : active === "lifeplanner" ? (
              <motion.div
                key="life-progress"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">{t("Impacto en tu retiro", "Impact on your retirement")}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-background/50 p-2.5 text-xs">
                    <span className="text-muted-foreground">{t("Sin decisiones", "Without decisions")}</span>
                    <span className="numeric font-medium">10.1 {t("años", "years")}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background/50 p-2.5 text-xs">
                    <span className="text-muted-foreground">{t("Con decisiones", "With decisions")}</span>
                    <span className="numeric font-medium text-negative">12.4 {t("años", "years")}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-positive/10 p-2.5 text-xs ring-1 ring-positive/20">
                    <span className="text-positive">{t("Ahorro si vendes tu empresa", "Savings if you sell your company")}</span>
                    <span className="numeric font-medium text-positive">−3.4 {t("años", "years")}</span>
                  </div>
                </div>
              </motion.div>
            ) : active === "nextcity" ? (
              <motion.div
                key="city-score"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">{t("Your North Score", "Your North Score")}</p>
                <div className="mt-3 flex items-center justify-center">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-background/50 ring-1 ring-border">
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - 87 / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="numeric text-3xl font-semibold text-primary">87</p>
                      <p className="text-[10px] text-muted-foreground">Madrid</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  {[
                    { label: t("Finanzas", "Finances"), score: "28/30" },
                    { label: t("Calidad vida", "Quality of life"), score: "22/25" },
                    { label: t("Seguridad", "Safety"), score: "13/15" },
                    { label: t("Trabajo", "Work"), score: "10/10" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-background/50 p-2">
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      <p className="numeric text-xs font-medium">{s.score}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : active === "whatsyournumber" ? (
              <motion.div
                key="number-table"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">{t("Proyección de retiro", "Retirement projection")}</p>
                <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-border">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-background/50 text-muted-foreground">
                        <th className="px-2 py-1.5 text-left font-medium">{t("Año", "Year")}</th>
                        <th className="px-2 py-1.5 text-right font-medium">{t("Capital", "Capital")}</th>
                        <th className="px-2 py-1.5 text-right font-medium">{t("Mes", "Monthly")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retirementTable.map((row) => (
                        <tr key={row.year} className="border-t border-border/50">
                          <td className="px-2 py-1.5 text-foreground">{row.year}</td>
                          <td className="numeric px-2 py-1.5 text-right text-foreground">{row.capital}</td>
                          <td className="numeric px-2 py-1.5 text-right text-positive">{row.monthly}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="allocation"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">{t("Asignación de activos", "Asset allocation")}</p>
                <div className="mt-2 h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={allocation} dataKey="v" innerRadius={36} outerRadius={56} paddingAngle={3} stroke="none">
                        {allocation.map((entry, i) => (
                          <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {allocation.map((a, i) => (
                    <li key={a.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                      {a.name}
                      <span className="numeric ml-auto text-foreground">{a.v}%</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              {t("Progreso hacia tu número", "Progress to your number")}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "38%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="numeric text-foreground">€248K</span>
              <span>38%</span>
              <span className="numeric text-foreground">€1.50M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
