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
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_ATTR, money, pocketTotals, type Member } from "@/lib/mfn";
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
  const saved = totals.ahorrar + totals.crecer;
  const level = Math.floor(member.xp / 50) + 1;
  const pct = ((member.xp % 50) / 50) * 100;

  if (collapsed) {
    return (
      <div className="mt-3 grid place-items-center rounded-2xl bg-surface-2 p-2 text-2xl" title={member.name}>
        {member.avatar}
      </div>
    );
  }

  return (
    <div className="mt-2 shrink-0 rounded-2xl border border-border/70 bg-surface-2/70 p-2">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-card text-sm shadow-sm">
          {member.avatar}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[11px] font-bold text-foreground">{member.name}</p>
          <p className="text-[9px] font-semibold text-muted-foreground">
            {t("Nivel", "Level")} {level} ⭐ · 🔥 {member.streak}
          </p>
        </div>
      </div>

      <div className="mt-1.5 rounded-lg bg-card px-2 py-1.5">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {t("Mi primer número", "My first number")}
        </p>
        <p className="font-display text-sm font-semibold leading-tight text-foreground">
          {money(saved, member.currency)}
        </p>
      </div>

      <div className="mt-1.5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[9px] font-medium text-muted-foreground">
          {50 - (member.xp % 50)} XP {t("para nivel", "to level")} {level + 1}
        </p>
      </div>
    </div>
  );
}

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
            {collapsed ? null : (
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t(`Para ${member.name}`, `For ${member.name}`)}
              </p>
            )}
          </div>
          {TABS.map((tab) => (

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

          <div className={cn("mt-3 border-t border-border/70 pt-2.5", collapsed && "mx-1")}>
            {collapsed ? null : (
              <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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
        <header className="relative z-20 flex items-center justify-between gap-3 px-5 pt-6 sm:px-6 lg:px-10">
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
          {PARENT_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
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
