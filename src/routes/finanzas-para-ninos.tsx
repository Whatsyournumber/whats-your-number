import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
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
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
} from "recharts";


import heroReal from "@/assets/kids-hero-real.jpg";
import ctaFamily from "@/assets/kids-cta-family.jpg";
import faceDad from "@/assets/kid-face-dad.jpg";
import faceMom from "@/assets/kid-face-mom.jpg";
import faceGirl from "@/assets/kid-face-girl.jpg";
import bikeAsset from "@/assets/kid-bike.png.asset.json";
import faceBoy from "@/assets/kid-face-boy.jpg";
import avatarFaces from "@/assets/kids-avatars-three.png";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/hooks/use-language";
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
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
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
          <div className="relative mt-3 h-32 overflow-hidden rounded-2xl ring-1 ring-border">
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

  const slides = [

    {
      id: "numbers",
      tab: t("Mi número", "My number"),
      icon: Wallet,
      color: "var(--kid-sky)",
      title: t("Su número de hoy y el del futuro", "Their number today and tomorrow"),
      desc: t(
        "Ve su dinero disponible en grande y hacia dónde puede llegar si sigue ahorrando cada semana.",
        "They see their money right now, and where it can go if they keep saving every week.",
      ),
      visual: (
        <ScreenCard title={t("Mi primer número", "My first number")} accent="var(--kid-sky)">
          <div className="flex items-center gap-2.5">
            <img src={faceGirl} alt="" className="h-8 w-8 rounded-full object-cover" />
            <div>
              <p className="text-xs font-medium">{t("Hola, Sofía", "Hi, Sofía")}</p>
              <p className="text-[11px] text-muted-foreground">{t("Tu dinero de hoy", "Your money today")}</p>
            </div>
          </div>
          <p className="numeric mt-3 text-3xl font-semibold text-kid-sky md:text-4xl">€120</p>
          <div className="mt-3 rounded-xl border border-kid-grape/25 bg-kid-grape/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-kid-grape">
              {t("Mi futuro (18 años)", "My future (age 18)")}
            </p>
            <p className="numeric mt-0.5 text-xl font-semibold">€10.668</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t("Si ahorra 11,3 € al mes", "If they save €11.3 a month")}
            </p>
          </div>
          <div className="mt-3 rounded-2xl bg-elevated/60 p-3 ring-1 ring-border">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("Progreso hacia su número", "Progress to their number")}</span>
              <span className="numeric text-kid-sky">11%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card">
              <div className="h-full w-[11%] rounded-full bg-kid-sky" />
            </div>
            <div className="mt-2 -mx-1">
              <MiniArea color="var(--kid-sky)" />
            </div>
          </div>



        </ScreenCard>
      ),
    },
    {
      id: "pockets",
      tab: t("Mi dinero", "My money"),
      icon: PiggyBank,
      color: "var(--kid-mint)",
      title: t("Bolsillos: ahorrar, invertir y gastar", "Pockets: save, invest and spend"),
      desc: t(
        "La regla 40/40/20, digital. Cada euro que entra ya sabe a dónde va.",
        "The 40/40/20 rule, gone digital. Every euro that arrives knows where it goes.",
      ),
      visual: (
        <ScreenCard title={t("Mi dinero", "My money")} accent="var(--kid-mint)">
          <p className="text-sm text-muted-foreground">{t("Regla 40/40/20", "40/40/20 rule")}</p>
          <div className="mt-2 grid items-center gap-4 sm:grid-cols-2">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pockets}
                    dataKey="value"
                    innerRadius="62%"
                    outerRadius="95%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {pockets.map((p) => (
                      <Cell key={p.label} fill={p.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {pockets.map((p) => (
                <div key={p.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label} ({p.value}%)
                  </span>
                  <span className="numeric font-semibold">{p.amount}</span>
                </div>
              ))}
            </div>
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
        <ScreenCard title={t("Mis sueños", "My dreams")} accent="var(--kid-coral)">
          <div className="space-y-5">
            {[
              { name: t("Bici nueva", "New bike"), have: "€186", goal: "€300", pct: 62, c: "var(--kid-mint)" },
              { name: t("Viaje a Disney", "Disney trip"), have: "€120", goal: "€1.200", pct: 10, c: "var(--kid-sun)" },
              { name: t("Nintendo Switch", "Nintendo Switch"), have: "€0", goal: "€300", pct: 3, c: "var(--kid-coral)" },
            ].map((d) => (
              <div key={d.name} className="rounded-2xl bg-elevated p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="numeric text-xs text-muted-foreground">
                      {d.have} {t("de", "of")} {d.goal}
                    </p>
                  </div>
                  <span className="numeric text-lg font-semibold" style={{ color: d.c }}>
                    {d.pct}%
                  </span>
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(d.pct, 3)}%`, backgroundColor: d.c }}
                  />
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("Tareas pendientes", "Pending chores")}</p>
            <span className="numeric rounded-full bg-kid-sun/12 px-3 py-1 text-xs font-semibold text-kid-sun">
              +€6,50 {t("esta semana", "this week")}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { k: t("Mesada semanal", "Weekly allowance"), v: "+€10,00", ok: true },
              { k: t("Hacer mi cama", "Make my bed"), v: "+€0,50", ok: true },
              { k: t("Ordenar mi habitación", "Tidy my room"), v: "+€1,00", ok: false },
              { k: t("Leer 20 minutos", "Read 20 minutes"), v: "+€0,50", ok: false },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between rounded-xl bg-elevated px-4 py-3 text-sm">
                <span className="flex items-center gap-2.5">
                  <BadgeCheck className={`h-5 w-5 ${r.ok ? "text-kid-mint" : "text-muted-foreground/40"}`} />
                  {r.k}
                </span>
                <span className="numeric text-base font-semibold text-kid-sun">{r.v}</span>
              </div>
            ))}
          </div>
        </ScreenCard>
      ),
    },
    {
      id: "grow",
      tab: t("Mi futuro", "My future"),
      icon: TrendingUp,
      color: "var(--kid-mint)",
      title: t("Interés compuesto explicado para niños", "Compound interest explained for kids"),
      desc: t(
        "Ven cómo cada euro ahorrado se multiplica con el tiempo, con gráficas que entienden solos.",
        "They watch every saved euro multiply over time, with charts they get on their own.",
      ),
      visual: (
        <ScreenCard title={t("Mi futuro", "My future")} accent="var(--kid-mint)">
          <p className="text-sm text-muted-foreground">{t("Proyección a 18 años", "Projection to age 18")}</p>
          <p className="numeric mt-1 text-4xl font-semibold">10.668 €</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Si ahorras", "If you save")} <span className="text-kid-mint">11,3 €</span> {t("al mes", "a month")}
          </p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growCurve} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grow-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--kid-mint)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--kid-mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="x"
                  ticks={[0, 10, 18]}
                  tickFormatter={(v: number) =>
                    v === 0 ? t("Hoy", "Today") : `${v} ${t("años", "yrs")}`
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="var(--kid-mint)"
                  strokeWidth={2.5}
                  fill="url(#grow-area)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ScreenCard>
      ),
    },
    {
      id: "badges",
      tab: t("Mis logros", "My badges"),
      icon: Trophy,
      color: "var(--kid-grape)",
      title: t("Premios, rachas y retos", "Rewards, streaks and quests"),
      desc: t(
        "Cada semana que ahorra desbloquea premios como una bici nueva, rachas e insignias.",
        "Every week they save unlocks rewards like a new bike, streaks and badges.",
      ),
      visual: (
        <ScreenCard title={t("Mis premios", "My rewards")} accent="var(--kid-grape)">
          <div className="relative overflow-hidden rounded-2xl bg-elevated p-4 ring-1 ring-kid-mint/15">
            <div
              className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full blur-2xl"
              style={{ background: "color-mix(in oklab, var(--kid-mint) 25%, transparent)" }}
            />
            <div className="relative flex items-center gap-3">
              <img
                src={bikeAsset.url}
                alt={t("Bici nueva", "New bike")}
                loading="lazy"
                width={816}
                height={816}
                className="h-20 w-20 shrink-0 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{t("Bici nueva", "New bike")}</p>
                <p className="numeric text-xs text-muted-foreground">
                  {t("Desbloqueado a los", "Unlocked at")} €250
                </p>
              </div>
              <span className="numeric ml-auto text-lg font-semibold text-kid-mint">62%</span>
            </div>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-card">
              <div className="h-full w-[62%] rounded-full bg-kid-mint" />
            </div>
          </div>


          <div className="mt-3 flex items-center justify-between rounded-2xl bg-elevated px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("Racha", "Streak")}</p>
              <p className="numeric mt-0.5 text-xl font-semibold text-kid-grape">
                7 {t("sem.", "wks")}
              </p>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, k) => (
                <Star
                  key={k}
                  className="h-4 w-4 fill-kid-sun text-kid-sun"
                />
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[Trophy, Star, BadgeCheck, Sparkles].map((Ic, k) => (
              <span
                key={k}
                className="flex aspect-square items-center justify-center rounded-xl text-kid-grape ring-1 ring-kid-grape/20 kid-gradient-soft"
              >
                <Ic className="h-4 w-4" />
              </span>
            ))}
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
        "Busca por universidad, ciudad o continente y mira al instante qué parte de la carrera cubre su número del futuro.",
        "Search by university, city or continent and instantly see how much of the degree their future number covers.",
      ),
      visual: <UniFinderVisual />,
    },
  ];

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
      { k: t("Interés", "Return"), v: "7,2%" },
      { k: t("Aportado", "Contributed"), v: "€2.442" },
      { k: t("Intereses", "Growth"), v: "€8.226" },
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



  const active = slides[i]!;
  const Icon = active.icon;

  return (
    <section className="mt-16 md:mt-24">
      <SectionHeader
        eyebrow={t("Cómo funciona", "How it works")}
        title={t("Todo lo que hay dentro, en una pantalla", "Everything inside, on one screen")}
        subtitle={t(
          "Desliza para ver las funciones que hacen que tus hijos quieran volver mañana.",
          "Slide through the features that make your kids want to come back tomorrow.",
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

        <div className="relative overflow-hidden rounded-[24px] bg-background/70 p-4 ring-1 ring-border md:p-6">
          <div className="kid-gradient pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70" />

          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {slides.map((s, k) => {
              const TabIcon = s.icon;
              const isActive = k === i;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setI(k)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all"
                  style={
                    isActive
                      ? {
                          color: s.color,
                          backgroundColor: `color-mix(in oklab, ${s.color} 14%, transparent)`,
                          boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${s.color} 55%, transparent), 0 0 24px color-mix(in oklab, ${s.color} 18%, transparent)`,
                        }
                      : { boxShadow: "inset 0 0 0 1px var(--border)" }
                  }
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{s.tab}</span>
                </button>
              );
            })}
            <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-[11px] text-muted-foreground md:inline-flex">
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
            className="mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr]"
          >
            <div className="min-w-0">{active.visual}</div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-2xl bg-elevated/60 p-5 ring-1 ring-border">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    color: active.color,
                    backgroundColor: `color-mix(in oklab, ${active.color} 12%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${active.color} 25%, transparent)`,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                  {active.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.desc}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(stats[active.id] ?? []).map((s) => (
                  <div key={s.k} className="rounded-2xl bg-elevated/60 p-3 text-center ring-1 ring-border">
                    <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</p>
                    <p className="numeric mt-1 text-sm font-semibold" style={{ color: active.color }}>
                      {s.v}
                    </p>
                  </div>
                ))}
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
      <h2 className="text-center font-display text-lg font-semibold tracking-tight md:text-xl">
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
            className={`numeric mt-1 font-semibold ${cute ? "text-[2rem]" : "text-3xl"}`}
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
            label={t("Fondo del futuro", "Future fund")}
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
            label={t("Su dinero hoy", "Her money today")}
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
  const items = [
    { age: t("0 años", "Age 0"), label: t("Primer aporte", "First deposit"), icon: Gift },
    { age: t("4 años", "Age 4"), label: t("Primeras monedas", "First coins"), icon: Coins },
    { age: t("8 años", "Age 8"), label: t("Mesada", "Allowance"), icon: Banknote },
    { age: t("10 años", "Age 10"), label: t("Primer ahorro", "First savings"), icon: PiggyBank },
    { age: t("12 años", "Age 12"), label: t("Primer ETF", "First ETF"), icon: TrendingUp },
    { age: t("16 años", "Age 16"), label: t("Primer negocio", "First business"), icon: Rocket },
    { age: t("18 años", "Age 18"), label: t("Universidad", "University"), icon: GraduationCap },
  ];
  const stages = [
    {
      range: t("0 a 6 años", "Ages 0 to 6"),
      desc: t(
        "Los padres abren su cartera y aportan desde el día uno. El tiempo hace el trabajo pesado.",
        "Parents open their portfolio and contribute from day one. Time does the heavy lifting.",
      ),
      icon: Gift,
      color: "var(--kid-grape)",
    },
    {
      range: t("7 a 9 años", "Ages 7 to 9"),
      desc: t(
        "Monedas, bolsillos y su primer sueño. Aprenden que el dinero se guarda antes de gastarse.",
        "Coins, pockets and their first dream. They learn money is saved before it's spent.",
      ),
      icon: Banknote,
      color: "var(--kid-sky)",
    },
    {
      range: t("10 a 13 años", "Ages 10 to 13"),
      desc: t(
        "Mesada, tareas y metas más grandes. Empiezan a planificar semanas y meses.",
        "Allowance, chores and bigger goals. They start planning weeks and months.",
      ),
      icon: CalendarCheck,
      color: "var(--kid-mint)",
    },
    {
      range: t("14 a 17 años", "Ages 14 to 17"),
      desc: t(
        "Interés compuesto, inversión y su número del futuro. Salen de casa sabiendo su número.",
        "Compound interest, investing and their future number. They leave home knowing their number.",
      ),
      icon: TrendingUp,
      color: "var(--kid-coral)",
    },
  ];
  return (
    <section className="mt-16 md:mt-24">
      <SectionHeader
        eyebrow={t("Crece con ellos", "It grows with them")}
        title={t("De los 0 a los 18 años", "From age 0 to 18")}
        subtitle={t(
          "Un solo camino: los padres empiezan desde el día uno y la app cambia con cada edad, de las primeras monedas al interés compuesto.",
          "One single path: parents start on day one and the app evolves with every age, from first coins to compound interest.",
        )}
      />

      <div className="relative mt-8 md:mt-12">
        <div className="kid-gradient absolute inset-x-6 top-[52px] hidden h-px opacity-40 md:block" />
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-7">
          {items.map(({ age, label, icon: Icon }) => (
            <motion.div
              key={age}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="surface relative w-[124px] shrink-0 snap-start p-4 text-center sm:w-auto"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-kid-mint ring-1 ring-kid-mint/25 kid-gradient-soft">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-sm font-semibold">{age}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>


      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map(({ icon: Icon, range, desc, color }) => (
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="surface relative overflow-hidden p-5 md:p-6"
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${color} 75%, transparent), transparent)`,
              }}
            />
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                color,
                backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 25%, transparent)`,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold tracking-tight">{range}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
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
        eyebrow={t("Perfiles", "Profiles")}
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
