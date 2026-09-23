import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Compass, Lightbulb, Sprout, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar";

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

type Step = { url: string; icon: typeof Compass; es: [string, string, string]; en: [string, string, string] };

const STEPS: Step[] = [
  { url: "/dashboard", icon: LayoutDashboard, es: ["Tu Dashboard", "Aquí tienes un resumen de tu situación financiera: patrimonio, ingresos, gastos, ahorro e hipoteca. Todo lo importante, en un solo lugar.", "Toca cada tarjeta para ir directo a su sección."], en: ["Your Dashboard", "A summary of your financial situation: net worth, income, expenses, savings and mortgage. Everything important in one place.", "Tap any card to jump straight to its section."] },
  { url: "/registro-gastos", icon: ReceiptText, es: ["Registra tus gastos", "Añade tus gastos por voz, foto del recibo o manualmente. Solo toma unos segundos y tendrás un análisis automático.", "Prueba el botón + de arriba: la IA clasifica cada gasto en tu plan."], en: ["Track your expenses", "Add expenses by voice, receipt photo or manually. It takes seconds and you get an automatic analysis.", "Try the + button above: AI sorts every expense into your plan."] },
  { url: "/gastos", icon: ChartPie, es: ["Análisis de Gastos", "Analiza tus gastos mensuales por categoría, compáralos con tu presupuesto y detecta dónde se te va el dinero.", "Las alertas te avisan cuando una categoría supera tu plan."], en: ["Spending Analysis", "Analyze your monthly spending by category, compare it with your budget and spot where your money goes.", "Alerts warn you when a category exceeds your plan."] },
  { url: "/cash-flow", icon: Scale, es: ["Distribución del dinero", "Ve cómo se reparte tu dinero entre necesidades, deseos y ahorro, y si vas por buen camino con la regla 50/30/20.", "Pasa el cursor sobre cada bloque para ver el detalle por categoría."], en: ["Money Distribution", "See how your money splits between needs, wants and savings, and whether you're on track with the 50/30/20 rule.", "Hover each block to see the breakdown by category."] },
  { url: "/retiro", icon: Target, es: ["WhatsYourNumber", "Calcula cuánto patrimonio necesitas para vivir la vida que quieres y cuándo podrás alcanzarlo.", "Mueve el monto mensual deseado y verás tu número cambiar al instante."], en: ["WhatsYourNumber", "Calculate how much wealth you need to live the life you want and when you'll reach it.", "Adjust your desired monthly amount and watch your number change instantly."] },
  { url: "/hipoteca", icon: Home, es: ["Análisis de hipoteca", "Simula la compra de vivienda, compara escenarios y ve cómo afecta a tu número y tu libertad financiera.", "Compra vs alquiler: compara ambos caminos con tus datos reales."], en: ["Mortgage analysis", "Simulate buying a home, compare scenarios and see how it affects your number and financial freedom.", "Buy vs rent: compare both paths with your real data."] },
  { url: "/patrimonio", icon: Wallet, es: ["Patrimonio", "Visualiza todo tu patrimonio: cuentas bancarias, inversiones, cripto, propiedades y más, con su evolución mes a mes.", "Edita cualquier activo con el lápiz para mantenerlo al día."], en: ["Net Worth", "See all your wealth: bank accounts, investments, crypto, properties and more, with month-by-month evolution.", "Edit any asset with the pencil to keep it up to date."] },
  { url: "/portafolio", icon: TrendingUp, es: ["Portafolio", "Analiza la distribución de tus inversiones, su rendimiento real frente al S&P 500 y cómo optimizar tu portafolio.", "Escribe el ticker de una acción o cripto y traemos su precio en tiempo real."], en: ["Portfolio", "Analyze your investment allocation, real performance vs the S&P 500 and how to optimize your portfolio.", "Type a stock or crypto ticker and we fetch its live price."] },
  { url: "/ciudades", icon: Globe2, es: ["Lifestyle Simulator", "Descubre ciudades donde tu dinero rinde más y llegarías antes a tu libertad financiera.", "Compara tu ciudad con destinos del mismo continente y presupuesto."], en: ["Lifestyle Simulator", "Discover cities where your money goes further and you'd reach financial freedom sooner.", "Compare your city with destinations on the same continent and budget."] },
  { url: "/life-planner", icon: Map, es: ["Life Planner", "Simula decisiones de vida —mudarte, cambiar de trabajo, tener hijos— y ve cómo suben o bajan tu número y tu fecha de retiro.", "Cada decisión recalcula tu número partiendo de tu situación actual."], en: ["Life Planner", "Simulate life decisions —moving, changing jobs, having kids— and see how your number and retirement date change.", "Every decision recalculates your number from your current situation."] },
  { url: "/mi-perfil", icon: UserRound, es: ["Mis datos", "Gestiona tu información: ingresos, gasto objetivo, familia, perfil de riesgo y más. Cuanto más completo, mejores recomendaciones.", "Todo lo que edites aquí actualiza el resto de la app al momento."], en: ["My data", "Manage your info: income, target spending, family, risk profile and more. The more complete, the better the recommendations.", "Everything you edit here updates the rest of the app instantly."] },
  { url: "/advisor", icon: Sparkles, es: ["Asistente IA", "Pregúntale cualquier cosa sobre tus finanzas. Analiza tus datos, encuentra oportunidades y te da recomendaciones personalizadas.", "Prueba: ¿cuánto ahorro al mes? o ¿cómo va mi fondo de emergencia?"], en: ["AI Assistant", "Ask anything about your finances. It analyzes your data, finds opportunities and gives personalized advice.", "Try: how much do I save per month? or how is my emergency fund?"] },
];
const TOTAL = STEPS.length + 1;

