import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  BookOpen,
  CalendarCheck,
  Coins,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartHandshake,
  LineChart as LineChartIcon,
  Lock,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import heroFamily from "@/assets/kids-hero-family.jpg";
import heroReal from "@/assets/kids-hero-real.jpg";
import ctaFamily from "@/assets/kids-cta-family.jpg";
import faceDad from "@/assets/kid-face-dad.jpg";
import faceMom from "@/assets/kid-face-mom.jpg";
import faceGirl from "@/assets/kid-face-girl.jpg";
import faceBoy from "@/assets/kid-face-boy.jpg";
import avatarFaces from "@/assets/kids-avatars-three.png";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/hooks/use-language";


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

function KidPreview() {
  const t = useT();

  const pockets = [
    { label: t("Gastar", "Spend"), value: "€24", pct: 20, tone: "bg-kid-sky" },
    { label: t("Ahorrar", "Save"), value: "€60", pct: 50, tone: "bg-kid-mint" },
    { label: t("Invertir", "Invest"), value: "€24", pct: 20, tone: "bg-kid-grape" },
    { label: t("Compartir", "Share"), value: "€12", pct: 10, tone: "bg-kid-coral" },
  ];

  return (
    <div className="surface glow relative overflow-hidden p-6 md:p-8">
      <div className="kid-gradient-soft pointer-events-none absolute inset-0" />
      <div className="relative grid gap-4 md:grid-cols-2">
        <div className="surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("Número de hoy", "Today's number")}
          </p>
          <p className="numeric kid-text-gradient mt-2 text-5xl font-semibold">€120</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Ahorrando €10 por semana", "Saving €10 every week")}
          </p>
          <div className="mt-5 rounded-xl p-4 ring-1 ring-kid-grape/25 kid-gradient-soft">
            <p className="text-[11px] uppercase tracking-wider text-kid-grape">
              {t("Número del futuro", "Future number")}
            </p>
            <p className="numeric mt-1 text-2xl font-semibold">€1,480</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("En 2 años si sigue así", "In 2 years if they keep going")}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {[Trophy, Star, BadgeCheck].map((Icon, i) => (
              <span
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-kid-sun/15 text-kid-sun ring-1 ring-kid-sun/30"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
            <span className="text-xs text-muted-foreground">
              {t("3 insignias ganadas", "3 badges earned")}
            </span>
          </div>
        </div>

        <div className="surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("Bolsillos", "Pockets")}
          </p>
          <ul className="mt-4 space-y-3">
            {pockets.map((p) => (
              <li key={p.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="numeric font-medium">{p.value}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-elevated">
                  <div className={`h-full rounded-full ${p.tone}`} style={{ width: `${p.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-elevated px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("Sueño: bici nueva", "Dream: new bike")}
              </span>
              <span className="numeric text-xs font-medium text-kid-mint">62%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background">
              <div className="kid-gradient h-full rounded-full" style={{ width: "62%" }} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-elevated px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {t("Tarea: ordenar el cuarto", "Chore: tidy the room")}
            </span>
            <span className="numeric text-xs font-medium text-kid-sun">+€3</span>
          </div>
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
    <section className="mt-24 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {t("Dos paneles.", "Two dashboards.")}
          <span className="kid-text-gradient block">
            {t("Un mismo objetivo.", "One shared goal.")}
          </span>
        </h2>
        <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-kid-mint" />
            {t("Los padres planifican el largo plazo.", "Parents plan the long term.")}
          </li>
          <li className="flex gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-kid-sky" />
            {t("Los hijos aprenden con dinero real.", "Kids learn with real money.")}
          </li>
          <li className="flex gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-kid-grape" />
            {t("Todo sincronizado en una sola cuenta.", "All synced in one single account.")}
          </li>
        </ul>
      </div>

      <div className="surface glow relative overflow-hidden p-5 md:p-7">
        <div className="kid-gradient-soft pointer-events-none absolute inset-0" />
        <div className="relative grid gap-4 md:grid-cols-2">
          <div className="surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("Panel de padres", "Parents panel")}
            </p>
            <p className="numeric mt-2 text-3xl font-semibold">€196.000</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Fondo del futuro en 10 años", "Future fund in 10 years")}
            </p>
            <div className="mt-4 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="kidP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--kid-mint)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--kid-mint)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="p"
                    stroke="var(--kid-mint)"
                    strokeWidth={2}
                    fill="url(#kidP)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Aporte mensual", "Monthly deposit")}</dt>
                <dd className="numeric">€300</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Rendimiento", "Return")}</dt>
                <dd className="numeric">7,2%</dd>
              </div>
            </dl>
          </div>

          <div className="surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("Panel de Sofía", "Sofía's panel")}
            </p>
            <p className="numeric kid-text-gradient mt-2 text-3xl font-semibold">€1.250</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Su patrimonio hoy", "Their net worth today")}
            </p>
            <div className="mt-4 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="kidK" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--kid-grape)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--kid-grape)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="k"
                    stroke="var(--kid-grape)"
                    strokeWidth={2}
                    fill="url(#kidK)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Ahorros", "Savings")}</dt>
                <dd className="numeric">€850</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Inversiones", "Investments")}</dt>
                <dd className="numeric">€400</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function GrowthChart() {
  const t = useT();
  const data = Array.from({ length: 19 }, (_, i) => {
    const year = i;
    const monthly = 50;
    const invested = monthly * 12 * year * Math.pow(1.07, year * 0.32);
    return {
      year: `${year}`,
      invertido: Math.round(monthly * 12 * year * 1.0),
      compuesto: Math.round(invested * 1.35),
    };
  });

  return (
    <section className="surface relative mt-24 overflow-hidden p-6 md:p-10">
      <div className="kid-gradient absolute inset-x-0 top-0 h-1" />
      <h2 className="text-center font-display text-2xl font-semibold tracking-tight md:text-3xl">
        {t(
          "El patrimonio de un niño también puede crecer.",
          "A child's wealth can compound too.",
        )}
      </h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_2fr]">
        <div className="surface p-5">
          <h3 className="font-display text-base font-semibold tracking-tight">
            {t("Invertir hoy cambia su mañana", "Investing today changes their tomorrow")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(
              "€50 al mes desde los 8 años, invertidos al 7%, valen mucho más que guardarlos en la alcancía.",
              "€50 a month from age 8, invested at 7%, is worth far more than a piggy bank.",
            )}
          </p>
          <div className="mt-5 space-y-2 text-xs">
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-kid-mint" />
              {t("Invertido (7%)", "Invested (7%)")}
            </p>
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              {t("Guardado sin invertir", "Saved, not invested")}
            </p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={11}
                width={56}
                tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => `€${v.toLocaleString("es-ES")}`}
                labelFormatter={(l) => t(`Año ${l}`, `Year ${l}`)}
              />
              <Line
                type="monotone"
                dataKey="compuesto"
                stroke="var(--kid-mint)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="invertido"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function Milestones() {
  const t = useT();
  const items = [
    { age: t("8 años", "Age 8"), label: t("Mesada", "Allowance"), icon: Coins },
    { age: t("10 años", "Age 10"), label: t("Primer ahorro", "First savings"), icon: PiggyBank },
    { age: t("12 años", "Age 12"), label: t("Primer ETF", "First ETF"), icon: TrendingUp },
    { age: t("16 años", "Age 16"), label: t("Primer negocio", "First business"), icon: Rocket },
    { age: t("18 años", "Age 18"), label: t("Universidad", "University"), icon: GraduationCap },
  ];
  return (
    <section className="mt-24">
      <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
        {t("Un camino que los prepara para la vida", "A path that prepares them for life")}
      </h2>
      <div className="relative mt-12">
        <div className="kid-gradient absolute inset-x-6 top-[52px] hidden h-px opacity-40 md:block" />
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
          {items.map(({ age, label, icon: Icon }) => (
            <div key={age} className="surface relative p-5 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-kid-mint ring-1 ring-kid-mint/25 kid-gradient-soft">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold">{age}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
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
    <section className="mt-24">
      <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
        {t("Para toda la ", "For the whole ")}
        <span className="kid-text-gradient">{t("familia", "family")}</span>
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((m) => (
          <div
            key={m.name}
            className={`surface relative p-6 text-center transition-colors ${
              m.active ? "border-kid-mint/50 shadow-[0_0_30px_-12px_var(--kid-mint)]" : ""
            }`}
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

  const features = [
    {
      icon: Wallet,
      tone: "text-kid-sky bg-kid-sky/12 ring-kid-sky/25",
      title: t("Número de hoy", "Today's number"),
      desc: t(
        "Su dinero disponible ahora mismo, en grande y explicado con palabras que entienden.",
        "Their money right now, big and explained in words they understand.",
      ),
    },
    {
      icon: Rocket,
      tone: "text-kid-grape bg-kid-grape/12 ring-kid-grape/25",
      title: t("Número del futuro", "Future number"),
      desc: t(
        "Proyecta hasta dónde puede llegar su dinero si sigue ahorrando cada semana.",
        "Projects how far their money can go if they keep saving every week.",
      ),
    },
    {
      icon: PiggyBank,
      tone: "text-kid-mint bg-kid-mint/12 ring-kid-mint/25",
      title: t("Bolsillos", "Pockets"),
      desc: t(
        "Gastar, ahorrar, invertir y compartir: el método de los 4 sobres, digital.",
        "Spend, save, invest and share: the 4-envelope method, gone digital.",
      ),
    },
    {
      icon: Target,
      tone: "text-kid-coral bg-kid-coral/12 ring-kid-coral/25",
      title: t("Sueños", "Dreams"),
      desc: t(
        "Metas visuales con barra de progreso: la bici, el viaje o el videojuego.",
        "Visual goals with progress bars: the bike, the trip or the video game.",
      ),
    },
    {
      icon: CalendarCheck,
      tone: "text-kid-sun bg-kid-sun/12 ring-kid-sun/25",
      title: t("Tareas", "Chores"),
      desc: t(
        "Tareas de casa que se convierten en ingreso propio y en hábitos que duran.",
        "Household chores that turn into their own income and lasting habits.",
      ),
    },
    {
      icon: TrendingUp,
      tone: "text-kid-mint bg-kid-mint/12 ring-kid-mint/25",
      title: t("Cómo crece tu dinero", "How money grows"),
      desc: t(
        "Interés compuesto explicado para niños, con gráficas que se entienden solas.",
        "Compound interest explained for kids, with charts that speak for themselves.",
      ),
    },
    {
      icon: Coins,
      tone: "text-kid-sun bg-kid-sun/12 ring-kid-sun/25",
      title: t("Mesada automática", "Automatic allowance"),
      desc: t(
        "Programa la mesada semanal o mensual y se reparte sola entre sus bolsillos.",
        "Schedule weekly or monthly allowance; it splits itself across their pockets.",
      ),
    },
    {
      icon: Trophy,
      tone: "text-kid-coral bg-kid-coral/12 ring-kid-coral/25",
      title: t("Insignias y rachas", "Badges and streaks"),
      desc: t(
        "Cada semana que ahorra suma racha, nivel e insignias que quieren coleccionar.",
        "Every week they save adds a streak, a level and badges they want to collect.",
      ),
    },
    {
      icon: Gamepad2,
      tone: "text-kid-grape bg-kid-grape/12 ring-kid-grape/25",
      title: t("Retos de dinero", "Money quests"),
      desc: t(
        "Mini retos jugables: ¿ahorrar o gastar? Aprenden decidiendo, no memorizando.",
        "Playable mini-quests: save or spend? They learn by deciding, not memorizing.",
      ),
    },
    {
      icon: BookOpen,
      tone: "text-kid-sky bg-kid-sky/12 ring-kid-sky/25",
      title: t("Lecciones de 2 minutos", "2-minute lessons"),
      desc: t(
        "Cápsulas por edad: qué es un banco, un precio justo, un interés y un impuesto.",
        "Age-based capsules: what a bank, a fair price, interest and taxes really are.",
      ),
    },
    {
      icon: HeartHandshake,
      tone: "text-kid-coral bg-kid-coral/12 ring-kid-coral/25",
      title: t("Bolsillo de compartir", "Share pocket"),
      desc: t(
        "Aprenden generosidad: apartan una parte para donar o ayudar a alguien.",
        "They learn generosity: a slice set aside to donate or help someone.",
      ),
    },
    {
      icon: Users,
      tone: "text-kid-mint bg-kid-mint/12 ring-kid-mint/25",
      title: t("Vista de los papás", "Parents' view"),
      desc: t(
        "Aprueba tareas, ajusta mesadas y mira el progreso de cada hijo desde tu cuenta.",
        "Approve chores, tweak allowances and see each child's progress from your account.",
      ),
    },
    {
      icon: BellRing,
      tone: "text-kid-sun bg-kid-sun/12 ring-kid-sun/25",
      title: t("Avisos amables", "Kind nudges"),
      desc: t(
        "Recordatorios positivos cuando toca ahorrar o cuando alcanzan un sueño.",
        "Positive reminders when it's time to save or when they hit a dream.",
      ),
    },
    {
      icon: LineChartIcon,
      tone: "text-kid-sky bg-kid-sky/12 ring-kid-sky/25",
      title: t("Su historia de ahorro", "Their savings story"),
      desc: t(
        "Una línea de tiempo con todo lo que ahorró, ganó y logró desde el día uno.",
        "A timeline of everything they saved, earned and achieved from day one.",
      ),
    },
    {
      icon: ShieldCheck,
      tone: "text-kid-grape bg-kid-grape/12 ring-kid-grape/25",
      title: t("Seguro y sin anuncios", "Safe and ad-free"),
      desc: t(
        "Cero publicidad, cero compras dentro de la app, datos privados y bajo tu control.",
        "Zero ads, zero in-app purchases, private data fully under your control.",
      ),
    },
  ];

  const stats = [
    { value: "7-17", label: t("Edades", "Ages") },
    { value: "4", label: t("Bolsillos", "Pockets") },
    { value: "2 min", label: t("Para empezar", "To get started") },
    { value: "0", label: t("Anuncios", "Ads") },
  ];

  const steps = [
    {
      icon: Lock,
      title: t("1. Activa el plan Familiar", "1. Activate the Family plan"),
      desc: t(
        "Desde WhatsYournumber creas el perfil de cada hijo en segundos, con su propio acceso.",
        "From WhatsYournumber you create each child's profile in seconds, with their own login.",
      ),
    },
    {
      icon: Sparkles,
      title: t("2. El niño entra a su pantalla", "2. The kid opens their screen"),
      desc: t(
        "Una interfaz simple, colorida y sin ruido: solo sus números y sus sueños.",
        "A simple, colorful, noise-free interface: just their numbers and their dreams.",
      ),
    },
    {
      icon: GraduationCap,
      title: t("3. Aprende ahorrando de verdad", "3. They learn by really saving"),
      desc: t(
        "Cada tarea, sueño y bolsillo le enseña a decidir con su propio dinero.",
        "Every chore, dream and pocket teaches them to decide with their own money.",
      ),
    },
  ];

  const ages = [
    {
      range: t("7 a 9 años", "Ages 7 to 9"),
      desc: t(
        "Monedas, bolsillos y su primer sueño. Aprenden que el dinero se guarda antes de gastarse.",
        "Coins, pockets and their first dream. They learn money is saved before it's spent.",
      ),
      icon: Banknote,
    },
    {
      range: t("10 a 13 años", "Ages 10 to 13"),
      desc: t(
        "Mesada, tareas y metas más grandes. Empiezan a planificar semanas y meses.",
        "Allowance, chores and bigger goals. They start planning weeks and months.",
      ),
      icon: CalendarCheck,
    },
    {
      range: t("14 a 17 años", "Ages 14 to 17"),
      desc: t(
        "Interés compuesto, inversión y su número del futuro. Salen de casa sabiendo su número.",
        "Compound interest, investing and their future number. They leave home knowing their number.",
      ),
      icon: TrendingUp,
    },
  ];

  const quotes = [
    {
      quote: t(
        "Mi hija de 9 años ahora pregunta cuánto le falta para su bici, no cuánto le doy.",
        "My 9-year-old now asks how much is left for her bike, not how much I'll give her.",
      ),
      author: t("Marta, mamá de 2", "Marta, mom of 2"),
    },
    {
      quote: t(
        "Las tareas dejaron de ser pelea: ahora las hace porque ve subir su número.",
        "Chores stopped being a fight: he does them because he sees his number go up.",
      ),
      author: t("Andrés, papá de 3", "Andrés, dad of 3"),
    },
    {
      quote: t(
        "En un mes entendió el interés compuesto mejor que yo a los 25.",
        "In a month she understood compound interest better than I did at 25.",
      ),
      author: t("Lucía, mamá de 1", "Lucía, mom of 1"),
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
          <div className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[58%]">
            <img
              src={heroReal}
              alt={t(
                "Padre e hija revisando juntos su plan de ahorro en una tablet",
                "Father and daughter reviewing their savings plan together on a tablet",
              )}
              width={1280}
              height={1024}
              className="h-full w-full object-cover object-[58%_42%] brightness-[1.35] contrast-[1.08] saturate-[1.05] [mask-image:linear-gradient(90deg,transparent_0%,transparent_22%,#000_62%,#000_100%)]"
            />
            {/* Gradual fade into the dark background so the photo never shows a hard edge */}
            <div className="absolute inset-y-0 left-0 w-[55%] bg-[linear-gradient(90deg,var(--background)_0%,transparent_100%)]" />
            <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,var(--background)_0%,transparent_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(0deg,var(--background)_0%,transparent_100%)]" />
            <div className="absolute inset-0 bg-background/15" />
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-6 py-16 md:py-20 lg:py-24">
            <div className="lg:max-w-[50%]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-kid-mint/25 bg-kid-mint/10 px-3 py-1 text-xs font-medium text-kid-mint backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t(
                  "El futuro financiero de tus hijos, impulsado por IA",
                  "Your kids' financial future, powered by AI",
                )}
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.08] tracking-tight md:text-4xl lg:text-5xl">
                {t("Construye ", "Build ")}
                <span className="text-kid-mint">{t("su patrimonio.", "their wealth.")}</span>
                <br />
                {t("Enséñale ", "Teach them ")}
                <span className="text-kid-mint">{t("a manejarlo.", "to manage it.")}</span>
                <br />
                {t("En una sola plataforma.", "In one single platform.")}
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                {t(
                  "Planifica cuánto tendrá tu hijo a los 18 años, crea su primera cartera de inversión, administra su mesada y ayúdalo a desarrollar hábitos financieros que lo acompañarán toda la vida.",
                  "Plan how much your child will have at 18, build their first investment portfolio, manage their allowance and help them build money habits for life.",
                )}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/precios"
                  className="kid-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-background shadow-lg transition-all hover:gap-3"
                >
                  {t("Crear plan Familiar", "Create Family plan")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-3">
                <img
                  src={avatarFaces}
                  alt={t("Familias usando WhatsYournumber", "Families using WhatsYournumber")}
                  width={256}
                  height={128}
                  className="h-12 w-auto shrink-0 mix-blend-lighten"
                />
                <p className="text-sm font-medium text-foreground">
                  {t(
                    "+3.200 familias ya están construyendo su futuro.",
                    "+3,200 families are already building their future.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="mx-auto w-full max-w-6xl px-6">

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="surface px-4 py-5">
              <dt className="numeric kid-text-gradient text-2xl font-semibold">{s.value}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>


        <DualDashboards />

        <Milestones />

        <GrowthChart />

        <section className="mt-24">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">
            {t("La pantalla de tu hijo", "Your child's screen")}
          </h2>
          <KidPreview />
        </section>

        <FamilyProfiles />


        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("Todo lo que hay dentro", "Everything inside")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
            {t(
              "Cada función existe por una razón: que entiendan su dinero y quieran volver mañana.",
              "Every feature exists for one reason: so they understand their money and want to come back tomorrow.",
            )}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, tone }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
                className="surface group relative overflow-hidden p-6 transition-transform hover:-translate-y-1"
              >
                <div className="kid-gradient-soft pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-4 font-display text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            {t("Crece con ellos", "It grows with them")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ages.map(({ icon: Icon, range, desc }) => (
              <div key={range} className="surface relative overflow-hidden p-6">
                <div className="kid-gradient absolute inset-x-0 top-0 h-1" />
                <Icon className="h-5 w-5 text-kid-grape" />
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight">{range}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            {t("Cómo funciona", "How it works")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-kid-sky ring-1 ring-kid-sky/25 kid-gradient-soft">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            {t("Lo que dicen los papás", "What parents say")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {quotes.map((q) => (
              <figure key={q.author} className="surface p-6">
                <div className="flex gap-0.5 text-kid-sun">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed">“{q.quote}”</blockquote>
                <figcaption className="mt-4 text-xs text-muted-foreground">{q.author}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="surface glow relative mt-24 overflow-hidden">
          <div className="grid items-center gap-0 md:grid-cols-2">
            <div className="relative p-10 md:p-14">
              <div className="kid-gradient-soft pointer-events-none absolute inset-0" />
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
            <img
              src={ctaFamily}
              alt={t(
                "Familia revisando sus finanzas juntos",
                "Family reviewing their finances together",
              )}
              loading="lazy"
              width={1408}
              height={912}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
