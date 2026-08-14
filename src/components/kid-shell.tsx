import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  CheckSquare,
  Home,
  Rocket,
  Star,
  Wallet,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_ATTR, type Member } from "@/lib/mfn";
import { useI18n, LangToggle } from "@/lib/mfn-i18n";
import { CurrencySelect } from "@/components/mfn-currency-select";

const TABS = [
  { to: "/ninos/kid/numero", label: "Mi Primer Número", labelEn: "My First Number", icon: Home },
  { to: "/ninos/kid/futuro", label: "Planificador familiar", labelEn: "Family Planner", icon: Rocket },
  { to: "/ninos/kid/dinero", label: "Mi Dinero", labelEn: "My Money", icon: Wallet },
  { to: "/ninos/kid/tareas", label: "Mis Tareas", labelEn: "My Tasks", icon: CheckSquare },
  { to: "/ninos/kid/deseos", label: "Mis Sueños", labelEn: "My Dreams", icon: Star },
] as const;


const BOTTOM_TABS = [
  { to: "/ninos/kid/datos", label: "Mis Datos", labelEn: "My Data", icon: SlidersHorizontal },
] as const;



/** Aplica el tema visual del perfil (niño / niña / neutro). */
export function useKidTheme(theme?: string) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute(THEME_ATTR, theme);
    return () => root.removeAttribute(THEME_ATTR);
  }, [theme]);
}

export function KidShell({ member, children }: { member: Member; children: ReactNode }) {
  useKidTheme(member.theme);
  const router = useRouter();
  const { t, lang } = useI18n();
  const label = (tab: { label: string; labelEn: string }) => (lang === "en" ? tab.labelEn : tab.label);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(window.localStorage.getItem("mfn-nav-collapsed") === "1");
  }, []);
  const toggleNav = () =>
    setCollapsed((c) => {
      window.localStorage.setItem("mfn-nav-collapsed", c ? "0" : "1");
      return !c;
    });

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "glass-nav sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r py-6 transition-[width] duration-300 lg:flex",
          collapsed ? "w-[86px] px-2" : "w-72 px-4",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
          {!collapsed ? (
            <button
              onClick={() => router.navigate({ to: "/ninos" })}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> {t("Cambiar perfil", "Switch profile")}
            </button>
          ) : null}
          <button
            onClick={toggleNav}
            aria-label={collapsed ? t("Expandir menú", "Expand menu") : t("Colapsar menú", "Collapse menu")}
            title={collapsed ? t("Expandir menú", "Expand menu") : t("Colapsar menú", "Collapse menu")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <div
          className={cn(
            "mt-6 flex items-center rounded-3xl p-3 avatar-ring",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-card text-2xl shadow-sm">
            {member.avatar}
          </span>
          {collapsed ? null : (
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-foreground">
              {member.name}
            </p>
            <p className="text-[11px] font-semibold text-foreground/70">
              {member.age} {t("años", "yrs")} · ⭐ {member.xp} XP · 🔥 {member.streak}
            </p>
          </div>
          )}
        </div>
        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-1.5">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeProps={{ className: "nav-pill-active" }}
              className={cn("nav-pill text-sm", collapsed && "justify-center px-0")}
              title={collapsed ? label(tab) : undefined}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <span className={cn("nav-icon", isActive && "nav-icon-active")}>
                    <tab.icon className="h-4 w-4" />
                  </span>
                  {collapsed ? null : <span className="truncate">{label(tab)}</span>}
                </>
              )}
            </Link>
          ))}
        </nav>
        <nav className="mt-3 shrink-0 space-y-1.5 border-t border-border/70 pt-3">
          {BOTTOM_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeProps={{ className: "nav-pill-active" }}
              className={cn("nav-pill text-[13px]", collapsed && "justify-center px-0")}
              title={collapsed ? label(tab) : undefined}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <span className={cn("nav-icon", isActive && "nav-icon-active")}>
                    <tab.icon className="h-4 w-4" />
                  </span>
                  {collapsed ? null : <span className="truncate">{label(tab)}</span>}
                </>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 pb-36 lg:pb-0">
        <header className="flex items-center justify-between gap-3 px-5 pt-6 sm:px-6 lg:px-10">
          <button
            onClick={() => router.navigate({ to: "/ninos" })}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" /> {t("Perfiles", "Profiles")}
          </button>
          <span className="glass-nav flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold text-foreground lg:hidden">
            <span className="text-base">{member.avatar}</span> ⭐ {member.xp} · 🔥 {member.streak}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            <CurrencySelect
              memberId={member.id}
              currency={member.currency}
              baseCurrency={member.base_currency}
            />

          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>

      <div className="glass-nav fixed inset-x-0 bottom-0 z-30 border-t lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 pt-2">
          {BOTTOM_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeProps={{ className: "nav-pill-active" }}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-border/60 bg-secondary/60 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground"
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label(tab)}</span>
            </Link>
          ))}
        </div>
        <nav className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-2">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold text-muted-foreground"
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <span className={cn("nav-icon h-9 w-9", isActive && "nav-icon-active bg-primary text-primary-foreground animate-pop")}>
                    <tab.icon className="h-4.5 w-4.5" />
                  </span>
                  <span className={cn("truncate", isActive && "text-primary")}>
                    {label(tab).replace("Mi ", "").replace("Mis ", "").replace("My ", "")}
                  </span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </div>

    </div>
  );
}


export function ParentShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.navigate({ to: "/ninos" })}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> {t("Cambiar perfil", "Switch profile")}
          </button>
          <LangToggle />
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
