import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { Bot, Camera, Mic, PencilLine, Plus, ShoppingBasket, Users, Utensils, Upload, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const dailySpend = [
  { day: 1, amount: 18 }, { day: 3, amount: 12 }, { day: 5, amount: 44 },
  { day: 7, amount: 28 }, { day: 9, amount: 38 }, { day: 11, amount: 56 },
  { day: 13, amount: 35 }, { day: 15, amount: 22 }, { day: 17, amount: 16 },
  { day: 19, amount: 48 }, { day: 21, amount: 72 }, { day: 23, amount: 61 },
  { day: 25, amount: 42 }, { day: 27, amount: 67 }, { day: 29, amount: 58 },
];

export function DailySpendingPreview() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const [tab, setTab] = useState<"all" | "mine" | "shared">("all");
  const [addOpen, setAddOpen] = useState(false);
  const expenses = [
    { name: "Ahorramas", category: t("Supermercado", "Groceries"), date: t("Hoy", "Today"), amount: "€32.40", icon: ShoppingBasket, shared: true },
    { name: t("Café y desayuno", "Coffee & breakfast"), category: t("Restaurantes", "Restaurants"), date: t("Hoy", "Today"), amount: "€6.50", icon: Utensils, shared: false },
    { name: t("Cena con Carlos", "Dinner with Carlos"), category: t("Restaurantes", "Restaurants"), date: t("Ayer", "Yesterday"), amount: "€24.00", icon: Users, shared: true },
    { name: "Metro", category: t("Transporte", "Transport"), date: t("Ayer", "Yesterday"), amount: "€12.00", icon: Wallet, shared: false },
  ];
  const visible = expenses.filter((expense) => tab === "all" || (tab === "shared" ? expense.shared : !expense.shared)).slice(0, 3);

  return (
    <div className="daily-spending-showcase relative mt-5 grid min-w-0 overflow-hidden rounded-lg border border-border bg-card text-foreground md:grid-cols-[minmax(0,1fr)_320px]" data-daily-spending-preview>
      <div className="min-w-0 p-5 sm:p-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold">{t("Mis gastos diarios", "My daily spending")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("Controla tu dinero día a día", "Control your money daily")}</p>
          </div>
          <span className="pt-1 text-xs font-medium uppercase text-muted-foreground">{t("Octubre 2026", "October 2026")}</span>
        </div>
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="numeric text-5xl font-bold">€1.8K</p>
          <span className="text-base font-medium text-muted-foreground">{t("de €3K planificado", "of €3K planned")}</span>
        </div>
        <div className="h-52 w-full min-w-0" data-daily-spending-chart aria-label={t("Gráfico de gastos diarios de octubre", "October daily spending chart")}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySpend} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
              <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 5" />
              <XAxis dataKey="day" ticks={[1, 9, 19, 29]} tickFormatter={(day: number) => `${day} Oct`} axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} dy={6} />
              <Tooltip cursor={{ stroke: "var(--color-positive)", strokeDasharray: "3 4" }} content={({ active, payload }) => {
                const point = payload?.[0]?.payload as { day: number; amount: number } | undefined;
                if (!active || !point) return null;
                return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"><p className="text-muted-foreground">{point.day} Oct</p><p className="numeric mt-1 font-semibold text-positive">€{point.amount.toFixed(2)}</p></div>;
              }} />
              <Area type="monotone" dataKey="amount" stroke="var(--color-positive)" strokeWidth={3} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5, fill: "var(--color-positive)", stroke: "var(--color-card)", strokeWidth: 2 }} isAnimationActive={!reducedMotion} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-7 flex items-start gap-4 rounded-lg border border-positive/20 bg-elevated p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-positive/10 text-positive"><Bot className="h-5 w-5" /></span>
          <div className="min-w-0"><h4 className="mb-1 text-sm font-semibold text-positive">AI Advisor</h4><p className="text-sm leading-relaxed text-foreground/75"><span className="line-clamp-2 md:hidden">{t("Tu gasto en ocio bajó 12%: a este ritmo ahorras €240 más.", "Leisure spending fell 12%: at this pace you save €240 more.")}</span><span className="hidden md:inline">{t("Tu gasto en ocio es un 12% menor que el mes pasado. Si mantienes este ritmo, podrías ahorrar €240 adicionales para tu objetivo de inversión.", "Your leisure spending is 12% lower than last month. At this pace, you could save an extra €240 toward your investment goal.")}</span></p></div>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-3">
          {[
            { label: t("Supermercado", "Groceries"), amount: "€320", progress: "w-[65%]", color: "bg-positive" },
            { label: t("Restaurantes", "Restaurants"), amount: "€240", progress: "w-2/5", color: "bg-chart-2" },
            { label: t("Otros gastos", "Other spending"), amount: "€340", progress: "w-[55%]", color: "bg-chart-4" },
          ].map((category) => <div key={category.label} className="min-w-0"><div className="flex flex-wrap justify-between gap-1 text-xs font-medium"><span className="text-muted-foreground">{category.label}</span><span className="numeric">{category.amount}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", category.progress, category.color)} /></div></div>)}
        </div>
      </div>
      <div className="min-w-0 border-t border-border bg-elevated/30 p-5 sm:p-6 md:border-l md:border-t-0">
        <div className="mb-5 flex items-center justify-between gap-2"><h4 className="text-lg font-semibold">{t("Últimos gastos", "Latest expenses")}</h4><Button size="icon" onClick={() => setAddOpen(!addOpen)} aria-expanded={addOpen} aria-label={t("Agregar gasto", "Add expense")} title={t("Agregar gasto", "Add expense")} className="h-9 w-9 shrink-0 rounded-full bg-positive text-background hover:bg-positive/85"><Plus /></Button></div>
        {addOpen && <div className="mb-4 grid grid-cols-2 gap-1 border-b border-border pb-3">{[
          { icon: PencilLine, label: t("Manual", "Manual") }, { icon: Mic, label: t("Por voz", "By voice") }, { icon: Camera, label: t("Tomar foto", "Take photo") }, { icon: Upload, label: t("Subir archivo", "Upload file") }, { icon: Users, label: t("Compartido", "Shared expense") },
        ].map((method) => <Button key={method.label} asChild variant="ghost" size="sm" className="justify-start px-1"><Link to="/auth" search={{ mode: "signup" }}><method.icon className="text-positive" />{method.label}</Link></Button>)}</div>}
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-border/40 p-1">{([{ id: "all", label: t("Todos", "All") }, { id: "mine", label: t("Míos", "Mine") }, { id: "shared", label: t("Compartidos", "Shared") }] as const).map((item) => <Button key={item.id} size="sm" variant="ghost" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={cn("px-1 text-[11px]", tab === item.id ? "bg-positive/10 text-positive hover:bg-positive/15 hover:text-positive" : "text-muted-foreground")}>{item.label}</Button>)}</div>
        {tab === "shared" && <div className="mt-4 flex items-center justify-between gap-3 border-b border-border pb-3"><div><p className="text-sm font-semibold">Carlos</p><p className="mt-1 text-xs text-muted-foreground">{t("Te debe", "Owes you")}</p></div><span className="numeric text-lg font-semibold text-positive">€32.40</span></div>}
        <ul className="mt-3 min-h-56 space-y-1">{visible.map((expense) => <li key={expense.name} className="flex min-w-0 items-center gap-3 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-border/40"><expense.icon className="h-4 w-4 text-muted-foreground" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-snug">{expense.name}</p><p className="mt-1 text-[10px] leading-snug text-muted-foreground">{expense.shared ? t("Con Carlos · 50%", "With Carlos · 50%") : `${expense.category} · ${expense.date}`}</p></div><span className="numeric shrink-0 text-sm font-semibold">{expense.amount}</span></li>)}</ul>
        <div className="mt-5 flex flex-col items-center">
          <div className="relative h-32 w-32" role="progressbar" aria-label={t("Plan gastado", "Plan spent")} aria-valuenow={60} aria-valuemin={0} aria-valuemax={100}>
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="64" cy="64" r="56" stroke="var(--color-border)" strokeWidth="8" fill="none" /><circle cx="64" cy="64" r="56" stroke="var(--color-positive)" strokeWidth="8" fill="none" strokeDasharray="351.86" strokeDashoffset="140.74" strokeLinecap="round" /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="numeric text-2xl font-bold">60%</span><span className="mt-1 text-[10px] uppercase text-muted-foreground">{t("del plan", "of plan")}</span></div>
          </div>
          <p className="mt-4 max-w-56 text-center text-xs leading-relaxed text-muted-foreground">{t("Te quedan", "You have")} <span className="numeric font-semibold text-foreground">€1.2K</span> {t("este mes para no exceder tu límite.", "left this month to stay within your limit.")}</p>
        </div>
      </div>
    </div>
  );
}
