import { createFileRoute, Link } from "@tanstack/react-router";
import { SavingsGoals, type SavingsGoal } from "@/components/savings-goals";
import { motion } from "motion/react";
import { ArrowLeftRight, ArrowRight, Coins, Lightbulb, Pencil, PiggyBank, ReceiptText, Target, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useLanguage, useT } from "@/hooks/use-language";
import { translateCategory } from "@/lib/i18n-data";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      { title: "Metas de ahorro — WhatsYournumber" },
      {
        name: "description",
        content: "Sigue tus metas de ahorro y cómo se reparte tu dinero cada mes entre gastos, inversiones y ahorro.",
      },
      { property: "og:title", content: "Metas de ahorro — WhatsYournumber" },
      { property: "og:description", content: "Sigue tus metas de ahorro y el destino de tus ingresos mensuales." },
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
    const list = [...set].sort().reverse();
    if (list.length > 0) return list;
    // Sin EEFF: mostrar los últimos 6 meses desde hoy.
    const now = new Date();
    const fallback: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      fallback.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return fallback;
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

  // Necesidades: Vivienda/Renta, Hipoteca, Condominio, Alimentos/Supermercado, Transporte, Servicios, Salud, Educación.
  // Deseos: Viajes, Restaurantes, Entretenimiento/Salidas, Compras, Tecnología/Apps, Hobbies/Lifestyle.
  const NEED_CATS = new Set([
    "Vivienda",
    "Hipoteca",
    "Renta",
    "Alquiler",
    "Condominio",
    "Alimentos",
    "Alimentación",
    "Supermercado",
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

  // Destino del ahorro: a dónde va el ahorro del mes (metas, inversiones, disponible).
  const { value: savingsGoalsValue } = useSyncedSetting<{ items: { id: string; monthly: number }[] }>("whatsyournumber:savings-goals", { items: [] });
  const { value: savingsAlloc, save: setSavingsAlloc } = useSyncedSetting<{ invest: number; goals: number } | null>("whatsyournumber:savings-allocation", null);
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocDraft, setAllocDraft] = useState<{ invest: number; goals: number }>({ invest: 0, goals: 0 });
  const goalsMonthly = (Array.isArray(savingsGoalsValue?.items) ? savingsGoalsValue.items : []).reduce((s, g) => s + (Number(g.monthly) || 0), 0);
  // Destino del ahorro: el editor manda; si no hay nada guardado, se usan las metas y las inversiones detectadas.
  const destInvest = Math.min(savingsAlloc?.invest ?? investAmount, saveAmount);
  const destGoals = Math.min(savingsAlloc?.goals ?? goalsMonthly, Math.max(0, saveAmount - destInvest));
  const savingsDestinations = [
    { name: t("Metas de ahorro", "Savings goals"), amount: destGoals, icon: <PiggyBank className="h-5 w-5" />, color: "var(--color-positive)" },
    { name: t("Inversiones", "Investments"), amount: destInvest, icon: <TrendingUp className="h-5 w-5" />, color: "var(--color-chart-1)" },
    { name: t("Disponible", "Available"), amount: Math.max(0, saveAmount - destGoals - destInvest), icon: <Wallet className="h-5 w-5" />, color: "var(--color-chart-4)" },
  ];


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


  // «Tu ahorro en el tiempo»: proyecta el ahorro destinado a inversiones
  // (10% anual histórico del S&P 500) hasta la edad de retiro del plan.
  const SP500_RATE = 10;
  const savingsYears = Math.max(1, (d.retirement.retireAge ?? 65) - d.retirement.currentAge);
  const savingsProjection = useMemo(
    () => projectRetirementFrom(destInvest, SP500_RATE, savingsYears, 0, d.retirement.currentAge),
    [destInvest, savingsYears, d.retirement.currentAge],
  );
  const savingsAtRetire = savingsProjection[savingsProjection.length - 1]?.value ?? 0;
  // «Tu ahorro en el tiempo»: curva de crecimiento con hitos y aporte vs interés compuesto
  const savingsContributed = destInvest * 12 * savingsYears;
  const savingsGrowth = Math.max(0, savingsAtRetire - savingsContributed);
  const chartMilestones = useMemo(() => {
    const years = [...new Set([0, 1, 5, 10, savingsYears])].filter((y) => y <= savingsYears).sort((a, b) => a - b);
    return years.map((y) => ({ year: y, value: savingsProjection[y]?.value ?? 0 }));
  }, [savingsProjection, savingsYears]);
  const chartMax = Math.max(1, ...chartMilestones.map((m) => m.value));
  const chartPoints = chartMilestones.map((m, i) => ({
    ...m,
    x: chartMilestones.length > 1 ? (i / (chartMilestones.length - 1)) * 300 : 0,
    y: 104 - (m.value / chartMax) * 92,
  }));
  const chartLine = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  // Consejo «¿Quieres llegar antes?»: usa el ahorro sin destino y la primera meta activa
  const { value: goalsSetting } = useSyncedSetting<{ items: SavingsGoal[] }>("whatsyournumber:savings-goals", { items: [] });
  const goalsList = Array.isArray(goalsSetting?.items) ? goalsSetting.items : [];
  const tipFree = Math.max(0, saveAmount - destGoals - destInvest);
  const tipGoal = goalsList.find((g) => g.target > 0 && g.saved < g.target && g.monthly > 0);
  const tipMonthsSaved = tipGoal && tipFree > 0
    ? Math.max(0, Math.ceil((tipGoal.target - tipGoal.saved) / tipGoal.monthly) - Math.ceil((tipGoal.target - tipGoal.saved) / (tipGoal.monthly + tipFree)))
    : 0;

  return (
    <TooltipProvider delayDuration={150}>
      <PageShell>
        <PageHeader
          eyebrow={activeMonth ? monthLabel(activeMonth) : t("Sin EEFF cargados", "No statements uploaded")}
          title={t("Metas de ahorro", "Savings goals")}
          subtitleClassName="sm:whitespace-nowrap"
          subtitle={
            <>
              <span className="hidden sm:inline">
                {t("Tu plan mensual de ahorro e inversión, dólar a dólar", "Your monthly savings and investment plan, dollar by dollar")}
              </span>
              <span className="sm:hidden">
                {t("Tu plan mensual de ahorro e inversión", "Your monthly savings and investment plan")}
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
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 sm:hidden"
          data-tour-cashflow-target="alloc-m"
          onClick={() => {
            setAllocDraft({
              invest: Math.round(savingsAlloc?.invest ?? destInvest),
              goals: Math.round(savingsAlloc?.goals ?? destGoals),
            });
            setAllocOpen(true);
          }}
        >
          <PiggyBank className="h-3.5 w-3.5" />
          {t("Ahorro", "Savings")}
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

      <Panel
        className="hidden sm:block"
        title={t("Flujo de dinero", "Money flow")}
        description={t("Convierte tu ahorro en progreso hacia tus metas.", "Turn your savings into progress toward your goals.")}
        icon={<ArrowLeftRight />}
        actions={
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          data-tour-cashflow-target="alloc"
          onClick={() => {
              setAllocDraft({
                invest: Math.round(savingsAlloc?.invest ?? destInvest),
                goals: Math.round(savingsAlloc?.goals ?? destGoals),
              });
              setAllocOpen(true);
            }}
          >
            <PiggyBank className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("Editar ahorro", "Edit savings")}</span>
            <span className="sm:hidden">{t("Ahorro", "Savings")}</span>
          </Button>
        }
      >
        {(() => {
          const midBuckets = [
            { name: t("Necesidades básicas", "Basic needs"), amount: needsAmount, icon: <ReceiptText className="h-5 w-5" />, color: "var(--color-chart-2)" },
            { name: t("Potencial ahorro", "Savings potential"), amount: saveAmount, icon: <PiggyBank className="h-5 w-5" />, color: "var(--color-positive)", highlight: true },
            { name: t("Lifestyle / deseos", "Lifestyle / wants"), amount: wantsAmount, icon: <Wallet className="h-5 w-5" />, color: "var(--color-chart-4)" },
          ];
          const flowCard = (d: { name: string; amount: number; icon: ReactNode; color: string; highlight?: boolean }, total: number, idx: number, dir: "l" | "r") => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: dir === "l" ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              className={`rounded-2xl border p-4 ${d.highlight ? "border-positive/25 bg-positive/10" : "border-border bg-elevated/60"}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${d.color} 15%, transparent)`, color: d.color }}>{d.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="numeric text-sm font-semibold">{fmt(d.amount)}</p>
                </div>
                <p className="numeric ml-auto text-xs text-muted-foreground">{total > 0 ? ((d.amount / total) * 100).toFixed(0) : 0}%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${total > 0 ? Math.min(100, (d.amount / total) * 100) : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: d.color }}
                />
              </div>
            </motion.div>
          );
          return (
            <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.8fr)_70px_minmax(0,1.1fr)_70px_minmax(0,1.2fr)]">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-border bg-elevated/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><Wallet className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t("Ingresos", "Income")}</p>
                    <p className="numeric text-lg font-semibold">{fmt(totalIncome)}</p>
                  </div>
                  <p className="numeric ml-auto text-xs text-muted-foreground">100%</p>
                </div>
              </motion.div>

              <div className="relative hidden h-56 lg:block">
                <svg viewBox="0 0 120 220" className="h-full w-full" preserveAspectRatio="none">
                  {midBuckets.map((b, i) => {
                    const y = 30 + i * 80;
                    const w = Math.max(2.5, totalIncome > 0 ? (b.amount / totalIncome) * 22 : 2.5);
                    return (
                      <motion.path
                        key={b.name}
                        d={`M0,110 C60,110 60,${y} 120,${y}`}
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
                {midBuckets.map((b, idx) => flowCard(b, totalIncome, idx, "l"))}
              </div>

              <div className="relative hidden h-56 lg:block">
                <svg viewBox="0 0 120 220" className="h-full w-full" preserveAspectRatio="none">
                  {savingsDestinations.map((d, i) => {
                    const y = 30 + i * 80;
                    const w = Math.max(2.5, saveAmount > 0 ? (d.amount / saveAmount) * 22 : 2.5);
                    return (
                      <motion.path
                        key={d.name}
                        d={`M0,110 C60,110 60,${y} 120,${y}`}
                        fill="none"
                        stroke={d.color}
                        strokeWidth={w}
                        strokeOpacity={0.35}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="space-y-3">
                {savingsDestinations.map((d, idx) => flowCard(d, saveAmount, idx, "r"))}
              </div>
            </div>
          );
        })()}
      </Panel>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <SavingsGoals fmt={fmt} />
          {tipGoal && tipFree > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-400/15 text-amber-400"><Lightbulb className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t("¿Quieres llegar antes?", "Want to get there sooner?")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("Tienes", "You have")} <span className="numeric font-semibold text-positive">{fmt(tipFree)}{t("/mes", "/mo")}</span> {t("de ahorro sin destino. Si los destinas a", "of unassigned savings. If you put them toward")} <span className="font-medium text-foreground">{tipGoal.name}</span>
                  {tipMonthsSaved > 0 && <>{t(", podrías alcanzar tu meta ~", ", you could reach your goal ~")}{tipMonthsSaved} {t(tipMonthsSaved === 1 ? "mes antes" : "meses antes", tipMonthsSaved === 1 ? "month sooner" : "months sooner")}</>}.
                </p>
              </div>
            </div>
          )}
        </div>
        <Panel className="flex flex-col overflow-hidden" title={t("Tus inversiones en el tiempo", "Your investments over time")} description={t(`Tus ahorros de inversión (${fmt(destInvest)}/mes) pueden ser:`, `Your investment savings (${fmt(destInvest)}/mo) can become:`)} descriptionClassName="whitespace-nowrap text-[11px]" icon={<TrendingUp />}>
          {destInvest > 0 ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="numeric text-3xl font-bold text-primary">{fmt(savingsAtRetire)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t("en", "in")} {savingsYears} {t("años", "years")}</p>
                </div>
                <div className="rounded-lg border border-border bg-elevated/60 px-2.5 py-1.5 text-right">
                  <p className="numeric text-xs font-semibold text-positive">{fmt(savingsAtRetire)}</p>
                  <p className="text-[10px] text-muted-foreground">{savingsYears} {t("años", "years")}</p>
                </div>
              </div>
              <div className="mt-3">
                <svg viewBox="0 0 300 120" className="h-28 w-full" role="img" aria-label={t("Proyección de tu ahorro", "Your savings projection")}>
                  <defs>
                    <linearGradient id="savingsChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-positive)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-positive)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1="0" x2="300" y1={104 - f * 92} y2={104 - f * 92} stroke="var(--color-border)" strokeDasharray="3 4" strokeWidth="1" />
                  ))}
                  <path d={`${chartLine} L 300 112 L 0 112 Z`} fill="url(#savingsChartFill)" stroke="none" />
                  <path d={chartLine} fill="none" stroke="var(--color-positive)" strokeWidth="2" strokeLinecap="round" />
                  {chartPoints.map((p) => (
                    <circle key={p.year} cx={p.x} cy={p.y} r="3" fill="var(--color-positive)" stroke="var(--color-background)" strokeWidth="1.5" />
                  ))}
                </svg>
                <div className="mt-0.5 flex justify-between text-center">
                  {chartPoints.map((p) => (
                    <div key={p.year} className="min-w-0">
                      <p className="text-[9px] text-muted-foreground">{p.year === 0 ? t("Hoy", "Today") : `${p.year} ${t(p.year === 1 ? "año" : "años", p.year === 1 ? "year" : "years")}`}</p>
                      <p className="numeric text-[10px] font-medium">{fmt(p.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border bg-elevated/60 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Coins className="h-3.5 w-3.5 text-positive" /><p className="text-[10px]">{t("Aportarías", "You'd contribute")}</p></div>
                  <p className="numeric mt-0.5 text-base font-semibold">{fmt(savingsContributed)}</p>
                  <p className="text-[10px] text-muted-foreground">{t("de tu bolsillo", "out of your pocket")}</p>
                </div>
                <div className="rounded-xl border border-border bg-elevated/60 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-positive" /><p className="text-[10px]">{t("Crecimiento estimado", "Estimated growth")}</p></div>
                  <p className="numeric mt-0.5 text-base font-semibold text-positive">+{fmt(savingsGrowth)}</p>
                  <p className="text-[10px] text-muted-foreground">{t("gracias al interés compuesto", "thanks to compound interest")}</p>
                </div>
              </div>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link to="/retiro">{t("Ver proyección completa", "See full projection")}<ArrowRight /></Link>
              </Button>
              <p className="mt-2.5 whitespace-nowrap text-center text-[10px] text-muted-foreground">
                {t(
                  `Simulación al ${SP500_RATE}% anual (S&P 500). Rendimientos reales pueden variar.`,
                  `Simulation at ${SP500_RATE}% a year (S&P 500). Actual returns may vary.`,
                )}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t("Sin ahorro de inversión todavía: pulsa «Editar ahorro» para destinar dinero a inversiones.", "No investment savings yet: tap «Edit savings» to put money toward investments.")}</p>
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

      <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Destino del ahorro", "Savings destination")}</DialogTitle>
            <DialogDescription className="truncate" title={t(
              `De tus ${fmt(saveAmount)} de ahorro al mes, decide cuánto va a cada destino.`,
              `Out of your ${fmt(saveAmount)} monthly savings, decide how much goes to each destination.`,
            )}>
              {t(
                `De tus ${fmt(saveAmount)} de ahorro al mes, decide cuánto va a cada destino.`,
                `Out of your ${fmt(saveAmount)} monthly savings, decide how much goes to each destination.`,
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                {t("Inversiones al mes", "Investments per month")}
              </label>
              <div className="relative">
                <NumberInput
                  format
                  value={allocDraft.invest}
                  onChange={(v) => setAllocDraft((d) => ({ ...d, invest: v }))}
                  placeholder="0"
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAllocDraft((d) => ({ ...d, invest: Math.max(0, saveAmount - Math.max(0, d.goals)) }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-primary"
                  aria-label={t("Usar todo en ahorro e inversión", "Use all for savings & investment")}
                >
                  {t("Máx", "Max")}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-positive" />
                {t("Metas de ahorro al mes", "Savings goals per month")}
              </label>
              <NumberInput
                format
                value={allocDraft.goals}
                onChange={(v) => setAllocDraft((d) => ({ ...d, goals: v }))}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                `Disponible: ${fmt(Math.max(0, saveAmount - allocDraft.invest - allocDraft.goals))}`,
                `Available: ${fmt(Math.max(0, saveAmount - allocDraft.invest - allocDraft.goals))}`,
              )}
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setSavingsAlloc({ invest: Math.max(0, allocDraft.invest), goals: Math.max(0, allocDraft.goals) });
                setAllocOpen(false);
                toast.success(t("Destino del ahorro guardado", "Savings destination saved"));
              }}
            >
              {t("Guardar", "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
    </TooltipProvider>
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

