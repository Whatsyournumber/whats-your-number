import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Target, LineChart, Plus, UserRound, PencilLine, Mic, Camera, Upload, Sparkles, Users } from "lucide-react";
import { BudgetVoiceAdvisor } from "@/components/budget-voice-advisor";
import { SharedExpenseDialog } from "@/components/shared-expense";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const t = useT();
  const { isPro, isInvestor } = useSubscription();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [sharedOpen, setSharedOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  // El tour del paso del botón + abre el menú real mientras dura el paso.
  const [tourHold, setTourHold] = useState(false);
  useEffect(() => {
    const onTour = (event: Event) => setTourHold(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    window.addEventListener("wyn:tour-add-menu", onTour);
    return () => window.removeEventListener("wyn:tour-add-menu", onTour);
  }, []);
  useEffect(() => {
    setMenuOpen(tourHold);
  }, [tourHold]);
  useEffect(() => {
    if (!menuOpen || tourHold) {
      setBlurBounds(null);
      return;
    }
    const measure = () => {
      const button = addButtonRef.current?.getBoundingClientRect();
      if (!button) return;
      const p = 2;
      setBlurBounds({ x1: button.left - p, y1: button.top - p, x2: button.right + p, y2: button.bottom + p });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [menuOpen, tourHold]);

  const isFree = !isPro && !isInvestor;
  const tabs = [
    { title: t("Inicio", "Home"), url: "/dashboard", icon: Home },
    { title: isFree ? t("Mis gastos", "My spending") : t("Tus gastos", "Spending"), url: "/registro-gastos", icon: Wallet },
    ...(isFree ? [{ title: t("Ahorro", "Savings"), url: "/cash-flow", icon: Target }] : []),
    ...(isPro ? [{ title: t("Tu número", "Your number"), url: "/retiro", icon: Target }] : []),
    ...(isInvestor
      ? [{ title: t("Portfolio", "Portfolio"), url: "/portafolio", icon: LineChart }]
      : [{ title: t("Mis datos", "My data"), url: "/mi-perfil", icon: UserRound }]),
  ];

  const goAdd = (search: { add?: boolean; action?: string }) => {
    setMenuOpen(false);
    void navigate({ to: "/registro-gastos", search });
  };

  const addOptions: { icon: typeof Home; label: string; search?: { add?: boolean; action?: string }; onClick?: () => void }[] = [
    { icon: PencilLine, label: t("Manual", "Manual"), search: { add: true } as const },
    { icon: Mic, label: t("Por voz", "By voice"), search: { action: "voice" } as const },
    { icon: Camera, label: t("Tomar foto (super, compras, etc)", "Take photo (groceries, shopping, etc)"), search: { action: "photo" } as const },
    { icon: Upload, label: t("Fotos o estados de cuentas", "Photos or bank statements"), search: { action: "upload" } as const },
    { icon: Users, label: t("Gasto compartido", "Shared expense"), onClick: () => { setMenuOpen(false); setSharedOpen(true); } },
    ...(isPro
      ? [{ icon: Sparkles, label: t("Asesor de gastos con IA", "AI Expense Advisor"), onClick: () => { setMenuOpen(false); setAdviceOpen(true); } }]
      : []),
  ];

  const renderTab = (tab: { title: string; url: string; icon: typeof Home }, extraClass = "") => {
    const active = pathname === tab.url;
    return (
      <Link
        key={tab.url}
        to={tab.url}
        data-tour-nav={tab.url}
        onClick={() => window.dispatchEvent(new CustomEvent("wyn:tour-mobile-tab", { detail: tab.url }))}
        className={`group flex min-w-0 flex-col items-center gap-1 px-0.5 py-1 transition-colors ${extraClass}`}
      >
        <tab.icon
          className={`h-6 w-6 shrink-0 transition-colors ${
            active ? "text-primary/85" : "text-muted-foreground group-hover:text-foreground"
          }`}
          strokeWidth={active ? 2.2 : 1.9}
        />
        <span
          className={`min-h-7 text-center text-[10px] font-medium leading-tight ${
            active ? "text-primary/90" : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {tab.title}
        </span>
      </Link>
    );
  };

  return (
    <nav className={cn("fixed bottom-0 left-0 w-screen max-w-full lg:hidden", menuOpen ? "z-50" : "z-40")}>
      <SharedExpenseDialog
        open={sharedOpen}
        onOpenChange={setSharedOpen}
        onSaved={() => {
          void navigate({ to: "/registro-gastos" });
          window.setTimeout(() => document.getElementById("latest-expenses")?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
        }}
      />
      {isPro && <BudgetVoiceAdvisor open={adviceOpen} onOpenChange={setAdviceOpen} />}
      {menuOpen && (
        <>
          {!tourHold && (
            <div
              className="fixed inset-x-0 top-14 z-[45] bg-background/60 backdrop-blur-sm"
              style={{ bottom: addButtonRef.current?.closest("nav")?.getBoundingClientRect().height ?? 82 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
          )}
          <div
            data-tour-add-menu
            className={cn(
              "absolute inset-x-3 z-50 rounded-2xl border border-border bg-card p-2 shadow-2xl",
              tourHold ? "bottom-[calc(100%+200px)]" : "bottom-full mb-6",
            )}
          >
            <div className="px-4 pb-2 pt-3 text-center">
              <p className="text-[22px] font-bold tracking-tight text-foreground">
                {t("Trackea tus gastos diarios", "Track your spending")}
              </p>
              <p className="mt-0.5 text-[15px] font-medium text-muted-foreground">
                {t("Elige cómo quieres agregarlos", "Choose how you want to add them")}
              </p>
            </div>
            {addOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => (opt.onClick ? opt.onClick() : goAdd(opt.search ?? {}))}
                className="flex min-h-12 w-full items-center gap-4 rounded-xl px-4 py-2 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-muted/50 active:bg-muted"
              >
                <opt.icon className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="relative grid w-full grid-cols-5 items-end justify-items-center bg-background px-1 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-2 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.35)]">
        {tabs.slice(0, 2).map((tab, i) => renderTab(tab, i === 1 && !isFree ? "-translate-x-2" : ""))}
        <button
          ref={addButtonRef}
          type="button"
          data-tour-nav-add
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={t("Agregar gasto", "Add expense")}
          aria-expanded={menuOpen}
          className="group -mt-12 flex min-w-0 flex-col items-center gap-1 px-3 py-1"
        >
          <span className={cn("relative -top-1 grid h-16 w-16 shrink-0 place-items-center rounded-full bg-positive text-background shadow-lg shadow-positive/40 ring-4 ring-background transition-transform group-hover:scale-105 group-active:scale-95", menuOpen && "z-50")}>
            <Plus className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <span className={cn("min-h-7 whitespace-nowrap text-center text-[9px] font-medium leading-tight tracking-tight text-foreground", menuOpen && "opacity-0")}>
            {t("Agregar gasto", "Add expense")}
          </span>
        </button>
        {tabs.slice(2).map((tab, i) => renderTab(tab, isFree ? "" : tabs.length === 3 ? "col-start-5 translate-x-2" : i === 0 ? "translate-x-2" : ""))}
      </div>
    </nav>
  );
}
