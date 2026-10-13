import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/use-language";

type Row = { session_id: string; user_id: string | null; event: string; step: number | null };

const STEP_LABELS: Record<number, [string, string]> = {
  1: ["Paso 1 · Inicio", "Step 1 · Start"],
  2: ["Paso 2", "Step 2"],
  3: ["Paso 3", "Step 3"],
  4: ["Paso 4", "Step 4"],
  5: ["Paso 5", "Step 5"],
  6: ["Paso 6", "Step 6"],
  7: ["Paso 7", "Step 7"],
  8: ["Paso 8", "Step 8"],
  9: ["Paso 9", "Step 9"],
  10: ["Construyendo tu Número", "Building your Number"],
};

/** Embudo propio: visitas → auth → registro/login → pasos del onboarding → Número listo. */
export function AdminFunnel() {
  const t = useT();
  const [days, setDays] = useState(7);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-funnel", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const all: Row[] = [];
      for (let from = 0; from < 50000; from += 1000) {
        const { data, error } = await supabase
          .from("funnel_events")
          .select("session_id,user_id,event,step")
          .gte("created_at", since)
          .range(from, from + 999);
        if (error) throw error;
        all.push(...(data as Row[]));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });

  const who = (r: Row) => r.user_id ?? r.session_id;
  const count = (pred: (r: Row) => boolean, key: (r: Row) => string = (r) => r.session_id) =>
    new Set(data.filter(pred).map(key)).size;

  const visits = count((r) => r.event === "visit");
  const authViews = count((r) => r.event === "auth_view");
  const signups = count((r) => r.event === "sign_up", who);
  const logins = count((r) => r.event === "login", who);
  const completed = count((r) => r.event === "onboarding_complete", who);

  const main = [
    { label: t("Tráfico (visitas)", "Traffic (visits)"), value: visits },
    { label: t("Abrieron registro / login", "Opened sign up / login"), value: authViews },
    { label: t("Registros nuevos", "New sign-ups"), value: signups },
    { label: t("Empezaron onboarding", "Started onboarding"), value: count((r) => r.event === "onboarding_step" && r.step === 1, who) },
    { label: t("Número listo (conversión)", "Number ready (conversion)"), value: completed },
  ];
  const steps = Object.entries(STEP_LABELS).map(([n, l]) => ({
    label: t(l[0], l[1]),
    value: count((r) => r.event === "onboarding_step" && r.step === Number(n), who),
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
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.value / top) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[1, 7, 30, 90].map((d) => (
          <Button key={d} size="sm" variant={d === days ? "default" : "outline"} onClick={() => setDays(d)}>
            {d} {t("días", "days")}
          </Button>
        ))}
      </div>
      <Panel
        title={t("Embudo de conversión", "Conversion funnel")}
        description={
          isLoading
            ? t("Cargando", "Loading")
            : t(`Conversión total ${visits ? ((completed / visits) * 100).toFixed(1) : "0"}% · Logins ${logins}`, `Overall conversion ${visits ? ((completed / visits) * 100).toFixed(1) : "0"}% · Logins ${logins}`)
        }
      >
        <Bars rows={main} />
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
