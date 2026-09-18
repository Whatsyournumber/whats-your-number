import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  Flag,
  Home,
  Mic,
  Pencil,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;
const PLAN_PCT = 0.78;

const categories = [
  { es: "Restaurantes", en: "Restaurants", now: "320", goal: "250", pct: 128, over: true },
  { es: "Supermercado", en: "Groceries", now: "420", goal: "500", pct: 84, over: false },
  { es: "Transporte", en: "Transport", now: "180", goal: "200", pct: 90, over: false },
];

const capture = [
  { icon: Pencil, es: "Manual", en: "Manual" },
  { icon: Mic, es: "Por voz", en: "By voice" },
  { icon: ReceiptText, es: "Foto de recibo", en: "Receipt photo" },
  { icon: Wallet, es: "Recurrente", en: "Recurring" },
];

const nav = [
  { icon: Home, es: "Inicio", en: "Home", active: false },
  { icon: ReceiptText, es: "Gastos", en: "Expenses", active: true },
  { icon: Wallet, es: "Patrimonio", en: "Wealth", active: false },
  { icon: BarChart3, es: "Simulaciones", en: "Tools", active: false },
  { icon: Flag, es: "Plan", en: "Plan", active: false },
];

export function HeroPhone({ es = true, className }: { es?: boolean; className?: string }) {
  const tabs = es
    ? ["Hoy", "Semana", "Mes", "Categorías"]
    : ["Today", "Week", "Month", "Categories"];

  return (
    <div className={cn("relative w-[290px] select-none", className)} aria-hidden>
      {/* Glow behind the device */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl" />

      {/* Device frame */}
      <div className="rounded-[2.6rem] border border-white/12 bg-foreground/5 p-[6px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)]">
        <div className="relative overflow-hidden rounded-[2.15rem] bg-background">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-20 h-[18px] w-[86px] -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-foreground/80">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-foreground/50" />
              <span className="inline-block h-2 w-3 rounded-[2px] bg-foreground/50" />
              <span className="inline-block h-2 w-4 rounded-[2px] border border-foreground/50" />
            </span>
          </div>

          {/* App bar */}
          <div className="mt-3 flex items-center justify-between px-4">
            <span className="text-[11px] font-semibold tracking-tight">
              Whats<span className="text-primary">Your</span>Number
            </span>
            <span className="flex items-center gap-2">
              <span className="relative">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-negative" />
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[8px] font-semibold text-secondary-foreground">
                OA
              </span>
            </span>
          </div>

          {/* Title */}
          <div className="mt-2 flex items-center justify-between px-4">
            <span className="font-display text-xl font-semibold tracking-tight">
              {es ? "Gastos" : "Expenses"}
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex items-center gap-1.5 px-4">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className={cn(
                  "rounded-full px-2 py-1 text-[9px] font-medium",
                  i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-3 space-y-2.5 px-3 pb-3">
            {/* Capture options */}
            <div className="rounded-xl border border-border bg-card/70 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold">
                  {es ? "Agrega un gasto" : "Add an expense"}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {capture.map((item) => (
                  <span
                    key={item.es}
                    className="flex items-center gap-1.5 rounded-lg bg-background/80 px-2 py-1.5 text-[9px] text-foreground/90"
                  >
                    <item.icon className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} />
                    {es ? item.es : item.en}
                  </span>
                ))}
              </div>
            </div>

            {/* Budget alert */}
            <div className="flex items-start gap-2 rounded-xl border border-negative/30 bg-negative/10 px-2.5 py-2">
              <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
              <span className="flex-1">
                <span className="block text-[9.5px] font-medium leading-snug">
                  {es
                    ? "Has gastado 78% de tu presupuesto en restaurantes"
                    : "You've spent 78% of your restaurant budget"}
                </span>
                <span className="mt-0.5 block text-[9px] leading-snug text-muted-foreground">
                  {es
                    ? "Te quedan €55 para el resto del mes."
                    : "€55 left for the rest of the month."}
                </span>
              </span>
            </div>

            {/* Plan card */}
            <div className="rounded-xl border border-border bg-card/70 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex-1">
                  <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">
                    {es ? "Gastos vs plan" : "Spending vs plan"}
                  </span>
                  <span className="mt-1 block font-display text-lg font-semibold leading-none tracking-tight">
                    € 1.945
                  </span>
                  <span className="mt-1 block text-[9px] text-muted-foreground">
                    {es ? "de € 2.500" : "of € 2,500"}
                  </span>
                </span>
                <span className="relative flex h-[58px] w-[58px] items-center justify-center">
                  <svg viewBox="0 0 64 64" className="h-[58px] w-[58px] -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={RING_R}
                      fill="none"
                      strokeWidth="7"
                      className="stroke-border"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r={RING_R}
                      fill="none"
                      strokeWidth="7"
                      strokeLinecap="round"
                      className="stroke-primary"
                      strokeDasharray={RING_C}
                      strokeDashoffset={RING_C * (1 - PLAN_PCT)}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-semibold text-primary">78%</span>
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-border/70 pt-2">
                <span>
                  <span className="block text-[10px] font-semibold text-positive">€ 555</span>
                  <span className="block text-[8px] leading-tight text-muted-foreground">
                    {es ? "Te quedan" : "Left"}
                  </span>
                </span>
                <span>
                  <span className="block text-[10px] font-semibold">12</span>
                  <span className="block text-[8px] leading-tight text-muted-foreground">
                    {es ? "días en el mes" : "days this month"}
                  </span>
                </span>
                <span>
                  <span className="block text-[10px] font-semibold text-positive">€ 46/día</span>
                  <span className="block text-[8px] leading-tight text-muted-foreground">
                    {es ? "para el plan" : "to stay on plan"}
                  </span>
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-xl border border-border bg-card/70 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold">
                  {es ? "Gastos por categoría" : "Spending by category"}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                  {es ? "Este mes" : "This month"}
                  <ChevronDown className="h-2.5 w-2.5" />
                </span>
              </div>

              <div className="mt-2 space-y-2">
                {categories.map((row) => (
                  <span key={row.es} className="block">
                    <span className="flex items-center justify-between text-[9px]">
                      <span className="font-medium">{es ? row.es : row.en}</span>
                      <span className="text-muted-foreground">
                        € {row.now} / € {row.goal}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            row.over ? "bg-negative" : "bg-positive",
                          )}
                          style={{ width: `${Math.min(row.pct, 100)}%` }}
                        />
                      </span>
                      <span
                        className={cn(
                          "w-7 text-right text-[8px] font-semibold",
                          row.over ? "text-negative" : "text-positive",
                        )}
                      >
                        {row.pct}%
                      </span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-end justify-between border-t border-border/70 px-4 pb-3 pt-2">
            {nav.map((item) => (
              <span
                key={item.es}
                className={cn(
                  "flex flex-col items-center gap-1 text-[7.5px]",
                  item.active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                {es ? item.es : item.en}
              </span>
            ))}
          </div>

          {/* Home indicator */}
          <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>
  );
}
