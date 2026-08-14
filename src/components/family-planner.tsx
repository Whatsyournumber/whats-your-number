import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Pencil,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  VEHICLES,
  disclaimer,
  futureValue,
  humanDuration,
  money,
  monthlyNeeded,
  monthsToTarget,
  monthsUntil,
} from "@/lib/mfn";
import { useI18n } from "@/lib/mfn-i18n";

/* ---------------- small pieces ---------------- */

function StatCard({
  icon,
  label,
  value,
  hint,
  onChange,
  suffix,
  action,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  max?: number;
  onChange?: (n: number) => void;
  suffix?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <p className="min-w-0 text-sm font-medium leading-tight text-muted-foreground">{label}</p>
      </div>
      <div className="mt-1.5 flex h-8 items-baseline gap-1 overflow-hidden">
        {onChange ? (
          <input
            type="number"
            inputMode="numeric"
            value={value === 0 ? "" : value}
            placeholder="0"
            max={max}
            onChange={(e) => {
              const n = Math.max(0, Number(e.target.value));
              onChange(max !== undefined ? Math.min(max, n) : n);
            }}
            className="w-full min-w-0 rounded-lg bg-transparent font-display text-2xl font-semibold leading-8 tracking-tight text-foreground outline-none focus:bg-primary/5 sm:text-[24px]"
          />
        ) : (
          <span className="truncate font-display text-2xl font-semibold leading-8 tracking-tight text-foreground sm:text-[24px]">
            {value}
          </span>
        )}
        {suffix ? (
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
      <div className="mt-1 flex h-5 items-center justify-between gap-2">
        <p className="truncate text-xs leading-5 text-muted-foreground">{hint}</p>
        {action}
      </div>

    </div>
  );
}

function Foot({
  label,
  value,
  hint,
  dot,
}: {
  label: string;
  value: string;
  hint: string;
  dot: string;
}) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5 sm:py-3.5">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
        <span className="truncate">{hint}</span>
      </p>
    </div>
  );
}

