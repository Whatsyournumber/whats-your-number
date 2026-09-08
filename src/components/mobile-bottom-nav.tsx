import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Target, LineChart, Sparkles } from "lucide-react";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const t = useT();
  const { isPro } = useSubscription();

  const tabs = [
    { title: t("Inicio", "Home"), url: "/dashboard", icon: Home },
    { title: t("Tus gastos", "Spending"), url: "/gastos", icon: Wallet },
    { title: t("Tu número", "Your number"), url: "/retiro", icon: Target },
    ...(isPro
      ? [
          { title: t("Portfolio", "Portfolio"), url: "/portafolio", icon: LineChart },
          { title: "IA", url: "/advisor", icon: Sparkles },
        ]
      : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="flex w-full items-center justify-around bg-background/90 px-2 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-3 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = pathname === tab.url;
          return (
            <Link
              key={tab.url}
              to={tab.url}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 transition-colors"
            >
              <tab.icon
                className={`h-6 w-6 shrink-0 transition-colors ${
                  active ? "text-primary/85" : "text-muted-foreground group-hover:text-foreground"
                }`}
                strokeWidth={active ? 2.2 : 1.9}
              />
              <span
                className={`truncate text-[11px] font-medium leading-tight ${
                  active ? "text-primary/90" : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {tab.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
