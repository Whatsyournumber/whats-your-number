import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { Progress } from "@/components/ui/progress";
import { fmt, fmtCompact, goals } from "@/lib/data";

export const Route = createFileRoute("/objetivos")({
  head: () => ({
    meta: [
      { title: "Objetivos — Finance OS" },
      { name: "description", content: "Metas de patrimonio, retiro, ETF, fondo de emergencia y viajes con avance en tiempo real." },
      { property: "og:title", content: "Objetivos — Finance OS" },
      { property: "og:description", content: "Sigue el porcentaje de avance de cada meta financiera." },
    ],
  }),
  component: Objetivos,
});

function Objetivos() {
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overall = (totalCurrent / totalTarget) * 100;

  return (
    <PageShell>
      <PageHeader eyebrow="Planificación" title="Objetivos" subtitle="Hacia dónde va tu dinero y cuánto te falta para llegar." />

      <Panel className="relative overflow-hidden">
        <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative flex flex-wrap items-end gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Avance global</p>
            <p className="numeric mt-2 text-4xl font-semibold">{overall.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmtCompact(totalCurrent)} de {fmtCompact(totalTarget)} en metas activas
            </p>
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overall}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g, idx) => {
          const p = Math.min(100, (g.current / g.target) * 100);
          const remaining = Math.max(0, g.target - g.current);
          const monthsLeft = g.monthly ? Math.ceil(remaining / g.monthly) : 0;
          return (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-lg">{g.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-muted-foreground">Meta {g.deadline}</p>
                </div>
                <span className="numeric ml-auto text-lg font-semibold">{p.toFixed(0)}%</span>
              </div>

              <Progress value={p} className="mt-4 h-2" />

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-elevated/60 px-3 py-2">
                  <p className="text-muted-foreground">Actual</p>
                  <p className="numeric text-sm font-medium">{fmtCompact(g.current)}</p>
                </div>
                <div className="rounded-lg bg-elevated/60 px-3 py-2">
                  <p className="text-muted-foreground">Objetivo</p>
                  <p className="numeric text-sm font-medium">{fmtCompact(g.target)}</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Faltan <span className="numeric text-foreground">{fmt(remaining)}</span>
                {monthsLeft > 0 && <> · ~{monthsLeft} meses aportando {fmt(g.monthly)}</>}
              </p>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
}
