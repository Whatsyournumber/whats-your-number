import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, ChartPie, Check, Compass, Crown, Globe2, Home, LayoutDashboard,
  Lightbulb, Map, MousePointerClick, ReceiptText, Scale, Sparkles, Sprout, Target,
  TrendingUp, UserRound, Users, Wallet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar";
import { planMeetsTier, useSubscription, type PlanTier } from "@/hooks/use-subscription";
import { BrandMark } from "@/components/brand-logo";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const PENDING_KEY = "yn.tour.pending";
const doneKey = (uid: string) => `yn.tour.done:${uid}`;

/** Llamar al terminar el onboarding: el tutorial se mostrará una sola vez. */
export function queueAppTour() {
  try {
    localStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* noop */
  }
}

// es/en: [título, intro, punto 1, punto 2, punto 3]
type Step = {
  url: string;
  icon: typeof Compass;
  minPlan: PlanTier;
  es: [string, string, string, string, string];
  en: [string, string, string, string, string];
};

const STEPS: Step[] = [
  {
    url: "/dashboard", icon: LayoutDashboard, minPlan: "free",
    es: ["Tu Dashboard", "El resumen de tu situación financiera, en un solo lugar.",
      "Patrimonio, ingresos, gastos, ahorro, hipoteca y tu Número de libertad financiera de un vistazo.",
      "Toca cualquier tarjeta para ir directo a su sección.",
      "Tus metas e insights se actualizan con cada gasto que registras."],
    en: ["Your Dashboard", "The summary of your financial situation, in one place.",
      "Net worth, income, expenses, savings, mortgage and your Financial Freedom Number at a glance.",
      "Tap any card to jump straight to its section.",
      "Your goals and insights update with every expense you log."],
  },
  {
    url: "/registro-gastos", icon: ReceiptText, minPlan: "free",
    es: ["Registra tus gastos", "Trackea tus gastos del día a día.",
      "Crea o repasa tu presupuesto mensual.",
      "Cárgalos por voz, foto del recibo o con el botón +.",
      "La IA te avisa cuando estés cerca de pasarte."],
    en: ["Track your expenses", "Track your day-to-day spending.",
      "Create or review your monthly budget.",
      "Log by voice, receipt photo or the + button.",
      "AI alerts you when you're close to going over."],
  },
  {
    url: "/gastos", icon: ChartPie, minPlan: "free",
    es: ["Análisis de Gastos", "Descubre dónde se va tu dinero cada mes.",
      "Compara cada categoría con tu presupuesto mensual.",
      "La IA te busca oportunidades de ahorro.",
      "Ve tu evolución mes a mes desde que empezaste."],
    en: ["Spending Analysis", "Find out where your money goes each month.",
      "Compare each category with your monthly budget.",
      "Alerts warn you when a category exceeds your plan.",
      "See your month-by-month evolution since you started."],
  },
  {
    url: "/cash-flow", icon: Scale, minPlan: "free",
    es: ["Distribución del dinero", "La regla 50/30/20 aplicada a tus números reales.",
      "Necesidades, deseos y ahorro, comparados con tu plan.",
      "Pasa el cursor sobre cada bloque para ver el detalle.",
      "Al empezar usa tu plan; luego usa tus gastos reales."],
    en: ["Money Distribution", "The 50/30/20 rule applied to your real numbers.",
      "Needs, wants and savings, compared with your plan.",
      "Hover each block to see the breakdown by category.",
      "It starts from your plan, then uses your real spending."],
  },
  {
    url: "/retiro", icon: Target, minPlan: "pro",
    es: ["Tu número de libertad financiera", "WhatsYourNumber calcula el capital que necesitas para vivir de tus inversiones y alcanzar tu libertad financiera.",
      "Tu Número convierte el ingreso mensual que deseas en una meta concreta de capital.",
      "Descubre el año estimado en que alcanzarás tu libertad y cuánto aportar cada mes.",
      "Compara tasas de retiro del 4% al 12%; el escenario del 7% destaca Tu Número."],
    en: ["Your financial freedom number", "WhatsYourNumber calculates the capital you need to live off your investments and reach financial freedom.",
      "Your Number turns your desired monthly income into a clear capital target.",
      "See your estimated freedom year and how much to contribute each month.",
      "Compare withdrawal rates from 4% to 12%; the 7% scenario highlights Your Number."],
  },
  {
    url: "/hipoteca", icon: Home, minPlan: "free",
    es: ["Análisis de hipoteca", "Compra vs alquiler, con tus datos reales.",
      "Simula entrada, plazo e interés y compara escenarios.",
      "Ve cómo cada opción afecta a tu número y tu libertad.",
      "Tu propiedad y su deuda se suman a tu patrimonio."],
    en: ["Mortgage analysis", "Buy vs rent, with your real data.",
      "Simulate down payment, term and interest to compare scenarios.",
      "See how each option affects your number and your freedom.",
      "Your property and its debt are added to your net worth."],
  },
  {
    url: "/patrimonio", icon: Wallet, minPlan: "pro",
    es: ["Patrimonio", "Todo lo que tienes y lo que debes, en una vista.",
      "Cuentas, inversiones, cripto, propiedades y deudas.",
      "Edita cualquier activo con el lápiz para mantenerlo al día.",
      "Sigue la evolución de tu patrimonio mes a mes."],
    en: ["Net Worth", "Everything you own and owe, in one view.",
      "Accounts, investments, crypto, properties and debts.",
      "Edit any asset with the pencil to keep it up to date.",
      "Track your net worth evolution month by month."],
  },
  {
    url: "/portafolio", icon: TrendingUp, minPlan: "pro",
    es: ["Portafolio", "Tus inversiones comparadas con el mercado.",
      "Escribe el ticker y traemos el precio en tiempo real.",
      "Rentabilidad real ponderada frente al S&P 500.",
      "Acciones, ETF, cripto, REITs, fondo de retiro y efectivo."],
    en: ["Portfolio", "Your investments compared with the market.",
      "Type a ticker and we fetch its live price.",
      "Real weighted performance vs the S&P 500.",
      "Stocks, ETFs, crypto, REITs, retirement fund and cash."],
  },
  {
    url: "/ciudades", icon: Globe2, minPlan: "pro",
    es: ["Lifestyle Simulator", "Ciudades donde tu dinero rinde más.",
      "Compara tu ciudad con destinos del mismo continente.",
      "Filtra por presupuesto, estilo de vida e hijos.",
      "Ve en cuántas llegarías antes a tu libertad financiera."],
    en: ["Lifestyle Simulator", "Cities where your money goes further.",
      "Compare your city with destinations on the same continent.",
      "Filter by budget, lifestyle and kids.",
      "See where you'd reach financial freedom sooner."],
  },
  {
    url: "/life-planner", icon: Map, minPlan: "pro",
    es: ["Life Planner", "Simula decisiones de vida antes de tomarlas.",
      "Mudarte, cambiar de trabajo, tener hijos y más.",
      "Cada decisión recalcula tu número al instante.",
      "Todo parte de tu situación real, no de cero."],
    en: ["Life Planner", "Simulate life decisions before making them.",
      "Moving, changing jobs, having kids and more.",
      "Every decision recalculates your number instantly.",
      "Everything starts from your real situation, not from scratch."],
  },
  {
    url: "/mi-perfil", icon: UserRound, minPlan: "free",
    es: ["Mis datos", "Cuanto más completo, mejores recomendaciones.",
      "Ingresos, gasto objetivo, familia y perfil de riesgo.",
      "Todo lo que edites actualiza el resto de la app al momento.",
      "Con el plan Familiar gestionas los perfiles de tu hogar."],
    en: ["My data", "The more complete, the better the recommendations.",
      "Income, target spending, family and risk profile.",
      "Everything you edit updates the rest of the app instantly.",
      "With the Family plan you manage your household profiles."],
  },
  {
    url: "/advisor", icon: Sparkles, minPlan: "free",
    es: ["Asistente IA", "Tu CFO personal, disponible 24/7.",
      "Analiza tus datos y encuentra oportunidades de ahorro.",
      "Prueba: ¿cuánto ahorro al mes? o ¿cómo va mi fondo de emergencia?",
      "Recuerda tus conversaciones para darte seguimiento."],
    en: ["AI Assistant", "Your personal CFO, available 24/7.",
      "It analyzes your data and finds savings opportunities.",
      "Try: how much do I save per month? or how is my emergency fund?",
      "It remembers your conversations to follow up with you."],
  },
];
const BULLET_ICONS = [MousePointerClick, Lightbulb, Check];

