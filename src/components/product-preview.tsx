import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis } from "recharts";

import { cn } from "@/lib/utils";

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
  { m: "Ene", v: 3.2 },
  { m: "Feb", v: 2.8 },
  { m: "Mar", v: 3.6 },
  { m: "Abr", v: 3.1 },
  { m: "May", v: 2.6 },
  { m: "Jun", v: 2.9 },
];

const allocation = [
  { name: "ETFs", v: 46 },
  { name: "Acciones", v: 24 },
  { name: "Cripto", v: 12 },
  { name: "Efectivo", v: 18 },
];

const pieColors = ["var(--color-primary)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

const views = [
  { id: "patrimonio", label: "Patrimonio", kpi: "$248,300", delta: "+6.4% este mes" },
  { id: "gastos", label: "Gastos", kpi: "$2,940", delta: "−11% vs. mes previo" },
  { id: "portafolio", label: "Portafolio", kpi: "+18.2%", delta: "vs. S&P 500 +12.1%" },
] as const;

export function ProductPreview() {
  const [active, setActive] = useState<(typeof views)[number]["id"]>("patrimonio");

  useEffect(() => {
    const t = setInterval(() => {
      setActive((cur) => {
        const i = views.findIndex((v) => v.id === cur);
        return views[(i + 1) % views.length]!.id;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const view = views.find((v) => v.id === active)!;

  return (
    <div className="surface overflow-hidden p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              active === v.id
                ? "bg-primary text-primary-foreground"
                : "bg-elevated text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
        <div className="ml-auto hidden items-center gap-1.5 md:flex">
          <span className="h-2 w-2 rounded-full bg-chart-3/70" />
          <span className="h-2 w-2 rounded-full bg-chart-2/70" />
          <span className="h-2 w-2 rounded-full bg-primary/70" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">{view.label}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={view.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <p className="numeric mt-1 text-3xl font-semibold tracking-tight">{view.kpi}</p>
              <p className="mt-1 text-xs text-primary">{view.delta}</p>

              <div className="mt-4 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  {active === "gastos" ? (
                    <BarChart data={spend}>
                      <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
                    </BarChart>
                  ) : (
                    <AreaChart data={netWorth}>
                      <defs>
                        <linearGradient id="pp-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fill="url(#pp-grad)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Asignación de activos</p>
          <div className="mt-2 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="v" innerRadius={40} outerRadius={62} paddingAngle={3} stroke="none">
                  {allocation.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
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
        </div>
      </div>
    </div>
  );
}
