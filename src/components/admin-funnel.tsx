import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/use-language";
import { getGa4Traffic } from "@/lib/ga4.functions";

type Ev = { session_id: string; user_id: string | null; event: string; step: number | null };
type Ob = { user_id: string; current_step: number; completed: boolean };

async function pageAll<T>(fn: (from: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const all: T[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await fn(from);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

/** Embudo: tráfico (GA4) → auth → registros → pasos del onboarding → Número listo, con datos históricos. */
export function AdminFunnel() {
  const t = useT();
  const [range, setRange] = useState<DateRange | undefined>({ from: new Date(Date.now() - 29 * 86400_000), to: new Date() });
  const fromD = range?.from ?? new Date(Date.now() - 29 * 86400_000);
  const toD = new Date((range?.to ?? range?.from ?? new Date()).getTime());
  toD.setHours(23, 59, 59, 999);
  const startD = new Date(fromD); startD.setHours(0, 0, 0, 0);
  const since = startD.toISOString();
  const until = toD.toISOString();
  const days = Math.max(1, Math.ceil((Date.now() - startD.getTime()) / 86400_000));
  const { data, isLoading } = useQuery({
    queryKey: ["admin-funnel", since, until],
    queryFn: async () => {
      const [events, profiles, onboarding, ga] = await Promise.all([
        pageAll<Ev>((f) => supabase.from("funnel_events").select("session_id,user_id,event,step").gte("created_at", since).lte("created_at", until).range(f, f + 999)),
        pageAll<{ id: string }>((f) => supabase.from("profiles").select("id").gte("created_at", since).lte("created_at", until).range(f, f + 999)),
        pageAll<Ob>((f) => supabase.from("onboarding_profiles").select("user_id,current_step,completed").gte("created_at", since).lte("created_at", until).range(f, f + 999)),
        getGa4Traffic({ data: { days } }).catch(() => null),
      ]);
      return { events, profiles, onboarding, gaUsers: ga?.configured ? ga.totals.users : 0 };
    },
  });

  const ev = data?.events ?? [];
  const who = (r: Ev) => r.user_id ?? r.session_id;
  const set = (pred: (r: Ev) => boolean, key: (r: Ev) => string = (r) => r.session_id) =>
    new Set(ev.filter(pred).map(key));

  // Historial: onboarding_profiles indica hasta qué paso llegó cada persona.
  const reached = new Map<string, number>();
  for (const o of data?.onboarding ?? []) reached.set(o.user_id, o.completed ? 11 : Math.max(1, o.current_step ?? 1));
  for (const r of ev) {
    if (!r.user_id) continue;
    const s = r.event === "onboarding_complete" ? 11 : r.event === "onboarding_step" ? (r.step ?? 0) : 0;
    if (s > (reached.get(r.user_id) ?? 0)) reached.set(r.user_id, s);
  }
  const atLeast = (n: number) => [...reached.values()].filter((v) => v >= n).length;

  const signupIds = set((r) => r.event === "sign_up", who);
  for (const p of data?.profiles ?? []) signupIds.add(p.id);
  const signups = signupIds.size;
  const authViews = Math.max(set((r) => r.event === "auth_view").size, signups);
  const visits = Math.max(set((r) => r.event === "visit").size, data?.gaUsers ?? 0, authViews);
  const started = atLeast(1);
  const completed = atLeast(11);
  const logins = set((r) => r.event === "login", who).size;

  const main = [
    { label: t("Tráfico (visitantes)", "Traffic (visitors)"), value: visits },
    { label: t("Abrieron registro / login", "Opened sign up / login"), value: authViews },
    { label: t("Registros nuevos", "New sign-ups"), value: signups },
    { label: t("Empezaron onboarding", "Started onboarding"), value: started },
    { label: t("Número listo (conversión)", "Number ready (conversion)"), value: completed },
  ];
  const steps = Array.from({ length: 10 }, (_, i) => ({
    label: i === 9 ? t("Construyendo tu Número", "Building your Number") : t(`Paso ${i + 1}`, `Step ${i + 1}`),
    value: atLeast(i + 1),
  }));
  steps.push({ label: t("Número listo", "Number ready"), value: completed });

  const Bars = ({ rows }: { rows: { label: string; value: number }[] }) => {
    const top = Math.max(1, rows[0]?.value ?? 1);
    return (
      <div className="space-y-2">
        {rows.map((r, i) => {
          const prev = i > 0 ? rows[i - 1]!.value : 0;
          const drop = i > 0 && prev > 0 ? Math.round((1 - r.value / prev) * 100) : null;
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 tabular-nums">
                  <b>{r.value}</b>
                  <span className="ml-2 text-xs text-muted-foreground">{Math.round((r.value / top) * 100)}%</span>
                  {drop !== null && drop > 0 && <span className="ml-2 text-xs text-destructive">−{drop}%</span>}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (r.value / top) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const Funnel = ({ rows }: { rows: { label: string; value: number }[] }) => {
    const W = 360, H = 70, gap = 8, n = rows.length;
    const half = (i: number) => 170 - i * (120 / n);
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <svg viewBox={`0 0 ${W} ${n * (H + gap) + 20}`} className="w-full max-w-sm shrink-0">
          {rows.map((r, i) => {
            const y = 12 + i * (H + gap);
            const a = half(i), b = half(i + 1), c = W / 2, color = COLORS[i % COLORS.length];
            return (
              <g key={r.label}>
                <path d={`M ${c - a} ${y} L ${c + a} ${y} L ${c + b} ${y + H} A ${b} 10 0 0 1 ${c - b} ${y + H} Z`} fill={color} opacity={0.9} />
                <ellipse cx={c} cy={y} rx={a} ry={11} fill={color} style={{ filter: "brightness(0.75)" }} />
                <text x={c} y={y + H / 2 + 10} textAnchor="middle" className="fill-background" style={{ fontSize: 22, fontWeight: 700 }}>{r.value}</text>
              </g>
            );
          })}
        </svg>
        <div className="flex-1 space-y-3">
          {rows.map((r, i) => {
            const prev = i > 0 ? rows[i - 1]!.value : 0;
            const drop = i > 0 && prev > 0 ? Math.round((1 - r.value / prev) * 100) : null;
            return (
              <div key={r.label} className="flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold uppercase tracking-wide">{r.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.value} · {Math.round((r.value / Math.max(1, rows[0]!.value)) * 100)}% {t("del tráfico", "of traffic")}
                    {drop !== null && drop > 0 && <span className="ml-2 text-destructive">−{drop}% {t("vs anterior", "vs previous")}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const rate = visits ? ((completed / visits) * 100).toFixed(1) : "0";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90, 365].map((d) => (
          <Button key={d} size="sm" variant="outline" onClick={() => setRange({ from: new Date(Date.now() - (d - 1) * 86400_000), to: new Date() })}>
            {d} {t("días", "days")}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="default">
              <CalendarIcon className="h-4 w-4" />
              {format(startD, "dd/MM/yyyy")} – {format(toD, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} disabled={{ after: new Date() }} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      <Panel
        title={t("Embudo de conversión", "Conversion funnel")}
        description={isLoading ? t("Cargando", "Loading") : t(`Conversión total ${rate}% · Logins ${logins}`, `Overall conversion ${rate}% · Logins ${logins}`)}
      >
        <Funnel rows={main} />
      </Panel>
      <Panel
        title={t("¿Dónde se quedan en el onboarding?", "Where do people drop in onboarding?")}
        description={t("Personas que llegaron a cada paso; en rojo, la caída frente al paso anterior", "People reaching each step; red shows drop vs previous step")}
      >
        <Bars rows={steps} />
      </Panel>
    </div>
  );
}
