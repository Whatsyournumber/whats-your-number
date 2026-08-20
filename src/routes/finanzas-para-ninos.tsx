import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  BadgeCheck,
  Banknote,
  CalendarCheck,
  Coins,
  Gift,
  GraduationCap,
  PiggyBank,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";


import heroReal from "@/assets/kids-hero-real.jpg";
import ctaFamily from "@/assets/kids-cta-family.jpg";
import faceDad from "@/assets/kid-face-dad.jpg";
import faceMom from "@/assets/kid-face-mom.jpg";
import faceGirl from "@/assets/kid-face-girl.jpg";
import bikeAsset from "@/assets/kid-bike.png.asset.json";
import faceBoy from "@/assets/kid-face-boy.jpg";
import avatarFaces from "@/assets/kids-avatars-three.png";
import stageBaby from "@/assets/kid-stage-baby.jpg";
import stageBoy from "@/assets/kid-stage-boy.jpg";
import stageTeen from "@/assets/kid-stage-teen.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

import { useLiveCount, formatCount } from "@/components/live-count";
import { REAL_UNI_PHOTOS } from "@/lib/uni-photos-real";


export const Route = createFileRoute("/finanzas-para-ninos")({
  head: () => ({
    meta: [
      { title: "Finanzas para niños — su primer número | WhatsYournumber" },
      {
        name: "description",
        content:
          "La app de finanzas para niños más premium: número de hoy, número del futuro, bolsillos de ahorro, sueños, tareas, insignias e interés compuesto explicado para peques.",
      },
      { property: "og:title", content: "Finanzas para niños — su primer número" },
      {
        property: "og:description",
        content:
          "Bolsillos, sueños, tareas, insignias y su número del futuro: la forma más divertida de que tus hijos aprendan a manejar dinero real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsFinanceLanding,
});

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-medium uppercase tracking-wider text-kid-mint">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}


function ScreenCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl">
      <div className="h-1 w-full" style={{ backgroundColor: accent, opacity: 0.7 }} />
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

function MiniArea({ color }: { color: string }) {
  return (
    <div className="h-28 md:h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={growCurve} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="slide-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="url(#slide-area)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Planificador familiar (demo) ---------- */
const PLAN_START = 25000;
const PLAN_MONTHLY = 99;
const PLAN_GOAL = 150000;
const PLAN_AGE_NOW = 5;
const PLAN_AGE_TARGET = 18;
const PLAN_RATE = 0.1;

const plannerCurve = Array.from({ length: PLAN_AGE_TARGET - PLAN_AGE_NOW + 1 }, (_, i) => {
  const r = PLAN_RATE / 12;
  const n = i * 12;
  const growth = Math.pow(1 + r, n);
  const value = PLAN_START * growth + (n === 0 ? 0 : PLAN_MONTHLY * ((growth - 1) / r));
  return {
    age: PLAN_AGE_NOW + i,
    value: Math.round(value),
    goal: Math.round((PLAN_GOAL * i) / (PLAN_AGE_TARGET - PLAN_AGE_NOW)),
  };
});
const PLAN_FUTURE = plannerCurve[plannerCurve.length - 1]!.value;
const PLAN_CONTRIB = PLAN_MONTHLY * 12 * (PLAN_AGE_TARGET - PLAN_AGE_NOW);
const PLAN_GROWTH = PLAN_FUTURE - PLAN_CONTRIB - PLAN_START;
const PLAN_PCT = Math.round((PLAN_FUTURE / PLAN_GOAL) * 100);

const eur = (n: number) => `${n.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €`;

function PlanMilestoneDot(props: {
  cx?: number;
  cy?: number;
  payload?: { age: number; value: number };
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  if (![10, 15, 18].includes(payload.age)) return null;
  const w = 86;
  const flip = payload.age === 18;
  const x = flip ? cx - w + 6 : cx - w / 2;
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx} y2={cy - 26} stroke="var(--border)" strokeWidth={1} />
      <rect
        x={x}
        y={cy - 62}
        rx={12}
        width={w}
        height={36}
        fill="var(--color-card)"
        stroke="var(--border)"
      />
      <text x={x + w / 2} y={cy - 47} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
        {payload.age}
      </text>
      <text
        x={x + w / 2}
        y={cy - 35}
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
        fill="var(--color-foreground)"
      >
        {eur(payload.value)}
      </text>
      <circle cx={cx} cy={cy} r={5} fill="var(--color-background)" stroke="var(--kid-mint)" strokeWidth={2.5} />
    </g>
  );
}

function PlannerChart() {
  const t = useT();
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm font-medium">{t("Proyección de crecimiento", "Growth projection")}</p>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-0.5 w-5 rounded-full bg-kid-mint" /> {t("Tu inversión", "Your investment")}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-0.5 w-5 rounded-full border-t-2 border-dashed border-muted-foreground/60" />{" "}
          {t("Objetivo", "Goal")}
        </span>
      </div>
      <div className="mt-2 h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={plannerCurve} margin={{ top: 46, right: 12, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="planner-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--kid-mint)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--kid-mint)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="age"
              ticks={[5, 10, 15, 18]}
              tickFormatter={(v: number) => `${v} ${t("años", "yrs")}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              width={62}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickFormatter={(v: number) => (v === 0 ? "0 €" : `${Math.round(v / 1000)} mil €`)}
            />
            <Line
              type="monotone"
              dataKey="goal"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="6 6"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--kid-mint)"
              strokeWidth={3}
              fill="url(#planner-area)"
              isAnimationActive={false}
              dot={<PlanMilestoneDot />}
              activeDot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        {t(
          "Fuente: retorno histórico nominal del S&P 500 con dividendos reinvertidos, ~10% anual desde 1957. La rentabilidad pasada no garantiza la futura.",
          "Source: nominal historical S&P 500 return with dividends reinvested, ~10% a year since 1957. Past returns don't guarantee future ones.",
        )}
      </p>
    </div>
  );
}

function FamilyPlannerVisual() {
  const t = useT();

  const metrics = [
    { icon: PiggyBank, k: t("Capital inicial", "Starting capital"), v: eur(PLAN_START), s: t("Hoy", "Today") },
    { icon: Coins, k: t("Aporte mensual", "Monthly deposit"), v: eur(PLAN_MONTHLY), s: t("Cada mes", "Every month") },
    { icon: Target, k: t("Objetivo", "Goal"), v: eur(PLAN_GOAL), s: t("A los 18 años", "At age 18") },
    { icon: GraduationCap, k: t("Edad objetivo", "Target age"), v: "18", s: t("13 años por delante", "13 years ahead") },
    { icon: TrendingUp, k: t("Rentabilidad", "Expected return"), v: "10%", s: "S&P 500" },
  ];

  const summary = [
    { k: t("Aportes totales", "Total deposits"), v: eur(PLAN_CONTRIB), s: t("Durante 13 años", "Over 13 years"), c: "var(--kid-sky)" },
    { k: t("Crecimiento estimado", "Estimated growth"), v: eur(PLAN_GROWTH), s: t("Gracias al interés compuesto", "Thanks to compound interest"), c: "var(--kid-mint)" },
    { k: t("Valor a los 18", "Value at 18"), v: eur(PLAN_FUTURE), s: t("Objetivo final", "Final goal"), c: "var(--kid-grape)" },
    { k: t("Tiempo para lograrlo", "Time to get there"), v: t("13 años", "13 years"), s: t("Antes de los 18", "Before turning 18"), c: "var(--kid-sun)" },
  ];

  return (
    <ScreenCard title={t("Planificador familiar", "Family planner")} accent="var(--kid-mint)">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" /> {t("Universidad", "University")}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {t("El futuro de Sofía", "Sofía's future")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(`Si inviertes ${eur(PLAN_MONTHLY)} al mes desde hoy, Sofía tendrá`, `If you invest ${eur(PLAN_MONTHLY)} a month from today, Sofía will have`)}
          </p>
          <p className="numeric mt-1 text-4xl font-semibold text-kid-mint md:text-5xl">{eur(PLAN_FUTURE)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("cuando cumpla 18 años.", "when she turns 18.")}</p>
          <span className="numeric mt-3 inline-flex items-center gap-1.5 rounded-full bg-kid-sun/12 px-3 py-1.5 text-xs font-semibold text-kid-sun ring-1 ring-kid-sun/25">
            <Target className="h-3.5 w-3.5" /> {t("Faltan 86 €/mes", "86 €/mo to go")}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-elevated/60 p-4 ring-1 ring-border/60">
          <div
            className="relative flex h-28 w-28 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--kid-mint) 0% ${PLAN_PCT}%, color-mix(in oklab, var(--kid-mint) 14%, transparent) ${PLAN_PCT}% 100%)`,
            }}
          >
            <span className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-card">
              <span className="numeric text-xl font-bold text-kid-mint">{PLAN_PCT}%</span>
              <span className="text-[10px] text-muted-foreground">{t("del objetivo", "of goal")}</span>
            </span>
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("Faltan 14 años y 11 meses para alcanzar tu meta", "14 years and 11 months to reach your goal")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.k} className="rounded-2xl bg-elevated/60 p-3 ring-1 ring-border/60">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-kid-mint" />
                <span className="truncate">{m.k}</span>
              </p>
              <p className="numeric mt-1.5 text-lg font-semibold">{m.v}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{m.s}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.k} className="rounded-2xl bg-elevated/60 p-3 ring-1 ring-border/60">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</p>
            <p className="numeric mt-1 text-lg font-semibold">{s.v}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.c }} />
              <span className="truncate">{s.s}</span>
            </p>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}



