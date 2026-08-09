import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useLanguage, useT } from "@/hooks/use-language";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { useCategories } from "@/hooks/use-categories";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { categorizeTx } from "@/lib/categorize";
import { money } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";

export const Route = createFileRoute("/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash Flow — WhatsYournumber" },
      {
        name: "description",
        content: "Tu flujo real mes a mes: ingresos de los EEFF cargados hacia gastos fijos, lifestyle, inversiones y flujo libre.",
      },
      { property: "og:title", content: "Cash Flow — WhatsYournumber" },
      { property: "og:description", content: "Visualiza a dónde fluye cada dólar de tus ingresos cada mes, con datos reales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

  // Gasto variable real del mes, separado en necesidades vs deseos.
  const WANT_CATS = new Set(["Restaurantes", "Salidas", "Compras", "Viajes", "Lifestyle", "Apps"]);
  const spend = useMemo(() => {
    let wants = 0;
    let needs = 0;
    for (const tx of monthTx) {
      if (tx.amount >= 0) continue;
      const cat = categorizeTx(tx as Tx, rules);
      const v = Math.abs(tx.amount);
      if (WANT_CATS.has(cat)) wants += v;
      else needs += v;
    }
    return { wants, needs, total: wants + needs };
  }, [monthTx, rules]);

  const hasReal = hasData && monthTx.length > 0;

  // Ahorro explícito dentro de los gastos fijos (p. ej. «Fondo de ahorro»).
  const fixedSavings = useMemo(
    () => fixed.items.filter((i) => /ahorro|inver|saving|invest/i.test(i.name)).reduce((s, i) => s + (i.amount || 0), 0),
    [fixed.items],
  );
  const fixedNeeds = Math.max(0, fixed.total - fixedSavings);

  const fixedAmount = hasReal ? fixedNeeds + spend.needs : d.cashFlow.buckets[0]!.amount;
  const lifestyleAmount = hasReal ? spend.wants : d.cashFlow.buckets[1]!.amount;
  const investAmount = hasReal ? fixedSavings : d.cashFlow.buckets[2]!.amount;
  const freeAmount = Math.max(0, totalIncome - fixedAmount - lifestyleAmount - investAmount);

  const buckets = [
    { name: t("Gastos fijos", "Fixed expenses"), amount: fixedAmount, color: "var(--color-chart-2)" },
    { name: t("Lifestyle", "Lifestyle"), amount: lifestyleAmount, color: "var(--color-chart-3)" },
    { name: t("Inversiones / ahorro", "Investments / savings"), amount: investAmount, color: "var(--color-chart-1)" },
    { name: t("Flujo libre", "Free flow"), amount: freeAmount, color: "var(--color-chart-4)" },
  ];

  // Regla 50/30/20 con los números reales del mes.
  const needsAmount = fixedAmount;
  const wantsAmount = lifestyleAmount;
  const saveAmount = Math.max(0, totalIncome - needsAmount - wantsAmount);

  const cash = profile.assets_cash + profile.assets_bank;
  const monthlySpend = hasReal ? fixedNeeds + spend.total : d.expenses;
  const runway = monthlySpend > 0 ? cash / monthlySpend : 0;


  return (
    <PageShell>
      <PageHeader
        eyebrow={activeMonth ? monthLabel(activeMonth) : t("Sin EEFF cargados", "No statements uploaded")}
        title="Cash Flow"
        subtitle={
          hasReal
            ? t("Cómo se reparte cada dólar que entra, según tus estados de cuenta cargados.", "How every dollar you receive is allocated, based on your uploaded statements.")
            : t("Carga tus estados de cuenta en «Cargar EEFF» para ver tu flujo real. Mientras tanto, usamos tu perfil.", "Upload your statements in \u00abUpload statements\u00bb to see your real flow. Meanwhile, we use your profile.")
        }
      />

      {months.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("Mes:", "Month:")}</span>
          {months.slice(0, 12).map((m) => (
            <button
              key={m}
              onClick={() => setMonth(m)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
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
        <KpiCard label={t("Ingresos", "Income")} value={fmt(totalIncome)} hint={usingStatements ? t("Abonos de tus EEFF", "Credits from your statements") : t("Según tu perfil", "Based on your profile")} accent index={0} />
        <KpiCard
          label={t("Gastos fijos", "Fixed expenses")}
          value={fmt(buckets[0]!.amount)}
          hint={`${((buckets[0]!.amount / totalIncome) * 100).toFixed(0)}% ${t("del ingreso", "of income")}`}
          index={1}
        />
        <KpiCard label={t("Lifestyle", "Lifestyle")} value={fmt(buckets[1]!.amount)} hint={hasReal ? `${monthTx.length} ${t("movimientos", "transactions")}` : t("Según tu perfil", "Based on your profile")} index={2} />
        <KpiCard label={t("Flujo libre", "Free flow")} value={fmt(buckets[3]!.amount)} index={3} />
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

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title={t("Regla 50 / 30 / 20", "50 / 30 / 20 rule")}>
          <div className="space-y-3 text-sm">
            <Row label={t("Necesidades", "Needs")} value={buckets[0]!.amount} total={totalIncome} target={50} />
            <Row label={t("Deseos", "Wants")} value={buckets[1]!.amount} total={totalIncome} target={30} />
            <Row label={t("Ahorro e inversión", "Savings & investing")} value={buckets[2]!.amount + buckets[3]!.amount} total={totalIncome} target={20} />
          </div>
        </Panel>
        <Panel title={t("Runway", "Runway")} description={t("Meses cubiertos con tu efectivo", "Months covered with your cash")}>
          <p className="numeric text-4xl font-semibold text-primary">{runway.toFixed(1)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Con", "With")} {money(cash, d.currency)} {t("en efectivo y un gasto de", "in cash and a spend of")} {fmt(monthlySpend)} {t("al mes.", "per month.")}
          </p>
        </Panel>
        <Panel title={t("Eficiencia del flujo", "Flow efficiency")}>
          <p className="numeric text-4xl font-semibold">
            {(((buckets[2]!.amount + buckets[3]!.amount) / totalIncome) * 100).toFixed(0)}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("De cada dólar que ganas, esa porción termina construyendo patrimonio.", "Of every dollar you earn, that share ends up building net worth.")}
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}

function Row({ label, value, total, target }: { label: string; value: number; total: number; target: number }) {
  const p = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="numeric">
          {p.toFixed(0)}% <span className="text-xs text-muted-foreground">/ {target}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
    </div>
  );
}