export function AppTour() {
  const t = useT();
  const { user } = useAuth();
  const { tier, isPromo, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();
  const { profile } = useProfile();
  const [step, setStep] = useState<number | null>(null); // 0 = bienvenida
  const availableSteps = useMemo(
    () => STEPS.filter((tourStep) => planMeetsTier(tourStep.minPlan, tier)),
    [tier],
  );
  const total = availableSteps.length + 1;

  // Nombre para saludar: perfil > Google > correo.
  const firstName = useMemo(() => {
    const raw =
      profile.full_name ||
      (user?.user_metadata?.["full_name"] as string | undefined) ||
      user?.email?.split("@")[0] ||
      "";
    return raw.trim().split(/\s+/)[0] ?? "";
  }, [profile.full_name, user]);


  useEffect(() => {
    if (!user || subscriptionLoading) return;
    try {
      if (localStorage.getItem(doneKey(user.id))) return;
      if (localStorage.getItem(PENDING_KEY) !== "1") return;
      setStep(0);
    } catch {
      /* noop */
    }
  }, [user, subscriptionLoading]);

  const current = step && step > 0 ? availableSteps[step - 1] ?? null : null;

  // Abre cada sección cuando le toca.
  useEffect(() => {
    if (current && pathname !== current.url) navigate({ to: current.url });
  }, [current, pathname, navigate]);

  // Resalta el enlace del menú lateral.
  useEffect(() => {
    document.querySelectorAll("[data-tour-active]").forEach((el) => el.removeAttribute("data-tour-active"));
    if (!current) return;
    const el = document.querySelector(`[data-sidebar="sidebar"] a[href="${current.url}"]`);
    el?.setAttribute("data-tour-active", "true");
  }, [current, pathname]);

  const close = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
      if (user) localStorage.setItem(doneKey(user.id), "1");
    } catch {
      /* noop */
    }
    document.querySelectorAll("[data-tour-active]").forEach((el) => el.removeAttribute("data-tour-active"));
    setStep(null);
    navigate({ to: "/dashboard" });
  };

  if (step === null) return null;

  const planLabel =
    tier === "patrimonio"
      ? t("Plan Familiar", "Family plan")
      : tier === "pro"
        ? isPromo
          ? t("Plan Pro · código", "Pro plan · code")
          : t("Plan Pro", "Pro plan")
        : t("Plan Free", "Free plan");
  const PlanIcon = tier === "patrimonio" ? Users : tier === "pro" ? Crown : Sprout;

  const planBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/25">
      <PlanIcon className="h-3 w-3" />
      {planLabel}
    </span>
  );

  if (step === 0) {
    const welcomePoints: [typeof Compass, string][] = [
      [ReceiptText, t("Trackea tus gastos", "Track your expenses")],
      [Lightbulb, t("Encuentra oportunidades", "Find opportunities")],
      [Target, t("Alcanza tu libertad financiera", "Reach financial freedom")],
    ];
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-background/60 p-4 backdrop-blur-[2px]">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-positive/40 bg-card p-6 pt-7 text-center shadow-2xl shadow-positive/15">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-positive/15 blur-3xl" />
          <span className="numeric absolute right-5 top-4 text-xs font-medium text-muted-foreground">1 / {total}</span>
          <div className="relative flex justify-center">
            <BrandMark className="h-16 w-16" />
          </div>
          <h2 className="relative mt-3 font-display text-[26px] font-semibold leading-tight">
            {firstName ? (
              <>
                {t("¡Bienvenido,", "Welcome,")} <span className="text-positive">{firstName}!</span>
              </>
            ) : (
              t("¡Bienvenido!", "Welcome!")
            )}
          </h2>
          <div className="relative mt-2.5 flex justify-center">{planBadge}</div>
          <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("Vamos a hacer un tour rápido para que aproveches al máximo WhatsYourNumber.", "Let's take a quick tour so you get the most out of WhatsYourNumber.")}
          </p>
          <p className="relative mt-1.5 text-sm font-medium text-foreground">
            {t("En menos de 1 minuto estarás listo.", "You'll be ready in under a minute.")}
          </p>
          <div className="relative mt-6 grid grid-cols-3">
            {welcomePoints.map(([Icon, label], i) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center gap-2.5 px-1.5 text-[11px] leading-tight text-muted-foreground",
                  i > 0 && "border-l border-foreground/10",
                )}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-positive/10 text-positive ring-1 ring-positive/25">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="max-w-[94px]">{label}</span>
              </div>
            ))}
          </div>
          <Button
            className="relative mt-6 w-full gap-2 rounded-2xl py-5 text-[15px]"
            onClick={() => { if (isMobile) setOpenMobile(false); setStep(1); }}
          >
            {t("Comenzar tour", "Start tour")} <ArrowRight className="h-4 w-4" />
          </Button>
          <button className="relative mt-3 text-sm text-muted-foreground transition-colors hover:text-foreground" onClick={close}>
            {t("Omitir tour", "Skip tour")}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const [title, intro, ...points] = t(current.es.join("|"), current.en.join("|")).split("|");
  const last = step === availableSteps.length;
  const StepIcon = current.icon;
  const isNumberStep = current.url === "/retiro";

  return (
    <>
      {/* Oscurece ligeramente el fondo para que el paso resalte sin ocultarlo */}
      <div className={`fixed inset-0 z-[90] ${isNumberStep ? "bg-background/10" : "bg-background/30"}`} />
      <div className="fixed inset-x-3 bottom-24 z-[100] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px] lg:bottom-8">
        <div className={`relative overflow-hidden rounded-3xl border border-primary/60 p-5 shadow-[0_0_50px_-8px] shadow-primary/40 ring-2 ring-primary/30 ${isNumberStep ? "bg-card/90 backdrop-blur-md" : "bg-card/95 backdrop-blur-xl"}`}>
          <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-positive/15 text-positive ring-1 ring-positive/30">
              <StepIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 pr-6">
              <h3 className="font-display text-lg font-semibold leading-tight">{title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="numeric text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("Paso", "Step")} {step + 1} / {total}
                </span>
                {current.minPlan !== "free" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-medium text-positive ring-1 ring-positive/25">
                    <Check className="h-2.5 w-2.5" />
                    {t("Incluido en tu plan", "Included in your plan")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground/90">{intro}</p>
          <ul className="relative mt-3 space-y-2">
            {points.map((p, i) => {
              const B = BULLET_ICONS[i % BULLET_ICONS.length] ?? Check;
              return (
                <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-positive/10 text-positive">
                    <B className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              );
            })}
          </ul>
          <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-positive transition-all duration-500" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <div className="relative mt-4 flex items-center justify-between gap-2">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> {t("Atrás", "Back")}
            </button>
            <div className="flex items-center gap-3">
              <button className="text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline" onClick={close}>
                {t("Omitir", "Skip")}
              </button>
              <Button size="sm" className="gap-2 rounded-xl" onClick={() => (last ? close() : setStep(step + 1))}>
                {last ? t("¡Listo!", "Done!") : t("Siguiente", "Next")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
