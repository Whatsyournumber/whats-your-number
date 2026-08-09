import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PieChart,
  Landmark,
  LineChart,
  PiggyBank,
  Globe,

  Waves,
  Sparkles,
  Target,
  Bot,
  Settings,
  Wallet,
  UserCog,
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { profile } = useProfile();
  const data = buildDataset(profile);
  const t = useT();

  const primary = [
    { title: t("Dashboard", "Dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("Análisis de Gastos", "Spending Analysis"), url: "/gastos", icon: PieChart },
    { title: t("Patrimonio", "Net Worth"), url: "/patrimonio", icon: Landmark },
    { title: t("Portafolio", "Portfolio"), url: "/portafolio", icon: LineChart },
    { title: "WhatsYournumber", url: "/retiro", icon: PiggyBank },
    { title: t("Ciudades para vivir", "Cities to live in"), url: "/ciudades", icon: Globe },

    { title: "Cash Flow", url: "/cash-flow", icon: Waves },
    { title: t("Objetivos", "Goals"), url: "/objetivos", icon: Target },
  ] as const;

  const secondary = [
    { title: "AI Advisor", url: "/advisor", icon: Bot },
    { title: t("Mis datos", "My data"), url: "/mi-perfil", icon: UserCog },
    { title: t("Cargar EEFF", "Upload statements"), url: "/configuracion", icon: Settings },
  ] as const;

  const renderItem = (item: { title: string; url: string; icon: typeof Wallet }) => {
    const active = pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
          <Link to={item.url} className="flex items-center gap-3">
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">WhatsYournumber</p>
              <p className="truncate text-xs text-muted-foreground">{t("Tu CFO personal", "Your personal CFO")}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("Patrimonio", "Net Worth")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{primary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("Inteligencia", "Intelligence")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{secondary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3">
          <div className="surface p-3">
            <p className="text-xs text-muted-foreground">{t("Patrimonio neto", "Net worth")}</p>
            <p className="numeric mt-1 text-lg font-semibold">{data.fmtCompact(data.netWorth)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Ahorro", "Savings")} {data.fmtCompact(data.savings)}
              {t("/mes", "/mo")}
            </p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
