import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
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
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-funnel", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const [events, profiles, onboarding, ga] = await Promise.all([
        pageAll<Ev>((f) => supabase.from("funnel_events").select("session_id,user_id,event,step").gte("created_at", since).range(f, f + 999)),
        pageAll<{ id: string }>((f) => supabase.from("profiles").select("id").gte("created_at", since).range(f, f + 999)),
        pageAll<Ob>((f) => supabase.from("onboarding_profiles").select("user_id,current_step,completed").gte("created_at", since).range(f, f + 999)),
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
  const visits = Math.max(set((r) => r.event === "visit").size, data?.gaUsers ?? 0);
  const authViews = Math.max(set((r) => r.event === "auth_view").size, signups);
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

  const Funnel = ({ rows }: { rows: { label: string; value: number }[] }) => {
    const top = Math.max(1, ...rows.map((r) => r.value));
    return (
      <div className="flex flex-col items-center gap-1.5">
        {rows.map((r, i) => {
          const prev = i > 0 ? rows[i - 1]!.value : 0;
          const drop = i > 0 && prev > 0 ? Math.round((1 - r.value / prev) * 100) : null;
          const width = Math.max(18, (r.value / top) * 100);
          return (
            <div key={r.label} className="flex w-full items-center gap-3">
              <div className="flex flex-1 justify-center">
                <div
                  className="flex h-11 items-center justify-center rounded-md bg-primary/80 px-3 text-primary-foreground transition-all"
                  style={{ width: `${width}%`, opacity: 1 - i * (0.5 / rows.length) }}
                >
                  <span className="truncate text-sm font-medium">{r.label}</span>
                </div>
              </div>
              <div className="w-28 shrink-0 text-right text-sm tabular-nums">
                <b className="text-base">{r.value}</b>
                <span className="ml-1.5 text-xs text-muted-foreground">{Math.round((r.value / Math.max(1, rows[0]!.value)) * 100)}%</span>
                {drop !== null && drop > 0 && <div className="text-xs text-destructive">−{drop}%</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const rate = visits ? ((completed / visits) * 100).toFixed(1) : "0";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90, 365].map((d) => (
          <Button key={d} size="sm" variant={d === days ? "default" : "outline"} onClick={() => setDays(d)}>
            {d} {t("días", "days")}
          </Button>
        ))}
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
        <Funnel rows={steps} />
      </Panel>
    </div>
  );
}
