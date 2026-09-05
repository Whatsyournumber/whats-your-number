import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PieChart,
  Landmark,
  LineChart,
  PiggyBank,
  Globe,
  Home,
  Waves,
  Sparkles,
  Target,
  Bot,
  Upload,
  Wallet,
  UserCog,
  CreditCard,
  ShieldCheck,
  Users,
  Handshake,
  ChevronRight,
} from "lucide-react";



import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-logo";
import { useProfile } from "@/hooks/use-profile";
import { buildDataset } from "@/lib/profile-data";
import { useT } from "@/hooks/use-language";
import { useRoles } from "@/hooks/use-role";
import { useSubscription } from "@/hooks/use-subscription";
import { useMyAffiliate } from "@/hooks/use-affiliate";

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { profile } = useProfile();
  const data = buildDataset(profile);
  const t = useT();
  const { isSuperAdmin } = useRoles();
  const { tier } = useSubscription();
  const { affiliate } = useMyAffiliate();


  const primary = [
    { title: t("Dashboard", "Dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("Análisis de Gastos", "Spending Analysis"), url: "/gastos", icon: PieChart },
    { title: t("Distribución del dinero", "Money Distribution"), url: "/cash-flow", icon: Waves },
    { title: t("Análisis de hipoteca", "Mortgage analysis"), url: "/hipoteca", icon: Home },
    { title: "WhatsYournumber", url: "/retiro", icon: PiggyBank },
    { title: t("Patrimonio", "Net Worth"), url: "/patrimonio", icon: Landmark },
    { title: t("Portafolio", "Portfolio"), url: "/portafolio", icon: LineChart },

    { title: "Lifestyle Simulator", url: "/ciudades", icon: Globe },
    { title: "Life Planner", url: "/life-planner", icon: Target },
  ] as const;



  const affiliateItems: { title: string; url: string; icon: typeof Users }[] =
    affiliate && affiliate.status !== "disabled"
      ? [{ title: t("Programa de afiliados", "Affiliate program"), url: "/afiliados", icon: Handshake }]
      : [];

  const secondary = [
    ...affiliateItems,
    { title: t("Asistente IA", "AI Assistant"), url: "/advisor", icon: Bot },
    { title: t("Mis datos", "My data"), url: "/mi-perfil", icon: UserCog },
    { title: t("Suscripción", "Subscription"), url: "/suscripcion", icon: CreditCard },
    
    { title: t("Importar gastos", "Import expenses"), url: "/configuracion", icon: Upload },
  ] as const;


  const adminItems = isSuperAdmin
    ? ([{ title: t("Panel admin", "Admin panel"), url: "/admin", icon: ShieldCheck }] as const)
    : ([] as const);


  const renderItem = (item: { title: string; url: string; icon: typeof Wallet }) => {
    const active = pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-8 gap-2 px-2">
          <Link
            to={item.url}
            className="flex items-center gap-2"
            onClick={() => setOpenMobile(false)}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-sm leading-none">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="px-3 py-3">
        {isMobile ? (
          <div className="relative flex items-center justify-center py-1 pr-12">
            <Link
              to="/ninos"
              onClick={() => setOpenMobile(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            >
              <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight">
                <ChevronRight className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
                {t("Perfiles", "Profiles")}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <BrandMark className="h-8 w-8 shrink-0" />
              <div className="min-w-0 text-left">
                <p className="truncate font-display text-sm font-semibold">WhatsYournumber</p>
                <p className="truncate text-xs text-muted-foreground">{t("Tu CFO personal", "Your personal CFO")}</p>
              </div>
            </div>
          </div>
        ) : (


          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">WhatsYournumber</p>
                <p className="truncate text-xs text-muted-foreground">{t("Tu CFO personal", "Your personal CFO")}</p>
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={isMobile ? "flex-1 gap-0.5 overflow-y-auto" : "flex-none gap-0.5 overflow-hidden"}>
        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className="h-6 text-[10px] uppercase tracking-wide">
            {t("Patrimonio", "Net Worth")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">{primary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-auto my-1.5 h-px w-2/3 bg-gradient-to-r from-transparent via-border to-transparent" />

        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className="h-6 text-[10px] uppercase tracking-wide">
            {t("Inteligencia", "Intelligence")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">{secondary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup className="p-1.5">
            <SidebarGroupLabel className="h-6 text-[10px] uppercase tracking-wide">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">{adminItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-2">
          <div className="surface p-2.5">
            <p className="text-[11px] text-muted-foreground">WhatsYournumber</p>
            <p className="numeric mt-0.5 text-base font-semibold">{data.fmtCompact(data.plan.targetCapital)}</p>
            {data.plan.mode !== "freedom" ? (
              <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                {(() => {
                  const months = data.plan.monthsToGoal || 0;
                  const years = Math.max(1, Math.round(months / 12));
                  const amount = data.fmtCompact(data.plan.monthlyToGoal || 0);
                  if (months <= 0) return t("Define tu ahorro mensual", "Set your monthly savings");
                  return (
                    <>
                      <span className="font-medium text-foreground">
                        {amount}
                        {t("/mes", "/mo")}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>
                        {years} {t(years === 1 ? "año" : "años", years === 1 ? "year" : "years")}
                      </span>
                    </>
                  );
                })()}
              </p>
            ) : (
              <p className="mt-1 truncate whitespace-nowrap text-xs text-muted-foreground">
                {t("Quieres", "You want")} {data.fmtCompact(data.plan.desiredIncome)}
                {t("/mes", "/mo")}
              </p>
            )}


          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
