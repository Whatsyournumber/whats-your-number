import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage, useT } from "@/hooks/use-language";
import { translateCategory, translateFixedName } from "@/lib/i18n-data";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { buildTravelDays, categorizeTxWithTravel } from "@/lib/categorize";
import { money } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";

export const Route = createFileRoute("/cash-flow")({
  head: () => ({
    meta: [
      { title: "Money Distribution — WhatsYournumber" },
      {
        name: "description",
        content: "Tu flujo real mes a mes: ingresos de los EEFF cargados hacia gastos fijos, lifestyle, inversiones y flujo libre.",
      },
      { property: "og:title", content: "Money Distribution — WhatsYournumber" },
      { property: "og:description", content: "Visualiza a dónde fluye cada dólar de tus ingresos cada mes, con datos reales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CashFlow,
});

const MONTH_LABELS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(d: string) {
  return d.slice(0, 7);
}

function buildMonthLabel(labels: string[]) {
  return (key: string) => {
    const [y, m] = key.split("-");
    return `${labels[Number(m) - 1] ?? m} ${y}`;
  };
}

function CashFlow() {
  const t = useT();
  const { lang } = useLanguage();
  const monthLabel = useMemo(() => buildMonthLabel(lang === "en" ? MONTH_LABELS_EN : MONTH_LABELS_ES), [lang]);
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const { transactions, hasData } = useTransactions();
  const fixed = useFixedExpenses();
  const { rules } = useCategories();

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) if (t.tx_date) set.add(monthKey(t.tx_date));
    return [...set].sort().reverse();
  }, [transactions]);

  const [month, setMonth] = useState<string | null>(null);
  const activeMonth = month && months.includes(month) ? month : (months[0] ?? null);

  const monthTx = useMemo(
    () => (activeMonth ? transactions.filter((t) => t.tx_date && monthKey(t.tx_date) === activeMonth) : []),
    [transactions, activeMonth],
  );

  const fmt = d.fmt;

  // Ingresos reales: abonos de los EEFF del mes; si no hay, se usa el perfil.
  const incomeFromStatements = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of monthTx) {
      if (tx.amount <= 0) continue;
      const key = tx.merchant?.trim() || t("Otros ingresos", "Other income");
      map.set(key, (map.get(key) ?? 0) + tx.amount);
    }
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTx]);

  const usingStatements = hasData && monthTx.length > 0 && incomeFromStatements.length > 0;
  const incomeLines = usingStatements ? incomeFromStatements : d.cashFlow.income;
  const totalIncome = incomeLines.reduce((s, i) => s + i.amount, 0) || d.income || 1;

  // Necesidades: Vivienda/Renta, Hipoteca, Condominio, Alimentos/Mercado, Transporte, Servicios, Salud, Educación.
  // Deseos: Viajes, Restaurantes, Entretenimiento/Salidas, Compras, Tecnología/Apps, Hobbies/Lifestyle.
  const NEED_CATS = new Set([
    "Vivienda",
    "Hipoteca",
    "Renta",
    "Alquiler",
    "Condominio",
    "Alimentos",
    "Alimentación",
    "Mercado",
    "Transporte",
    "Servicios",
    "Hogar",
    "Salud",
    "Educación",
    "Seguro médico",
    "Seguro de salud",
  ]);
  const WANT_CATS = new Set([
    "Viajes",
    "Restaurantes",
    "Delivery",
    "Entretenimiento",
    "Ocio",
    "Salidas",
    "Nightlife",
    "Deportes",
    "Gimnasio",
    "Compras",
    "Ropa",
    "Tecnología",
    "Tecnologia",
    "Apps",
    "Suscripciones",
    "Hobbies",
    "Lifestyle",
    "Belleza",
    "Regalos",
    "Mascotas",
  ]);
  const isWant = (cat: string) => WANT_CATS.has(cat) || /viaje|restaur|delivery|ocio|salida|night|deporte|gym|gimnasio|compra|ropa|tecnolog|app|suscrip|hobb|lifestyle|belleza|regalo|mascota|entreten/i.test(cat);

  const travelDays = useMemo(() => buildTravelDays(monthTx as Tx[], rules), [monthTx, rules]);
  const spend = useMemo(() => {
    let wants = 0;
    let needs = 0;
    const needsBy = new Map<string, number>();
    const wantsBy = new Map<string, number>();
    for (const tx of monthTx) {
      if (tx.amount >= 0) continue;
      const cat = categorizeTxWithTravel(tx as Tx, rules, travelDays);
      const v = Math.abs(tx.amount);
      if (isWant(cat)) {
        wants += v;
        wantsBy.set(cat, (wantsBy.get(cat) ?? 0) + v);
      } else {
        // necesidades + lo no clasificado (se considera necesidad por defecto)
        needs += v;
        const key = NEED_CATS.has(cat) ? cat : t("Otros", "Other");
        needsBy.set(key, (needsBy.get(key) ?? 0) + v);
      }
    }
    return { wants, needs, total: wants + needs, needsBy, wantsBy };
  }, [monthTx, rules, travelDays]);

  const hasReal = hasData && monthTx.length > 0;

  // Ahorro explícito dentro de los gastos fijos (p. ej. «Fondo de ahorro»).
  const savingItems = useMemo(
    () => fixed.items.filter((i) => /ahorro|inver|saving|invest/i.test(i.name)),
    [fixed.items],
  );
  const activeFixedItems = useMemo(
    () => fixed.items.filter((i) => !/ahorro|inver|saving|invest/i.test(i.name) && (i.amount || 0) > 0),
    [fixed.items],
  );
  // Gastos fijos de estilo de vida (gimnasio, streaming, ocio…) suman a Deseos, no a Necesidades.
  const FIXED_WANT_RE = /gym|gimnasio|netflix|spotify|hbo|disney|prime|streaming|suscrip|club|padel|pádel|golf|ocio|viaje|hobby|hobbies|lifestyle|belleza|peluquer|mascota/i;
  const wantFixedItems = useMemo(() => activeFixedItems.filter((i) => FIXED_WANT_RE.test(i.name)), [activeFixedItems]);
  const needFixedItems = useMemo(() => activeFixedItems.filter((i) => !FIXED_WANT_RE.test(i.name)), [activeFixedItems]);
  const fixedSavings = savingItems.reduce((s, i) => s + (i.amount || 0), 0);
  const fixedNeeds = needFixedItems.reduce((s, i) => s + (i.amount || 0), 0);
  const fixedWants = wantFixedItems.reduce((s, i) => s + (i.amount || 0), 0);

  // Aporte mensual al fondo de retiro (misma fuente que la pestaña «Fondo de retiro»).
  const retirementContribution = Math.max(0, Math.round(d.retirement.monthlyContribution || 0));

  // Necesidades = gastos fijos de necesidad + gastos variables de necesidad.
  const fixedAmount = hasReal ? fixedNeeds + spend.needs : d.cashFlow.buckets[0]!.amount;
  // Deseos / lifestyle = gastos variables de deseo + gastos fijos de lifestyle.
  const lifestyleAmount = hasReal ? spend.wants + fixedWants : d.cashFlow.buckets[1]!.amount;
  // El bucket de inversión usa el ahorro real de tus gastos fijos (p. ej. «Progreso» 2.500/mes).
  // Solo si no hay partida de ahorro fija se usa el aporte estimado del fondo de retiro.
  const useFixedSavings = hasReal && fixedSavings > 0;
  const investAmount = useFixedSavings
    ? fixedSavings
    : hasReal
      ? retirementContribution
      : Math.max(d.cashFlow.buckets[2]!.amount, retirementContribution);

  const freeAmount = Math.max(0, totalIncome - fixedAmount - lifestyleAmount - investAmount);

  const buckets = [
    { name: t("Necesidades", "Needs"), amount: fixedAmount, color: "var(--color-chart-2)" },
    { name: t("Deseos / lifestyle", "Wants / lifestyle"), amount: lifestyleAmount, color: "var(--color-chart-3)" },
    { name: t("Inversiones / ahorro", "Investments / savings"), amount: investAmount, color: "var(--color-chart-1)" },
    { name: t("Flujo libre", "Free flow"), amount: freeAmount, color: "var(--color-chart-4)" },
  ];

  // Regla 40/40/20 con la misma data del mes, presentada como Necesidades → Inversión → Deseos.
  const needsAmount = fixedAmount;
  const wantsAmount = lifestyleAmount;
  const saveAmount = investAmount + freeAmount;


  const needsBreakdown = hasReal
    ? [
        ...needFixedItems.map((i) => ({ label: `${translateFixedName(i.name, lang)} (${t("fijo", "fixed")})`, amount: i.amount })),
        ...[...spend.needsBy.entries()].map(([label, amount]) => ({ label: translateCategory(label, lang), amount })),
      ].sort((a, b) => b.amount - a.amount)
    : [];
  const wantsBreakdown = hasReal
    ? [
        ...wantFixedItems.map((i) => ({ label: `${translateFixedName(i.name, lang)} (${t("fijo", "fixed")})`, amount: i.amount })),
        ...[...spend.wantsBy.entries()].map(([label, amount]) => ({ label: translateCategory(label, lang), amount })),
      ].sort((a, b) => b.amount - a.amount)
    : [];

  const saveBreakdown = hasReal
    ? [
        ...(useFixedSavings
          ? savingItems.map((i) => ({ label: `${translateFixedName(i.name, lang)} (${t("fijo", "fixed")})`, amount: i.amount }))
          : [{ label: t("Fondo de retiro (aporte mensual)", "Retirement fund (monthly contribution)"), amount: retirementContribution }]),
        { label: t("Flujo libre del mes", "Free flow this month"), amount: freeAmount },
      ].sort((a, b) => b.amount - a.amount)
    : [];


  const cash = profile.assets_cash + profile.assets_bank;
  const monthlySpend = hasReal ? fixedNeeds + fixedWants + spend.total : d.expenses;
  const runway = monthlySpend > 0 ? cash / monthlySpend : 0;

  return (
    <TooltipProvider delayDuration={150}>
      <PageShell>
        <PageHeader
          eyebrow={activeMonth ? monthLabel(activeMonth) : t("Sin EEFF cargados", "No statements uploaded")}
          title={t("Distribución del dinero", "Money Distribution")}
          subtitleClassName="sm:whitespace-nowrap"
          subtitle={
            <>
              <span className="hidden sm:inline">
                {t("Cómo se reparte cada dólar: rule of money (40 | 40 | 20), según tus EEFF cargados.", "How every dollar is split: rule of money (40 | 40 | 20), per your statements.")}
              </span>
              <span className="sm:hidden">
                {t("Cómo se reparte cada dólar: rule of money (40 | 40 | 20).", "How every dollar is split: rule of money (40 | 40 | 20).")}
              </span>
            </>
          }
        />

      {months.length > 0 && (
        <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5">
          <span className="shrink-0 text-xs text-muted-foreground">{t("Mes:", "Month:")}</span>
          {months.slice(0, 12).map((m) => (
            <button
              key={m}
              onClick={() => setMonth(m)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] leading-none transition ${
                m === activeMonth
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("Ingresos", "Income")}
          value={fmt(totalIncome)}
          hint={usingStatements ? t("Abonos de tus EEFF", "Credits from your statements") : t("Según tu perfil", "Based on your profile")}
          tooltip={<BreakdownTooltip items={incomeLines.slice(0, 8).map((i) => ({ label: i.name, amount: i.amount }))} fmt={fmt} total={totalIncome} />}
          accent
          index={0}
        />
        <KpiCard
          label={t("Necesidades", "Needs")}
          value={fmt(buckets[0]!.amount)}
          hint={`${((buckets[0]!.amount / totalIncome) * 100).toFixed(0)}% ${t("del ingreso", "of income")}`}
          tooltip={<BreakdownTooltip items={needsBreakdown} fmt={fmt} total={buckets[0]!.amount} />}
          index={1}
        />
        <KpiCard
          label={t("Ahorro / inversiones", "Savings / investments")}
          value={fmt(buckets[2]!.amount)}
          hint={`${((buckets[2]!.amount / totalIncome) * 100).toFixed(0)}% ${t("del ingreso", "of income")}`}
          tooltip={<BreakdownTooltip items={saveBreakdown} fmt={fmt} total={buckets[2]!.amount} />}
          index={2}
        />
        <KpiCard
          label={t("Deseos / lifestyle", "Wants / lifestyle")}
          value={fmt(buckets[1]!.amount)}
          hint={`${((buckets[1]!.amount / totalIncome) * 100).toFixed(0)}% ${t("del ingreso", "of income")}`}
          tooltip={<BreakdownTooltip items={wantsBreakdown} fmt={fmt} total={buckets[1]!.amount} />}
          index={3}
        />
      </div>

      <Panel title={t("Flujo de dinero", "Money flow")} description={t("Ingresos → destino final", "Income → final destination")}>
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1.3fr)]">
          <div className="space-y-3">
            {incomeLines.slice(0, 8).map((i, idx) => (
              <motion.div
                key={i.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl border border-border bg-elevated/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <p className="numeric text-sm font-semibold">{fmt(i.amount)}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (i.amount / totalIncome) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
            {incomeLines.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("No encontramos abonos en este periodo.", "We did not find credits for this period.")}</p>
            )}
          </div>

          <div className="relative hidden h-64 lg:block">
            <svg viewBox="0 0 120 260" className="h-full w-full" preserveAspectRatio="none">
              {buckets.map((b, i) => {
                const y = 30 + i * 66;
                const w = Math.max(6, (b.amount / totalIncome) * 60);
                return (
                  <motion.path
                    key={b.name}
                    d={`M0,130 C60,130 60,${y} 120,${y}`}
                    fill="none"
                    stroke={b.color}
                    strokeWidth={w}
                    strokeOpacity={0.35}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="space-y-3">
            {buckets.map((b, idx) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="rounded-2xl border border-border bg-elevated/60 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="numeric ml-auto text-sm font-semibold">{fmt(b.amount)}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (b.amount / totalIncome) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: b.color }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {((b.amount / totalIncome) * 100).toFixed(0)}% {t("de tus ingresos", "of your income")}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="hidden lg:block" title={t("Regla 40 / 40 / 20", "40 / 40 / 20 rule")} description={t("Distribución ideal de tu ingreso", "Ideal income distribution")}>
          <div className="space-y-3 text-sm">
            <Row
              label={t("Necesidades", "Needs")}
              value={needsAmount}
              total={totalIncome}
              target={40}
              fmt={fmt}
              legend={t("Vivienda, hipoteca, alquiler, mercado, transporte, servicios, salud y educación.", "Housing, mortgage, rent, groceries, transport, utilities, health and education.")}
            />
            <Row
              label={t("Ahorro & inversiones", "Savings & investing")}
              value={saveAmount}
              total={totalIncome}
              target={40}
              fmt={fmt}
              goodWhenHigher
              legend={t("Ahorro programado, fondos de inversión, ETF, bolsa, cripto y flujo libre ahorrado.", "Scheduled savings, investment funds, ETFs, stocks, crypto and free cash saved.")}
            />
            <Row
              label={t("Deseos", "Wants")}
              value={wantsAmount}
              total={totalIncome}
              target={20}
              fmt={fmt}
              legend={t("Viajes, restaurantes, salidas, compras, tecnología, apps, hobbies y lifestyle.", "Travel, dining out, entertainment, shopping, technology, apps, hobbies and lifestyle.")}
            />
          </div>
        </Panel>
        <Panel title={t("Runway", "Runway")} description={t("Meses cubiertos con tu efectivo", "Months covered with your cash")}>
          <p className="numeric text-4xl font-semibold text-primary">{runway.toFixed(1)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Con", "With")} {money(cash, d.currency)} {t("en efectivo y un gasto de", "in cash and a spend of")} {fmt(monthlySpend)} {t("al mes.", "per month.")}
          </p>
        </Panel>
        <Panel title={t("Eficiencia del flujo", "Flow efficiency")} description={t("Patrimonio construido cada mes", "Net worth built each month")}>
          <p className="numeric text-4xl font-semibold">
            {totalIncome > 0 ? ((saveAmount / totalIncome) * 100).toFixed(0) : "0"}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {fmt(saveAmount)} {t("de cada mes termina construyendo patrimonio.", "each month ends up building net worth.")}
          </p>
        </Panel>
      </div>
    </PageShell>
    </TooltipProvider>
  );
}

function Row({
  label,
  value,
  total,
  target,
  fmt,
  goodWhenHigher = false,
  legend,
}: {
  label: string;
  value: number;
  total: number;
  target: number;
  fmt: (n: number) => string;
  goodWhenHigher?: boolean;
  legend?: string;
}) {
  const t = useT();
  const p = total > 0 ? (value / total) * 100 : 0;
  const off = p - target;
  const colorClass = goodWhenHigher
    ? p >= target
      ? "bg-positive"
      : "bg-negative"
    : off > 5
      ? "bg-negative"
      : "bg-primary";

  const legendItems = useMemo(() => {
    if (!legend) return [];
    return legend
      .split(/[.,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [legend]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1.5 text-muted-foreground">
              {label}
              {legend && <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />}
            </span>
          </TooltipTrigger>
          {legend && (
            <TooltipContent side="top" className="max-w-[260px] p-0">
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <span className="numeric text-xs font-medium text-primary">{p.toFixed(0)}% / {target}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {fmt(value)} {t("actual", "actual")}
                </p>
                <ul className="space-y-1 border-t border-border/50 pt-2">
                  {legendItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
        <span className="numeric flex shrink-0 items-baseline gap-2 whitespace-nowrap">
          <span className="font-medium">{fmt(value)}</span>
          <span>
            {p.toFixed(0)}% <span className="text-xs text-muted-foreground">/ {target}%</span>
          </span>
        </span>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
    </div>
  );
}

function BreakdownTooltip({
  items,
  fmt,
  total,
}: {
  items: { label: string; amount: number }[];
  fmt: (n: number) => string;
  total: number;
}) {
  const t = useT();
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {fmt(total)} {t("actual", "actual")}
      </p>
      {items.length > 0 && (
        <ul className="space-y-1 border-t border-border/50 pt-2">
          {items.slice(0, 8).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="flex-1 leading-relaxed">{item.label}</span>
              <span className="numeric shrink-0 text-xs">{fmt(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
