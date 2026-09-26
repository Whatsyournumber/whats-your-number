import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Target, LineChart, Plus, UserRound, PencilLine, Mic, Camera, Upload, Repeat } from "lucide-react";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const t = useT();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const addOptions = [
    { icon: PencilLine, label: t("Manual", "Manual"), search: { add: true } as const },
    { icon: Mic, label: t("Por voz", "By voice"), search: { action: "voice" } as const },
    { icon: Camera, label: t("Tomar foto", "Take photo"), search: { action: "photo" } as const },
    { icon: Upload, label: t("Sube foto o captura", "Upload photo or screenshot"), search: { action: "upload" } as const },
    { icon: Repeat, label: t("Recurrente", "Recurring"), search: { action: "recurring" } as const },
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
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-3 bottom-full mb-3 rounded-2xl border border-border bg-card p-2 shadow-2xl">
            {addOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => goAdd(opt.search)}
                className="flex min-h-14 w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[17px] font-medium text-foreground transition-colors hover:bg-muted/50 active:bg-muted"
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
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-positive text-background shadow-lg shadow-positive/40 ring-4 ring-background transition-transform group-hover:scale-105 group-active:scale-95">
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
