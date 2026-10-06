import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion, useReducedMotion } from "motion/react";
import { Bot, Camera, Mic, PencilLine, Plus, ShoppingBasket, Target, Users, Utensils, Upload, Wallet } from "lucide-react";
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

/**
 * Muestra de «Tracking de Gastos diarios» del home.
 * Usa la misma gramática visual que las demás pestañas: paneles
 * `rounded-2xl bg-elevated/60 ring-1 ring-border`, etiquetas `text-xs`
 * y cifras `numeric text-3xl font-semibold tracking-tight`.
 */
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
  const categories = [
    { label: t("Supermercado", "Groceries"), amount: "€320", progress: "w-[65%]", color: "bg-positive" },
    { label: t("Restaurantes", "Restaurants"), amount: "€240", progress: "w-2/5", color: "bg-chart-2" },
    { label: t("Otros gastos", "Other spending"), amount: "€340", progress: "w-[55%]", color: "bg-chart-4" },
  ];

  return (
    <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr]" data-daily-spending-preview>
      <div className="min-w-0 rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
        <p className="text-xs text-muted-foreground">{t("Mis gastos diarios", "My daily spending")}</p>
        <p className="numeric mt-1 text-3xl font-semibold tracking-tight">€1.8K</p>
        <p className="mt-1 text-xs text-positive">{t("de €3K planificado", "of €3K planned")}</p>

        <div className="mt-4 h-[210px] w-full min-w-0" data-daily-spending-chart aria-label={t("Gráfico de gastos diarios de octubre", "October daily spending chart")}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySpend} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
              <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 5" />
              <XAxis dataKey="day" ticks={[1, 9, 19, 29]} tickFormatter={(day: number) => `${day} Oct`} axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} dy={6} />
              <Tooltip cursor={{ stroke: "var(--color-positive)", strokeDasharray: "3 4" }} content={({ active, payload }) => {
                const point = payload?.[0]?.payload as { day: number; amount: number } | undefined;
                if (!active || !point) return null;
                return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"><p className="text-muted-foreground">{point.day} Oct</p><p className="numeric mt-1 font-semibold text-positive">€{point.amount.toFixed(2)}</p></div>;
              }} />
              <Area type="monotone" dataKey="amount" stroke="var(--color-positive)" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5, fill: "var(--color-positive)", stroke: "var(--color-card)", strokeWidth: 2 }} isAnimationActive={!reducedMotion} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </div>


        <ul className="mt-4 space-y-2">
          {categories.map((category) => (
            <li key={category.label}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", category.color)} />
                {category.label}
                <span className="numeric ml-auto text-foreground">{category.amount}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                <div className={cn("h-full rounded-full", category.progress, category.color)} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-background/50 p-3 ring-1 ring-border">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Bot className="h-3.5 w-3.5 text-primary" />
            {t("AI Advisor", "AI Advisor")}
          </div>
          <p className="mt-1.5 flex items-start gap-2 text-xs text-foreground">
            <ShoppingBasket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="min-w-0 line-clamp-2 md:hidden">{t("Tu gasto en ocio bajó 12%: a este ritmo ahorras €240 más.", "Leisure spending fell 12%: at this pace you save €240 more.")}</span>
            <span className="hidden min-w-0 md:inline">{t("Tu gasto en ocio es un 12% menor que el mes pasado. Si mantienes este ritmo, podrías ahorrar €240 adicionales para tu objetivo de inversión.", "Your leisure spending is 12% lower than last month. At this pace, you could save an extra €240 toward your investment goal.")}</span>
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
        <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("Últimos gastos", "Latest expenses")}</p>
            <Button size="icon" onClick={() => setAddOpen(!addOpen)} aria-expanded={addOpen} aria-label={t("Agregar gasto", "Add expense")} title={t("Agregar gasto", "Add expense")} className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/85"><Plus className="h-4 w-4" /></Button>
          </div>
          {addOpen && (
            <div className="mt-3 grid grid-cols-2 gap-1 border-b border-border pb-3">
              {[
                { icon: PencilLine, label: t("Manual", "Manual") },
                { icon: Mic, label: t("Por voz", "By voice") },
                { icon: Camera, label: t("Tomar foto", "Take photo") },
                { icon: Upload, label: t("Subir archivo", "Upload file") },
                { icon: Users, label: t("Compartido", "Shared expense") },
              ].map((method) => (
                <Button key={method.label} asChild variant="ghost" size="sm" className="justify-start px-1 text-xs">
                  <Link to="/auth" search={{ mode: "signup" }}><method.icon className="h-3.5 w-3.5 text-primary" />{method.label}</Link>
                </Button>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-background/50 p-1 ring-1 ring-border">
            {([{ id: "all", label: t("Todos", "All") }, { id: "mine", label: t("Míos", "Mine") }, { id: "shared", label: t("Compartidos", "Shared") }] as const).map((item) => (
              <Button key={item.id} size="sm" variant="ghost" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={cn("px-1 text-[11px]", tab === item.id ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" : "text-muted-foreground")}>{item.label}</Button>
            ))}
          </div>
          {tab === "shared" && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-background/50 px-3 py-2 ring-1 ring-border">
              <div><p className="text-xs font-medium">Carlos</p><p className="mt-0.5 text-[11px] text-muted-foreground">{t("Te debe", "Owes you")}</p></div>
              <span className="numeric text-sm font-semibold text-positive">€32.40</span>
            </div>
          )}
          <ul className="mt-2 min-h-44 space-y-1">
            {visible.map((expense) => (
              <li key={expense.name} className="flex min-w-0 items-center gap-3 py-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background/50 ring-1 ring-border"><expense.icon className="h-3.5 w-3.5 text-muted-foreground" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{expense.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{expense.shared ? t("Con Carlos · 50%", "With Carlos · 50%") : `${expense.category} · ${expense.date}`}</p>
                </div>
                <span className="numeric shrink-0 text-xs font-medium">{expense.amount}</span>
              </li>
            ))}
          </ul>
        </div>


        <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            {t("Plan gastado", "Plan spent")}
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-label={t("Plan gastado", "Plan spent")}
            aria-valuenow={60}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="numeric text-foreground">€1.8K</span>
            <span>60%</span>
            <span className="numeric text-foreground">€3K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
