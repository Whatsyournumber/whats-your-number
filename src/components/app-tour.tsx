import { useEffect, useMemo, useRef, useState } from "react";
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
    es: ["Tu Dashboard", "Aquí tienes el resumen de tu situación financiera, en un solo lugar.",
      "Patrimonio, ingresos, gastos, ahorro e hipoteca de un vistazo.",
      "Verás tu número para tu libertad financiera y podrás editarlo en el plan Pro.",
      "Tus metas e insights se actualizan con cada gasto que registras."],
    en: ["Your Dashboard", "Here's the summary of your financial situation, in one place.",
      "Net worth, income, expenses, savings and mortgage at a glance.",
      "You'll see your financial freedom number and can edit it on the Pro plan.",
      "Your goals and insights update with every expense you log."],
  },
  {
    url: "/registro-gastos", icon: ReceiptText, minPlan: "free",
    es: ["Registra tus gastos", "Trackea tus gastos del día a día y mantente dentro de tu plan",
      "Crea o edita tu presupuesto mensual",
      "Añade gastos vía voz, foto a los recibos (como mercados) o cargando archivos",
      "Mira cómo van tus gastos diarios por categoría"],
    en: ["Track your expenses", "Track your daily expenses and stay within your plan.",
      "Create or edit your monthly budget",
      "Add expenses via voice, receipt photos (like groceries) or file uploads",
      "See how your daily spending is going by category"],
  },
  {
    url: "/gastos", icon: ChartPie, minPlan: "free",
    es: ["Análisis de Gastos", "Descubre dónde se va tu dinero cada mes.",
      "Importa tus gastos mensuales o estados de todos tus bancos.",
      "Compara cada categoría con tu presupuesto mensual.",
      "Deja que la IA te diga dónde gastaste de más y dónde ahorrar."],
    en: ["Spending Analysis", "Find out where your money goes each month.",
      "Import your monthly expenses or statements from any bank.",
      "Compare each category with your monthly budget.",
      "Let AI tell you where you overspent and where to save."],
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
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar();
  const { profile } = useProfile();
  const [step, setStep] = useState<number | null>(null); // 0 = bienvenida
  // Permite previsualizar el tour de otro plan con localStorage "yn.tour.tier" = free | pro | patrimonio.
  const tourTier = useMemo<PlanTier>(() => {
    try {
      const forced = localStorage.getItem("yn.tour.tier");
      if (forced === "free" || forced === "pro" || forced === "patrimonio") return forced;
    } catch {
      /* noop */
    }
    return tier;
  }, [tier]);
  const availableSteps = useMemo(
    () => STEPS.filter((tourStep) => planMeetsTier(tourStep.minPlan, tourTier)),
    [tourTier],
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
  const isDashboardTourStep = current?.url === "/dashboard";
  const isExpenseTourStep = current?.url === "/registro-gastos";
  const isAnalysisTourStep = current?.url === "/gastos";

  // Marcadores 1 y 2 con líneas punteadas (solo paso Dashboard en escritorio).
  const tourBoxRef = useRef<HTMLDivElement | null>(null);
  const [markers, setMarkers] = useState<{ kpi: { x: number; y: number }; number: { x: number; y: number }; box: { x: number; y: number } } | null>(null);
  useEffect(() => {
    if (!isDashboardTourStep || isMobile) {
      setMarkers(null);
      return;
    }
    let cancelled = false;
    const findLabel = (text: string, rightHalf = false): DOMRect | null => {
      const els = document.querySelectorAll<HTMLElement>("span, p, h1, h2, h3, h4, div");
      for (const el of els) {
        if (el.closest("[data-sidebar]") || el.closest("[data-tour-box]")) continue;
        if (el.children.length > 0) continue;
        const txt = el.textContent?.trim().toLowerCase() ?? "";
        if (!txt.startsWith(text)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (rightHalf && r.left < window.innerWidth * 0.55) continue;
        return r;
      }
      return null;
    };
    const measure = () => {
      const kpi = findLabel("patrimonio neto") ?? findLabel("net worth");
      const num = findLabel("tu número", true) ?? findLabel("your number", true);
      const box = tourBoxRef.current?.getBoundingClientRect();
      if (!kpi || !num || !box || cancelled) return;
      setMarkers({ kpi: { x: kpi.left, y: kpi.top }, number: { x: num.left, y: num.top }, box: { x: box.left, y: box.top } });
    };
    const timers = [80, 350, 900, 1800].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener("resize", measure);
    };
  }, [isDashboardTourStep, isMobile, pathname]);

  // Señala presupuesto, botón de añadir y gráfica en el paso Registro de gastos.
  const [expenseMarkers, setExpenseMarkers] = useState<{
    budget: { x: number; y: number };
    add: { x: number; y: number };
    chart: { x: number; y: number };
    box: { x: number; y: number; width: number; height: number };
  } | null>(null);
  useEffect(() => {
    if (!isExpenseTourStep || isMobile) {
      setExpenseMarkers(null);
      return;
    }
    let cancelled = false;
    const measure = () => {
      const budget = document.querySelector<HTMLElement>('[data-tour-expense-target="budget"]')?.getBoundingClientRect();
      const add = document.querySelector<HTMLElement>('[data-tour-expense-target="add"]')?.getBoundingClientRect();
      const chart = document.querySelector<HTMLElement>('[data-tour-expense-target="chart"]')?.getBoundingClientRect();
      const box = tourBoxRef.current?.getBoundingClientRect();
      if (!budget || !add || !chart || !box || cancelled) return;
      setExpenseMarkers({
        budget: { x: budget.right, y: budget.top + budget.height / 2 },
        add: { x: add.left + add.width / 2, y: add.bottom },
        chart: { x: chart.left + chart.width * 0.58, y: chart.top + 18 },
        box: { x: box.left, y: box.top, width: box.width, height: box.height },
      });
    };
    const timers = [80, 350, 900, 1800].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      window.removeEventListener("resize", measure);
    };
  }, [isExpenseTourStep, isMobile, pathname]);

  // Señala el botón de importar y la gráfica comparativa en el paso Análisis de gastos.
  const [analysisMarkers, setAnalysisMarkers] = useState<{
    importBtn: { x: number; y: number };
    chart: { x: number; y: number };
    box: { x: number; y: number; width: number; height: number };
  } | null>(null);
  useEffect(() => {
    if (!isAnalysisTourStep || isMobile) {
      setAnalysisMarkers(null);
      return;
    }
    let cancelled = false;
    const measure = () => {
      const importBtn = document.querySelector<HTMLElement>('[data-tour-analysis-target="import"]')?.getBoundingClientRect();
      const chart = document.querySelector<HTMLElement>('[data-tour-analysis-target="categories"]')?.getBoundingClientRect();
      const box = tourBoxRef.current?.getBoundingClientRect();
      if (!importBtn || !chart || !box || cancelled) return;
      setAnalysisMarkers({
        importBtn: { x: importBtn.left + importBtn.width / 2, y: importBtn.top },
        chart: { x: chart.left + 90, y: chart.top + 80 },
        box: { x: box.left, y: box.top, width: box.width, height: box.height },
      });
    };
    const scrollTimer = window.setTimeout(() => {
      const btn = document.querySelector<HTMLElement>('[data-tour-analysis-target="import"]');
      if (btn) window.scrollTo({ top: btn.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
    }, 250);
    const timers = [80, 350, 900, 1400, 1800].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelled = true;
      clearTimeout(scrollTimer);
      timers.forEach((timer) => clearTimeout(timer));
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [isAnalysisTourStep, isMobile, pathname]);

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
    tourTier === "patrimonio"
      ? t("Plan Familiar", "Family plan")
      : tourTier === "pro"
        ? isPromo
          ? t("Plan Pro · código", "Pro plan · code")
          : t("Plan Pro", "Pro plan")
        : t("Plan Free", "Free plan");
  const PlanIcon = tourTier === "patrimonio" ? Users : tourTier === "pro" ? Crown : Sprout;

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
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-tour-border bg-tour-surface p-5 pt-6 text-center text-tour-foreground shadow-2xl shadow-positive/15 sm:p-6 sm:pt-7">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-positive/15 blur-3xl" />
          <span className="numeric absolute right-5 top-4 text-xs font-medium text-tour-muted">1 / {total}</span>
          <div className="relative flex justify-center">
            <BrandMark className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
          <h2 className="relative mt-2.5 font-display text-[21px] font-semibold leading-tight sm:text-[26px]">
            {firstName ? (
              <>
                {t("¡Bienvenido,", "Welcome,")} <span className="text-positive">{firstName}!</span>
              </>
            ) : (
              t("¡Bienvenido!", "Welcome!")
            )}
          </h2>
          <div className="relative mt-2.5 flex justify-center">{planBadge}</div>
          <p className="relative mt-2.5 text-[13px] leading-relaxed text-tour-muted sm:mt-3 sm:text-sm">
            {t("Vamos a hacer un tour rápido para que aproveches al máximo WhatsYourNumber.", "Let's take a quick tour so you get the most out of WhatsYourNumber.")}
          </p>
          <p className="relative mt-1.5 text-[13px] font-medium text-tour-foreground sm:text-sm">
            {t("En menos de 1 minuto estarás listo.", "You'll be ready in under a minute.")}
          </p>
          <div className="relative mt-4 grid grid-cols-3 sm:mt-6">
            {welcomePoints.map(([Icon, label], i) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center gap-2 px-1 text-[10px] leading-tight text-tour-muted sm:gap-2.5 sm:px-1.5 sm:text-[11px]",
                  i > 0 && "border-l border-tour-foreground/10",
                )}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-positive/10 text-positive ring-1 ring-positive/25 sm:h-11 sm:w-11">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="max-w-[94px]">{label}</span>
              </div>
            ))}
          </div>
          <Button
            className="relative mt-5 w-full gap-2 rounded-2xl py-4 text-sm sm:mt-6 sm:py-5 sm:text-[15px]"
            onClick={() => { if (isMobile) setOpenMobile(false); setStep(1); }}
          >
            {t("Comenzar tour", "Start tour")} <ArrowRight className="h-4 w-4" />
          </Button>
          <button className="relative mt-2.5 text-[13px] text-tour-muted transition-colors hover:text-tour-foreground sm:mt-3 sm:text-sm" onClick={close}>
            {t("Omitir tour", "Skip tour")}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const [title, intro, ...rawPoints] = t(current.es.join("|"), current.en.join("|")).split("|");
  const points = rawPoints.filter(Boolean);
  const last = step === availableSteps.length;
  const StepIcon = current.icon;
  const isNumberStep = current.url === "/retiro";
  const isDashboardStep = current.url === "/dashboard";
  const isExpenseStep = current.url === "/registro-gastos";
  const isAnalysisStep = current.url === "/gastos";
  const hasNumberedBullets = isDashboardStep || isExpenseStep || isAnalysisStep;

  return (
    <>
      {/* Oscurece ligeramente el fondo para que el paso resalte sin ocultarlo */}
      <div className={`fixed inset-0 z-[90] ${isNumberStep ? "bg-background/20" : "bg-background/40"}`} />
      <div
        className={cn(
          "fixed inset-x-3 bottom-16 z-[100] sm:inset-x-auto sm:bottom-6 lg:bottom-8",
          hasNumberedBullets ? "sm:w-[560px]" : "sm:w-[400px]",
          isDashboardStep
            ? sidebarState === "expanded"
              ? "sm:bottom-auto sm:left-[calc(var(--sidebar-width)+1.5rem)] sm:right-auto sm:top-[clamp(22rem,42vh,28rem)]"
              : "sm:bottom-auto sm:left-[calc(var(--sidebar-width-icon)+1.5rem)] sm:right-auto sm:top-[clamp(22rem,42vh,28rem)]"
            : isExpenseStep
              ? "sm:bottom-auto sm:right-6 sm:top-[clamp(18rem,48vh,24rem)]"
              : isAnalysisStep
                ? "sm:bottom-auto sm:right-6 sm:top-[clamp(12rem,42vh,17rem)]"
                : "sm:right-6",
        )}
      >
        <div ref={tourBoxRef} data-tour-box className="relative overflow-hidden rounded-2xl border border-tour-border bg-tour-surface p-4 text-tour-foreground shadow-[0_0_50px_-8px] shadow-primary/35 ring-2 ring-primary/25 sm:rounded-3xl sm:p-5">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative flex items-start gap-2.5 sm:gap-3">
            {isDashboardStep ? (
              <div className="min-w-0 flex-1">
                <span className="numeric text-[11px] font-medium uppercase tracking-wider text-tour-muted">
                  {t("Paso", "Step")} {step + 1} / {total}
                </span>
                <h3 className="mt-0.5 font-display text-lg font-semibold leading-tight sm:text-xl">{title}</h3>
              </div>
            ) : (
              <>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-positive/15 text-positive ring-1 ring-positive/30 sm:h-11 sm:w-11 sm:rounded-2xl">
                  <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <h3 className="font-display text-base font-semibold leading-tight sm:text-lg">{title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="numeric text-[11px] font-medium uppercase tracking-wider text-tour-muted">
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
              </>
            )}
          </div>
          <p className="relative mt-2.5 text-[13px] leading-snug text-tour-foreground/90 sm:mt-3 sm:text-sm sm:leading-relaxed">{intro}</p>
          <ul className="relative mt-2.5 space-y-1.5 sm:mt-3 sm:space-y-2">
            {points.map((p, i) => {
              const B = BULLET_ICONS[i % BULLET_ICONS.length] ?? Check;
              return (
                <li key={i} className="flex items-start gap-2 whitespace-nowrap text-[11px] leading-snug text-tour-muted sm:gap-2.5 sm:text-xs sm:leading-relaxed">
                  {hasNumberedBullets ? (
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-positive text-[9px] font-semibold text-white sm:h-5 sm:w-5 sm:text-[10px]">
                      {i + 1}
                    </span>
                  ) : (
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-positive/10 text-positive sm:h-5 sm:w-5">
                      <B className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </span>
                  )}
                  {p}
                </li>
              );
            })}
          </ul>
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-tour-foreground/10 sm:mt-4">
            <div className="h-full rounded-full bg-positive transition-all duration-500" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <div className="relative mt-3 flex items-center justify-between gap-2 sm:mt-4">
            <button className="flex items-center gap-1 text-[13px] text-tour-muted transition-colors hover:text-tour-foreground sm:gap-1.5 sm:text-sm" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t("Atrás", "Back")}
            </button>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button className="text-[13px] text-tour-muted underline-offset-2 transition-colors hover:text-tour-foreground hover:underline sm:text-sm" onClick={close}>
                {t("Omitir", "Skip")}
              </button>
              <Button size="sm" className="h-8 gap-1.5 rounded-xl text-[13px] sm:h-9 sm:gap-2 sm:text-sm" onClick={() => (last ? close() : setStep(step + 1))}>
                {last ? t("¡Listo!", "Done!") : t("Siguiente", "Next")} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isDashboardStep && markers && (
        <div className="pointer-events-none fixed inset-0 z-[95] hidden sm:block" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            {([
              [markers.kpi.x - 34, markers.kpi.y + 24, markers.box.x + 64, markers.box.y - 2],
              [markers.number.x - 20, markers.number.y + 24, markers.box.x + 220, markers.box.y - 2],
            ] as const).map(([sx, sy, tx, ty], i) => {
              const cx = sx - (sx - tx) * 0.1;
              const cy = ty - Math.max(80, (sy - ty) * 0.3);
              return (
                <path
                  key={i}
                  d={`M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="5 7"
                  className="stroke-positive/70"
                />
              );
            })}
          </svg>
          <span
            className="absolute grid h-6 w-6 place-items-center rounded-full bg-positive text-[11px] font-bold text-background shadow-lg shadow-positive/40"
            style={{ left: markers.kpi.x - 46, top: markers.kpi.y - 6 }}
          >
            1
          </span>
          <span
            className="absolute grid h-6 w-6 place-items-center rounded-full bg-positive text-[11px] font-bold text-background shadow-lg shadow-positive/40"
            style={{ left: markers.number.x - 34, top: markers.number.y - 4 }}
          >
            2
          </span>
        </div>
      )}
      {isExpenseStep && expenseMarkers && (
        <div className="pointer-events-none fixed inset-0 z-[95] hidden sm:block" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="tour-expense-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-positive" />
              </marker>
            </defs>
            <path
              d={`M ${expenseMarkers.box.x + 50} ${expenseMarkers.box.y} Q ${expenseMarkers.box.x - 30} ${expenseMarkers.box.y - 70} ${expenseMarkers.budget.x} ${expenseMarkers.budget.y}`}
              fill="none" strokeWidth={1.5} strokeDasharray="5 7" markerEnd="url(#tour-expense-arrow)" className="stroke-positive/70"
            />
            <path
              d={`M ${expenseMarkers.box.x + expenseMarkers.box.width - 42} ${expenseMarkers.box.y} Q ${expenseMarkers.add.x + 85} ${expenseMarkers.box.y - 95} ${expenseMarkers.add.x} ${expenseMarkers.add.y}`}
              fill="none" strokeWidth={1.5} strokeDasharray="5 7" markerEnd="url(#tour-expense-arrow)" className="stroke-positive/70"
            />
            <path
              d={`M ${expenseMarkers.box.x + 38} ${expenseMarkers.box.y + expenseMarkers.box.height * 0.46} Q ${expenseMarkers.box.x - 90} ${expenseMarkers.box.y + 30} ${expenseMarkers.chart.x} ${expenseMarkers.chart.y}`}
              fill="none" strokeWidth={1.5} strokeDasharray="5 7" markerEnd="url(#tour-expense-arrow)" className="stroke-positive/70"
            />
          </svg>
          {([
            [expenseMarkers.budget.x + 8, expenseMarkers.budget.y - 34, 1],
            [expenseMarkers.add.x - 12, expenseMarkers.add.y - 58, 2],
            [expenseMarkers.chart.x - 12, expenseMarkers.chart.y - 12, 3],
          ] as const).map(([left, top, label]) => (
            <span
              key={label}
              className="absolute grid h-7 w-7 place-items-center rounded-full bg-positive text-xs font-bold text-background shadow-lg shadow-positive/40"
              style={{ left, top }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      {isAnalysisStep && analysisMarkers && (
        <div className="pointer-events-none fixed inset-0 z-[95] hidden sm:block" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="tour-analysis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-positive" />
              </marker>
            </defs>
            <path
              d={`M ${analysisMarkers.box.x + 12} ${analysisMarkers.box.y + analysisMarkers.box.height * 0.45} Q ${(analysisMarkers.box.x + analysisMarkers.importBtn.x) / 2} ${analysisMarkers.importBtn.y - 60} ${analysisMarkers.importBtn.x} ${analysisMarkers.importBtn.y - 12}`}
              fill="none" strokeWidth={1.5} strokeDasharray="5 7" markerEnd="url(#tour-analysis-arrow)" className="stroke-positive/70"
            />
            <path
              d={`M ${analysisMarkers.box.x + 30} ${analysisMarkers.box.y + 40} Q ${analysisMarkers.box.x - 160} ${analysisMarkers.box.y - 40} ${analysisMarkers.chart.x} ${analysisMarkers.chart.y}`}
              fill="none" strokeWidth={1.5} strokeDasharray="5 7" markerEnd="url(#tour-analysis-arrow)" className="stroke-positive/70"
            />
          </svg>
          <span
            className="absolute grid h-7 w-7 place-items-center rounded-full bg-positive text-xs font-bold text-background shadow-lg shadow-positive/40"
            style={{ left: analysisMarkers.importBtn.x - 14, top: analysisMarkers.importBtn.y - 52 }}
          >
            1
          </span>
          <span
            className="absolute grid h-7 w-7 place-items-center rounded-full bg-positive text-xs font-bold text-background shadow-lg shadow-positive/40"
            style={{ left: analysisMarkers.chart.x - 14, top: analysisMarkers.chart.y + 8 }}
          >
            2
          </span>
        </div>
      )}
    </>
  );
}
