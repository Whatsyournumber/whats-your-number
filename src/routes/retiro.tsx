import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { Pencil, X } from "lucide-react";
import { ScrollXButtons, useScrollX } from "@/components/scroll-x";

import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { useHoldings, holdingValue } from "@/hooks/use-holdings";
import { useQuotes } from "@/hooks/use-market";

import { useT } from "@/hooks/use-language";
import { buildDataset, projectRetirementFrom } from "@/lib/profile-data";
import { cn } from "@/lib/utils";
import { Amount } from "@/components/ui/amount";
import { currencySymbol } from "@/lib/onboarding";

export const Route = createFileRoute("/retiro")({
  head: () => ({
    meta: [
      { title: "WhatsYourNumber" },
      { name: "description", content: "Tu número: capital objetivo, aportes, rentabilidad anual y simulador de proyección." },
      { property: "og:title", content: "WhatsYourNumber" },
      { property: "og:description", content: "Proyecta tu número ajustando aporte mensual, rentabilidad y edad objetivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Retiro,
});


function RetiroContent() {
  const isMobile = useIsMobile();
  const t = useT();
  const { profile, save, saving } = useProfile();
  const { holdings } = useHoldings();
  const holdingSymbols = holdings.filter((h) => h.ticker && h.quantity > 0).map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries(
    (holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]),
  );


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
  const [editingAge, setEditingAge] = useState(false);
  const [draftAge, setDraftAge] = useState(0);

  // Solo activos que generan retorno (excluye propiedades). Viene del detalle de "Mis datos".
  const investableFallback =
    profile.assets_cash +
    profile.assets_bank +
    profile.assets_retirement +
    profile.assets_etf +
    profile.assets_stocks +
    profile.assets_crypto;
  const investableFromHoldings = holdings
    .filter((h) => h.kind !== "property" && h.kind !== "debt")
    .reduce((s, h) => s + holdingValue(h, prices), 0);
  const investable = holdings.length ? investableFromHoldings : investableFallback;

  const progressPct = plan.targetCapital > 0 ? Math.max(0, (investable / plan.targetCapital) * 100) : 0;
  const pctBar = Math.min(100, progressPct);
  const pctShift = pctBar < 10 ? "0%" : pctBar > 90 ? "-100%" : "-50%";


  const [monthly, setMonthly] = useState(retirement.monthlyContribution);
  const [rate, setRate] = useState(retirement.returnAnnualized);
  const [retireAge, setRetireAge] = useState(retirement.retireAge);

  // El simulador cambia según tu objetivo: libertad financiera, vivienda o negocio.
  const goalMode = plan.mode;
  const isGoal = goalMode !== "freedom";
  const goalLabel =
    goalMode === "home" ? t("Entrada de tu vivienda", "Your home down payment") : t("Capital para tu negocio", "Capital for your business");
  // El plazo por defecto es la edad objetivo que elegiste ("¿a qué edad quieres lograrlo?").
  // Si no hay edad válida, caemos al plazo estimado por tu capacidad de ahorro.
  const ageHorizon = Math.max(0, (retirement.retireAge || 0) - retirement.currentAge);
  const defaultHorizon = Math.max(
    1,
    Math.min(30, ageHorizon > 0 ? ageHorizon : Math.ceil((plan.monthsToGoal || 36) / 12)),
  );
  const [horizonYears, setHorizonYears] = useState(defaultHorizon);

  // Sincroniza el simulador cuando el perfil termina de cargar o el usuario edita sus datos.
  // En libertad financiera arranca con la rentabilidad histórica del S&P 500 (10%).
  useEffect(() => {
    if (isGoal || !simPrefilled.current) setMonthly(retirement.monthlyContribution);
    setRate(isGoal ? retirement.returnAnnualized : 10);
    setRetireAge(retirement.retireAge);
  }, [retirement.monthlyContribution, retirement.returnAnnualized, retirement.retireAge, isGoal]);

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

  // Aporte mensual necesario para llegar a tu número antes de tu edad de retiro.
  // Se usa el rendimiento REAL (10% histórico S&P 500 menos ~3% de inflación),
  // porque tu número objetivo está expresado en dinero de hoy. Así el aporte baja
  // cuanto más años tienes por delante, sin caer artificialmente a 0.
  const sp500Monthly = (() => {
    if (targetNow <= 0) return 0;
    const yrs = Math.max(1, retireAge - retirement.currentAge);
    const realAnnual = 0.07;
    const mr = Math.pow(1 + realAnnual, 1 / 12) - 1;
    const months = yrs * 12;
    const fvCurrent = investable * Math.pow(1 + realAnnual, yrs);
    const remaining = targetNow - fvCurrent;
    if (remaining <= 0) return 0;
    return Math.ceil((remaining * mr) / (Math.pow(1 + mr, months) - 1));
  })();


  // El simulador arranca con el aporte mensual sugerido para llegar a tu número
  // a la edad de retiro elegida (al 10% del S&P 500). Después el usuario puede moverlo.
  const simPrefilled = useRef(false);
  useEffect(() => {
    if (isGoal || simPrefilled.current) return;
    if (sp500Monthly <= 0) return;
    simPrefilled.current = true;
    setMonthly(sp500Monthly);
  }, [sp500Monthly, isGoal]);
  // Lo que de verdad apartaste este mes (tu ahorro mensual actual).
  const thisMonthContribution = Math.max(0, d.savings);

  const commitAge = () => {
    if (!draftAge || draftAge <= retirement.currentAge) return;
    setEditingAge(false);
    if (draftAge === profile.retire_age) return;
    void save({ retire_age: draftAge }).then(() =>
      toast.success(t("Edad de retiro actualizada", "Retirement age updated")),
    );
  };

  // Aporte mensual necesario para alcanzar el objetivo (negocio/vivienda) según lo que ya tienes,
  // la rentabilidad elegida y el plazo. En libertad financiera usa tu capacidad de ahorro real.
  const goalReached = isGoal && targetNow > 0 && investable >= targetNow;
  const requiredMonthly = (() => {
    if (!isGoal) return Math.max(0, d.income - d.expenses);
    if (targetNow <= 0) return 0;
    const r = rate / 100;
    const months = Math.max(1, Math.round(years * 12));
    const fvCurrent = investable * Math.pow(1 + r, years);
    const remaining = Math.max(0, targetNow - fvCurrent);
    if (remaining <= 0) return 0;
    const mr = r / 12;
    return Math.ceil(mr > 0 ? (remaining * mr) / (Math.pow(1 + mr, months) - 1) : remaining / months);
  })();
  const yearsLabel = `${horizonYears} ${horizonYears === 1 ? t("año", "year") : t("años", "years")}`;

  // Realismo: lo que de verdad te sobra hoy con tus gastos reales (fijos + variables importados).
  const capacity = Math.max(0, d.income - d.expenses);
  const feasible = requiredMonthly <= capacity;
  const shortfallMonthly = Math.max(0, requiredMonthly - capacity);
  // Con tu capacidad real de ahorro, ¿en cuántos años llegarías?
  const realisticYears = (() => {
    if (!isGoal || targetNow <= 0 || goalReached) return 0;
    const r = rate / 100;
    const mr = r / 12;
    let balance = investable;
    for (let m = 1; m <= 720; m += 1) {
      balance = balance * (1 + mr) + capacity;
      if (balance >= targetNow) return Math.round((m / 12) * 10) / 10;
    }
    return 0; // no alcanzable en 60 años con el ahorro actual
  })();
  const expenseCutNeeded = shortfallMonthly;

  // En modo negocio/vivienda el simulador parte del aporte mensual necesario para llegar a tiempo.
  useEffect(() => {
    if (isGoal) setMonthly(requiredMonthly);
  }, [requiredMonthly, isGoal]);

  // Escenarios de renta mensual: se construyen alrededor de TU número exacto (el que estás editando).
  const baseNumber = targetNow > 0 ? targetNow : 1_000_000;
  const roundNice = (v: number) => {
    if (v <= 0) return 0;
    const mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
    return Math.max(mag, Math.round(v / mag) * mag);
  };
  // Escenarios: tu número exacto en el centro, 4 valores por arriba y 4 por debajo.
  const capitals = Array.from(
    new Set(
      [0.29, 0.465, 0.6, 0.7, 1, 1.167, 1.458, 1.75, 2.917]
        .map((m) => {
          const v = baseNumber * m;
          return m === 1 ? baseNumber : roundNice(v);
        })
        .filter((v) => v > 0),
    ),
  ).sort((a, b) => a - b);
  const rates = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  const scenariosScroll = useScrollX();

  // El subtítulo siempre cambia según el objetivo elegido en el onboarding / perfil.
  const priority = (profile as { priority?: string }).priority || "libertad";
  const goalNote = ((profile as { goal_note?: string }).goal_note || "").trim();
  const headerSubtitle =
    goalMode === "home"
      ? t(
          "Cuánto necesitas para la entrada de tu vivienda y cuánto llevas ahorrado.",
          "How much you need for your home down payment and how much you have saved.",
        )
      : goalMode === "business"
        ? priority === "otro"
          ? t(
              "Cuánto capital necesitas para tu objetivo y cuánto llevas ahorrado.",
              "How much capital you need for your goal and how much you have saved.",
            )
          : t(
              "Cuánto capital necesitas para montar tu negocio y cuánto llevas ahorrado.",
              "How much capital you need to launch your business and how much you have saved.",
            )
        : priority === "gastos"
          ? t(
              "Controla tus gastos y mira cuánto capital necesitas para vivir de tus inversiones.",
              "Control your spending and see how much capital you need to live off your investments.",
            )
          : priority === "patrimonio"
            ? t(
                "Cuánto patrimonio tienes hoy y hasta dónde puede crecer con tus aportes.",
                "How much wealth you have today and how far it can grow with your contributions.",
              )
            : priority === "organizar"
              ? t(
                  "Ordena tu dinero y mira cuánto necesitas para alcanzar tu número.",
                  "Organize your money and see how much you need to reach your number.",
                )
              : t(
                  "Cuánto tienes hoy y cuánto tendrás cuando dejes de trabajar.",
                  "How much you have today and how much you will have when you stop working.",
                );


  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Largo plazo", "Long term")}
        title={t("WhatsYourNumber", "WhatsYourNumber")}
        subtitle={
          isMobile
            ? goalMode === "home"
              ? t("Entrada de tu vivienda y tu ahorro.", "Your home down payment and savings.")
              : goalMode === "business"
                ? t("Capital para tu objetivo y tu ahorro.", "Capital for your goal and savings.")
                : t("Cuánto necesitas para no trabajar.", "How much you need to stop working.")
            : headerSubtitle
        }
      />


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
                <span className="text-xs text-muted-foreground">
                  {isGoal
                    ? `${t("Capital para llegar a tu objetivo", "Capital to reach your goal")}${goalNote ? `: ${goalNote}` : ""}`
                    : `${fmt(Math.round((plan.targetCapital * (swr / 100)) / 12))} ${t("al mes con", "per month at")} ${swr}%`}
                </span>
              </div>
            </>
          ) : (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t("Edita tu número", "Edit your number")}</p>
                <button type="button" aria-label={t("Cerrar edición", "Close editor")} onClick={() => setEditing(false)} className="rounded-full p-1 text-muted-foreground hover:bg-elevated hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t("Ingreso mensual deseado", "Desired monthly income")}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="numeric mt-2 h-auto border-0 bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                  value={(() => {
                    if (!wantMonthly) return "";
                    const sym = currencySymbol(profile.currency || "USD");
                    return `${sym} ${Math.round(wantMonthly).toLocaleString("en-US")}`;
                  })()}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setWantMonthly(digits ? Number(digits) : 0);
                  }}
                  placeholder={`${currencySymbol(profile.currency || "USD")} 10,000`}
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
                  <p className="text-lg font-semibold leading-tight"><Amount full={fmt(liveNumber)} short={fmtCompact(liveNumber)} from="lg" /></p>
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



        <Link to="/mi-perfil" hash="patrimonio" className="block rounded-[inherit] transition-transform hover:-translate-y-0.5">
          <KpiCard
            label={t("Cuánto tengo", "How much I have")}
            value={fmt(investable)}
            icon={Pencil}
            hint={t("Inversiones, sin inmuebles", "Investments, no property")}
            index={2}
          />
        </Link>

        {!isGoal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.11, ease: "easeOut" }}
            className="surface relative overflow-hidden p-5"
          >
            <p className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("Aporte mensual", "Monthly saving")}
            </p>
            <div className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="numeric text-2xl font-semibold md:text-3xl">{fmt(sp500Monthly)}</p>
              <span className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                S&P 500 · 7% real
              </span>
            </div>
            <p className="relative mt-2 text-[11px]">
              {t("Aportaste", "You put in")}{" "}
              <span className={cn("numeric font-semibold", thisMonthContribution >= sp500Monthly ? "text-positive" : "text-negative")}>
                {fmt(thisMonthContribution)}
              </span>
              {sp500Monthly > 0 && (
                <span className={cn("ml-1 font-medium", thisMonthContribution >= sp500Monthly ? "text-positive" : "text-negative")}>
                  {thisMonthContribution >= sp500Monthly
                    ? t("· en camino", "· on track")
                    : `${t("· faltan", "· short by")} ${fmt(sp500Monthly - thisMonthContribution)}`}
                </span>
              )}
            </p>
          </motion.div>
        )}

        {goalMode === "business" && (
          <KpiCard
            label={t("Ingreso mensual", "Monthly income")}
            value={fmt(d.income)}
            hint={t("lo que entra cada mes", "what comes in each month")}
            index={1}
          />
        )}

        {!isGoal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
            className="surface relative flex h-full flex-col overflow-hidden p-5"
          >
            <div className="relative flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("Edad de retiro", "Retirement age")}
              </p>
              {!editingAge && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftAge(retireAge);
                    setEditingAge(true);
                  }}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-elevated hover:text-foreground"
                  title={t("Editar edad de retiro", "Edit retirement age")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            {editingAge ? (
              <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    className="numeric h-10 w-24 text-2xl font-semibold"
                    value={draftAge ? String(draftAge) : ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setDraftAge(digits ? Number(digits) : 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingAge(false);
                      if (e.key === "Enter") commitAge();
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{t("años", "years")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    disabled={saving || !draftAge || draftAge <= retirement.currentAge}
                    onClick={commitAge}
                  >
                    {saving ? t("Guardando", "Saving") : t("Guardar", "Save")}
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full px-3" onClick={() => setEditingAge(false)}>
                    {t("Cancelar", "Cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="numeric relative mt-3 text-2xl font-semibold md:text-3xl">
                  {retireAge} <span className="text-base font-medium text-muted-foreground">{t("años", "years")}</span>
                </p>
                <p className="relative mt-2 text-[11px] text-muted-foreground">
                  {retirement.currentAge} {t("hoy", "today")} · {Math.max(0, retireAge - retirement.currentAge)} {t("años restantes", "yrs left")}
                </p>
              </>
            )}
          </motion.div>
        )}
        {isGoal && goalMode !== "business" && (
          <KpiCard label={t("Cómo voy", "How I'm doing")} value={`${progressPct.toFixed(1)}%`} hint={t("del capital objetivo", "of target capital")} index={2} />
        )}
        {isGoal && (
          <KpiCard
            label={t("Porcentaje de mi ingreso", "Share of my income")}
            value={
              targetNow <= 0
                ? "—"
                : `${d.income > 0 ? Math.min(999, Math.round((requiredMonthly / d.income) * 100)) : 0}%`
            }
            hint={
              targetNow <= 0
                ? t("define el monto de tu objetivo", "set your goal amount")
                : goalReached
                  ? t("ya tienes el capital 🎯", "you already have the capital 🎯")
                  : `${t("de tu ingreso durante", "of your income for")} ${yearsLabel}`
            }
            index={3}
          />
        )}
        {isGoal && (
          <KpiCard
            label={t("Aporte necesario al mes", "Required monthly contribution")}
            value={targetNow <= 0 ? "—" : fmt(requiredMonthly)}
            hint={
              targetNow <= 0 ? (
                t("falta el monto objetivo", "goal amount missing")
              ) : goalReached ? (
                t("no necesitas aportar más", "no extra saving needed")
              ) : !feasible && shortfallMonthly > 0 ? (
                <span className="flex flex-col gap-0.5">
                  <span className="text-amber-400/60">
                    {t("Baja tus gastos en", "Cut expenses by")} {fmt(shortfallMonthly)}/{t("mes", "mo")}
                  </span>
                  <span className="text-positive/55">

                    {t("o produce extra de", "or earn extra")} {fmt(shortfallMonthly)}/{t("mes", "mo")} · {yearsLabel}
                  </span>
                </span>
              ) : (
                `${t("para llegar a", "to reach")} ${fmt(targetNow)} ${t("en", "in")} ${yearsLabel} ${t("al", "at")} ${rate}%`
              )
            }
            index={5}
          />
        )}


      </div>
      <div className="surface p-5">
        <p className="text-sm text-muted-foreground">
          {t("Progreso hacia tu capital objetivo", "Progress toward your target capital")}
          {isGoal && goalNote ? `: ${goalNote}` : ""}
        </p>
        <div className="relative mt-9 h-2.5 w-full">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-elevated">
            <div className="wealth-gradient h-full rounded-full" style={{ width: `${pctBar}%` }} />
          </div>
          <span
            className="absolute bottom-2 h-2 w-px bg-white/15"
            style={{ left: `${pctBar}%`, transform: "translateX(-50%)" }}
          />
          <span
            className="numeric absolute bottom-4 whitespace-nowrap text-3xl font-semibold leading-none md:text-4xl"
            style={{ left: `${pctBar}%`, transform: `translateX(${pctShift})` }}
          >
            {progressPct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-xs text-muted-foreground">
            {t("Te faltan", "You still need")} {fmt(Math.max(0, plan.targetCapital - investable))} {t("en inversiones que generen retorno.", "in return-generating investments.")}
          </p>
          <p className="numeric hidden text-xs text-muted-foreground sm:block">
            {fmt(investable)} / {fmt(plan.targetCapital)}
          </p>
        </div>
      </div>


      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={
            <span className="text-base font-semibold tracking-tight">
              {isGoal ? t("Proyección hasta tu objetivo", "Projection to your goal") : t("Proyección hasta el retiro", "Projection to retirement")}
            </span>
          }
          description={
            isGoal
              ? `${goalLabel} · ${t("saldo estimado en", "estimated balance in")} ${horizonYears} ${horizonYears === 1 ? t("año", "year") : t("años", "years")}`
              : `${t("Saldo estimado a los", "Estimated balance at")} ${retireAge} ${t("años", "years old")}`
          }
          className="flex flex-col lg:col-span-2"
          bleedMobile
        >
          <div className="min-h-[260px] flex-1">

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: isMobile ? 0 : -8, right: isMobile ? 4 : 8, top: 8, bottom: 0 }}>

              <defs>
                <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="year"
                {...axisProps}
                tickFormatter={(v) => (data.length > 10 ? `${v}a` : `${v} ${t("años", "yrs")}`)}
              />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={isMobile ? 40 : 62} />
              <Tooltip
                content={<ChartTooltip />}
                labelFormatter={(v) =>
                  isGoal
                    ? `${t("Año", "Year")} ${v}`
                    : `${v} ${Number(v) === 1 ? t("año", "year old") : t("años", "years old")}`
                }
              />
              <Area type="monotone" dataKey="value" name={t("Proyección", "Projection")} stroke="var(--color-chart-4)" strokeWidth={2.5} fill="url(#ret)" />
              <Area type="monotone" dataKey="contributed" name={t("Aportado", "Contributed")} stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </Panel>



        <Panel
          title={<span className="text-base font-semibold tracking-tight">{t("Simulador", "Simulator")}</span>}
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
                max={Math.max(500, Math.round(d.savings * 2) || 3000, Math.ceil((sp500Monthly * 2) / 50) * 50)}
                step={50}
                value={[monthly]}
                onValueChange={([v]) => setMonthly(v ?? 0)}
                onValueCommit={([v]) => {
                  // En modo libertad financiera el aporte lo elige el usuario;
                  // lo persistimos para que cash-flow y demás pestañas lo lean.
                  if (isGoal) return;
                  const next = v ?? 0;
                  if (next === profile.retirement_monthly_contribution) return;
                  void save({ retirement_monthly_contribution: next }).then(() =>
                    toast.success(t("Aporte mensual guardado", "Monthly contribution saved")),
                  );
                }}
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
                  max={30}
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
              <p className="truncate text-xs text-muted-foreground">
                {isGoal
                  ? `${t("Tendrías en", "You'd have in")} ${horizonYears} ${horizonYears === 1 ? t("año", "year") : t("años", "years")}`
                  : t("Saldo proyectado", "Projected balance")}
              </p>
              <p className="numeric mt-1 text-2xl font-semibold">{fmt(final.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {gap <= 0
                  ? `${isGoal ? t("Superas tu objetivo por", "You exceed your goal by") : t("Superas tu número por", "You exceed your number by")} ${fmt(-gap)} 🎯`
                  : `${t("Te faltarían", "You'd still need")} ${fmt(gap)}`}
              </p>
              <details className="group mt-3 border-t border-border/60 pt-2">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{t("Ver desglose", "See breakdown")}</span>
                  <span className="transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <dl className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] leading-snug">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                    <dt className="truncate text-muted-foreground">{t("Partes de", "Starting from")}</dt>
                    <dd className="numeric shrink-0 font-medium">{fmt(investable)}</dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                    <dt className="truncate text-muted-foreground">{isGoal ? goalLabel : t("Objetivo", "Target")}</dt>
                    <dd className="numeric shrink-0 font-medium">{fmt(targetNow)}</dd>
                  </div>
                  {isGoal ? (
                    <>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                        <dt className="truncate text-muted-foreground">{t("Plazo", "Timeframe")}</dt>
                        <dd className="numeric shrink-0 font-medium">{yearsLabel}</dd>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                        <dt className="truncate text-muted-foreground">{t("Aporte necesario", "Required saving")}</dt>
                        <dd className="numeric shrink-0 font-medium">{fmt(requiredMonthly)}/{t("mes", "mo")}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </details>


              {isGoal && gap > 0 && years > 0 ? (
                <p className="mt-2 text-[11px] text-primary">
                  {t("Ahorra", "Save")} {fmt(Math.ceil(requiredMonthly - monthly > 0 ? requiredMonthly - monthly : gap / (years * 12)))}/{t("mes más para llegar a tiempo", "mo more to make it on time")}
                </p>
              ) : null}
            </div>

            {isGoal && targetNow > 0 && !goalReached ? (
              <details className="group rounded-xl border border-border/60 bg-elevated/40 p-4 text-[11px] leading-relaxed">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold">
                  <span>{t("¿Es realista con tus gastos?", "Is it realistic with your spending?")}</span>
                  <span className="text-[11px] font-normal text-muted-foreground group-open:hidden">
                    {t("Ver más análisis", "See more analysis")}
                  </span>
                  <span className="hidden text-[11px] font-normal text-muted-foreground group-open:inline">
                    {t("Ocultar", "Hide")}
                  </span>
                </summary>
                <dl className="mt-2 space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                    <dt className="truncate text-muted-foreground">{t("Ingresos", "Income")}</dt>
                    <dd className="numeric shrink-0 font-medium">{fmt(d.income)}</dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                    <dt className="truncate text-muted-foreground">{t("Gastos reales", "Actual expenses")}</dt>
                    <dd className="numeric shrink-0 font-medium">-{fmt(d.expenses)}</dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-t border-border/60 pt-1">
                    <dt className="truncate text-muted-foreground">{t("Te queda para ahorrar", "Left to save")}</dt>
                    <dd className="numeric shrink-0 font-semibold">{fmt(capacity)}/{t("mes", "mo")}</dd>
                  </div>
                </dl>
                {feasible ? (
                  <p className="mt-2 text-primary">
                    ✅ {t("Alcanzable: el aporte necesario", "Doable: the required saving")} ({fmt(requiredMonthly)}) {t("cabe en tu ahorro actual", "fits your current saving")}
                    {capacity > 0 ? ` (${Math.round((requiredMonthly / capacity) * 100)}%)` : ""}.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1 text-amber-400">
                    <p>
                      ⚠️ {t("Te faltan", "You're short")} {fmt(expenseCutNeeded)}/{t("mes", "mo")}: {t("recorta gastos o sube ingresos", "cut expenses or raise income")}.
                    </p>
                    <p className="text-muted-foreground">
                      {realisticYears > 0
                        ? `${t("Con tu ahorro actual llegarías en", "At your current saving you'd get there in")} ${realisticYears} ${t("años", "years")}.`
                        : t("Con tu ahorro actual no llegarías en 60 años.", "At your current saving you wouldn't get there in 60 years.")}
                    </p>
                    <Link to="/gastos" className="inline-block text-primary underline underline-offset-2">
                      {t("Ver dónde recortar", "See where to cut")}
                    </Link>
                  </div>
                )}
              </details>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* Standard of living = ingreso/gasto mensual objetivo. El usuario lo edita en "Tu número". */}
      {(() => {
        const standardOfLiving = Math.max(0, wantMonthly || d.expenses);
        return (
          <Panel
            title={
              <>
                <span className="hidden sm:inline">{t("Escenarios de renta mensual para retirarte", "Monthly income scenarios to retire")}</span>
                <span className="sm:hidden">{t("Escenarios de retiro mensual", "Monthly retirement scenarios")}</span>
              </>
            }
            description={
              <>
                <span className="hidden sm:block">{t("En verde, los importes de hasta", "In green, amounts up to")} {fmt(standardOfLiving)} · {t("tu número", "your number")} {fmtCompact(baseNumber)} · {t("Objetivo", "Target")}: 7%.</span>
                <span className="sm:hidden">
                  {t("Verde = hasta", "Green = up to")} {fmt(standardOfLiving)} · {t("Objetivo", "Target")}: 7%
                  <br />
                  {t("Tu número", "Your number")}: {fmtCompact(baseNumber)}
                </span>
              </>
            }
            actions={<ScrollXButtons state={scenariosScroll.state} nudge={scenariosScroll.nudge} />}
          >
            <div ref={scenariosScroll.ref} onScroll={scenariosScroll.update} className="overflow-x-auto scroll-smooth">
              <table className="w-full min-w-[900px] lg:min-w-[1340px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">{t("Capital", "Capital")}</th>
                    {rates.map((rr) => (
                      <th
                        key={rr}
                        className={cn(
                          "px-3 py-2 text-right font-medium",
                          rr === 7 && "bg-primary/[0.08] text-primary",
                        )}
                      >
                        {rr}%{rr === 7 && <span className="ml-1 text-[9px] font-black uppercase tracking-wider">★</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capitals.map((cap) => {
                    const isNumberRow = cap === baseNumber;
                    return (
                      <tr
                        key={cap}
                        className={cn(
                          "relative border-b border-border/60 last:border-0 hover:bg-elevated/40",
                          isNumberRow && "border-primary/30 bg-primary/[0.04] shadow-[0_0_20px_hsl(var(--primary)/5%)]",
                        )}
                      >
                        <td className={cn("numeric px-3 text-left font-semibold", isNumberRow ? "pb-5 pt-5" : "py-3")}>
                          <div className="flex flex-col items-start gap-1.5">
                            {isNumberRow && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary-foreground">
                                <span className="h-1 w-1 rounded-full bg-primary-foreground" />
                                {t("tu número", "your number")}
                              </span>
                            )}
                            {fmt(cap)}
                          </div>
                        </td>
                        {rates.map((rr) => {
                          const inc = Math.round((cap * (rr / 100)) / 12);
                          const isTarget = rr === 7;
                          const isWithinTarget = inc <= standardOfLiving && standardOfLiving > 0;
                          return (
                            <td
                              key={rr}
                              className={cn(
                                "numeric px-3 text-right transition-colors",
                                isNumberRow ? "pb-5 pt-5" : "py-3",
                                isTarget && "bg-primary/[0.06]",
                                isWithinTarget && "font-semibold text-positive",
                              )}
                            >
                              {fmt(inc)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("Renta mensual = capital × rentabilidad anual ÷ 12.", "Monthly income = capital × annual return ÷ 12.")}</p>
          </Panel>
        );
      })()}

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

