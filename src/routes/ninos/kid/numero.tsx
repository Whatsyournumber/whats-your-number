import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, CheckSquare, Rocket, Star, Wallet } from "lucide-react";
import { Buddy, Card, GrowthChart, Progress } from "@/components/mfn-ui";
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

function MiniStat({
  icon,
  label,
  value,
  hint,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  to: "/ninos/kid/dinero" | "/ninos/kid/deseos" | "/ninos/kid/tareas" | "/ninos/kid/futuro";
}) {
  return (
    <Link
      to={to}
      className="card-soft group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 transition hover:border-primary/40"
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-surface-2">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="block truncate font-display text-lg font-semibold text-foreground">{value}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}

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
  const base = Math.max(today, Number(fund?.current_balance ?? 0));
  const monthly = Number(fund?.monthly_contribution ?? 0);
  const rate = Number(fund?.expected_return ?? 10);
  const projection = projectFund(base, monthly, member.age, targetAge, rate);
  const years = horizon ?? Math.max(1, targetAge - member.age);
  const chartProjection = projectFund(base, monthly, member.age, member.age + years, rate);

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

  const pending = tasks.filter((x) => x.status === "pendiente").length;
  const earned = tasks
    .filter((x) => x.status === "aprobada")
    .reduce((s, x) => s + Number(x.reward), 0);
  const pace = monthlySavingPace(movements);
  const lines = buddyLines(lang);
  const line = lines[(member.xp / 10) % lines.length | 0] ?? lines[0];

  return (
    <>
      <PageTitle
        emoji="👋"
        title={`${t("Hola", "Hello")}, ${member.name}`}
        subtitle={t("¡Vamos por un gran futuro!", "Let's go for a great future!")}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-soft animate-rise relative flex min-h-[190px] flex-col justify-center overflow-hidden bg-primary/5 p-5 pr-24">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary">
                {t("Mi dinero hoy", "My money today")}
              </p>
              <p className="mt-2 font-display text-[2.6rem] font-bold leading-none tracking-tight text-foreground">
                {money(today, member.currency)}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("Esta semana", "This week")}{" "}
                <span className="font-semibold text-chart-2">+{money(pace, member.currency)} ↗</span>
              </p>
              <img
                src={piggyImg}
                alt=""
                aria-hidden
                loading="lazy"
                width={768}
                height={768}
                className="pointer-events-none absolute -bottom-3 -right-2 h-[150px] w-[150px] object-contain"
              />
            </div>

            <div className="card-soft animate-rise relative flex min-h-[190px] flex-col justify-center overflow-hidden bg-chart-3/10 p-5 pr-24">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-chart-3">
                {t(`Mi dinero a los ${targetAge}`, `My money at ${targetAge}`)}
              </p>
              <p className="mt-2 font-display text-[2.6rem] font-bold leading-none tracking-tight text-foreground">
                {money(projection.future, member.currency)}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("Si sigues ahorrando", "If you keep saving")}
                <span className="block font-semibold text-chart-3">
                  {money(monthly || pace, member.currency)} {t("al mes", "a month")}
                </span>
              </p>
              <img
                src={treeImg}
                alt=""
                aria-hidden
                loading="lazy"
                width={768}
                height={768}
                className="pointer-events-none absolute -bottom-2 -right-3 h-[155px] w-[155px] object-contain"
              />
            </div>
          </div>

          <div className="card-soft p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground">
              {t("¿Dónde está mi dinero?", "Where is my money?")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {POCKETS.map((p, i) => {
                const amount = totals[p.key];
                const pct = today > 0 ? Math.round((amount / today) * 100) : 0;
                const tone = [
                  { bg: "bg-primary/5", text: "text-primary", bar: "bg-primary" },
                  { bg: "bg-chart-2/10", text: "text-chart-2", bar: "bg-chart-2" },
                  { bg: "bg-chart-4/10", text: "text-chart-4", bar: "bg-chart-4" },
                ][i] ?? { bg: "bg-surface-2", text: "text-primary", bar: "bg-primary" };
                return (
                  <div key={p.key} className={`rounded-2xl p-4 ${tone.bg}`}>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-2xl leading-none">{p.emoji}</span>
                      <span className={tone.text}>{pocketLabel(p.key, lang)}</span>
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-foreground">
                      {money(amount, member.currency)}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {pct}% {t("de tu dinero", "of your money")}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>



        <div className="grid content-start gap-4">
          <Buddy>{line}</Buddy>
          <Card title={t("Mis sueños", "My dreams")}>
            <div className="flex items-center gap-4">
              <Ring value={dreams.progress} />
              <div className="min-w-0">
                {dreams.next ? (
                  <>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {dreams.next.emoji} {dreams.next.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {money(Number(dreams.next.saved), member.currency)} {t("de", "of")}{" "}
                      {money(Number(dreams.next.price), member.currency)}
                    </p>
                    <Progress
                      className="mt-2"
                      value={(Number(dreams.next.saved) / Math.max(1, Number(dreams.next.price))) * 100}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("Añade tu primer sueño.", "Add your first dream.")}
                  </p>
                )}
                <Link to="/ninos/kid/deseos" className="mt-3 inline-block text-xs font-semibold text-primary">
                  {t("Ver mis sueños", "See my dreams")} →
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          to="/ninos/kid/dinero"
          icon={<Wallet className="h-5 w-5 text-primary" />}
          label={t("Mi dinero", "My money")}
          value={money(today, member.currency)}
          hint={t("ingresos y gastos", "income and expenses")}
        />
        <MiniStat
          to="/ninos/kid/tareas"
          icon={<CheckSquare className="h-5 w-5 text-chart-2" />}
          label={t("Mis tareas", "My tasks")}
          value={`${pending} ${t("pendientes", "pending")}`}
          hint={`${money(earned, member.currency)} ${t("ganados", "earned")}`}
        />
        <MiniStat
          to="/ninos/kid/deseos"
          icon={<Star className="h-5 w-5 text-chart-3" />}
          label={t("Mis sueños", "My dreams")}
          value={`${dreams.active.length} ${t("activos", "active")}`}
          hint={`${dreams.achieved} ${t("cumplidos", "achieved")}`}
        />
        <MiniStat
          to="/ninos/kid/futuro"
          icon={<Rocket className="h-5 w-5 text-chart-4" />}
          label={t("Mi futuro", "My future")}
          value={money(projection.future, member.currency)}
          hint={`${t("a los", "at")} ${targetAge} ${t("años", "yrs")}`}
        />
      </div>

      <Card
        className="mt-4"
        title={t("Cómo crece mi número", "How my number grows")}
        hint={disclaimer(lang)}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("A los", "At age")}
          </span>
          {[
            member.age + 5,
            targetAge,
            25,
            30,
            40,
          ]
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-chart-1/15 text-chart-1"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {age}
                </button>
              );
            })}
          <span className="ml-auto text-sm text-muted-foreground">
            {t("tendría", "I'd have")}{" "}
            <span className="text-foreground font-bold">
              {money(chartProjection.future, member.currency)}
            </span>
          </span>
        </div>
        <GrowthChart
          data={chartProjection.points}
          currency={member.currency}
          height={320}
          areas={[
            { key: "total", color: "var(--color-chart-1)" },
            { key: "aportes", color: "var(--color-chart-4)" },
          ]}
        />
      </Card>
    </>
  );
}
