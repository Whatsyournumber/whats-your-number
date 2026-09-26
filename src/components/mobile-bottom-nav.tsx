import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Target, LineChart, Plus, UserRound } from "lucide-react";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const t = useT();
  const { isPro } = useSubscription();
  const navigate = useNavigate();

  const tabs = [
    { title: t("Inicio", "Home"), url: "/dashboard", icon: Home },
    { title: t("Tus gastos", "Spending"), url: "/registro-gastos", icon: Wallet },
    { title: t("Tu número", "Your number"), url: "/retiro", icon: Target },
    ...(isPro
      ? [{ title: t("Portfolio", "Portfolio"), url: "/portafolio", icon: LineChart }]
      : [{ title: t("Mis datos", "My data"), url: "/mi-perfil", icon: UserRound }]),
  ];

  const renderTab = (tab: { title: string; url: string; icon: typeof Home }) => {
    const active = pathname === tab.url;
    return (
      <Link
        key={tab.url}
        to={tab.url}
        data-tour-nav={tab.url}
        onClick={() => window.dispatchEvent(new CustomEvent("wyn:tour-mobile-tab", { detail: tab.url }))}
        className="group flex min-w-0 flex-col items-center gap-1 px-0.5 py-1 transition-colors"
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
      <div className="grid w-full grid-cols-5 items-end bg-background/90 px-1 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-2 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {tabs.slice(0, 2).map(renderTab)}
        <button
          type="button"
          data-tour-nav-add
          onClick={() => navigate({ to: "/registro-gastos", search: { add: true } })}
          aria-label={t("Agregar gasto", "Add expense")}
          className="group mx-2 flex min-w-0 flex-col items-center gap-1 px-0.5 py-1 sm:mx-3"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-positive text-background shadow-lg shadow-positive/30 transition-transform group-hover:scale-105 group-active:scale-95">
            <Plus className="h-7 w-7" strokeWidth={2.4} />
          </span>
          <span className="min-h-7 whitespace-nowrap text-center text-[9px] font-medium leading-tight tracking-tight text-foreground">
            {t("Agregar gasto", "Add expense")}
          </span>
        </button>
        {tabs.slice(2).map(renderTab)}
      </div>
    </nav>
  );
}
