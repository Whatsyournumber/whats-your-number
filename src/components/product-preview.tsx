import { useEffect, useRef, useState } from "react";
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
  YAxis,
} from "recharts";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Home,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { lifestyleCities } from "@/lib/lifestyle-cities";
import { useT } from "@/hooks/use-language";

const mortgage = [
  { m: "2026", interes: 8.6, capital: 4.6 },
  { m: "2029", interes: 7.6, capital: 5.6 },
  { m: "2032", interes: 6.3, capital: 6.9 },
  { m: "2035", interes: 4.8, capital: 8.4 },
  { m: "2038", interes: 3.0, capital: 10.2 },
  { m: "2041", interes: 1.2, capital: 12.0 },
];


const spend = [
  { m: "Ene", v: 3.2, i: 5.4 },
  { m: "Feb", v: 2.8, i: 5.4 },
  { m: "Mar", v: 3.6, i: 5.9 },
  { m: "Abr", v: 3.1, i: 5.4 },
  { m: "May", v: 2.6, i: 5.4 },
  { m: "Jun", v: 2.9, i: 6.2 },
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

const spendCategories = [
  { name: "Mercado", value: 32, color: "var(--color-primary)" },
  { name: "Restaurantes", value: 18, color: "var(--color-chart-2)" },
  { name: "Nightlife", value: 14, color: "var(--color-chart-3)" },
  { name: "Compras", value: 12, color: "var(--color-chart-4)" },
  { name: "Viajes", value: 10, color: "var(--color-chart-5)" },
  { name: "Transporte", value: 9, color: "var(--color-muted-foreground)" },
  { name: "App Marketing", value: 5, color: "var(--color-destructive)" },
];

const pieColors = [
  "var(--color-primary)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

const cityPhoto = (id: string) => lifestyleCities.find((c) => c.id === id)?.photo ?? "";

const cities = [
  {
    id: "madrid",
    name: "Madrid",
    score: 87,
    cost: "€2.8k",
    tag: "Base actual",
    tagEn: "Current base",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    score: 84,
    cost: "€2.9k",
    tag: "Costa y cultura",
    tagEn: "Coast and culture",
  },
  {
    id: "lisbon",
    name: "Lisboa",
    score: 82,
    cost: "€2.4k",
    tag: "Visa nómada",
    tagEn: "Nomad visa",
  },
];

const retirementTable = [
  { year: "2026", age: "38", capital: "€248k", monthly: "€1.7k" },
  { year: "2030", age: "42", capital: "€540k", monthly: "€3.6k" },
  { year: "2034", age: "46", capital: "€920k", monthly: "€6.1k" },
  { year: "2038", age: "50", capital: "€1.50M", monthly: "€10.0k" },
];

export function ProductPreview() {
  const t = useT();

  const views = [
    { id: "portafolio", label: t("Portafolio", "Portfolio"), icon: TrendingUp },
    { id: "gastos", label: t("Análisis de gasto", "Spending analysis"), icon: BarChart3 },
    { id: "hipoteca", label: t("Tu hipoteca", "Your mortgage"), icon: Home },
    { id: "nextcity", label: t("Your next city", "Your next city"), icon: Globe },
    { id: "whatsyournumber", label: "WhatsYournumber", icon: Target },
  ] as const;

  const kpis: Record<(typeof views)[number]["id"], { kpi: string; delta: string; sub: string }> = {
    hipoteca: {
      kpi: "€104,074",
      delta: t("Ahorras €49.606 abonando €500/mes", "Save €49,606 paying €500/mo extra"),
      sub: t("Interés total que pagarás", "Total interest you'll pay"),
    },
    gastos: {
      kpi: "€2,940",
      delta: t("−11% vs. mes previo", "−11% vs. last month"),
      sub: t("Análisis de gasto del mes", "This month's spending analysis"),
    },
    portafolio: {
      kpi: "+18.2%",
      delta: t("vs. S&P 500 +12.1%", "vs. S&P 500 +12.1%"),
      sub: t("Rentabilidad anualizada", "Annualized return"),
    },
    nextcity: {
      kpi: "Madrid",
      delta: "87/100",
      sub: t("Your next city", "Your next city"),
    },
    whatsyournumber: {
      kpi: "€1.50M",
      delta: t("al 8% anual", "at 8% yearly"),
      sub: t("Tu número de libertad", "Your freedom number"),
    },
  };

  const insights: Record<(typeof views)[number]["id"], { icon: typeof Sparkles; text: string }> = {
    portafolio: {
      icon: TrendingUp,
      text: t(
        "Tu cartera supera al S&P 500 en 6.1 pts: el 46% en ETFs es lo que amortigua la volatilidad.",
        "Your portfolio beats the S&P 500 by 6.1 pts: the 46% in ETFs is what cushions volatility.",
      ),
    },
    gastos: {
      icon: Sparkles,
      text: t(
        "Detecté 3 suscripciones sin uso y un 18% en restaurantes: recortando ahí ahorras €84/mes.",
        "I found 3 unused subscriptions and 18% in restaurants: trimming there saves you €84/mo.",
      ),
    },
    hipoteca: {
      icon: Home,
      text: t(
        "Abonando €500/mes al capital pagas €49.606 menos en intereses y terminas 4 años antes.",
        "Paying €500/mo extra to principal cuts €49,606 in interest and ends it 4 years sooner.",
      ),
    },
    nextcity: {
      icon: MapPin,
      text: t(
        "Lisboa cuesta €400/mes menos que Madrid: mudarte adelantaría tu número casi 1 año.",
        "Lisbon costs €400/mo less than Madrid: moving would pull your number forward almost a year.",
      ),
    },
    whatsyournumber: {
      icon: FileText,
      text: t(
        "Si mantienes este ritmo de ahorro, llegas a tu número 2 años antes de lo previsto.",
        "At this savings pace, you reach your number 2 years ahead of plan.",
      ),
    },
  };

  const [active, setActive] = useState<(typeof views)[number]["id"]>("portafolio");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (paused) return;
      setActive((cur) => {
        const i = views.findIndex((v) => v.id === cur);
        return views[(i + 1) % views.length]!.id;
      });
    }, 7000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    if (!paused) return;
    const resume = setTimeout(() => setPaused(false), 12000);
    return () => clearTimeout(resume);
  }, [paused]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => checkScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollTabs = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  const view = views.find((v) => v.id === active)!;
  const kpi = kpis[active];
  const Insight = insights[active];

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

      <div className="relative">
        <div
          ref={scrollRef}
          className="relative flex items-center gap-2 overflow-x-auto overflow-y-hidden px-8 pb-1 scrollbar-hide scroll-smooth md:px-0"
        >
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setActive(v.id);
                  setPaused(true);
                }}
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

        <button
          type="button"
          onClick={() => scrollTabs("left")}
          aria-label={t("Anterior", "Previous")}
          className={cn(
            "absolute left-1 top-1/2 z-10 -translate-y-1/2 md:hidden",
            "flex h-6 w-6 items-center justify-center rounded-full",
            "bg-card/70 text-muted-foreground/80 backdrop-blur-sm ring-1 ring-border/30",
            "transition-all duration-200",
            canScroll.left ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 pointer-events-none",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => scrollTabs("right")}
          aria-label={t("Siguiente", "Next")}
          className={cn(
            "absolute right-1 top-1/2 z-10 -translate-y-1/2 md:hidden",
            "flex h-6 w-6 items-center justify-center rounded-full",
            "bg-card/70 text-muted-foreground/80 backdrop-blur-sm ring-1 ring-border/30",
            "transition-all duration-200",
            canScroll.right ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 pointer-events-none",
          )}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
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
              <p
                className={cn(
                  "mt-1 text-xs",
                  active === "gastos" ? "text-primary" : "text-positive",
                )}
              >
                {kpi.delta}
              </p>

              <div className="mt-4 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  {active === "hipoteca" ? (
                    <BarChart data={mortgage} barGap={2}>
                      <XAxis
                        dataKey="m"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="var(--color-muted-foreground)"
                      />
                      <Tooltip
                        cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06, radius: 8 }}
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "var(--color-foreground)" }}
                        formatter={(v: number, n) => [
                          `€${Number(v).toFixed(1)}k`,
                          n === "interes" ? t("Intereses", "Interest") : t("Capital", "Principal"),
                        ]}
                      />
                      <Bar
                        dataKey="interes"
                        stackId="m"
                        fill="var(--color-destructive)"
                        opacity={0.85}
                      />
                      <Bar
                        dataKey="capital"
                        stackId="m"
                        radius={[6, 6, 0, 0]}
                        fill="var(--color-primary)"
                      />
                    </BarChart>
                  ) : active === "gastos" ? (
                    <BarChart data={spend} barGap={4}>
                      <XAxis
                        dataKey="m"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="var(--color-muted-foreground)"
                      />
                      <Tooltip
                        cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06, radius: 8 }}
                        content={({ active: on, payload, label }) => {
                          if (!on || !payload?.length) return null;
                          const row = payload[0]?.payload as { v: number; i: number } | undefined;
                          if (!row) return null;
                          return (
                            <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 shadow-xl backdrop-blur-md">
                              <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                {label}
                              </p>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="h-2 w-2 rounded-full bg-positive" />
                                  <span className="text-muted-foreground">
                                    {t("Ingreso", "Income")}
                                  </span>
                                  <span className="ml-auto font-semibold text-foreground">
                                    €{row.i.toFixed(1)}k
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="h-2 w-2 rounded-full bg-primary" />
                                  <span className="text-muted-foreground">
                                    {t("Gasto", "Spending")}
                                  </span>
                                  <span className="ml-auto font-semibold text-foreground">
                                    €{row.v.toFixed(1)}k
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="i"
                        radius={[6, 6, 0, 0]}
                        fill="var(--color-positive)"
                        opacity={0.35}
                      />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
                    </BarChart>
                  ) : active === "portafolio" ? (
                    <ReLineChart data={portfolio}>
                      <XAxis
                        dataKey="m"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="var(--color-muted-foreground)"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "var(--color-foreground)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="you"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        dot={false}
                        name={t("Tú", "You")}
                      />
                      <Line
                        type="monotone"
                        dataKey="spy"
                        stroke="var(--color-muted-foreground)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        name="S&P 500"
                      />
                    </ReLineChart>
                  ) : active === "nextcity" ? (
                    <div className="flex h-full flex-col gap-2.5">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          {t("Top city acorde con tu presupuesto", "Top city matching your budget")}
                        </p>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex-1 overflow-hidden rounded-2xl ring-1 ring-border"
                      >
                        <img
                          src={cityPhoto(cities[0]!.id)}
                          alt={cities[0]!.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
                        <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          #1 · Your next city
                        </span>
                        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-1.5 text-base font-semibold">
                              <MapPin className="h-4 w-4 text-primary" />
                              {cities[0]!.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {t(cities[0]!.tag, cities[0]!.tagEn)} · {cities[0]!.cost}/mes
                            </p>
                          </div>
                          <span className="numeric rounded-full bg-primary/15 px-2.5 py-1 text-sm font-semibold text-primary ring-1 ring-primary/30">
                            {cities[0]!.score}
                          </span>
                        </div>
                      </motion.div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {cities.slice(1).map((city, i) => (
                          <motion.div
                            key={city.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.08 }}
                            className="relative h-20 overflow-hidden rounded-xl ring-1 ring-border"
                          >
                            <img
                              src={cityPhoto(city.id)}
                              alt={city.name}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                            <div className="absolute inset-x-2.5 bottom-2 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold">{city.name}</p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {city.cost}/mes
                                </p>
                              </div>
                              <span className="numeric rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                {city.score}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <AreaChart data={retirement}>
                      <defs>
                        <linearGradient id="pp-ret" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="m"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="var(--color-muted-foreground)"
                      />
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
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="var(--color-positive)"
                        strokeWidth={2.5}
                        fill="url(#pp-ret)"
                      />
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
                key={active}
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
                <p className="text-xs text-muted-foreground">
                  {t("Distribución del mes", "This month's breakdown")}
                </p>
                <div className="mt-2 h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={spendCategories}
                        dataKey="value"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {spendCategories.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {spendCategories.map((a) => (
                    <li
                      key={a.name}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                      {a.name}
                      <span className="numeric ml-auto text-foreground">{a.value}%</span>
                    </li>
                  ))}
                </ul>
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
              <p className="text-xs text-muted-foreground">
                  {t("Your next city", "Your next city")}
                </p>
                <div className="mt-3 flex items-center justify-center">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-background/50 ring-1 ring-border">
                    <svg
                      className="absolute inset-0 h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="8"
                      />
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
            ) : active === "hipoteca" ? (
              <motion.div
                key="mortgage-summary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border"
              >
                <p className="text-xs text-muted-foreground">
                  {t("Simulador de hipoteca", "Mortgage simulator")}
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    { label: t("Monto pendiente", "Outstanding balance"), value: "€160,000" },
                    { label: t("Tasa · plazo", "Rate · term"), value: "5.5% · 20a" },
                    { label: t("Pago mensual", "Monthly payment"), value: "€1,101" },
                    { label: t("Libre de hipoteca", "Mortgage-free"), value: "oct 2037", accent: true },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span
                        className={cn(
                          "numeric font-medium",
                          row.accent ? "text-primary" : "text-foreground",
                        )}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {t(
                    "Abonar €500/mes te libera 8 años y 10 meses antes.",
                    "Paying €500/mo extra frees you 8 years 10 months earlier.",
                  )}
                </p>
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
                <p className="text-xs text-muted-foreground">
                  {t("Proyección de retiro", "Retirement projection")}
                </p>
                <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-border">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-background/50 text-muted-foreground">
                        <th className="px-2 py-1.5 text-left font-medium">{t("Año", "Year")}</th>
                        <th className="px-2 py-1.5 text-right font-medium">
                          {t("Capital", "Capital")}
                        </th>
                        <th className="px-2 py-1.5 text-right font-medium">
                          {t("Mes", "Monthly")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {retirementTable.map((row) => (
                        <tr key={row.year} className="border-t border-border/50">
                          <td className="px-2 py-1.5 text-foreground">{row.year}</td>
                          <td className="numeric px-2 py-1.5 text-right text-foreground">
                            {row.capital}
                          </td>
                          <td className="numeric px-2 py-1.5 text-right text-positive">
                            {row.monthly}
                          </td>
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
                <p className="text-xs text-muted-foreground">
                  {t("Asignación de activos", "Asset allocation")}
                </p>
                <div className="mt-2 h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={allocation}
                        dataKey="v"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {allocation.map((entry, i) => (
                          <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {allocation.map((a, i) => (
                    <li
                      key={a.name}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: pieColors[i % pieColors.length] }}
                      />
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
