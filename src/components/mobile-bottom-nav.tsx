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
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-[2rem] border border-border/60 bg-card/85 px-2 py-2 shadow-[0_16px_50px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = pathname === tab.url;
          return (
            <Link
              key={tab.url}
              to={tab.url}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-1 py-1 transition-colors"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_0_16px_-4px_var(--color-primary)]"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
              </div>
              <span
                className={`truncate text-[10px] font-semibold leading-none ${
                  active ? "text-primary" : "text-muted-foreground"
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
