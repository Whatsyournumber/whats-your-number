import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, HelpCircle, Lightbulb, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage, useT } from "@/hooks/use-language";
import { translateCategory } from "@/lib/i18n-data";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useHoldings } from "@/hooks/use-holdings";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { sameMerchant, useTransactions, type Tx } from "@/hooks/use-transactions";
import { findBudgetCategory } from "@/lib/budget-categories";
import { buildTravelDays, categorizeTxWithTravel } from "@/lib/categorize";
import { buildDataset, projectRetirementFrom } from "@/lib/profile-data";

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
type MoneyBucket = "needs" | "savings" | "wants" | "excluded";
const MONEY_RULE_KEY = "whatsyournumber:money-rule-categories";
const EMPTY_BUCKETS: Record<string, MoneyBucket> = {};
const RETIREMENT_FUND_CATEGORY = "Fondo de retiro";

function cleanCategoryName(name: string) {
  return name.replace(/^\p{Extended_Pictographic}\s*/u, "").trim();
}

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
  const { user } = useAuth();
  const { lang } = useLanguage();
  const monthLabel = useMemo(() => buildMonthLabel(lang === "en" ? MONTH_LABELS_EN : MONTH_LABELS_ES), [lang]);
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const { transactions, hasData } = useTransactions();
  const { rules } = useCategories();
  const fixed = useFixedExpenses();
  const { holdings } = useHoldings();
  const { lines: budgetLines } = useSpendBudgets();
  const [ruleOpen, setRuleOpen] = useState(false);
  // Guardado en la cuenta: las mismas categorías en móvil, tablet y ordenador.
  const { value: categoryBuckets, save: saveCategoryBuckets } = useSyncedSetting<Record<string, MoneyBucket>>(
    MONEY_RULE_KEY,
    EMPTY_BUCKETS,
  );

  const setCategoryBucket = (category: string, bucket: MoneyBucket) => {
    saveCategoryBuckets({ ...categoryBuckets, [category]: bucket });
  };

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
  const isWant = (cat: string) =>
    WANT_CATS.has(cat) ||
    /viaje|restaur|delivery|ocio|salida|night|deporte|gym|gimnasio|compra|ropa|tecnolog|app|suscrip|hobb|lifestyle|belleza|regalo|mascota|entreten|pet|stay|whatsyournumber|marketing/i.test(cat);
  const isSaving = (cat: string) => /ahorro|inver|saving|invest|broker|etf|fondo|bolsa|crypto|cripto/i.test(cat);
  const defaultBucket = (cat: string): MoneyBucket => (isSaving(cat) ? "savings" : isWant(cat) ? "wants" : "needs");
  const bucketFor = (cat: string): MoneyBucket => categoryBuckets[cleanCategoryName(cat)] ?? defaultBucket(cat);

  // Categorías personalizadas del plan de gastos (con sus palabras clave) → se clasifican como deseos.
  const customWants = useMemo(
    () =>
      budgetLines
        .filter((l) => l.id.startsWith("custom:"))
        .map((l) => {
          const label = (l.label ?? l.id.slice(7)).trim();
          return {
            label,
            aliases: [label, ...(l.keywords ?? [])]
              .map((k) => k.trim().toLowerCase())
              .filter((k) => k.length > 2),
          };
        })
        .filter((c) => c.aliases.length > 0),
    [budgetLines],
  );

  const travelDays = useMemo(() => buildTravelDays(monthTx as Tx[], rules), [monthTx, rules]);
  const matchesFixed = useMemo(() => {
    const rows = fixed.items
      .filter((item) => Number(item.amount) > 0)
      .map((item) => ({ amount: Math.abs(Number(item.amount)).toFixed(2), name: item.name }));
    return (tx: Tx) => {
      const amount = Math.abs(Number(tx.amount)).toFixed(2);
      return rows.some(
        (row) => row.amount === amount && (sameMerchant(row.name, tx.merchant) || sameMerchant(row.name, tx.description)),
      );
    };
  }, [fixed.items]);

  const spend = useMemo(() => {
    let wants = 0;
    let needs = 0;
    let investments = 0;
    const needsBy = new Map<string, number>();
    const wantsBy = new Map<string, number>();
    const investmentsBy = new Map<string, number>();
    const matchCustom = (name: string) => {
      const n = name.trim().toLowerCase();
      if (!n) return null;
      return customWants.find((c) => c.aliases.some((a) => n === a || n.includes(a) || a.includes(n)))?.label ?? null;
    };
    for (const tx of monthTx) {
      if (tx.amount >= 0) continue;
      // Los gastos fijos guardados se añaden por separado para conservar su
      // monto mensual y evitar duplicarlos cuando también aparecen en el EEFF.
      if (matchesFixed(tx as Tx)) continue;
      const v = Math.abs(tx.amount);
      const custom = matchCustom(tx.merchant ?? "");
      const cat = custom ?? categorizeTxWithTravel(tx as Tx, rules, travelDays);
      const bucket = bucketFor(cat);
      if (bucket === "excluded") continue;
      if (bucket === "wants") {
        wants += v;
        wantsBy.set(cat, (wantsBy.get(cat) ?? 0) + v);
        continue;
      }
      const investmentLabel = `${cat} ${tx.merchant ?? ""}`;
      if (bucket === "savings" || (categoryBuckets[cleanCategoryName(cat)] === undefined && isSaving(investmentLabel))) {
        investments += v;
        investmentsBy.set(cat, (investmentsBy.get(cat) ?? 0) + v);
        continue;
      }
      needs += v;
      const key = NEED_CATS.has(cat) ? cat : cat || t("Otros", "Other");
      needsBy.set(key, (needsBy.get(key) ?? 0) + v);
    }
    return { wants, needs, investments, total: wants + needs, needsBy, wantsBy, investmentsBy };
  }, [monthTx, rules, travelDays, customWants, matchesFixed, categoryBuckets]);

  const hasReal = hasData && monthTx.length > 0;

  const fixedSavings = fixed.items.filter((item) => bucketFor(item.name) === "savings");
  const fixedWants = fixed.items.filter((item) => bucketFor(item.name) === "wants");
  const fixedNeeds = fixed.items.filter((item) => bucketFor(item.name) === "needs");
  const fixedSavingsAmount = fixedSavings.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  const fixedWantsAmount = fixedWants.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  const fixedNeedsAmount = fixedNeeds.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  const retirementFundAmount = holdings
    .filter((holding) => holding.kind === "retirement")
    .reduce((sum, holding) => sum + Math.max(0, Number(holding.monthly_contribution) || 0), 0);
  const retirementFundBucket = bucketFor(RETIREMENT_FUND_CATEGORY);
  const retirementFundNeeds = retirementFundBucket === "needs" ? retirementFundAmount : 0;
  const retirementFundWants = retirementFundBucket === "wants" ? retirementFundAmount : 0;
  const retirementFundSavings = retirementFundBucket === "savings" ? retirementFundAmount : 0;

  // Plan de gasto del onboarding: los gastos fijos alimentan "Necesidades" y
  // las categorías variables se usan como referencia en los tooltips.
  const planBuckets = useMemo(() => {
    const needs: { label: string; amount: number }[] = [];
    const wants: { label: string; amount: number }[] = [];
    for (const line of budgetLines) {
      const amount = Math.max(0, Number(line.amount) || 0);
      if (amount <= 0) continue;
      const cat = line.id.startsWith("custom:") ? null : findBudgetCategory(line.id);
      const label = cleanCategoryName(line.label ?? (cat ? (lang === "en" ? cat.en : cat.es) : line.id.replace(/^custom:/, "")));
      const group = line.group ?? cat?.group ?? "other";
      const override = categoryBuckets[label];
      const isNeed = override ? override === "needs" : group === "essentials";
      if (override === "excluded" || override === "savings") continue;
      (isNeed ? needs : wants).push({ label, amount });
    }
    // Letra de la hipoteca del onboarding: cuenta como gasto fijo en Necesidades.
    // No se añade si el plan ya tiene una línea de vivienda (Vivienda, Alquiler,
    // Hipoteca...) para no duplicar el mismo concepto.
    const mBalance = Number(profile.mortgage_balance) || 0;
    const mRate = Number(profile.mortgage_rate) || 0;
    const mTerm = Number(profile.mortgage_term) || 0;
    const hasHousingLine = needs.some((n) => /hipoteca|mortgage|vivienda|housing|alquiler|renta\b|rent\b/i.test(n.label));
    if (mBalance > 0 && mTerm > 0 && !hasHousingLine) {
      const r = mRate / 100 / 12;
      const n = mTerm * 12;
      const payment = r > 0 ? (mBalance * r) / (1 - Math.pow(1 + r, -n)) : mBalance / n;
      if (payment > 0) needs.push({ label: lang === "en" ? "Mortgage" : "Hipoteca", amount: Math.round(payment) });
    }
    const sum = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);
    needs.sort((a, b) => b.amount - a.amount);
    wants.sort((a, b) => b.amount - a.amount);
    return { needs, wants, needsAmount: sum(needs), wantsAmount: sum(wants) };
  }, [budgetLines, lang, categoryBuckets, profile.mortgage_balance, profile.mortgage_rate, profile.mortgage_term]);


  // Cuando hay movimientos, toda la distribución sale exclusivamente del mes corriente.
  // No se suman presupuestos, metas ni gastos fijos estimados del perfil.
  // Al empezar (sin movimientos) se usa el plan del onboarding; en cuanto hay
  // gastos reales registrados, Necesidades suma lo realmente gastado.
  const fixedAmount = hasReal
    ? fixedNeedsAmount + retirementFundNeeds + spend.needs
    : planBuckets.needsAmount;

  // Deseos e inversiones parten de 0 hasta que se registran gastos reales;
  // el plan del onboarding solo sirve de referencia en los tooltips.
  const lifestyleAmount = hasReal ? fixedWantsAmount + retirementFundWants + spend.wants : 0;
  const investAmount = hasReal ? fixedSavingsAmount + retirementFundSavings + spend.investments : 0;

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
        ...fixedNeeds
          .filter((item) => Number(item.amount) > 0)
          .map((item) => ({ label: item.name.replace(/^\p{Extended_Pictographic}\s*/u, ""), amount: Number(item.amount) })),
        ...(retirementFundNeeds > 0 ? [{ label: t("Fondo de retiro", "Retirement fund"), amount: retirementFundNeeds }] : []),
        ...[...spend.needsBy.entries()].map(([label, amount]) => ({ label: translateCategory(label, lang), amount })),
      ].sort((a, b) => b.amount - a.amount)
    : planBuckets.needs;

  const realWantsBreakdown = hasReal
    ? [
        ...fixedWants.filter((item) => Number(item.amount) > 0).map((item) => ({ label: cleanCategoryName(item.name), amount: Number(item.amount) })),
        ...(retirementFundWants > 0 ? [{ label: t("Fondo de retiro", "Retirement fund"), amount: retirementFundWants }] : []),
        ...[...spend.wantsBy.entries()].map(([label, amount]) => ({ label: translateCategory(label, lang), amount })),
      ]
        .sort((a, b) => b.amount - a.amount)
    : [];
  // Sin gastos registrados aún, el tooltip muestra las categorías del plan del onboarding.
  const wantsBreakdown = realWantsBreakdown.length > 0 ? realWantsBreakdown : planBuckets.wants;

  const saveBreakdown = hasReal
    ? [
        ...fixedSavings
          .filter((item) => Number(item.amount) > 0)
          .map((item) => ({ label: cleanCategoryName(item.name), amount: Number(item.amount) })),
        ...(retirementFundSavings > 0 ? [{ label: t("Fondo de retiro", "Retirement fund"), amount: retirementFundSavings }] : []),
        ...[...spend.investmentsBy.entries()].map(([label, amount]) => ({ label: translateCategory(label, lang), amount })),
        { label: t("Flujo libre del mes", "Free flow this month"), amount: freeAmount },
      ].sort((a, b) => b.amount - a.amount)
    : [{ label: t("Flujo libre del mes", "Free flow this month"), amount: freeAmount }];


  const editableCategories = useMemo(() => {
    const names = new Set<string>();
    if (retirementFundAmount > 0) names.add(RETIREMENT_FUND_CATEGORY);
    for (const item of fixed.items) if (Number(item.amount) > 0) names.add(cleanCategoryName(item.name));
    for (const tx of monthTx) {
      if (tx.amount >= 0 || matchesFixed(tx as Tx)) continue;
      const custom = customWants.find((entry) =>
        entry.aliases.some((alias) => (tx.merchant ?? "").toLowerCase().includes(alias)),
      )?.label;
      names.add(custom ?? categorizeTxWithTravel(tx as Tx, rules, travelDays));
    }
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, lang));
  }, [fixed.items, monthTx, matchesFixed, customWants, rules, travelDays, lang, retirementFundAmount]);


  // Uso del ahorro: proyecta el ahorro mensual actual con interés compuesto hasta la edad de retiro.
  const savingsYears = Math.max(1, (d.retirement.retireAge ?? 65) - d.retirement.currentAge);
  const savingsProjection = useMemo(
    () => projectRetirementFrom(saveAmount, d.retirement.returnAnnualized, savingsYears, 0, d.retirement.currentAge),
    [saveAmount, d.retirement.returnAnnualized, savingsYears, d.retirement.currentAge],
  );
  const savingsAtRetire = savingsProjection[savingsProjection.length - 1]?.value ?? 0;
  // No se presupone que todos los deseos se puedan eliminar: el recorte está
  // limitado al exceso sobre el objetivo y al gasto de la categoría principal.
  // El detalle de Análisis de gastos se basa en movimientos variables; los
  // gastos fijos no tienen el mismo desglose de comercios y movimientos.
  const topWant = [...spend.wantsBy.entries()]
    .map(([category, amount]) => ({ category, label: translateCategory(category, lang), amount }))
    .sort((a, b) => b.amount - a.amount)[0] ?? null;
  const wantsTarget = Math.max(0, totalIncome * 0.2);
  const monthlyOpportunity = hasReal && topWant
    ? Math.max(0, Math.min(topWant.amount, wantsAmount - wantsTarget))
    : 0;
  const opportunityProjection = monthlyOpportunity > 0
    ? projectRetirementFrom(monthlyOpportunity, 10, savingsYears, 0, d.retirement.currentAge)
    : [];
  const opportunityAtRetire = opportunityProjection[opportunityProjection.length - 1]?.value ?? 0;

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
                {t("Analizamos cómo se reparte cada dólar | para monitorear tu PLAN de Ahorro / Inversión mensual", "We analyze how every dollar is split | to monitor your monthly Savings / Investment PLAN")}
              </span>
              <span className="sm:hidden">
                {t("Analizamos cada dólar | tu PLAN mensual de ahorro", "We analyze every dollar | your monthly savings PLAN")}
              </span>
            </>
          }
        />

      <div className="flex items-center gap-3">
        {months.length > 0 && (
          <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 py-0.5">
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
        <Button variant="outline" size="sm" className="shrink-0 gap-2" data-tour-cashflow-target="edit" onClick={() => setRuleOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("Editar categorías", "Edit categories")}</span>
          <span className="sm:hidden">{t("Editar", "Edit")}</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour-cashflow-target="cards">
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
          tooltip={<BreakdownTooltip items={needsBreakdown} fmt={fmt} total={buckets[0]!.amount} showAmounts />}
          index={1}
        />
        <KpiCard
          label={t("Ahorro / inversiones", "Savings / investments")}
          value={fmt(saveAmount)}
          hint={`${((saveAmount / totalIncome) * 100).toFixed(0)}% ${t("del ingreso", "of income")}`}
          tooltip={<BreakdownTooltip items={saveBreakdown} fmt={fmt} total={saveAmount} showAmounts={hasReal} />}
          index={2}
        />
        <KpiCard
          label={t("Deseos / lifestyle", "Wants / lifestyle")}
          value={fmt(buckets[1]!.amount)}
          hint={`${((buckets[1]!.amount / totalIncome) * 100).toFixed(0)}% ${t("del ingreso", "of income")}`}
          tooltip={<BreakdownTooltip items={wantsBreakdown} fmt={fmt} total={buckets[1]!.amount} showAmounts={hasReal} />}
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

          <div className="space-y-3" data-tour-cashflow-target="blocks">
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
        <Panel title={t("Uso del ahorro", "Use of savings")} description={t("Si ahorras a este ritmo, lo que tendrás al retirarte", "If you keep saving at this pace, what you'll have when you retire")}>
          <p className="numeric text-4xl font-semibold text-primary">{fmt(savingsAtRetire)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {saveAmount > 0
              ? <>
                  {t("Ahorras", "You save")} {fmt(saveAmount)} {t("al mes", "per month")} {t("al", "at")} {d.retirement.returnAnnualized}%
                  {` ${t("durante", "for")} ${savingsYears} ${t("años", "years")}.`}
                </>
              : t("Sin ahorro mensual todavía: edita tus categorías para verlo.", "No monthly savings yet: edit your categories to see it.")}
          </p>
        </Panel>
        <Panel
          title={t("Oportunidad del mes", "Opportunity of the month")}
          description={t("Dónde puedes ahorrar e invertir más", "Where you could save and invest more")}
          icon={<Lightbulb />}
        >
          {monthlyOpportunity > 0 && topWant ? (
            <div className="space-y-4">
              <div>
                <p className="numeric text-4xl font-semibold text-positive">{fmt(monthlyOpportunity)}<span className="ml-1 text-base font-normal text-muted-foreground">{t("/mes", "/mo")}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{t("de gasto en deseos por encima de tu objetivo", "of wants spending above your target")}</p>
              </div>
              <div className="border-t border-border pt-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 font-medium text-foreground">{topWant.label}</span>
                  <span className="numeric shrink-0 font-semibold">{fmt(topWant.amount)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("Objetivo total de deseos (20%):", "Total wants target (20%):")} {fmt(wantsTarget)}</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("Si reduces ese gasto e inviertes", "If you cut that spending and invest")} {fmt(monthlyOpportunity)} {t("al mes en el S&P 500, podrías tener", "per month in the S&P 500, you could have")} <strong className="text-foreground">{fmt(opportunityAtRetire)}</strong> {t("en", "in")} {savingsYears} {t("años", "years")} {t("(supuesto del 10% anual; no garantizado).", "(assuming 10% a year; not guaranteed).")}
              </p>
              <Button asChild size="sm" className="w-full gap-2">
                <Link
                  to="/gastos"
                  search={{
                    from: `${activeMonth}-01`,
                    to: new Date(Number(activeMonth?.slice(0, 4)), Number(activeMonth?.slice(5, 7)), 0).toISOString().slice(0, 10),
                    category: topWant.category,
                  }}
                >{t("Ver dónde puedo ahorrar", "See where I can save")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {!hasReal
                  ? t("Registra tus gastos para detectar tu mejor oportunidad de ahorro.", "Add your expenses to find your best savings opportunity.")
                  : t("Tus deseos están dentro del objetivo del 20% este mes.", "Your wants are within the 20% target this month.")}
              </p>
              <Button asChild size="sm" variant="outline" className="w-full gap-2">
                <Link to={hasReal ? "/gastos" : "/registro-gastos"}>{hasReal ? t("Ver mis gastos", "View my spending") : t("Registrar gastos", "Add expenses")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          )}
        </Panel>
      </div>
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("Categorías de tu regla del dinero", "Your money rule categories")}</DialogTitle>
            <DialogDescription>
              {t("Elige dónde cuenta cada categoría. Los montos se actualizan al instante.", "Choose where each category counts. Amounts update instantly.")}
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border">
            {editableCategories.map((category) => (
              <div key={category} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0 text-sm font-medium">
                  {category === RETIREMENT_FUND_CATEGORY ? t("Fondo de retiro", "Retirement fund") : translateCategory(category, lang)}
                </span>
                <Select value={bucketFor(category)} onValueChange={(value) => setCategoryBucket(category, value as MoneyBucket)}>
                  <SelectTrigger className="w-[190px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needs">{t("Necesidades", "Needs")}</SelectItem>
                    <SelectItem value="savings">{t("Ahorro / inversiones", "Savings / investments")}</SelectItem>
                    <SelectItem value="wants">{t("Deseos / lifestyle", "Wants / lifestyle")}</SelectItem>
                    <SelectItem value="excluded">{t("No incluir", "Do not include")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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
  showAmounts = false,
}: {
  items: { label: string; amount: number }[];
  fmt: (n: number) => string;
  total: number;
  showAmounts?: boolean;
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
              {showAmounts && <span className="numeric shrink-0 text-xs">{fmt(item.amount)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
