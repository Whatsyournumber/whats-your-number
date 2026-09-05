import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  CheckSquare,
  Home,
  Rocket,
  GraduationCap,
  Star,
  Wallet,
  ChevronLeft,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { THEME_ATTR, kidZoneEnabled, money, pocketTotals, type Member } from "@/lib/mfn";
import { useMovements } from "@/hooks/use-mfn";
import { useI18n, LangToggle } from "@/lib/mfn-i18n";
import { CurrencySelect } from "@/components/mfn-currency-select";

const TABS = [
  { to: "/ninos/kid/numero", label: "Inicio", labelEn: "Home", icon: Home },
  { to: "/ninos/kid/dinero", label: "Mi dinero", labelEn: "My Money", icon: Wallet },
  { to: "/ninos/kid/tareas", label: "Tareas", labelEn: "Tasks", icon: CheckSquare },
  { to: "/ninos/kid/deseos", label: "Sueños", labelEn: "Dreams", icon: Star },
] as const;

const PARENT_TABS = [
  { to: "/ninos", label: "Perfiles", labelEn: "Profiles", icon: Users },
  { to: "/ninos/kid/futuro", label: "Planificador", labelEn: "Planner", icon: Rocket },
  { to: "/ninos/kid/universidades", label: "Universidad", labelEn: "University", icon: GraduationCap },
  { to: "/ninos/kid/datos", label: "Ajustes", labelEn: "Settings", icon: SlidersHorizontal },
] as const;

function ProfileCard({ member, collapsed }: { member: Member; collapsed: boolean }) {
  const { t } = useI18n();
  const { data: movements = [] } = useMovements(member.id);
  const totals = pocketTotals(movements);
  const saved = totals.gastar + totals.ahorrar + totals.crecer;

  if (collapsed) {
    return (
      <div className="mt-3 grid place-items-center rounded-2xl bg-surface-2 p-2 text-2xl" title={member.name}>
        {member.avatar}
      </div>
    );
  }

  return (
    <div className="mt-2 flex shrink-0 items-center gap-2.5 rounded-2xl border border-border/60 bg-card/60 p-2.5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
        {member.avatar}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold text-foreground">{member.name}</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("Mi primer número", "My first number")}
        </p>
        <p className="mt-0.5 whitespace-nowrap font-display text-[19px] font-extrabold leading-tight tracking-tight text-primary">
          {money(saved, member.currency)}
        </p>
      </div>
    </div>
  );
}



/** Aplica el tema visual del perfil (niño / niña / neutro). */
export function useKidTheme(theme?: string) {
  useEffect(() => {
    const root = document.documentElement;
    if (!theme) return;
    root.setAttribute(THEME_ATTR, theme);
    // La app fija un fondo oscuro inline en <html>; el tema infantil es claro,
    // así que lo retiramos mientras esté activo para que no mate el contraste.
    const prevBg = root.style.backgroundColor;
    root.style.backgroundColor = "";
    root.style.colorScheme = "light";
    return () => {
      root.removeAttribute(THEME_ATTR);
      root.style.backgroundColor = prevBg;
      root.style.colorScheme = "";
    };
  }, [theme]);
}

export function KidShell({ member, children }: { member: Member; children: ReactNode }) {
  useKidTheme(member.theme);
  const showKidTabs = kidZoneEnabled(member);
  const kidTabs = showKidTabs ? TABS : [];
  const router = useRouter();
  const { t, lang } = useI18n();
  const label = (tab: { label: string; labelEn: string }) => (lang === "en" ? tab.labelEn : tab.label);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
          "glass-nav sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r py-5 transition-[width] duration-300 lg:flex",
          collapsed ? "w-[78px] px-2" : "w-60 px-3",
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
        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden [&_.nav-icon]:h-7 [&_.nav-icon]:w-7 [&_.nav-pill]:gap-2.5 [&_.nav-pill]:px-2.5 [&_.nav-pill]:py-1.5">
          <div className={cn("pb-1", collapsed && "mx-1")}>
            {collapsed || !showKidTabs ? null : (
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t(`Para ${member.name}`, `For ${member.name}`)}
              </p>
            )}
          </div>
          {kidTabs.map((tab) => (

            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
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

          {showKidTabs ? (
            <div className={cn("mt-6 mb-1", collapsed && "mx-1")}>
              <span className="block h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          ) : null}

          <div className={cn(!collapsed && "px-2.5")}>
            {collapsed ? null : (
              <p className="pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t("Para papás", "For parents")}
              </p>
            )}
          </div>
          {PARENT_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
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

        <ProfileCard member={member} collapsed={collapsed} />
      </aside>

      <div className="min-w-0 flex-1 pb-36 lg:pb-0">
        <header className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 pt-5 sm:px-6 lg:flex lg:justify-between lg:gap-3 lg:px-10 lg:pt-6">
          <button
            onClick={() => router.navigate({ to: "/ninos" })}
            className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground lg:hidden"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("Perfiles", "Profiles")}</span>
          </button>
          <div className="flex shrink-0 items-center gap-1.5 lg:ml-auto">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={t("Abrir menú", "Open menu")}
                  className="glass-nav grid h-9 w-9 shrink-0 place-items-center rounded-full border text-foreground lg:hidden"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-xs">
                <div className="flex flex-col gap-6 pt-8">
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{member.name}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        ⭐ {member.xp} · 🔥 {member.streak}
                      </p>
                    </div>
                  </div>
                  {kidTabs.length ? (
                    <nav className="flex flex-col gap-1.5">
                      <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {t(`Para ${member.name}`, `For ${member.name}`)}
                      </p>
                      {kidTabs.map((tab) => (
                        <SheetClose asChild key={tab.to}>
                          <Link
                            to={tab.to}
                            activeOptions={{ exact: true }}
                            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground [&.nav-pill-active]:bg-primary/10 [&.nav-pill-active]:text-primary"
                            activeProps={{ className: "nav-pill-active" }}
                          >
                            <tab.icon className="h-4.5 w-4.5 shrink-0" />
                            <span className="truncate">{label(tab)}</span>
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  ) : null}
                  <nav className="flex flex-col gap-1.5 border-t border-border/60 pt-4">
                    <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("Para papás", "For parents")}
                    </p>
                    {PARENT_TABS.map((tab) => (
                      <SheetClose asChild key={tab.to}>
                        <Link
                          to={tab.to}
                          activeOptions={{ exact: true }}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground [&.nav-pill-active]:bg-primary/10 [&.nav-pill-active]:text-primary"
                          activeProps={{ className: "nav-pill-active" }}
                        >
                          <tab.icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="truncate">{label(tab)}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
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

      <div className="glass-nav fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden">
        <nav className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-2">
          {kidTabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
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
