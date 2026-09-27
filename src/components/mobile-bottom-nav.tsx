import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Target, LineChart, Plus, UserRound, PencilLine, Mic, Camera, Upload, FileSpreadsheet, Sparkles } from "lucide-react";
import { BudgetVoiceAdvisor } from "@/components/budget-voice-advisor";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const t = useT();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
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

  const tabs = [
    { title: t("Inicio", "Home"), url: "/dashboard", icon: Home },
    { title: t("Tus gastos", "Spending"), url: "/registro-gastos", icon: Wallet },
    { title: t("Tu número", "Your number"), url: "/retiro", icon: Target },
    ...(isPro
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
    { icon: Camera, label: t("Tomar foto", "Take photo"), search: { action: "photo" } as const },
    { icon: Upload, label: t("Sube foto o captura", "Upload photo or screenshot"), search: { action: "upload" } as const },
    { icon: FileSpreadsheet, label: t("Subir tus estados de cuenta", "Upload your bank statements"), search: { action: "statement" } as const },
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
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      {isPro && <BudgetVoiceAdvisor open={adviceOpen} onOpenChange={setAdviceOpen} />}
      {menuOpen && (
        <>
          {!tourHold && (
            <div
              className="fixed inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
          )}
          <div
            data-tour-add-menu
            className={cn(
              "absolute inset-x-3 rounded-2xl border border-border bg-card p-2 shadow-2xl",
              tourHold ? "bottom-[calc(100%+200px)]" : "bottom-full mb-6",
            )}
          >
            <p className="px-4 pb-1 pt-2 text-center text-[15px] font-semibold tracking-tight text-muted-foreground">
              {t("Agrega tus gastos diarios", "Add your daily spending")}
            </p>
            {addOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => (opt.onClick ? opt.onClick() : goAdd(opt.search ?? {}))}
                className="flex min-h-13 w-full items-center gap-4 rounded-xl px-4 py-2.5 text-left text-[19px] font-medium text-foreground transition-colors hover:bg-muted/50 active:bg-muted"
              >
                <opt.icon className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="relative grid w-full grid-cols-5 items-end justify-items-center bg-background/90 px-1 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-2 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {tabs.slice(0, 2).map((tab, i) => renderTab(tab, i === 1 ? "-translate-x-2" : ""))}
        <button
          type="button"
          data-tour-nav-add
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={t("Agregar gasto", "Add expense")}
          aria-expanded={menuOpen}
          className="group -mt-12 flex min-w-0 flex-col items-center gap-1 px-3 py-1"
        >
          <span className="relative -top-1 grid h-16 w-16 shrink-0 place-items-center rounded-full bg-positive text-background shadow-lg shadow-positive/40 ring-4 ring-background transition-transform group-hover:scale-105 group-active:scale-95">
            <Plus className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <span className="min-h-7 whitespace-nowrap text-center text-[9px] font-medium leading-tight tracking-tight text-foreground">
            {t("Agregar gasto", "Add expense")}
          </span>
        </button>
        {tabs.slice(2).map((tab, i) => renderTab(tab, i === 0 ? "translate-x-2" : ""))}
      </div>
    </nav>
  );
}