function Ring({ pct, caption }: { pct: number; caption: string }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[120px] w-[120px]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="fp-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="11" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="url(#fp-ring)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${(c * v) / 100} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {Math.round(v)}%
            </p>
            <p className="text-[11px] text-muted-foreground">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneChart({
  data,
  currency,
  yMax,
  height = 300,
}: {
  data: { label: string; valor: number; objetivo: number; mark?: string | undefined }[];
  currency: string;
  yMax: number;
  height?: number;
}) {
  const axis = {
    stroke: "var(--color-muted-foreground)",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  } as const;
  const padTop = 44;
  const padBottom = 26;
  const padLeft = 68;
  const marked = data.map((d, i) => ({ ...d, i })).filter((d) => d.mark);
  // como máximo 4 burbujas para que no se amontonen en horizontes largos
  const keep = Math.ceil(marked.length / 4);
  const marks = marked
    .filter((_, idx) => (marked.length - 1 - idx) % keep === 0)
    .map((d) => ({
      mark: d.mark as string,
      valor: d.valor,
      left: `calc(${padLeft}px + (100% - ${padLeft + 24}px) * ${
        data.length > 1 ? d.i / (data.length - 1) : 0
      })`,
      top: padTop + (height - padTop - padBottom) * (1 - Math.min(1, d.valor / yMax)),
    }));

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: padTop, right: 24, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.26} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fp-flat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" {...axis} interval={0} />
          <YAxis
            {...axis}
            width={padLeft}
            domain={[0, yMax]}
            tickFormatter={(v) => money(Number(v), currency, true)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              fontSize: 12,
              color: "var(--color-popover-foreground)",
            }}
            formatter={(v: number | string) => money(Number(v), currency)}
          />
          <Area
            type="monotone"
            dataKey="objetivo"
            stroke="var(--color-muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            fill="url(#fp-flat)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="var(--color-primary)"
            strokeWidth={3}
            fill="url(#fp-fill)"
            activeDot={{ r: 5 }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {marks.map((m) => (
        <div
          key={m.mark}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
          style={{ left: m.left, top: m.top + 6 }}
        >
          <div className="flex flex-col items-center">
            <div className="rounded-xl border border-border bg-card px-3 py-2 text-center shadow-[0_14px_28px_-20px_oklch(0_0_0/40%)]">
              <p className="text-[11px] leading-none text-muted-foreground">{m.mark}</p>
              <p className="mt-1 font-display text-sm font-semibold leading-none text-foreground">
                {money(m.valor, currency)}
              </p>
            </div>
            <span className="h-4 w-px bg-border" />
            <span className="h-3 w-3 rounded-full border-[3px] border-primary bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- main ---------------- */

export function FamilyPlanner({
  childName,
  childAge,
  currency = "EUR",
  goal,
  defaultBase = 0,
  defaultMonthly = 0,
  defaultRate = 10,
}: {
  childName: string;
  childAge: number;
  currency?: string;
  goal?: string | undefined;
  defaultBase?: number;
  defaultMonthly?: number;
  defaultTargetAge?: number;
  defaultRate?: number;
}) {
  const { t, lang } = useI18n();
  const [base, setBase] = useState(Math.round(defaultBase));
  const [baseTouched, setBaseTouched] = useState(false);
  const [monthly, setMonthly] = useState(Math.round(defaultMonthly) || 200);
  const [target, setTarget] = useState(150000);
  const [targetAge, setTargetAge] = useState(18);
  const [showPicks, setShowPicks] = useState(false);
  const [pick, setPick] = useState(
    VEHICLES.find((v) => Math.abs(v.rate - defaultRate) <= 1)?.key ?? "sp500",
  );

  // Sincroniza con el dinero real del niño mientras no lo edite a mano
  useEffect(() => {
    if (!baseTouched) setBase(Math.round(defaultBase));
  }, [defaultBase, baseTouched]);
  useEffect(() => {
    if (defaultMonthly) setMonthly(Math.round(defaultMonthly));
  }, [defaultMonthly]);


  const vehicle = VEHICLES.find((v) => v.key === pick) ?? VEHICLES[0]!;
  const rate = vehicle.rate;
  const vehicleName = lang === "en" ? vehicle.nameEn : vehicle.name;

  const horizon = Math.max(1, monthsUntil(childAge, targetAge));
  const future = Math.round(futureValue(base, monthly, horizon, rate));
  const contributed = Math.round(monthly * horizon);
  const growth = Math.max(0, future - base - contributed);
  const pct = target > 0 ? (future / target) * 100 : 0;
  const toGoal = monthsToTarget(target, base, monthly, rate);
  const reached = toGoal !== null && toGoal <= horizon;
  const needed = Math.round(monthlyNeeded(target, base, horizon, rate));

  const boost = monthsToTarget(target, base, monthly + 30, rate);
  const boostGain = toGoal !== null && boost !== null ? toGoal - boost : null;

  const years = Math.max(2, Math.ceil(horizon / 12));
  const series = useMemo(() => {
    // hitos cada 5 años; a partir de 40 años cada 10 para que no se amontonen
    const step = years > 40 ? 10 : 5;
    const marks = new Set<number>();
    for (let y = step; y < years; y += step) marks.add(y);
    marks.add(years);
    const startAge = Math.floor(childAge);
    const ageLabel = (y: number) => t(`${startAge + y} años`, `age ${startAge + y}`);
    return Array.from({ length: years + 1 }, (_, y) => ({
      label: y === 0 || marks.has(y) ? ageLabel(y) : "",
      valor: Math.round(futureValue(base, monthly, y * 12, rate)),
      objetivo: Math.round((target * y) / years),
      mark: y === 0 ? undefined : marks.has(y) ? ageLabel(y) : undefined,
    }));
  }, [base, monthly, rate, target, years, childAge, t]);


  const yMax = Math.round(Math.max(future, target) * 1.3);

  const lumpNeeded = Math.max(
    0,
    Math.round((target - future) / Math.pow(1 + rate / 100, horizon / 12)),
  );

  const tips = useMemo(
    () => [
      {
        key: "monthly",
        body: t(
          `¡Vas muy bien, ${childName}! Necesitas ${money(needed, currency)}/mes.`,
          `Great job, ${childName}! You need ${money(needed, currency)}/mo.`,
        ),
        label: t("Para llegar justo a tiempo", "To hit the goal right on time"),
        value: money(needed, currency),
        unit: t("mes", "mo"),
      },
      {
        key: "lump",
        body: t(
          `Con un aporte único hoy llegarías a la meta sin subir la cuota mensual.`,
          `A single lump sum today would reach the goal without raising the monthly amount.`,
        ),
        label: t("Aporte único hoy", "One-off contribution today"),
        value: money(lumpNeeded, currency),
        unit: "",
      },
      {
        key: "boost",
        body: t(
          `Si aportas ${money(monthly + 30, currency)}/mes llegarías antes${
            boostGain && boostGain > 0 ? ` (${humanDuration(boostGain, "es")} antes)` : ""
          }.`,
          `Contributing ${money(monthly + 30, currency)}/mo gets you there sooner${
            boostGain && boostGain > 0 ? ` (${humanDuration(boostGain, "en")} sooner)` : ""
          }.`,
        ),
        label: t("Aporte mensual sugerido", "Suggested monthly contribution"),
        value: money(monthly + 30, currency),
        unit: t("mes", "mo"),
      },
    ],
    [t, childName, needed, currency, lumpNeeded, monthly, boostGain],
  );

  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % 3), 6000);
    return () => clearInterval(id);
  }, []);
  const tip = tips[tipIdx % tips.length]!;

  const [chartH, setChartH] = useState(380);
  useEffect(() => {
    const fit = () =>
      setChartH(Math.max(280, Math.min(460, Math.round(window.innerHeight * 0.44))));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);


  return (
    <div className="min-w-0">
      <div className="min-w-0">


        {/* hero */}
        <div className="grid gap-4 rounded-[28px] bg-card p-5 shadow-[0_24px_60px_-44px_oklch(0_0_0/40%)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_240px_260px] lg:items-stretch">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {goal ?? t("Fondo Universidad", "College fund")}
                </p>
                <h2 className="truncate font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {t(`El futuro de ${childName}`, `${childName}'s future`)}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t(
                `Si inviertes ${money(monthly, currency)} al mes desde hoy, ${childName} tendrá`,
                `If you invest ${money(monthly, currency)} a month from today, ${childName} will have`,
              )}
            </p>
            <p className="mt-1 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-primary sm:text-[48px]">
              {money(future, currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`cuando cumpla ${targetAge} años.`, `when they turn ${targetAge}.`)}
            </p>

            <span
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                reached ? "bg-success/12 text-success" : "bg-warning/14 text-warning"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {reached
                ? t("Objetivo alcanzado", "Goal reached")
                : t(
                    `Faltan ${money(Math.max(0, needed - monthly), currency)}/mes`,
                    `${money(Math.max(0, needed - monthly), currency)}/mo short`,
                  )}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[24px] bg-muted/40 p-4 text-center">
            <Ring pct={pct} caption={t("del objetivo", "of the goal")} />
            <p className="mt-3 text-center text-[13px] leading-snug text-muted-foreground">
              {toGoal === null
                ? t("Aumenta el aporte para alcanzar la meta", "Raise the contribution to reach the goal")
                : t(
                    `Faltan ${humanDuration(toGoal, "es")} para alcanzar tu meta`,
                    `${humanDuration(toGoal, "en")} left to reach your goal`,
                  )}
            </p>
          </div>

          {/* Buddy */}
          <div className="flex min-w-0 flex-col gap-2.5 rounded-[24px] bg-primary/6 p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-lg">
                🤖
              </span>
              <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Buddy
              </p>
            </div>
            <p key={tip.key} className="animate-rise line-clamp-2 text-[13px] leading-snug text-foreground">
              {tip.body}
            </p>

            <div className="mt-auto rounded-2xl bg-card p-3">
              <p className="text-[12px] text-muted-foreground">{tip.label}</p>
              <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-primary">
                {tip.value}
                {tip.unit ? (
                  <span className="text-xs font-medium text-muted-foreground">/{tip.unit}</span>
                ) : null}
              </p>
            </div>
            <div className="flex justify-center gap-1.5">
              {tips.map((tp, i) => (
                <span
                  key={tp.key}
                  className={`h-1.5 rounded-full transition-all ${
                    i === tipIdx ? "w-4 bg-primary" : "w-1.5 bg-primary/25"
                  }`}
                />
              ))}
            </div>
          </div>

        </div>


        {/* inputs */}
        <div className="mt-3 grid rounded-[28px] bg-card shadow-[0_20px_50px_-42px_oklch(0_0_0/38%)] sm:grid-cols-2 sm:divide-x sm:divide-border/60 lg:grid-cols-5">
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label={t("Capital inicial", "Initial capital")}
            value={base}
            hint={t("Hoy", "Today")}
            onChange={(v) => {
              setBaseTouched(true);
              setBase(v);
            }}
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label={t("Aporte mensual", "Monthly contribution")}
            value={monthly}
            hint={t("Cada mes", "Every month")}
            onChange={setMonthly}
          />
          <StatCard
            icon={<Target className="h-4 w-4" />}
            label={t("Objetivo", "Goal")}
            value={target}
            hint={t(`A los ${targetAge} años`, `At age ${targetAge}`)}
            onChange={setTarget}
          />
          <StatCard
            icon={<GraduationCap className="h-4 w-4" />}
            label={t("Edad objetivo", "Target age")}
            value={targetAge}
            max={80}
            suffix={t("años", "yrs")}
            hint={t(
              `${Math.ceil(horizon / 12)} años por delante`,
              `${Math.ceil(horizon / 12)} yrs ahead`,
            )}
            onChange={(v) => setTargetAge(Math.min(80, Math.round(v)))}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label={t("Rentabilidad esperada", "Expected return")}
            value={rate}
            suffix={t("anual", "yearly")}
            hint={vehicleName}
            action={
              <button
                type="button"
                onClick={() => setShowPicks((s) => !s)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                aria-label={t("Cambiar perfil", "Change profile")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>

        {showPicks ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {VEHICLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setPick(v.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  v.key === pick
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {(lang === "en" ? v.nameEn : v.name)} · {v.rate}%
              </button>
            ))}
          </div>
        ) : null}

        {/* chart */}
        <div className="mt-3 rounded-[28px] bg-card p-4 shadow-[0_20px_50px_-42px_oklch(0_0_0/38%)] sm:p-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {t("Proyección de crecimiento", "Growth projection")}
            </h3>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-0.5 w-6 rounded-full bg-primary" />
              {t("Proyección de tu inversión", "Your investment projection")}
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-0.5 w-6 rounded-full border-t-2 border-dashed border-muted-foreground" />
              {t("Objetivo", "Goal")}
            </span>
          </div>
          <div className="mt-1">
            <MilestoneChart data={series} currency={currency} yMax={yMax} height={chartH} />
          </div>
          <p className="mt-2 truncate border-t border-border/60 pt-2 text-[11px] text-muted-foreground/80">
            {t("Fuente:", "Source:")} {lang === "en" ? vehicle.sourceEn : vehicle.source}.{" "}
            {t("Rentabilidad pasada no garantiza la futura.", "Past performance does not guarantee future results.")}
          </p>

        </div>



        {/* footer strip */}
        <div className="mt-3 grid rounded-[28px] bg-card shadow-[0_20px_50px_-42px_oklch(0_0_0/38%)] sm:grid-cols-2 sm:divide-x sm:divide-border/60 lg:grid-cols-4">
          <Foot
            label={t("Aportes totales", "Total contributions")}
            value={money(contributed, currency)}
            hint={t(`Durante ${years} años`, `Over ${years} years`)}
            dot="var(--color-primary)"
          />
          <Foot
            label={t("Crecimiento estimado", "Estimated growth")}
            value={money(growth, currency)}
            hint={t("Gracias al interés compuesto", "Thanks to compound interest")}
            dot="var(--color-success)"
          />
          <Foot
            label={t(`Valor estimado a los ${targetAge} años`, `Estimated value at ${targetAge}`)}
            value={money(future, currency)}
            hint={t("Objetivo final", "Final goal")}
            dot="var(--color-accent)"
          />
          <Foot
            label={t("Tiempo para lograrlo", "Time to reach it")}
            value={toGoal === null ? "—" : humanDuration(toGoal, lang)}
            hint={t(`Antes de los ${targetAge} años`, `Before age ${targetAge}`)}
            dot="var(--color-warning)"
          />
        </div>

        <p className="mt-2 hidden px-1 text-[11px] leading-relaxed text-muted-foreground">
          {disclaimer(lang)}
        </p>
      </div>



    </div>
  );
}
