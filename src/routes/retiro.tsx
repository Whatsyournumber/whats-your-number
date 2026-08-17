import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { Pencil, X } from "lucide-react";

import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { buildDataset, projectRetirementFrom } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/retiro")({
  head: () => ({
    meta: [
      { title: "WhatsYournumber — Tu número de retiro" },
      { name: "description", content: "Tu número: capital objetivo, aportes, rentabilidad anual y simulador de proyección." },
      { property: "og:title", content: "WhatsYournumber — Tu número de retiro" },
      { property: "og:description", content: "Proyecta tu número ajustando aporte mensual, rentabilidad y edad objetivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Retiro,
});


function RetiroContent() {
  const t = useT();
  const { profile, save, saving } = useProfile();

  // Editor de "tu número": ingreso mensual deseado y tasa de retiro elegida.
  const [wantMonthly, setWantMonthly] = useState(profile.desired_retirement_income);
  const [swr, setSwr] = useState(profile.withdrawal_rate || 7);
  useEffect(() => {
    setWantMonthly(profile.desired_retirement_income);
    setSwr(profile.withdrawal_rate || 7);
  }, [profile.desired_retirement_income, profile.withdrawal_rate]);


  const d = buildDataset(profile);
  const { retirement, fmt, fmtCompact, plan } = d;

  const liveNumber = Math.round((Math.max(0, wantMonthly) * 12) / (Math.min(15, Math.max(3, swr)) / 100));
  const numberDirty = wantMonthly !== profile.desired_retirement_income || swr !== (profile.withdrawal_rate || 7);

  const [editing, setEditing] = useState(false);

  // Solo activos que generan retorno (excluye propiedades).
  const investable =
    profile.assets_cash +
    profile.assets_bank +
    profile.assets_retirement +
    profile.assets_etf +
    profile.assets_stocks +
    profile.assets_crypto;
  const progressPct = plan.targetCapital > 0 ? Math.max(0, (investable / plan.targetCapital) * 100) : 0;


  const [monthly, setMonthly] = useState(retirement.monthlyContribution);
  const [rate, setRate] = useState(retirement.returnAnnualized);
  const [retireAge, setRetireAge] = useState(retirement.retireAge);

  // El simulador cambia según tu objetivo: libertad financiera, vivienda o negocio.
  const goalMode = plan.mode;
  const isGoal = goalMode !== "freedom";
  const goalLabel =
    goalMode === "home" ? t("Entrada de tu vivienda", "Your home down payment") : t("Capital para tu negocio", "Capital for your business");
  const defaultHorizon = Math.max(1, Math.min(15, Math.ceil((plan.monthsToGoal || 36) / 12)));
  const [horizonYears, setHorizonYears] = useState(defaultHorizon);

  // Sincroniza el simulador cuando el perfil termina de cargar o el usuario edita sus datos.
  useEffect(() => {
    setMonthly(retirement.monthlyContribution);
    setRate(retirement.returnAnnualized);
    setRetireAge(retirement.retireAge);
  }, [retirement.monthlyContribution, retirement.returnAnnualized, retirement.retireAge]);

  useEffect(() => {
    setHorizonYears(defaultHorizon);
  }, [defaultHorizon]);


  const years = isGoal ? horizonYears : Math.max(0, retireAge - retirement.currentAge);
  // Parte de TODO lo que ya tengo invertido (no solo la cuenta de retiro).
  const data = projectRetirementFrom(monthly, rate, years, investable, retirement.currentAge);
  const final = data[data.length - 1]!;
  // El objetivo se compara contra tu meta activa (vivienda/negocio) o el número que editas en vivo.
  const targetNow = isGoal ? plan.targetCapital : liveNumber > 0 ? liveNumber : plan.targetCapital;
  const gap = targetNow - final.value;

  // Aporte mensual necesario para alcanzar el objetivo (negocio/vivienda) según lo que ya tienes,
  // la rentabilidad elegida y el plazo. En libertad financiera usa tu capacidad de ahorro real.
  const requiredMonthly = (() => {
    if (!isGoal) return Math.max(0, d.income - d.expenses);
    const r = rate / 100;
    const months = Math.max(1, years * 12);
    const fvCurrent = investable * Math.pow(1 + r, years);
    const remaining = Math.max(0, targetNow - fvCurrent);
    if (remaining <= 0) return 0;
    const mr = r / 12;
    return Math.ceil(mr > 0 ? (remaining * mr) / (Math.pow(1 + mr, months) - 1) : remaining / months);
  })();

  // En modo negocio/vivienda el simulador parte del aporte mensual necesario para llegar a tiempo.
  useEffect(() => {
    if (isGoal) setMonthly(requiredMonthly);
  }, [requiredMonthly, isGoal]);

  // Escenarios de renta mensual: se construyen alrededor de TU número (el que estás editando).
  const baseNumber = targetNow > 0 ? targetNow : 1_000_000;
  const roundNice = (v: number) => {
    if (v <= 0) return 0;
    const mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
    return Math.max(mag, Math.round(v / mag) * mag);
  };
  const capitals = Array.from(
    new Set([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((m) => roundNice(baseNumber * m)).filter((v) => v > 0)),
  ).sort((a, b) => a - b);
  const rates = [4, 6, 8, 10, 12];

  const headerSubtitle =
    goalMode === "home"
      ? t(
          "Cuánto necesitas para la entrada de tu vivienda y cuánto llevas ahorrado.",
          "How much you need for your home down payment and how much you have saved.",
        )
      : goalMode === "business"
        ? t(
            "Cuánto capital necesitas para montar tu negocio y cuánto llevas ahorrado.",
            "How much capital you need to launch your business and how much you have saved.",
          )
        : t(
            "Cuánto tienes hoy y cuánto tendrás cuando dejes de trabajar.",
            "How much you have today and how much you will have when you stop working.",
          );

  return (
    <PageShell>
      <PageHeader eyebrow={t("Largo plazo", "Long term")} title="WhatsYournumber" subtitle={headerSubtitle} />


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          className={cn("surface relative overflow-hidden p-5 glow", editing ? "ring-1 ring-primary/20" : "cursor-pointer hover:bg-elevated/40")}
          onClick={() => !editing && setEditing(true)}
        >
          <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />
          {!editing ? (
            <>
              <div className="relative flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">WhatsYournumber</p>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="numeric relative mt-3 text-2xl font-semibold md:text-3xl">{fmt(plan.targetCapital)}</p>
              <div className="relative mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{`${fmt(Math.round((plan.targetCapital * (swr / 100)) / 12))} ${t("al mes con", "per month at")} ${swr}%`}</span>
              </div>
            </>
          ) : (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t("Edita tu número", "Edit your number")}</p>
                <button type="button" onClick={() => setEditing(false)} className="rounded-full p-1 text-muted-foreground hover:bg-elevated hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("Ingreso mensual", "Monthly income")}</label>
                <Input
                  type="number"
                  className="mt-1 h-9 border-0 border-b border-border bg-transparent px-0 text-lg font-medium shadow-none focus-visible:ring-0"
                  value={wantMonthly || ""}
                  onChange={(e) => setWantMonthly(Number(e.target.value || 0))}
                  placeholder="7000"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span>{t("Tasa de retiro", "Withdrawal rate")}</span>
                  <span className="numeric text-sm font-medium text-foreground">{swr.toFixed(1)}%</span>
                </div>
                <div className="relative mt-3">
                  <Slider value={[swr]} min={3} max={15} step={0.5} onValueChange={(v) => setSwr(v[0] ?? 4)} />
                  <div className="relative mt-3 h-5 w-full">
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((r) => {
                      const pct = ((r - 3) / (15 - 3)) * 100;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSwr(r)}
                          className="absolute top-0 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[10px] transition-colors"
                          style={{ left: `${pct}%` }}
                        >
                          <span className={swr === r ? "rounded-full bg-primary/15 px-1.5 py-0.5 text-foreground" : "text-muted-foreground hover:text-foreground"}>
                            {r}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="numeric text-lg font-semibold leading-tight">{fmtCompact(liveNumber)}</p>
                  <p className="text-[10px] text-muted-foreground">{fmt(wantMonthly)}/{t("mes", "mo")} · {swr.toFixed(1)}%</p>
                </div>
                <Button
                  size="sm"
                  variant={numberDirty ? "default" : "outline"}
                  className="rounded-full px-4"
                  disabled={!numberDirty || saving}
                  onClick={() => {
                    void save({ desired_retirement_income: wantMonthly, withdrawal_rate: swr }).then(() => {
                      toast.success(t("Tu número se actualizó", "Your number was updated"));
                      setEditing(false);
                    });
                  }}
                >
                  {saving ? t("Guardando…", "Saving…") : t("Guardar", "Save")}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <KpiCard
          label={t("Ingreso mensual", "Monthly income")}
          value={fmt(d.income)}
          hint={t("lo que entra cada mes", "what comes in each month")}
          index={1}
        />
        <EditableKpiCard
          label={t("Cuánto tengo", "How much I have")}
          value={fmt(investable)}
          rawValue={investable}
          format={fmt}
          onChange={(v) => {
            const others = investable - profile.assets_bank;
            void save({ assets_bank: Math.max(0, Math.round(v - others)) });
          }}
          hint={t("Ahorros e inversiones — sin contar propiedades", "Savings and investments — excluding properties")}
          index={2}
        />

        <Link to="/gastos" className="block rounded-[inherit] transition-transform hover:-translate-y-0.5">
          <KpiCard label={t("Gastos mensuales", "Monthly expenses")} value={fmt(d.expenses)} hint={`${fmt(d.expenses * 12)} ${t("al año", "per year")}`} index={3} />
        </Link>
        <KpiCard label={t("Rentabilidad esperada", "Expected return")} value={`${swr}%`} hint={t("anual · tu tasa de retiro", "annual · your withdrawal rate")} index={4} />
        {goalMode === "business" && (
          <KpiCard
            label={t("Aporte necesario al mes", "Required monthly contribution")}
            value={fmt(requiredMonthly)}
            hint={t("para llegar a tu capital en el plazo", "to reach your capital on time")}
            index={5}
          />
        )}
      </div>
      <div className="surface p-5">
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="min-w-0 text-muted-foreground">{t("Progreso hacia tu capital objetivo", "Progress toward your target capital")}</span>
          <span className="numeric whitespace-nowrap font-semibold sm:text-right">
            {fmt(investable)} / {fmt(plan.targetCapital)}
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-elevated">
          <div className="wealth-gradient h-full rounded-full" style={{ width: `${Math.min(100, progressPct)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("Vas al", "You're at")} {progressPct.toFixed(1)}% · {t("te faltan", "you still need")} {fmt(Math.max(0, plan.targetCapital - investable))} {t("en inversiones que generen retorno.", "in return-generating investments.")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={isGoal ? t("Proyección hasta tu objetivo", "Projection to your goal") : t("Proyección hasta el retiro", "Projection to retirement")}
          description={
            isGoal
              ? `${goalLabel} · ${t("saldo estimado en", "estimated balance in")} ${horizonYears} ${horizonYears === 1 ? t("año", "year") : t("años", "years")}`
              : `${t("Saldo estimado a los", "Estimated balance at")} ${retireAge} ${t("años", "years old")}`
          }
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="year" {...axisProps} tickFormatter={(v) => `${v}a`} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={62} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" name={t("Proyección", "Projection")} stroke="var(--color-chart-4)" strokeWidth={2.5} fill="url(#ret)" />
              <Area type="monotone" dataKey="contributed" name={t("Aportado", "Contributed")} stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title={t("Simulador", "Simulator")}
          description={isGoal ? `${goalLabel} · ${fmt(plan.targetCapital)}` : t("Ajusta y mira el impacto", "Adjust and see the impact")}
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{isGoal ? t("Ahorro mensual", "Monthly saving") : t("Aporte mensual", "Monthly contribution")}</span>
                <span className="numeric font-semibold">{fmt(monthly)}</span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={Math.max(500, Math.round(d.savings * 2) || 3000)}
                step={50}
                value={[monthly]}
                onValueChange={([v]) => setMonthly(v ?? 0)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("Rentabilidad anual", "Annual return")}</span>
                <span className="numeric font-semibold">{rate}%</span>
              </div>
              <Slider className="mt-3" min={1} max={15} step={0.5} value={[rate]} onValueChange={([v]) => setRate(v ?? 7)} />
            </div>
            {isGoal ? (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("Plazo para lograrlo", "Time to reach it")}</span>
                  <span className="numeric font-semibold">
                    {horizonYears} {horizonYears === 1 ? t("año", "year") : t("años", "years")}
                  </span>
                </div>
                <Slider
                  className="mt-3"
                  min={1}
                  max={15}
                  step={1}
                  value={[horizonYears]}
                  onValueChange={([v]) => setHorizonYears(v ?? defaultHorizon)}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("Edad de retiro", "Retirement age")}</span>
                  <span className="numeric font-semibold">{retireAge} {t("años", "years old")}</span>
                </div>
                <Slider
                  className="mt-3"
                  min={Math.min(retirement.currentAge + 1, 80)}
                  max={85}
                  step={1}
                  value={[retireAge]}
                  onValueChange={([v]) => setRetireAge(v ?? retirement.retireAge)}
                />
              </div>
            )}
            <div className="rounded-xl bg-elevated/60 p-4">
              <p className="text-xs text-muted-foreground">{isGoal ? t("Tendrías en", "You'd have in") + ` ${horizonYears}a` : t("Saldo proyectado", "Projected balance")}</p>
              <p className="numeric mt-1 text-2xl font-semibold">{fmt(final.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {gap <= 0
                  ? `${isGoal ? t("Superas tu objetivo por", "You exceed your goal by") : t("Superas tu número por", "You exceed your number by")} ${fmt(-gap)} 🎯`
                  : `${t("Te faltarían", "You'd still need")} ${fmt(gap)}`}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("Partes de", "Starting from")} {fmt(investable)}{" "}
                {isGoal ? `${t("que ya tienes ·", "you already have ·")} ${goalLabel} ${fmt(targetNow)}` : `${t("que ya tienes · objetivo", "you already have · target")} ${fmt(targetNow)}`}
              </p>
              {isGoal && gap > 0 && years > 0 ? (
                <p className="mt-2 text-[11px] text-primary">
                  {t("Ahorra", "Save")} {fmt(Math.ceil(gap / (years * 12)))}/{t("mes más para llegar a tiempo", "mo more to make it on time")}
                </p>
              ) : null}
            </div>


          </div>
        </Panel>
      </div>

      <Panel
        title={t("Escenarios: renta mensual según tu capital", "Scenarios: monthly income based on your capital")}
        description={`${t("Cuánto podrías retirar cada mes según el capital acumulado y la rentabilidad anual. En verde, lo que cubre tus gastos de", "How much you could withdraw monthly based on accumulated capital and annual return. In green, what covers your expenses of")} ${fmt(d.expenses)}.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">{t("Capital", "Capital")}</th>
                {rates.map((rr) => (
                  <th key={rr} className="px-3 py-2 text-right font-medium">
                    {rr}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capitals.map((cap) => (
                <tr
                  key={cap}
                  className={cn(
                    "border-b border-border/60 last:border-0 hover:bg-elevated/40",
                    cap === roundNice(baseNumber) && "bg-primary/5",
                  )}
                >
                  <td className="numeric px-3 py-3 text-left font-semibold">
                    {fmt(cap)}
                    {cap === roundNice(baseNumber) && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                        {t("tu número", "your number")}
                      </span>
                    )}
                  </td>
                  {rates.map((rr) => {
                    const inc = (cap * (rr / 100)) / 12;
                    const covers = inc >= d.expenses && d.expenses > 0;
                    return (
                      <td key={rr} className={`numeric px-3 py-3 text-right ${covers ? "font-medium text-positive" : ""}`}>
                        {fmt(Math.round(inc))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("Renta mensual = capital × rentabilidad anual ÷ 12.", "Monthly income = capital × annual return ÷ 12.")}</p>
      </Panel>

    </PageShell>
  );
}

function Retiro() {
  return (
    <PlanGate required="pro">
      <RetiroContent />
    </PlanGate>
  );
}

