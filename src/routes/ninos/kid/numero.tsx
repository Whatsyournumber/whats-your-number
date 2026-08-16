import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getBuddyTip } from "@/lib/kid-buddy.functions";
import { ArrowUpRight, CheckSquare, ChevronDown, ChevronRight } from "lucide-react";
import { Card, GrowthChart, Progress } from "@/components/mfn-ui";
import buddyImg from "@/assets/kid-buddy-robot.png";
import piggyImg from "@/assets/kid-piggy.png";
import treeImg from "@/assets/kid-tree.png";
import { KidPage, PageTitle } from "@/components/kid-page";
import { useI18n } from "@/lib/mfn-i18n";
import { useFund, useMovements, useTasks, useWishes } from "@/hooks/use-mfn";
import {
  buddyLines,
  disclaimer,
  monthlySavingPace,
  pocketLabel,
  POCKETS,
  money,
  pocketTotals,
  projectFund,
  type Member,
} from "@/lib/mfn";

export const Route = createFileRoute("/ninos/kid/numero")({
  head: () => ({
    meta: [
      { title: "Mi Primer Número | My First Number" },
      {
        name: "description",
        content:
          "Todos tus números en una pantalla: número de hoy, número del futuro, bolsillos, sueños, tareas y cómo crece tu dinero.",
      },
      { property: "og:title", content: "Mi Primer Número | My First Number" },
      {
        property: "og:description",
        content: "Tu hub de números: hoy, futuro, ahorro, sueños y tareas en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <KidPage>{(member) => <MyNumber member={member} />}</KidPage>,
});

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`whitespace-nowrap text-[clamp(11px,3.6cqi,14px)] font-bold uppercase leading-tight tracking-[0.12em] ${className}`}>
      {children}
    </p>
  );
}

function Ring({ value, size = 116 }: { value: number; size?: number }) {

  const pct = Math.max(0, Math.min(100, value));
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-chart-2)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold text-foreground">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

const RATE_PRESETS = [
  { key: "banco", es: "Banco", en: "Bank", rate: 4 },
  { key: "bonos", es: "Bonos", en: "Bonds", rate: 6 },
  { key: "msci", es: "MSCI World (histórico)", en: "MSCI World (historical)", rate: 8 },
  { key: "sp500", es: "S&P 500", en: "S&P 500", rate: 10 },
  { key: "nasdaq", es: "Nasdaq 100", en: "Nasdaq 100", rate: 13 },
  { key: "cripto", es: "Cripto", en: "Crypto", rate: 20 },
] as const;


function MyNumber({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { data: movements = [] } = useMovements(member.id);
  const { data: fund } = useFund(member.id);
  const { data: wishes = [] } = useWishes(member.id);
  const { data: tasks = [] } = useTasks(member.id);

  const totals = pocketTotals(movements);
  const today = totals.gastar + totals.ahorrar + totals.crecer;
  const targetAge = Number(fund?.target_age ?? 18);
  const [horizon, setHorizon] = useState<number | null>(null);
  const [ageInput, setAgeInput] = useState<string | null>(null);

  const base = Math.max(today, Number(fund?.current_balance ?? 0));
  const monthly = Number(fund?.monthly_contribution ?? 0);
  const rate = Number(fund?.expected_return ?? 10);
  const projection = projectFund(base, monthly, member.age, targetAge, rate);
  const years = horizon ?? Math.max(1, targetAge - member.age);
  const [rateOverride, setRate] = useState<number | null>(null);
  const chartRate = rateOverride ?? rate;
  const [ratesOpen, setRatesOpen] = useState(false);
  const activePreset =
    RATE_PRESETS.find((p) => Math.abs(chartRate - p.rate) < 0.01) ??
    ({ es: "Personalizado", en: "Custom" } as { es: string; en: string });
  const chartProjection = projectFund(base, monthly, member.age, member.age + years, chartRate);
  const [compareRate, setCompareRate] = useState<number | null>(null);
  const comparedPoints = useMemo(() => {
    if (compareRate === null) return chartProjection.points;
    const alt = projectFund(base, monthly, member.age, member.age + years, compareRate).points;
    return chartProjection.points.map((p, i) => ({ ...p, compare: alt[i]?.total ?? 0 }));
  }, [compareRate, chartProjection.points, base, monthly, member.age, years]);



  const dreams = useMemo(() => {
    const active = wishes.filter((w) => !w.achieved);
    const saved = wishes.reduce((s, w) => s + Number(w.saved), 0);
    const price = wishes.reduce((s, w) => s + Number(w.price), 0);
    return {
      active,
      achieved: wishes.filter((w) => w.achieved).length,
      next: active[0] ?? null,
      progress: price > 0 ? (saved / price) * 100 : 0,
    };
  }, [wishes]);

  const openTasks = tasks.filter((x) => x.status === "pendiente").slice(0, 4);

  const pace = monthlySavingPace(movements);
  const lines = buddyLines(lang);
  const line = lines[(member.xp / 10) % lines.length | 0] ?? lines[0];

  const buddyTipFn = useServerFn(getBuddyTip);
  const { data: buddyTip, isFetching: buddyThinking } = useQuery({
    queryKey: ["kid-buddy-tip", member.id, lang, Math.round(today), Math.round(projection.future)],
    enabled: movements.length > 0,
    staleTime: 1000 * 60 * 30,
    retry: false,
    queryFn: () =>
      buddyTipFn({
        data: {
          name: member.name,
          age: member.age,
          currency: member.currency,
          lang,
          today,
          future: projection.future,
          targetAge,
          monthly,
          pace,
          pockets: POCKETS.map((p) => ({ label: pocketLabel(p.key, lang), amount: totals[p.key] })),
          dream: dreams.next
            ? {
                title: dreams.next.title,
                saved: Number(dreams.next.saved),
                price: Number(dreams.next.price),
              }
            : null,
        },
      }),
  });

  return (
    <>
      <PageTitle
        emoji="👋"
        title={`${t("Hola", "Hello")}, ${member.name}`}
        subtitle={t("¡Vamos por un gran futuro!", "Let's go for a great future!")}
      />

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5 lg:grid-rows-[220px_1fr]">
          <div className="grid gap-5 sm:grid-cols-2 [&>*]:h-full">
            <div className="@container card-soft animate-rise relative grid min-h-[220px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-7">

              <div className="min-w-0">
                <Eyebrow className="text-primary">{t("Mi dinero hoy", "My money today")}</Eyebrow>
                <p className="mt-3 whitespace-nowrap font-display text-[clamp(1.4rem,12cqi,3rem)] font-bold leading-none tracking-tight text-foreground">
                  {money(today, member.currency)}
                </p>
                <p className="mt-4 whitespace-nowrap text-[clamp(12px,4.2cqi,16px)] leading-snug text-muted-foreground">
                  {t("Esta semana", "This week")}{" "}
                  <span className="font-semibold text-chart-3">+{money(pace, member.currency)} ↗</span>
                </p>
              </div>
              <img
                src={piggyImg}
                alt=""
                aria-hidden
                loading="lazy"
                width={768}
                height={768}
                className="pointer-events-none h-[clamp(96px,38cqi,180px)] w-[clamp(96px,38cqi,180px)] shrink-0 self-center object-contain"
              />
            </div>

            <div className="@container card-soft animate-rise relative grid min-h-[220px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden bg-gradient-to-br from-chart-2/10 via-card to-card p-6 sm:p-7">
              <div className="min-w-0">
                <Eyebrow className="text-chart-2">
                  {t(`Mi dinero a los ${targetAge}`, `My money at ${targetAge}`)}
                </Eyebrow>
                <p className="mt-3 whitespace-nowrap font-display text-[clamp(1.4rem,12cqi,3rem)] font-bold leading-none tracking-tight text-foreground">
                  {money(projection.future, member.currency)}
                </p>
                <p className="mt-4 whitespace-nowrap text-[clamp(12px,4.2cqi,16px)] leading-snug text-muted-foreground">
                  {t("Si sigues ahorrando", "If you keep saving")}
                </p>
                <p className="whitespace-nowrap text-[clamp(12px,4.2cqi,16px)] font-semibold text-chart-2">
                  {money(monthly || pace, member.currency)} {t("al mes", "a month")}
                </p>
              </div>
              <img
                src={treeImg}
                alt=""
                aria-hidden
                loading="lazy"
                width={768}
                height={768}
                className="pointer-events-none h-[clamp(96px,38cqi,180px)] w-[clamp(96px,38cqi,180px)] shrink-0 self-center object-contain"
              />
            </div>
          </div>

          <div className="card-soft p-5 sm:p-6">
            <Eyebrow className="text-foreground">
              {t("¿Dónde está mi dinero?", "Where is my money?")}
            </Eyebrow>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {POCKETS.map((p, i) => {
                const amount = totals[p.key];
                const pct = today > 0 ? Math.round((amount / today) * 100) : 0;
                const tone = [
                  { text: "text-primary", bar: "bg-primary", chip: "bg-primary/10" },
                  { text: "text-chart-3", bar: "bg-chart-3", chip: "bg-chart-3/10" },
                  { text: "text-chart-2", bar: "bg-chart-2", chip: "bg-chart-2/10" },
                ][i] ?? { text: "text-primary", bar: "bg-primary", chip: "bg-primary/10" };
                return (
                  <div key={p.key} className="@container rounded-2xl border border-border/60 bg-card p-5">
                    <p className="flex items-center gap-3">
                      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-[34px] leading-none ${tone.chip}`}>
                        {p.emoji}
                      </span>
                      <span className={`truncate text-[clamp(14px,8cqi,18px)] font-semibold ${tone.text}`}>
                        {pocketLabel(p.key, lang)}
                      </span>
                    </p>
                    <p className="mt-4 whitespace-nowrap font-display text-[clamp(1.25rem,13cqi,2rem)] font-bold leading-none text-foreground">
                      {money(amount, member.currency)}
                    </p>

                    <p className="mt-3 text-[13px] text-muted-foreground">
                      {pct}% {t("de tu dinero", "of your money")}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid content-start gap-5 lg:grid-rows-[220px_1fr] [&>*]:h-full">
          <div className="card-soft animate-rise relative flex items-center overflow-hidden bg-gradient-to-br from-primary/20 via-chart-2/15 to-chart-2/30 p-5">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-card/40 blur-2xl" />
            <div className="pointer-events-none absolute right-24 top-5 text-lg opacity-70">✨</div>
            <div className="pointer-events-none absolute right-10 top-14 text-sm opacity-60">✦</div>
            <div className="relative min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-lg shadow-sm">🤖</span>
                <p className="font-kid text-2xl font-extrabold text-primary">Buddy</p>
                <span className="rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  IA
                </span>
              </div>
              <div className="mt-3 rounded-3xl rounded-bl-lg bg-card/95 px-4 py-3 shadow-sm">
                {buddyThinking && !buddyTip ? (
                  <div className="flex items-center gap-1.5 py-2">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                    <span className="ml-2 font-kid text-sm text-muted-foreground">
                      {t("Leyendo tus números…", "Reading your numbers…")}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="font-kid line-clamp-2 text-[16px] font-extrabold leading-tight text-foreground">
                      {buddyTip?.headline ?? `${t(`¡Genial, ${member.name}!`, `Great job, ${member.name}!`)} 🚀`}
                    </p>
                    <p className="mt-1 font-kid line-clamp-2 text-[14px] font-medium leading-snug text-muted-foreground">
                      {buddyTip?.insight ?? line}
                    </p>
                    {buddyTip?.tip ? (
                      <p className="mt-2 line-clamp-2 rounded-2xl bg-primary/10 px-3 py-2 font-kid text-[14px] font-semibold leading-snug text-foreground">
                        💡 {buddyTip.tip}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            <img
              src={buddyImg}
              alt=""
              aria-hidden
              loading="lazy"
              width={768}
              height={768}
              className="pointer-events-none relative -mr-2 h-[140px] w-[110px] shrink-0 self-end object-contain"
            />

          </div>


          <div className="card-soft animate-rise flex flex-col p-6">
            <div className="flex items-center justify-between gap-2">
              <Eyebrow className="text-primary">{t("Mi próximo sueño", "My next dream")}</Eyebrow>
              <Link to="/ninos/kid/deseos" aria-label={t("Ver mis sueños", "See my dreams")}>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition hover:text-primary" />
              </Link>
            </div>

            {dreams.next ? (
              (() => {
                const saved = Number(dreams.next.saved);
                const price = Number(dreams.next.price);
                const pct = Math.max(0, Math.min(100, (saved / Math.max(1, price)) * 100));
                const missing = Math.max(0, price - saved);
                const months = pace > 0 ? Math.max(1, Math.ceil(missing / pace)) : null;
                return (
                  <div className="mt-5 flex flex-1 flex-col">
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4">
                      <DreamPhoto title={dreams.next.title} emoji={dreams.next.emoji} pct={pct} />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-bold text-foreground">
                          {dreams.next.title} <span>{dreams.next.emoji}</span>
                        </p>
                        <p className="mt-1 whitespace-nowrap font-display text-lg font-bold text-foreground">
                          {money(saved, member.currency)}{" "}
                          <span className="text-[13px] font-medium text-muted-foreground">
                            {t("de", "of")} {money(price, member.currency)}
                          </span>
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Progress className="flex-1" value={pct} />
                          <span className="text-[11px] font-bold text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto pt-5">
                      {missing > 0 && (
                        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-foreground">
                          {t("Te faltan", "You need")} {money(missing, member.currency)}
                        </span>
                      )}
                      {months && (
                        <p className="mt-2 text-[13px] text-muted-foreground">
                          {t(
                            `A este ritmo la tendrás en ${months} ${months === 1 ? "mes" : "meses"}.`,
                            `At this pace you'll get it in ${months} ${months === 1 ? "month" : "months"}.`,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="mt-5 flex flex-1 items-center gap-4">
                <Ring value={dreams.progress} />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {t("Añade tu primer sueño.", "Add your first dream.")}
                  </p>
                  <Link to="/ninos/kid/deseos" className="mt-3 inline-block text-xs font-semibold text-primary">
                    {t("Ver mis sueños", "See my dreams")} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      <div className="card-soft mt-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow className="text-chart-2">{t("Mis tareas abiertas", "My open tasks")}</Eyebrow>
          <Link
            to="/ninos/kid/tareas"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            {t("Ver todas", "See all")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {openTasks.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {openTasks.map((task) => (
              <Link
                key={task.id}
                to="/ninos/kid/tareas"
                className="card-soft group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 transition hover:border-primary/40"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-chart-2/10">
                  <CheckSquare className="h-5 w-5 text-chart-2" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-kid text-[15px] font-bold text-foreground">
                    {task.title}
                  </span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {t("Ganas", "You earn")} {money(Number(task.reward), member.currency)}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 font-kid text-sm text-muted-foreground">
            {t("¡No tienes tareas pendientes! 🎉", "No pending tasks! 🎉")}
          </p>
        )}
      </div>


      <Card
        className="mt-4"
        title={t("Cómo crece mi número", "How my number grows")}
        hint={disclaimer(lang)}
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-3 lg:items-stretch">
          {/* Edad */}
          <div className="flex flex-col rounded-2xl border border-border/60 bg-surface-2/40 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Edad", "Age")}
            </span>
            <div className="mt-3 flex min-w-0 items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={ageInput ?? String(member.age + years)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setAgeInput(raw);
                  const age = Number(raw);
                  if (raw && age > member.age && age <= 99) setHorizon(age - member.age);
                }}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={() => setAgeInput(null)}
                className="h-9 w-16 shrink-0 rounded-full border border-border/60 bg-surface-1 text-center text-sm font-bold text-foreground outline-none focus:border-primary"
              />

              <span className="shrink-0 text-xs text-muted-foreground">{t("años", "yrs")}</span>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {[member.age + 5, targetAge, 25, 30, 40]
                  .filter((a, i, arr) => a > member.age && arr.indexOf(a) === i)
                  .sort((a, b) => a - b)
                  .map((age) => {
                    const y = age - member.age;
                    const active = years === y;
                    return (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setHorizon(y)}
                        className={`h-8 min-w-9 rounded-full px-3 text-xs font-bold transition ${
                          active
                            ? "bg-foreground text-background"
                            : "bg-surface-1 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {age}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Tasa */}
          <div className="flex flex-col rounded-2xl border border-border/60 bg-surface-2/40 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Tasa", "Rate")}
            </span>
            <div className="mt-3 min-w-0">
              <button
                type="button"
                onClick={() => setRatesOpen((v) => !v)}
                className="flex h-8 w-full items-center gap-2 rounded-full bg-surface-1 pl-1 pr-3 text-left transition hover:bg-surface-1/70"
              >
                <span className="truncate rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                  {t(activePreset.es, activePreset.en)} · {chartRate}%
                </span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${ratesOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div className="flex flex-col justify-center rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`A los ${member.age + years} años`, `At age ${member.age + years}`)}
            </span>
            <span className="mt-0.5 whitespace-nowrap font-kid text-[clamp(1.4rem,3.2vw,2rem)] font-black leading-none text-primary">
              {money(chartProjection.future, member.currency)}
            </span>
            <span className="mt-1.5 text-xs text-muted-foreground">
              {t("Ahorrado", "Saved")}{" "}
              <b className="text-foreground">{money(chartProjection.contributed, member.currency)}</b>
              {" · "}
              {t("Intereses", "Interest")}{" "}
              <b className="text-chart-1">{money(chartProjection.growth, member.currency)}</b>
            </span>
          </div>
        </div>

        {/* Tasa — línea horizontal de chips */}
        {ratesOpen && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Tasa", "Rate")}:
            </span>
            {RATE_PRESETS.map((preset) => {
              const active = Math.abs(chartRate - preset.rate) < 0.01;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setRate(preset.rate);
                    setRatesOpen(false);
                  }}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-1 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(preset.es, preset.en)} · {preset.rate}%
                </button>
              );
            })}
          </div>
        )}



        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-1 w-5 rounded-full bg-chart-1" />
            {t("Tu dinero con intereses", "Your money with interest")}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-5 rounded-full bg-chart-4" />
            {t("Lo que ahorraste", "What you saved")}
          </span>
          {compareRate !== null && (
            <span className="flex items-center gap-2">
              <span className="h-1 w-5 rounded-full bg-chart-2" />
              {t("Comparación", "Comparison")} · {compareRate}%
            </span>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              {t("Comparar con", "Compare with")}:
            </span>
            {RATE_PRESETS.filter((p) => Math.abs(p.rate - chartRate) > 0.01).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setCompareRate(compareRate === p.rate ? null : p.rate)}
                className={`h-7 rounded-full px-3 text-[11px] font-semibold transition ${
                  compareRate === p.rate
                    ? "bg-chart-2 text-background"
                    : "bg-surface-1 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(p.es, p.en)} · {p.rate}%
              </button>
            ))}
            {compareRate !== null && (
              <button
                type="button"
                onClick={() => setCompareRate(null)}
                className="h-7 rounded-full px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                {t("Quitar", "Clear")}
              </button>
            )}
          </div>

        </div>

        <GrowthChart
          data={comparedPoints}
          currency={member.currency}
          height={320}
          areas={[
            { key: "total", color: "var(--color-chart-1)" },
            { key: "aportes", color: "var(--color-chart-4)" },
          ]}
          lines={compareRate !== null ? [{ key: "compare", color: "var(--color-chart-2)" }] : []}
          seriesNames={{
            total: `${t("Con intereses", "With interest")} · ${chartRate}%`,
            aportes: t("Lo que ahorraste", "What you saved"),
            compare: `${t("Comparación", "Comparison")} · ${compareRate ?? 0}%`,
          }}
          tooltipLabel={(l) => `${t("A los", "At age")} ${Number(l)} ${t("años", "yrs")}`}
        />


        <p className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 font-kid text-sm font-semibold text-foreground">
          💡{" "}
          {t(
            `Con ${chartRate}% al año, tus intereses suman ${money(Math.max(0, chartProjection.future - chartProjection.contributed), member.currency)} extra.`,
            `At ${chartRate}% a year, interest adds ${money(Math.max(0, chartProjection.future - chartProjection.contributed), member.currency)} extra.`,
          )}
        </p>

      </Card>
    </>
  );
}

function DreamPhoto({ emoji }: { title: string; emoji: string; pct: number }) {
  return (
    <div className="grid aspect-square w-full place-items-center rounded-2xl bg-primary/10">
      <span className="text-[clamp(2.5rem,7vw,3.5rem)] leading-none">{emoji || "⭐"}</span>
    </div>
  );

}