const DEMO_UNIS = [
  {
    id: "es-universitat-de-barcelona",
    name: "Universitat de Barcelona",
    city: "Barcelona",
    country: "🇪🇸",
    rank: 149,
    cost: 9600,
    region: "eu",
  },
  {
    id: "uk-university-of-oxford",
    name: "University of Oxford",
    city: "Oxford",
    country: "🇬🇧",
    rank: 3,
    cost: 46200,
    region: "eu",
  },
  {
    id: "nl-tu-delft",
    name: "TU Delft",
    city: "Delft",
    country: "🇳🇱",
    rank: 49,
    cost: 21400,
    region: "eu",
  },
  {
    id: "ca-university-of-toronto",
    name: "University of Toronto",
    city: "Toronto",
    country: "🇨🇦",
    rank: 21,
    cost: 38900,
    region: "na",
  },
  {
    id: "us-mit",
    name: "MIT",
    city: "Boston",
    country: "🇺🇸",
    rank: 1,
    cost: 82500,
    region: "na",
  },
] as const;

function UniFinderVisual() {
  const t = useT();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<"all" | "eu" | "na">("all");
  const budget = 10668;

  const list = DEMO_UNIS.filter((u) => (region === "all" ? true : u.region === region)).filter((u) =>
    q.trim() ? `${u.name} ${u.city}`.toLowerCase().includes(q.trim().toLowerCase()) : true,
  ).slice().sort((a, b) => a.rank - b.rank);
  const eligible = list.filter((u) => u.cost <= budget);
  const hero = list[0];

  const rest = list.slice(1, 3);
  const fmt = (v: number) => `€${Math.round(v).toLocaleString("es-ES")}`;

  return (
    <ScreenCard title={t("Buscador de universidades", "University finder")} accent="var(--kid-grape)">
      <div className="flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Busca una universidad o ciudad", "Search a university or city")}
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-2.5 flex gap-1.5">
        {(["all", "eu", "na"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              region === r
                ? "bg-kid-grape/15 text-kid-grape ring-1 ring-kid-grape/40"
                : "bg-elevated text-muted-foreground hover:text-foreground"
            }`}
          >
            {r === "all" ? t("Mundo", "World") : r === "eu" ? t("Europa", "Europe") : t("Norteamérica", "N. America")}
          </button>
        ))}
      </div>

      {hero ? (
        <>
          <p className="mt-2.5 text-[11px] text-muted-foreground">
            {t(
              `Con €${budget.toLocaleString("es-ES")} podría aplicar a ${eligible.length} de ${list.length} universidades mostradas`,
              `With €${budget.toLocaleString("es-ES")} they could apply to ${eligible.length} of ${list.length} universities shown`,
            )}
          </p>
          <div className="relative mt-2 h-32 overflow-hidden rounded-2xl ring-1 ring-border">
            <img
              src={REAL_UNI_PHOTOS[hero.id]}
              alt={hero.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full bg-kid-grape/90 px-2 py-0.5 text-[10px] font-semibold text-background">
              #{hero.rank} · {t("ranking mundial", "world ranking")}
            </span>
            <span
              className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                hero.cost <= budget
                  ? "bg-kid-mint/15 text-kid-mint ring-kid-mint/30"
                  : "bg-elevated/80 text-muted-foreground ring-border"
              }`}
            >
              {hero.cost <= budget ? t("Puede aplicar", "Can apply") : t("Le falta", "Short")}
            </span>
            <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {hero.country} {hero.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hero.city} · {fmt(hero.cost)} {t("carrera completa", "full degree")}
                </p>
              </div>
              <span className="numeric rounded-full bg-kid-mint/15 px-2.5 py-1 text-xs font-semibold text-kid-mint ring-1 ring-kid-mint/30">
                {Math.min(999, Math.round((budget / hero.cost) * 100))}%
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {rest.map((u) => (
              <div key={u.id} className="relative h-20 overflow-hidden rounded-xl ring-1 ring-border">
                <img
                  src={REAL_UNI_PHOTOS[u.id]}
                  alt={u.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                {u.cost <= budget && (
                  <span className="absolute right-2 top-2 rounded-full bg-kid-mint/20 px-1.5 py-0.5 text-[9px] font-semibold text-kid-mint">
                    {t("Puede aplicar", "Can apply")}
                  </span>
                )}
                <div className="absolute inset-x-2.5 bottom-2 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold">
                      {u.country} {u.name}
                    </p>
                    <p className="numeric truncate text-[10px] text-muted-foreground">{fmt(u.cost)}</p>
                  </div>
                  <span className="numeric rounded-full bg-kid-grape/15 px-1.5 py-0.5 text-[10px] font-medium text-kid-grape">
                    #{u.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6 text-center text-xs text-muted-foreground">{t("Sin resultados", "No results")}</p>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
        <GraduationCap className="mt-0.5 h-3 w-3 shrink-0" />
        {t(
          "Ranking QS/THE + coste de vida por ciudad, comparado con su número del futuro.",
          "QS/THE ranking + city living costs, compared with their future number.",
        )}
      </p>

    </ScreenCard>
  );
}

function HowItWorksSlider() {
  const t = useT();
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);

  const pockets = [
    { label: t("Ahorrar", "Save"), value: 40, amount: "€24", color: "var(--kid-mint)" },
    { label: t("Invertir", "Invest"), value: 40, amount: "€24", color: "var(--kid-grape)" },
    { label: t("Gastar", "Spend"), value: 20, amount: "€12", color: "var(--kid-sky)" },
  ];

  const rawSlides = [

    {
      id: "numbers",
      tab: t("Mi Primer Número", "My First Number"),
      icon: Wallet,
      color: "var(--kid-sky)",
      title: t("Su número de hoy y el del futuro", "Their number today and tomorrow"),
      desc: t(
        "Ve su dinero disponible en grande y hacia dónde puede llegar si sigue ahorrando cada semana.",
        "They see their money right now, and where it can go if they keep saving every week.",
      ),
      visual: (
        <ScreenCard title={t("Mi primer número", "My first number")} accent="var(--kid-sky)">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src={faceGirl} alt="" className="h-9 w-9 rounded-full object-cover" />
              <div>
                <p className="text-sm font-medium">{t("Cómo crece mi número", "How my number grows")}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "Simulación basada en hipótesis de rentabilidad.",
                    "Simulation based on return assumptions.",
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-kid-sky" />
                {t("Con intereses · 7,2%", "With interest · 7.2%")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
                {t("Lo que ahorró", "What she saved")}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr_1fr]">
            <div className="rounded-2xl bg-elevated/60 p-3 ring-1 ring-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Edad", "Age")}</p>
              <div className="mt-2 flex items-center gap-1.5">
                {[10, 18, 25, 30].map((a) => (
                  <span
                    key={a}
                    className={`numeric rounded-full px-2.5 py-1 text-xs font-semibold ${
                      a === 18 ? "bg-kid-sky text-background" : "text-muted-foreground"
                    }`}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-elevated/60 p-3 ring-1 ring-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Tasa", "Rate")}</p>
              <span className="numeric mt-2 inline-flex rounded-full bg-kid-sky/15 px-3 py-1 text-xs font-semibold text-kid-sky">
                S&P 500 · 7,2%
              </span>
            </div>
            <div className="rounded-2xl border border-kid-grape/25 bg-kid-grape/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-kid-grape">
                {t("A los 18 años", "At age 18")}
              </p>
              <p className="numeric mt-1 text-2xl font-semibold">€10.668</p>
              <p className="numeric mt-0.5 text-[11px] text-muted-foreground">
                {t("Ahorrado", "Saved")} €2.442 · {t("Intereses", "Interest")}{" "}
                <span className="text-kid-mint">€8.226</span>
              </p>
            </div>
          </div>

          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growCurve} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="first-number-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--kid-sky)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--kid-sky)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="x"
                  ticks={[0, 5, 10, 14, 18]}
                  tickFormatter={(v: number) => (v === 0 ? t("Hoy", "Today") : `${v}`)}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="flat"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="var(--kid-sky)"
                  strokeWidth={2.5}
                  fill="url(#first-number-area)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 rounded-2xl bg-kid-sky/10 px-4 py-2.5 text-[12px] text-foreground ring-1 ring-kid-sky/20">
            💡{" "}
            {t(
              "Con un 7,2% al año, sus intereses suman €8.226 extra.",
              "At 7.2% a year, her interest adds €8,226 extra.",
            )}
          </div>
        </ScreenCard>
      ),

    },
    {
      id: "dreams",
      tab: t("Mis sueños", "My dreams"),
      icon: Target,
      color: "var(--kid-coral)",
      title: t("Sueños con barra de progreso", "Dreams with a progress bar"),
      desc: t(
        "La bici, el viaje o el videojuego: ven cuánto les falta y ahorran para conseguirlo.",
        "The bike, the trip or the game: they see what's left and save to get there.",
      ),
      visual: (
        <ScreenCard title={t("Mis sueños activos", "My active dreams")} accent="var(--kid-coral)">
          <div className="space-y-4">
            {[
              {
                e: "🚲",
                name: t("Bici nueva", "New bike"),
                have: "€186",
                goal: "€300",
                missing: "€114",
                pct: 62,
                date: t("Llegará el 12 dic 2026", "Arrives Dec 12, 2026"),
                eta: t("en 3 meses", "in 3 months"),
                c: "var(--kid-mint)",
              },
              {
                e: "🎮",
                name: t("Nintendo Switch", "Nintendo Switch"),
                have: "€9",
                goal: "€300",
                missing: "€291",
                pct: 3,
                date: t("Llegará el 8 mar 2027", "Arrives Mar 8, 2027"),
                eta: t("en 18 meses", "in 18 months"),
                c: "var(--kid-coral)",
              },
              {
                e: "🎢",
                name: t("Viaje a Disney", "Disney trip"),
                have: "€120",
                goal: "€1.200",
                missing: "€1.080",
                pct: 10,
                date: t("Llegará el 20 ago 2028", "Arrives Aug 20, 2028"),
                eta: t("en 2 años", "in 2 years"),
                c: "var(--kid-sun)",
              },
            ].map((d) => (
              <div key={d.name} className="rounded-2xl bg-elevated/70 p-4 ring-1 ring-border/50">
                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ backgroundColor: `color-mix(in oklab, ${d.c} 12%, transparent)` }}
                  >
                    {d.e}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <span className="numeric text-xs text-muted-foreground">{d.goal}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[11px]">
                      <span className="numeric font-medium" style={{ color: d.c }}>
                        {d.have} {t("ahorrados", "saved")}
                      </span>
                      <span className="text-muted-foreground">
                        {t("Te faltan", "Missing")} <span className="numeric font-medium">{d.missing}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(d.pct, 2)}%`, background: `linear-gradient(90deg, ${d.c}, color-mix(in oklab, ${d.c} 60%, white))` }}
                    />
                  </div>
                  <span className="numeric text-xs font-bold" style={{ color: d.c }}>{d.pct}%</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CalendarCheck className="h-3.5 w-3.5" style={{ color: d.c }} />
                    <span>{d.date}</span>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-background transition-transform hover:scale-105"
                    style={{ backgroundColor: d.c }}
                  >
                    <Rocket className="h-3 w-3" />
                    {t("Acelerar", "Accelerate")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScreenCard>
      ),
    },
    {
      id: "chores",
      tab: t("Mis tareas", "My chores"),
      icon: CalendarCheck,
      color: "var(--kid-sun)",
      title: t("Mesada automática y tareas", "Automatic allowance and chores"),
      desc: t(
        "Programa la mesada, aprueba tareas y su dinero se reparte solo entre sus bolsillos.",
        "Schedule the allowance, approve chores and their money splits itself across pockets.",
      ),
      visual: (
        <ScreenCard title={t("Mis tareas", "My chores")} accent="var(--kid-sun)">
          <div className="grid grid-cols-3 gap-2">
            {[
              { e: "💰", k: t("Ganado", "Earned"), v: "€6,50", c: "var(--kid-sun)" },
              { e: "✅", k: t("Hechas", "Done"), v: "2/4", c: "var(--kid-mint)" },
              { e: "🔥", k: t("Racha", "Streak"), v: t("4 días", "4 days"), c: "var(--kid-coral)" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-background/60 p-3 ring-1 ring-border/50">
                <span className="text-base leading-none">{s.e}</span>
                <p className="numeric mt-1.5 text-sm font-bold" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[11px] text-muted-foreground">{s.k}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-medium">{t("Tareas de esta semana", "This week's chores")}</p>
            <span className="numeric text-sm font-semibold text-kid-sun">+€6,50</span>
          </div>

          <div className="mt-3 space-y-2.5">
            {[
              { e: "🛏️", k: t("Hacer mi cama", "Make my bed"), v: "+€0,50", ok: true },
              { e: "🐶", k: t("Pasear al perro", "Walk the dog"), v: "+€2,00", ok: true },
              { e: "🧺", k: t("Ordenar mi habitación", "Tidy my room"), v: "+€1,00", ok: false },
              { e: "📚", k: t("Leer 20 minutos", "Read 20 minutes"), v: "+€0,50", ok: false },
            ].map((r) => (
              <div
                key={r.k}
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl px-4 py-4 ring-1",
                  r.ok ? "bg-kid-mint/10 ring-kid-mint/25" : "bg-background/40 ring-border/40",
                )}
              >
                <span className="text-2xl leading-none">{r.e}</span>
                <span className={cn("min-w-0 flex-1 truncate text-[15px] font-medium", r.ok && "text-muted-foreground line-through")}>
                  {r.k}
                </span>
                <span className={cn("numeric text-[15px] font-semibold", r.ok ? "text-kid-mint" : "text-muted-foreground")}>{r.v}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    r.ok ? "bg-kid-mint text-background" : "bg-card ring-1 ring-border",
                  )}
                >
                  <BadgeCheck className={cn("h-4 w-4", r.ok ? "" : "text-muted-foreground/40")} />
                </span>
              </div>
            ))}
          </div>

        </ScreenCard>

      ),
    },

    {
      id: "grow",
      tab: t("Planificador familiar", "Family planner"),
      icon: Rocket,
      color: "var(--kid-mint)",
      title: t("El plan del futuro, en una pantalla", "The future plan, on one screen"),
      desc: t(
        "Ajusta capital, aporte mensual y edad objetivo: verás al instante cuánto tendrá y cuánto viene del interés compuesto.",
        "Tune starting capital, monthly deposit and target age: see instantly how much they'll have and how much comes from compounding.",
      ),
      visual: (
        <ScreenCard title={t("Planificador familiar", "Family planner")} accent="var(--kid-mint)">
          <div className="flex h-full min-h-[420px] flex-col">
            <PlannerChart />
          </div>
        </ScreenCard>
      ),

    },
    {
      id: "unis",
      tab: t("Universidades", "Universities"),
      icon: GraduationCap,
      color: "var(--kid-grape)",
      title: t("Buscador de universidades", "University finder"),
      desc: t(
        "Busca por universidad, ciudad o continente y mira al instante a cuáles podría aplicar con su número del futuro.",
        "Search by university, city or continent and instantly see which ones they could apply to with their future number.",
      ),
      visual: <UniFinderVisual />,
    },
  ];

  const order = ["numbers", "chores", "dreams", "grow", "unis"];

  const slides = [...rawSlides].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const buddy: Record<string, string> = {
    numbers: t(
      "Sofía va un 11% de camino a su número. Con 3 € más al mes llegaría 8 meses antes.",
      "Sofía is 11% of the way to her number. Just €3 more a month gets her there 8 months sooner.",
    ),
    grow: t(
      "Con 99 €/mes Sofía llega al 82% de su objetivo universitario. Subiendo a 185 €/mes lo cubre entero.",
      "At €99/mo Sofía reaches 82% of her university goal. Raising it to €185/mo covers it fully.",
    ),
    unis: t(
      "Con su número podría aplicar hoy a 3 de estas universidades: cubre el 111% de un grado en Barcelona.",
      "With her number she could already apply to 3 of these universities: it covers 111% of a degree in Barcelona.",

    ),
    pockets: t(
      "Su bolsillo de gastar lleva 3 semanas intacto: buena señal para subir el de invertir al 45%.",
      "Her spend pocket has been untouched for 3 weeks: a good sign to push invest up to 45%.",
    ),
    chores: t(
      "Las tareas aportan el 39% de su dinero. Añadir una tarea de 1 € sumaría €52 al año.",
      "Chores bring in 39% of her money. Adding a €1 chore would add €52 a year.",
    ),
    dreams: t(
      "Si mueve 5 € del bolsillo de gastar, consigue la bici 6 semanas antes.",
      "Moving €5 from her spend pocket gets her the bike 6 weeks earlier.",
    ),
    badges: t(
      "7 semanas de racha: está en su mejor momento. Un reto nuevo mantiene el impulso.",
      "7-week streak: she's at her best. A fresh quest keeps the momentum going.",
    ),
  };

  const stats: Record<string, Array<{ k: string; v: string }>> = {
    numbers: [
      { k: t("Hoy", "Today"), v: "€120" },
      { k: t("A los 18", "At 18"), v: "€10.668" },
      { k: t("Ahorro/mes", "Saving/mo"), v: "€11,3" },
    ],
    pockets: [
      { k: t("Ahorrar", "Save"), v: "40%" },
      { k: t("Invertir", "Invest"), v: "40%" },
      { k: t("Gastar", "Spend"), v: "20%" },
    ],
    dreams: [
      { k: t("Sueños activos", "Active dreams"), v: "3" },
      { k: t("Progreso", "Progress"), v: "62%" },
      { k: t("Conseguidos", "Achieved"), v: "5" },
    ],
    chores: [
      { k: t("Esta semana", "This week"), v: "+€6,50" },
      { k: t("Mesada", "Allowance"), v: "€10/sem" },
      { k: t("Tareas", "Chores"), v: "4" },
    ],
    grow: [
      { k: t("Rentabilidad", "Return"), v: "10%" },
      { k: t("Aportado", "Contributed"), v: eur(PLAN_CONTRIB) },
      { k: t("Intereses", "Growth"), v: eur(PLAN_GROWTH) },
    ],
    badges: [
      { k: t("Racha", "Streak"), v: "7 " + t("sem.", "wks") },
      { k: t("Insignias", "Badges"), v: "12" },
      { k: t("Nivel", "Level"), v: "4" },
    ],
    unis: [
      { k: t("Universidades", "Universities"), v: "500+" },
      { k: t("Países", "Countries"), v: "28" },
      { k: t("Cobertura", "Coverage"), v: "111%" },
    ],
  };



  const sideTitle: Record<string, string> = {
    numbers: t("Cómo se reparte su dinero", "How their money is split"),
    pockets: t("Cómo se reparte su dinero", "How their money is split"),
    chores: t("Seguimiento de tareas", "Chore tracking"),
    dreams: t("Sus sueños en marcha", "Their dreams in progress"),
    grow: t("Proyección de crecimiento", "Growth projection"),
    unis: t("Universidades que podría pagar", "Universities they could afford"),
  };

  const active = slides[i]!;

  return (
    <section className="mt-16 md:mt-24">
      <SectionHeader
        eyebrow={t("Cómo se ve por dentro", "How it looks inside")}
        title={t("Aprender sobre dinero empieza aquí", "Learning about money starts here")}
        subtitle={t(
          "Ahorrar, invertir, cumplir sueños y entender el valor del dinero. Todo en un solo lugar.",
          "Saving, investing, chasing dreams and understanding the value of money. All in one place.",
        )}
      />

      <div
        className="relative mt-8 rounded-[30px] border border-border/70 bg-card/60 p-2 shadow-2xl backdrop-blur-sm md:mt-12 md:p-3"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX ?? null;
          touchX.current = null;
          if (start == null || end == null) return;
          const dx = end - start;
          if (Math.abs(dx) < 40) return;
          setI((v) => (dx < 0 ? (v + 1) % slides.length : (v - 1 + slides.length) % slides.length));
        }}
      >
        <div
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] blur-3xl"
          style={{ background: `color-mix(in oklab, ${active.color} 12%, transparent)` }}
        />

        <div className="relative flex items-center gap-2 px-3 py-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-kid-coral/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-kid-sun/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-kid-mint/70" />
          </span>
          <span className="mx-auto hidden rounded-full bg-elevated px-4 py-1 text-[11px] text-muted-foreground sm:inline-block">
            {t("Su primer número, en 1 pantalla", "Their first number, on one screen")}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[24px] bg-background/70 p-4 ring-1 ring-border md:p-6 lg:[zoom:0.72]">
          <div className="kid-gradient pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70" />

          <div className="-mx-1 flex items-center gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {slides.map((s, k) => {
              const TabIcon = s.icon;
              const isActive = k === i;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setI(k)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                    isActive ? "shadow-lg" : "bg-elevated text-muted-foreground hover:text-foreground",
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: s.color,
                          color: "var(--color-background)",
                          boxShadow: `0 8px 24px color-mix(in oklab, ${s.color} 25%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{s.tab}</span>
                </button>
              );
            })}
            <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-elevated px-3.5 py-2 text-xs text-muted-foreground md:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kid-mint opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-kid-mint" />
              </span>
              {t("En vivo", "Live")}
            </span>

          </div>

          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-5 grid items-stretch gap-4 lg:min-h-[620px] lg:grid-cols-[1.55fr_1fr]"
          >
            <div className="flex min-w-0 flex-col gap-4">
              <div className="min-w-0 flex-1">{active.visual}</div>

              <div
                className="relative mt-auto overflow-hidden rounded-2xl p-4 ring-1"
                style={{
                  backgroundColor: `color-mix(in oklab, ${active.color} 7%, transparent)`,
                  borderColor: "transparent",
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${active.color} 22%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{
                      color: active.color,
                      backgroundColor: `color-mix(in oklab, ${active.color} 15%, transparent)`,
                    }}
                  >
                    <Bot className="h-4 w-4" />
                  </span>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: active.color }}
                  >
                    UR Buddy
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {buddy[active.id]}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-1 flex-col justify-between rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
                <p className="text-sm font-semibold">{sideTitle[active.id] ?? t("Resumen", "Summary")}</p>

                {active.id === "numbers" ? (
                  <>
                    <div className="mt-1 h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pockets}
                            dataKey="value"
                            nameKey="label"
                            innerRadius="62%"
                            outerRadius="92%"
                            paddingAngle={3}
                            stroke="none"
                          >
                            {pockets.map((p) => (
                              <Cell key={p.label} fill={p.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 space-y-2.5">
                      {pockets.map((p) => (
                        <div key={p.label} className="flex items-center gap-2 text-sm">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                          <span className="truncate text-muted-foreground">
                            {p.label} ({p.value}%)
                          </span>
                          <span className="numeric ml-auto font-semibold">{p.amount}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("Su regla: 80% ahorrar e invertir · 20% gastar", "Their rule: 80% save & invest · 20% spend")}
                    </p>

                    <div className="mt-4 rounded-2xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-muted-foreground">{t("Progreso del mes", "Month progress")}</p>
                        <span className="numeric font-semibold text-kid-sky">€1.150 / €10.668</span>
                      </div>
                      <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-card">
                        <div
                          className="h-full rounded-full"
                          style={{ width: "11%", background: "linear-gradient(90deg, var(--kid-sky), var(--kid-mint))" }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {t("Ahorrando €11,3 al mes hasta los 18 años.", "Saving €11.3 per month until age 18.")}
                      </p>
                    </div>
                  </>
                ) : active.id === "chores" ? (
                  <>
                    <div className="mt-3 flex items-center gap-4 rounded-2xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div
                        className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background:
                            "conic-gradient(var(--kid-sun) 0% 75%, color-mix(in oklab, var(--kid-sun) 14%, transparent) 75% 100%)",
                        }}
                      >
                        <span className="flex h-[70px] w-[70px] flex-col items-center justify-center rounded-full bg-elevated">
                          <span className="numeric text-lg font-bold text-kid-sun">75%</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{t("3 de 4 tareas", "3 of 4 chores")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("Completadas esta semana", "Completed this week")}
                        </p>
                        <p className="numeric mt-2 text-sm font-bold text-kid-mint">+€6,50</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{t("Racha de la semana", "Weekly streak")}</p>
                        <span className="numeric text-xs font-semibold text-kid-mint">
                          {t("4 días seguidos", "4 days in a row")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                                idx < 4 ? "bg-kid-mint text-background" : "ring-1 ring-border/60 text-muted-foreground"
                              }`}
                            >
                              {idx < 4 ? "✓" : ""}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { e: "💰", k: t("Este mes", "This month"), v: "€24,00", c: "var(--kid-sun)" },
                        { e: "🏆", k: t("Mejor racha", "Best streak"), v: t("12 días", "12 days"), c: "var(--kid-coral)" },
                      ].map((s) => (
                        <div key={s.k} className="rounded-2xl bg-background/60 p-3.5 ring-1 ring-border/50">
                          <span className="text-base leading-none">{s.e}</span>
                          <p className="numeric mt-1.5 text-base font-bold" style={{ color: s.c }}>{s.v}</p>
                          <p className="text-[11px] text-muted-foreground">{s.k}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-muted-foreground">{t("Próxima recompensa", "Next reward")}</p>
                        <span className="numeric font-semibold text-kid-sun">€24 / €30</span>
                      </div>
                      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-card">
                        <div
                          className="h-full rounded-full"
                          style={{ width: "80%", background: "linear-gradient(90deg, var(--kid-sun), var(--kid-mint))" }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {t("Le faltan €6 para su bici nueva 🚲", "€6 to go for their new bike 🚲")}
                      </p>
                    </div>



                  </>
                ) : active.id === "dreams" ? (
                  <>
                    <div className="mt-3 flex flex-col items-center">
                      <div
                        className="relative flex h-32 w-32 items-center justify-center rounded-full"
                        style={{
                          background:
                            "conic-gradient(var(--kid-coral) 0% 25%, var(--kid-sun) 25% 33%, var(--kid-mint) 33% 75%, color-mix(in oklab, var(--kid-coral) 14%, transparent) 75% 100%)",
                        }}
                      >
                        <span className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-elevated">
                          <span className="numeric text-xl font-bold text-kid-coral">€315</span>
                          <span className="text-[10px] text-muted-foreground">{t("ahorrados", "saved")}</span>
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("de €1.800 en total", "of €1,800 total")}
                      </p>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {[
                        { e: "🚲", n: t("Bici nueva", "New bike"), eta: t("3 meses", "3 months"), c: "var(--kid-mint)" },
                        { e: "🎢", n: t("Viaje a Disney", "Disney trip"), eta: t("2 años", "2 years"), c: "var(--kid-sun)" },
                        { e: "🎮", n: "Nintendo Switch", eta: t("18 meses", "18 months"), c: "var(--kid-coral)" },
                      ].map((d) => (
                        <div key={d.n} className="flex items-center gap-2.5 rounded-xl bg-background/60 p-2.5 ring-1 ring-border/40">
                          <span className="text-lg leading-none">{d.e}</span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">{d.n}</span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarCheck className="h-3 w-3" style={{ color: d.c }} />
                            {d.eta}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-muted-foreground">{t("Próximo sueño", "Next dream")}</p>
                        <span className="numeric font-semibold text-kid-mint">€186 / €300</span>
                      </div>
                      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-card">
                        <div
                          className="h-full rounded-full"
                          style={{ width: "62%", background: "linear-gradient(90deg, var(--kid-mint), var(--kid-sky))" }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {t("Le faltan €114 para su bici nueva 🚲", "€114 to go for their new bike 🚲")}
                      </p>
                    </div>
                  </>
                ) : active.id === "grow" ? (
                  <div className="flex h-full flex-col justify-between gap-3">
                    {/* Headline */}
                    <div>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <GraduationCap className="h-4 w-4" /> {t("El futuro de Sofía", "Sofía's future")}
                      </p>
                      <p className="numeric mt-3 text-4xl font-bold leading-tight text-kid-mint">{eur(PLAN_FUTURE)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("cuando cumpla 18 años", "when she turns 18")}</p>
                    </div>

                    {/* Progress ring */}
                    <div className="flex items-center gap-4 rounded-2xl bg-background/60 p-4 ring-1 ring-border/40">
                      <div
                        className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(var(--kid-mint) 0% ${PLAN_PCT}%, color-mix(in oklab, var(--kid-mint) 14%, transparent) ${PLAN_PCT}% 100%)`,
                        }}
                      >
                        <span className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full bg-card">
                          <span className="numeric text-lg font-bold text-kid-mint">{PLAN_PCT}%</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t("Camino a la meta", "On track to goal")}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {t("Faltan 14 años y 11 meses", "14 years and 11 months to go")}
                        </p>
                      </div>
                    </div>

                    {/* Equation: how the number is built */}
                    <div className="flex flex-1 flex-col justify-center gap-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("Cómo se construye", "How it's built")}
                      </p>
                      {[
                        { k: t("Aportes totales", "Total deposits"), v: eur(PLAN_CONTRIB), c: "var(--kid-sky)" },
                        { k: t("Interés compuesto", "Compound interest"), v: `+ ${eur(PLAN_GROWTH)}`, c: "var(--kid-mint)" },
                        { k: t("Valor a los 18", "Value at 18"), v: eur(PLAN_FUTURE), c: "var(--kid-grape)", strong: true },
                      ].map((m) => (
                        <div
                          key={m.k}
                          className={`flex items-center justify-between rounded-xl px-4 py-3.5 ring-1 ring-border/40 ${
                            m.strong ? "bg-kid-mint/8" : "bg-background/60"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-2 w-2 rounded-full" style={{ background: m.c }} />
                            {m.k}
                          </span>
                          <span
                            className={`numeric ${m.strong ? "text-base font-bold" : "text-base font-semibold"}`}
                            style={m.strong ? { color: m.c } : undefined}
                          >
                            {m.v}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Gap to goal */}
                    <div className="flex items-center gap-3 rounded-xl bg-kid-sun/10 px-4 py-3.5 ring-1 ring-kid-sun/25">
                      <Target className="h-5 w-5 shrink-0 text-kid-sun" />
                      <p className="text-sm leading-tight">
                        <span className="font-semibold text-kid-sun">{t("Faltan 86 €/mes", "86 €/mo to go")}</span>{" "}
                        <span className="text-muted-foreground">{t("para cubrir el objetivo", "to fully cover the goal")}</span>
                      </p>
                    </div>
                  </div>

                ) : (
                  <>
                    <div className="mt-3 space-y-3">
                      {[
                        { n: "Univ. de Barcelona", cost: "€9.600", pct: 111, c: "var(--kid-mint)" },
                        { n: "TU Delft", cost: "€16.200", pct: 66, c: "var(--kid-sky)" },
                        { n: "Univ. of Toronto", cost: "€45.000", pct: 24, c: "var(--kid-grape)" },
                      ].map((u) => (
                        <div key={u.n} className="rounded-xl bg-background/60 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate">{u.n}</span>
                            <span className="numeric font-semibold" style={{ color: u.c }}>
                              {u.pct}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(u.pct, 100)}%`, backgroundColor: u.c }}
                            />
                          </div>
                          <p className="numeric mt-1.5 text-[11px] text-muted-foreground">
                            {t("Coste del grado", "Degree cost")} {u.cost}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("Cobertura estimada con su número a los 18.", "Estimated coverage with their number at 18.")}
                    </p>
                  </>
                )}
              </div>

            </div>
          </motion.div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              {slides.map((s, k) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={s.title}
                  onClick={() => setI(k)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: k === i ? 28 : 10,
                    backgroundColor: k === i ? active.color : "var(--border)",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={t("Anterior", "Previous")}
                onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border transition-colors hover:bg-elevated"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={t("Siguiente", "Next")}
                onClick={() => setI((v) => (v + 1) % slides.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border transition-colors hover:bg-elevated"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

const pocketMonths = [
  { m: "Ene", save: 16, invest: 16, spend: 8 },
  { m: "Feb", save: 18, invest: 18, spend: 9 },
  { m: "Mar", save: 20, invest: 20, spend: 10 },
  { m: "Abr", save: 22, invest: 22, spend: 11 },
  { m: "May", save: 23, invest: 23, spend: 11 },
  { m: "Jun", save: 24, invest: 24, spend: 12 },
];


const planBars = [4, 7, 10, 13, 17, 21, 26, 32, 39, 47, 56, 66, 78, 92].map((v, i) => ({
  x: i,
  v,
}));
const growCurve = Array.from({ length: 19 }, (_, i) => ({
  x: i,
  y: Math.round(50 * 12 * ((Math.pow(1.072, i) - 1) / 0.072)),
  flat: 50 * 12 * i,
}));
const teachSplit = [
  { key: "save", pct: 40 },
  { key: "invest", pct: 40 },
  { key: "spend", pct: 20 },
];

function PillarVisual({ id, color, labels }: { id: string; color: string; labels: string[] }) {
  if (id === "plan") {
    return (
      <div className="mt-4 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={planBars} margin={{ top: 8, right: 2, bottom: 0, left: 0 }} barCategoryGap={3}>
            <defs>
              <linearGradient id="plan-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={color} stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <Bar dataKey="v" radius={[4, 4, 2, 2]} isAnimationActive={false}>
              {planBars.map((_, i) => (
                <Cell
                  key={i}
                  fill="url(#plan-bar)"
                  fillOpacity={0.35 + (i / planBars.length) * 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (id === "teach") {
    const shades = [80, 52, 30];
    const amounts = ["€20", "€20", "€10"];
    return (
      <div className="mt-4 flex h-24 flex-col justify-center gap-2.5">
        <div className="flex h-12 w-full items-end gap-2">
          {teachSplit.map((s, i) => (
            <div key={s.key} className="flex flex-1 flex-col items-center gap-2">
              <span className="numeric text-[11px] font-medium" style={{ color }}>
                {amounts[i]}
              </span>
              <span
                className="w-full rounded-t-lg"
                style={{
                  height: `${(s.pct / 40) * 40}px`,
                  background: `linear-gradient(180deg, color-mix(in oklab, ${color} ${shades[i]}%, transparent), color-mix(in oklab, ${color} 8%, transparent))`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-elevated">
          {teachSplit.map((s, i) => (
            <span
              key={s.key}
              style={{
                width: `${s.pct}%`,
                backgroundColor: `color-mix(in oklab, ${color} ${shades[i]}%, transparent)`,
              }}
              className="h-full border-r border-card last:border-0"
            />
          ))}
        </div>
        <div className="flex justify-between gap-1 text-[9px] text-muted-foreground sm:text-[10px]">
          {teachSplit.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: `color-mix(in oklab, ${color} ${shades[i]}%, transparent)` }}
              />
              {labels[i]} {s.pct}%
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (id === "fun") {
    return (
      <div className="relative mt-4 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-elevated">
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(60% 80% at 50% 60%, color-mix(in oklab, ${color} 22%, transparent), transparent)` }}
        />
        <img
          src={bikeAsset.url}
          alt=""
          loading="lazy"
          className="relative h-[86px] w-auto object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.5)]"
        />
      </div>
    );
  }



  return (
    <div className="mt-4 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={growCurve} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`pillar-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="flat"
            stroke="var(--color-muted-foreground)"
            strokeWidth={1.25}
            strokeDasharray="4 4"
            fill="transparent"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2.25}
            strokeLinecap="round"
            fill={`url(#pillar-${id})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


function ThreePillars() {
  const t = useT();

  const pillarAxis: Record<string, [string, string]> = {
    plan: [t("Aporte mensual", "Monthly deposit"), t("18 años", "Age 18")],
    teach: [t("Ahorrar · invertir", "Save · invest"), t("Gastar", "Spend")],
    grow: [t("Hoy", "Today"), t("Interés compuesto", "Compounding")],
    fun: [t("Ahorra cada semana", "Saves every week"), t("Premio", "Reward")],
  };


  const pillars = [
    {
      id: "plan",
      icon: CalendarCheck,
      color: "var(--kid-grape)",
      title: t("Planifica", "Plan"),
      desc: t(
        "Calcula cuánto invertir hoy para su universidad o su primer hogar.",
        "Work out how much to invest today for university or their first home.",
      ),
      metric: "€196.000",
      metricLabel: t("proyectado a los 18", "projected at 18"),
    },
    {
      id: "teach",
      icon: GraduationCap,
      color: "var(--kid-sky)",
      title: t("Enseña", "Teach"),
      desc: t(
        "Aprenden a ahorrar, gastar e invertir con su propio dinero.",
        "They learn to save, spend and invest with their own money.",
      ),
      metric: "40 / 40 / 20",
      metricLabel: t("ahorrar · invertir · gastar", "save · invest · spend"),
    },
    {
      id: "grow",
      icon: Rocket,
      color: "var(--kid-mint)",
      title: t("Crece", "Grow"),
      desc: t(
        "Cada euro ahorrado crece con el tiempo gracias al interés compuesto.",
        "Every euro saved compounds over time.",
      ),
      metric: "7,2%",
      metricLabel: t("rendimiento anual medio", "average annual return"),
    },
    {
      id: "fun",
      icon: Trophy,
      color: "var(--kid-sun)",
      title: t("Aprende finanzas divertido", "Learning money is fun"),
      desc: t(
        "Cada meta cumplida se convierte en un premio real: su bici nueva.",
        "Every goal they hit turns into a real reward: their new bike.",
      ),
      metric: "€250",
      metricLabel: t("bici desbloqueada como premio", "bike unlocked as a reward"),
    },
  ];

  return (
    <section className="mt-16">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-kid-mint">
        {t("¿Por qué usar My First Number?", "Why use My First Number?")}
      </p>
      <h2 className="mt-3 text-center font-display text-lg font-semibold tracking-tight md:text-xl">
        {t("Cuatro pilares para un futuro increíble", "Four pillars for an incredible future")}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-center text-xs text-muted-foreground">
        {t(
          "Un plan para los padres, hábitos para los hijos y tiempo trabajando a su favor.",
          "A plan for parents, habits for kids and time working in their favour.",
        )}
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


        {pillars.map(({ id, icon: Icon, color, title, desc, metric, metricLabel }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 md:p-5"
            style={{ boxShadow: "0 1px 0 0 color-mix(in oklab, var(--foreground) 5%, transparent) inset" }}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${color} 70%, transparent), transparent)`,
              }}
            />
            <span
              className="pointer-events-none absolute -top-24 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)` }}
            />

            <div className="relative flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  color,
                  backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 25%, transparent)`,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-display text-sm font-medium tracking-tight">{title}</h3>
            </div>
            <p className="relative mt-2.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>

            <div className="relative mt-auto pt-4">
              <div className="flex items-baseline gap-2">
                <span className="numeric text-xl font-semibold" style={{ color }}>
                  {metric}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{metricLabel}</p>

              <PillarVisual
                id={id}
                color={color}
                labels={[t("Ahorrar", "Save"), t("Invertir", "Invest"), t("Gastar", "Spend")]}
              />
              <div className="mt-2.5 flex justify-between border-t border-border/60 pt-2 text-[9px] uppercase tracking-wider text-muted-foreground/70">
                <span>{pillarAxis[id]?.[0]}</span>
                <span>{pillarAxis[id]?.[1]}</span>
              </div>
            </div>


          </motion.div>
        ))}
      </div>

    </section>

  );
}

function PhoneMock({
  accent,
  face,
  name,
  label,
  value,
  data,
  dataKey,
  rows,
  chip,
  id,
  cute,
}: {
  accent: string;
  face: string;
  name: string;
  label: string;
  value: string;
  data: Array<Record<string, number | string>>;
  dataKey: string;
  rows: Array<{ k: string; v: string }>;
  chip: string;
  id: string;
  cute?: boolean;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[310px] rounded-[2.75rem] bg-elevated p-[10px]"
      style={{
        boxShadow: `0 40px 90px -45px color-mix(in oklab, ${accent} 55%, transparent), inset 0 0 0 1px color-mix(in oklab, ${accent} 22%, transparent)`,
      }}
    >
      {/* side buttons */}
      <span className="absolute -left-[3px] top-[110px] h-10 w-[3px] rounded-l-full bg-border" />
      <span className="absolute -left-[3px] top-[160px] h-10 w-[3px] rounded-l-full bg-border" />
      <span className="absolute -right-[3px] top-[130px] h-14 w-[3px] rounded-r-full bg-border" />

      <div className="relative overflow-hidden rounded-[2.25rem] bg-card">
        {cute && (
          <span
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full blur-3xl"
            style={{ backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)` }}
          />
        )}

        {/* status bar + dynamic island */}
        <div className="relative flex items-center justify-between px-6 pt-3 text-[10px] text-muted-foreground/70">
          <span className="numeric">9:41</span>
          <span className="absolute left-1/2 top-2.5 h-6 w-[86px] -translate-x-1/2 rounded-full bg-background" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="h-2.5 w-4 rounded-[3px] border border-border" />
          </span>
        </div>

        <div className="relative px-5 pb-2 pt-6">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-[2px]"
              style={{ background: `color-mix(in oklab, ${accent} 35%, transparent)` }}
            >
              <img
                src={face}
                alt=""
                width={48}
                height={48}
                className="h-full w-full rounded-full object-cover"
              />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                {name}
                {cute && <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />}
              </p>
              <p className="text-[11px] text-muted-foreground">{chip}</p>
            </div>
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p
            className={`numeric mt-1 font-semibold ${cute ? "text-[2.35rem]" : "text-[2.35rem]"}`}
            style={{ color: accent }}
          >
            {value}
          </p>

          <div className={`mt-5 ${cute ? "h-28 rounded-2xl p-2" : "h-28"}`}
            style={cute ? { backgroundColor: `color-mix(in oklab, ${accent} 7%, transparent)` } : undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`phone-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={cute ? 0.45 : 0.3} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={accent}
                  strokeWidth={cute ? 2.5 : 2}
                  strokeLinecap="round"
                  fill={`url(#phone-${id})`}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-xs">
            {rows.map((r) => (
              <div
                key={r.k}
                className={cute ? "flex items-center justify-between rounded-lg px-2 py-1" : "flex items-center justify-between"}
                style={cute ? { backgroundColor: `color-mix(in oklab, ${accent} 6%, transparent)` } : undefined}
              >
                <dt className="text-muted-foreground">{r.k}</dt>
                <dd className="numeric font-medium">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-center pb-2.5 pt-1">
          <span className="h-1 w-28 rounded-full bg-border" />
        </div>
      </div>
    </div>
  );
}

function DualDashboards() {
  const t = useT();
  const data = [
    { y: "0", p: 0, k: 0 },
    { y: "2", p: 28000, k: 1200 },
    { y: "4", p: 61000, k: 3100 },
    { y: "6", p: 98000, k: 5600 },
    { y: "8", p: 142000, k: 8900 },
    { y: "10", p: 196000, k: 13250 },
  ];

  return (
    <section id="funciones" className="scroll-mt-24 mt-16 md:mt-24">
      <h2 className="text-center font-display text-2xl font-semibold tracking-tight md:text-3xl">
        {t("Dos paneles. Un mismo objetivo.", "Two dashboards. One shared goal.")}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
        {t(
          "Papá planifica el futuro desde su móvil. Ella construye el suyo desde el propio.",
          "Parents plan the future from their phone. Kids build theirs from their own.",
        )}
      </p>

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
        >
          <PhoneMock
            id="dad"
            accent="var(--kid-mint)"
            face={faceDad}
            name={t("Papá", "Dad")}
            chip={t("Plan familiar", "Family plan")}
            label={t("Fondo para la universidad", "College fund")}
            value="€196.000"
            data={data}
            dataKey="p"
            rows={[
              { k: t("Aporte mensual", "Monthly deposit"), v: "€300" },
              { k: t("Rendimiento", "Return"), v: "7,2%" },
              { k: t("Meta a los 18", "Goal at 18"), v: "€200.000" },
            ]}
          />
        </motion.div>

        <div className="flex items-center justify-center gap-3 lg:flex-col">
          <span className="hidden h-px w-10 bg-border lg:block lg:h-14 lg:w-px" />
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-kid-mint/30 bg-kid-mint/10 text-kid-mint">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-kid-mint">Family Planner</span>
          </div>
          <span className="hidden h-px w-10 bg-border lg:block lg:h-14 lg:w-px" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <PhoneMock
            id="kid"
            accent="var(--kid-pink)"
            cute
            face={faceGirl}
            name={t("Sofía", "Sofía")}
            chip={t("Su primer número", "Her first number")}
            label={t("Sofía aprende a crecer su dinero", "Sofía learns to grow her money")}
            value="€1.250"
            data={data}
            dataKey="k"
            rows={[
              { k: t("Ahorros", "Savings"), v: "€850" },
              { k: t("Inversiones", "Investments"), v: "€400" },
              { k: t("Sueño: bici nueva", "Dream: new bike"), v: "62%" },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

function GrowsWithThem() {
  const t = useT();
  const stages = [
    {
      range: t("0 a 5 años", "Ages 0 to 5"),
      headline: (
        <>
          {t("Construyes ", "You build ")}
          <span style={{ color: "var(--kid-grape)" }}>{t("su futuro", "their future")}</span>
        </>
      ),
      text: t("Tú empiezas por ellos mientras crecen.", "You start for them while they grow."),
      features: [
        { label: t("College Fund", "College Fund"), icon: GraduationCap },
        { label: t("Aportes mensuales", "Monthly deposits"), icon: Coins },
        { label: t("Proyección a los 18", "Projection to 18"), icon: TrendingUp },
        { label: t("Universidad", "University"), icon: Banknote },
      ],
      pill: t("Gestionado por los padres", "Managed by parents"),
      color: "var(--kid-grape)",
      image: stageBaby,
      imageAlt: t("Bebé", "Baby"),
      overlay: (
        <div className="rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--color-card)_88%,black)] p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold">
            {t("El futuro de Sofía", "Sofía's future")} <Star className="h-3 w-3 shrink-0 fill-kid-sun text-kid-sun" />
          </p>
          <p className="mt-1.5 whitespace-nowrap text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("Patrimonio a los 18a", "Wealth at 18")}
          </p>
          <p className="numeric text-xl font-semibold" style={{ color: "var(--kid-grape)" }}>
            $96,400
          </p>
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growCurve} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grape-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--kid-grape)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--kid-grape)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="y" stroke="var(--kid-grape)" strokeWidth={2} fill="url(#grape-area)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      range: t("6 a 12 años", "Ages 6 to 12"),
      headline: (
        <>
          {t("Aprende ", "Learns ")}
          <span style={{ color: "var(--kid-mint)" }}>{t("con dinero", "with money")}</span>
        </>
      ),
      text: t("Ahora aprende contigo sobre el valor del dinero.", "Now they learn with you the value of money."),
      features: [
        { label: t("Mi dinero", "My money"), icon: Wallet },
        { label: t("Misiones", "Missions"), icon: Target },
        { label: t("Mis sueños", "My dreams"), icon: Sparkles },
        { label: t("Ahorro y metas", "Savings & goals"), icon: PiggyBank },
      ],
      pill: t("Padres + niño", "Parents + child"),
      color: "var(--kid-mint)",
      image: stageBoy,
      imageAlt: t("Niño con móvil", "Boy with phone"),
      overlay: (
        <div className="rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--color-card)_88%,black)] p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="text-xs font-semibold">{t("Mi dinero", "My money")}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("Este mes", "This month")}
          </p>
          <p className="numeric text-xl font-semibold" style={{ color: "var(--kid-mint)" }}>
            $120
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-14 w-14">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: 60, fill: "var(--kid-mint)" },
                      { value: 40, fill: "var(--kid-grape)" },
                      { value: 20, fill: "var(--kid-sky)" },
                    ]}
                    dataKey="value"
                    innerRadius="60%"
                    outerRadius="95%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-[10px]">
              <p className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--kid-mint)" }} /> {t("Futuro", "Future")} $60
              </p>
              <p className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--kid-grape)" }} /> {t("Sueños", "Dreams")} $40
              </p>
              <p className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--kid-sky)" }} /> {t("Disponible", "Free")} $20
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      range: t("13 a 17 años", "Ages 13 to 17"),
      headline: (
        <>
          {t("Se prepara ", "Gets ready ")}
          <span style={{ color: "var(--kid-sky)" }}>{t("para decidir", "to decide")}</span>
        </>
      ),
      text: t("Empieza a tomar sus propias decisiones financieras.", "They start making their own financial decisions."),
      features: [
        { label: t("Presupuesto", "Budget"), icon: Wallet },
        { label: t("Inversión", "Investing"), icon: TrendingUp },
        { label: t("Universidad", "University"), icon: GraduationCap },
        { label: t("Su Number", "Their Number"), icon: Target },
      ],
      pill: t("Adolescente + padres", "Teen + parents"),
      color: "var(--kid-sky)",
      image: stageTeen,
      imageAlt: t("Adolescente con móvil", "Teen with phone"),
      overlay: (
        <div className="rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--color-card)_88%,black)] p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("Tu patrimonio a los 18", "Your wealth at 18")}
          </p>
          <p className="numeric text-xl font-semibold" style={{ color: "var(--kid-sky)" }}>
            $38,450
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{t("Universidad", "University")}</span>
              <span className="font-semibold" style={{ color: "var(--kid-sky)" }}>72%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
              <div className="h-full rounded-full" style={{ width: "72%", backgroundColor: "var(--kid-sky)" }} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{t("Inversión", "Investing")} $8,450</span>
            <div className="h-6 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growCurve} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="mint-inv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--kid-mint)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--kid-mint)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="y" stroke="var(--kid-mint)" strokeWidth={1.5} fill="url(#mint-inv)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const timeline = [
    { icon: "👶", color: "var(--kid-grape)", label: "0" },
    { icon: "🌱", color: "var(--kid-mint)", label: "6" },
    { icon: "🚀", color: "var(--kid-sky)", label: "13" },
    { icon: "18", color: "var(--kid-mint)", label: "18", isEnd: true },
  ];

  return (
    <section className="mt-16 md:mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-kid-mint">
          {t("Crece con ellos", "It grows with them")}
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {t("Una app. Tres etapas. De los ", "One app. Three stages. From ")}
          <span style={{ color: "var(--kid-grape)" }}>0</span>
          {t(" a los ", " to ")}
          <span style={{ color: "var(--kid-mint)" }}>18</span>.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Los padres empiezan por ellos; luego aprenden juntos; al final deciden solos. ",
            "Parents start for them; then they learn together; finally they decide on their own. ",
          )}
          <span style={{ color: "var(--kid-grape)" }}>{t("su futuro", "their future")}</span>
          {", "}
          <span style={{ color: "var(--kid-mint)" }}>{t("con dinero", "with money")}</span>
          {", "}
          <span style={{ color: "var(--kid-sky)" }}>{t("para decidir", "to decide")}</span>.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative mx-auto mt-10 max-w-2xl">
        <div
          className="absolute left-0 right-0 top-5 h-0.5 hidden sm:block"
          style={{ background: "linear-gradient(90deg, var(--kid-grape), var(--kid-mint), var(--kid-sky))", opacity: 0.35 }}
        />
        <div className="relative flex items-center justify-between">
          {timeline.map((tl) => (
            <div key={tl.label} className="flex flex-col items-center gap-2">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ring-2 ring-background"
                style={{
                  backgroundColor: tl.isEnd
                    ? "var(--kid-mint)"
                    : `color-mix(in oklab, ${tl.color} 15%, transparent)`,
                  color: tl.isEnd ? "white" : tl.color,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tl.color} 35%, transparent)`,
                }}
              >
                {tl.icon}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">{tl.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stage cards */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {stages.map((s) => (
          <motion.div
            key={s.range}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-3xl border border-border h-[30rem] flex flex-col"
            style={{ background: "oklch(0 0 0)" }}
          >
            {/* Photo anchored to the right half, blended into the black card */}
            <img
              src={s.image}
              alt={s.imageAlt}
              loading="lazy"
              width={640}
              height={900}
              className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-top"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 14%, #000 34%), linear-gradient(to bottom, #000 55%, rgba(0,0,0,0.35) 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 14%, #000 34%), linear-gradient(to bottom, #000 55%, rgba(0,0,0,0.35) 88%, transparent 100%)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
            {/* Soft glow behind the subject so the photo melts into the black */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(120% 80% at 78% 22%, color-mix(in oklab, ${s.color} 16%, transparent) 0%, transparent 62%)`,
              }}
            />
            {/* Left darkening for text legibility */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(95deg, oklch(0 0 0) 0%, oklch(0 0 0 / 0.94) 34%, oklch(0 0 0 / 0.35) 56%, transparent 74%)",
              }}
            />
            {/* Bottom fade */}
            <span
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to top, oklch(0 0 0) 12%, oklch(0 0 0 / 0.7) 45%, transparent)" }}
            />

            {/* Content layer */}
            <div className="relative flex h-full flex-col p-6 md:p-7">
              {/* Top-left: headline + text + features */}
              <div className="w-[56%] min-w-0">
                <h3 className="font-display text-[26px] font-semibold leading-[1.1] tracking-tight">
                  {s.headline}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
                <ul className="mt-5 space-y-3.5">
                  {s.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-3 text-[14px]">
                      <f.icon className="h-[18px] w-[18px] shrink-0" style={{ color: s.color }} strokeWidth={1.6} />
                      <span className="truncate">{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data box: bottom-right, floating just above the pill */}
              <div className="pointer-events-none absolute bottom-[5.25rem] right-4 w-[46%] max-w-[13.5rem] md:right-5">
                {s.overlay}
              </div>

              {/* Bottom-left pill */}
              <div className="mt-auto">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold"
                  style={{
                    color: s.color,
                    backgroundColor: `color-mix(in oklab, ${s.color} 10%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${s.color} 32%, transparent)`,
                  }}
                >
                  <Users className="h-4 w-4" strokeWidth={1.6} />
                  {s.pill}
                </span>
              </div>
            </div>

          </motion.div>
        ))}
      </div>

    </section>
  );
}


function FamilyProfiles() {
  const t = useT();
  const members = [
    { name: "Carlos", role: t("Padre", "Dad"), photo: faceDad, active: false },
    { name: "Laura", role: t("Madre", "Mom"), photo: faceMom, active: false },
    { name: "Sofía", role: t("10 años", "Age 10"), photo: faceGirl, active: true },
    { name: "Lucas", role: t("7 años", "Age 7"), photo: faceBoy, active: false },
  ];
  return (
    <section className="mt-16 md:mt-24">
      <SectionHeader
        eyebrow={t("Perfiles tipo Netflix", "Netflix-style profiles")}
        title={
          <>
            {t("Para toda la ", "For the whole ")}
            <span className="kid-text-gradient">{t("familia", "family")}</span>
          </>
        }
        subtitle={t(
          "Papá y mamá gestionan el plan; cada hijo tiene su propio perfil y su propio número.",
          "Parents manage the plan; each child gets their own profile and their own number.",
        )}
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((m) => (
          <div
            key={m.name}
            className={`surface relative p-6 text-center transition-colors ${
              m.active ? "border-kid-mint/50 shadow-[0_0_30px_-12px_var(--kid-mint)]" : ""
            } ${m.name === "Lucas" ? "hidden sm:block" : ""}`}
          >
            {m.active && (
              <Star className="absolute right-3 top-3 h-4 w-4 fill-kid-mint text-kid-mint" />
            )}
            <img
              src={m.photo}
              alt={m.name}
              loading="lazy"
              width={512}
              height={512}
              className={`mx-auto h-16 w-16 rounded-full object-cover ring-2 ${
                m.active ? "ring-kid-mint" : "ring-border"
              }`}
            />
            <p className="mt-4 text-sm font-semibold">{m.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.role}</p>
          </div>
        ))}
        <Link
          to="/precios"
          className="surface flex flex-col items-center justify-center p-6 text-center transition-colors hover:border-kid-grape/40"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full text-2xl text-muted-foreground ring-1 ring-border">
            +
          </span>
          <p className="mt-4 text-xs text-muted-foreground">{t("Añadir hijo", "Add a child")}</p>
        </Link>
      </div>
    </section>
  );
}


function KidsFinanceLanding() {
  const t = useT();
  const liveCount = useLiveCount(1200);



  const quotes = [
    {
      quote: t(
        "Mi hija de 9 años ahora pregunta cuánto le falta para su bici, no cuánto le doy.",
        "My 9-year-old now asks how much is left for her bike, not how much I'll give her.",
      ),
      author: "Marta Salas",
      initials: "MS",
      role: t("Mamá de 2 · Valencia", "Mom of 2 · Valencia"),
    },
    {
      quote: t(
        "Las tareas dejaron de ser pelea: ahora las hace porque ve subir su número.",
        "Chores stopped being a fight: he does them because he sees his number go up.",
      ),
      author: "Andrés Duarte",
      initials: "AD",
      role: t("Papá de 3 · Bogotá", "Dad of 3 · Bogotá"),
    },
    {
      quote: t(
        "En un mes entendió el interés compuesto mejor que yo a los 25.",
        "In a month she understood compound interest better than I did at 25.",
      ),
      author: "Lucía Pérez",
      initials: "LP",
      role: t("Mamá de 1 · Madrid", "Mom of 1 · Madrid"),
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pt-16">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative -mt-16 overflow-hidden pt-16"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[34vh] min-h-[240px] md:h-[46vh] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:min-h-0 lg:w-[56%]">
            <img
              src={heroReal}
              alt={t(
                "Padre e hija revisando juntos su plan de ahorro en una tablet",
                "Father and daughter reviewing their savings plan together on a tablet",
              )}
              width={1280}
              height={1024}
              className="h-full w-full object-cover object-[45%_18%] brightness-110 contrast-[1.06] saturate-[1.08] md:object-[45%_22%] lg:object-[66%_48%] lg:[mask-image:linear-gradient(90deg,transparent_0%,transparent_8%,#000_28%,#000_82%,transparent_100%)]"
            />
            {/* Gradual fade into the dark background so the photo never shows a hard edge */}
            <div className="absolute inset-y-0 left-0 hidden w-[55%] bg-[linear-gradient(90deg,var(--background)_0%,transparent_100%)] lg:block" />
            <div className="absolute inset-y-0 right-0 hidden w-[26%] bg-[linear-gradient(270deg,var(--background)_0%,transparent_100%)] lg:block" />
            <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,var(--background)_0%,transparent_100%)] lg:h-20" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,var(--background)_0%,transparent_100%)] md:h-40 lg:h-44" />
            <div className="absolute inset-0 bg-background/15" />
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-6 pb-10 pt-[30vh] md:pb-16 md:pt-[42vh] md:py-20 lg:py-24">
            <div className="lg:max-w-[50%]">
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-kid-mint/25 bg-kid-mint/10 px-3 py-1 text-xs font-medium text-kid-mint backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t(
                  "El futuro financiero de tus hijos, impulsado por IA",
                  "Your kids' financial future, powered by AI",
                )}
              </span>

              {/* Mobile: shorter headline */}
              <h1 className="font-display text-[1.75rem] font-semibold leading-[1.08] tracking-tight md:hidden">
                {t("Construye su ", "Build their ")}
                <span className="text-kid-mint">{t("número", "number")}</span>
                <br />
                {t("desde pequeños.", "from day one.")}
              </h1>

              {/* Desktop: full headline */}
              <h1 className="mt-5 hidden font-display text-3xl font-semibold leading-[1.08] tracking-tight md:mt-5 md:block md:text-4xl lg:text-5xl">
                {t("Construye ", "Build ")}
                <span className="text-kid-mint">{t("su patrimonio.", "their wealth.")}</span>
                <br />
                {t("Enséñale ", "Teach them ")}
                <span className="text-kid-mint">{t("a manejarlo.", "to manage it.")}</span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:mt-6 md:text-base">
                <span className="md:hidden">
                  {t(
                    "Planifica su futuro, mesada y hábitos de ahorro en un solo lugar.",
                    "Plan their future, allowance and savings habits in one place.",
                  )}
                </span>
                <span className="hidden md:inline">
                  {t(
                    "Planifica cuánto tendrá tu hijo a los 18 años, crea su primera cartera de inversión, administra su mesada y ayúdalo a desarrollar hábitos financieros que lo acompañarán toda la vida.",
                    "Plan how much your child will have at 18, build their first investment portfolio, manage their allowance and help them build money habits for life.",
                  )}
                </span>
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-9">
                <Link
                  to="/precios"
                  className="kid-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-background shadow-lg transition-all hover:gap-3 md:px-6 md:py-3"
                >
                  {t("Crear plan Familiar", "Create Family plan")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-3 md:mt-10">
                <img
                  src={avatarFaces}
                  alt={t("Familias usando WhatsYournumber", "Families using WhatsYournumber")}
                  width={256}
                  height={128}
                  className="h-10 w-auto shrink-0 mix-blend-lighten md:h-12"
                />
                <p className="text-xs font-medium text-foreground md:text-sm">
                  {t(
                    `+${formatCount(liveCount, "es")} familias ya están construyendo su futuro.`,
                    `+${formatCount(liveCount, "en")} families are already building their future.`,
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="mx-auto w-full max-w-6xl px-6">

        <ThreePillars />

        <DualDashboards />

        <HowItWorksSlider />

        <GrowsWithThem />

        <FamilyProfiles />


        <section className="mt-16 md:mt-24">
          <SectionHeader
            eyebrow={t("Lo que dicen", "What people say")}
            title={t("Familias que ya empezaron", "Families who already started")}
            subtitle={t(
              "Historias reales de padres que vieron a sus hijos cambiar la forma de ver el dinero.",
              "Real stories from parents who watched their kids change how they see money.",
            )}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {quotes.map((q, i) => (
              <motion.figure
                key={q.author}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="surface flex flex-col p-6"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3.5 w-3.5 fill-kid-mint text-kid-mint" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-kid-mint ring-1 ring-border">
                    {q.initials}
                  </span>
                  <span className="text-xs">
                    <span className="block font-medium text-foreground">{q.author}</span>
                    <span className="text-muted-foreground">{q.role}</span>
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>

        <section className="relative mt-24 overflow-hidden">
          <div className="relative grid items-center gap-0 md:grid-cols-2">
            <div className="relative z-10 py-10 md:py-16 md:pr-10">
              <div className="relative">
                <Gift className="h-8 w-8 text-kid-coral" />
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-4xl">
                  {t("El mejor regalo para un hijo no es dinero. ", "The best gift isn't money. ")}
                  <span className="kid-text-gradient">
                    {t("Es enseñarle qué hacer con él.", "It's teaching them what to do with it.")}
                  </span>
                </h2>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  {t(
                    "Incluido en el plan Familiar de WhatsYournumber: tú gestionas tu patrimonio, ellos aprenden con el suyo.",
                    "Included in the WhatsYournumber Family plan: you manage your wealth, they learn with theirs.",
                  )}
                </p>
                <Link
                  to="/precios"
                  className="kid-gradient mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-background shadow-lg transition-all hover:gap-3"
                >
                  {t("Crear mi plan Familiar", "Create my Family plan")}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative h-72 md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[58%]">
              <img
                src={ctaFamily}
                alt={t(
                  "Familia revisando sus finanzas juntos",
                  "Family reviewing their finances together",
                )}
                loading="lazy"
                width={1408}
                height={912}
                className="h-full w-full object-cover [mask-image:linear-gradient(90deg,transparent_0%,#000_38%,#000_100%)]"
              />
              <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,var(--background)_0%,transparent_100%)]" />
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,var(--background)_0%,transparent_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,var(--background)_0%,transparent_100%)]" />
            </div>
          </div>
        </section>

        </div>
      </main>

      <SiteFooter kids />
    </div>
  );
}