export function AppTour() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();
  const [step, setStep] = useState<number | null>(null); // 0 = bienvenida

  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem(doneKey(user.id))) return;
      if (localStorage.getItem(PENDING_KEY) !== "1") return;
      setStep(0);
    } catch {
      /* noop */
    }
  }, [user]);

  const current = step && step > 0 ? STEPS[step - 1] : null;

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

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-sm rounded-3xl border border-primary/40 bg-card p-6 text-center shadow-2xl shadow-primary/20">
          <span className="numeric absolute right-5 top-4 text-xs text-muted-foreground">1 / {TOTAL}</span>
          <Sprout className="mx-auto h-10 w-10 text-positive" />
          <h2 className="mt-3 font-display text-2xl font-semibold">{t("¡Bienvenido!", "Welcome!")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Vamos a hacer un tour rápido para que aproveches al máximo WhatsYourNumber. En menos de 1 minuto estarás listo.", "Let's take a quick tour so you get the most out of WhatsYourNumber. You'll be ready in under a minute.")}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            {[
              [Compass, t("Entiende tu dinero", "Understand your money")],
              [Lightbulb, t("Encuentra oportunidades", "Find opportunities")],
              [Target, t("Alcanza tu libertad financiera", "Reach financial freedom")],
            ].map(([Icon, label], i) => {
              const I = Icon as typeof Compass;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-positive/15 text-positive"><I className="h-4 w-4" /></span>
                  {label as string}
                </div>
              );
            })}
          </div>
          <Button className="mt-6 w-full gap-2" onClick={() => { if (isMobile) setOpenMobile(false); setStep(1); }}>
            {t("Comenzar tour", "Start tour")} <ArrowRight className="h-4 w-4" />
          </Button>
          <button className="mt-3 text-sm text-muted-foreground hover:text-foreground" onClick={close}>
            {t("Omitir tour", "Skip tour")}
          </button>
        </div>
      </div>
    );
  }

  const [title, body] = t(current!.es.join("|"), current!.en.join("|")).split("|");
  const last = step === STEPS.length;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[100] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] lg:bottom-8">
      <div className="rounded-2xl border border-primary/50 bg-card p-5 shadow-2xl shadow-primary/25 ring-1 ring-primary/20">
        <div className="flex items-start gap-3">
          <span className="numeric grid h-8 w-8 shrink-0 place-items-center rounded-full bg-positive text-sm font-semibold text-background">{step + 1}</span>
          <h3 className="flex-1 pt-1 font-display text-lg font-semibold leading-tight">{title}</h3>
          <span className="numeric shrink-0 pt-1 text-xs text-muted-foreground">{step + 1} / {TOTAL}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4" /> {t("Atrás", "Back")}
          </button>
          <Button size="sm" className="gap-2" onClick={() => (last ? close() : setStep(step + 1))}>
            {last ? t("¡Listo!", "Done!") : t("Siguiente", "Next")} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
