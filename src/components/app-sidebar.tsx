import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PieChart,
  Landmark,
  LineChart,
  PiggyBank,
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
import { useProfile } from "@/hooks/use-profile";
import { buildDataset } from "@/lib/profile-data";

const primary = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Análisis de Gastos", url: "/gastos", icon: PieChart },
  { title: "Patrimonio", url: "/patrimonio", icon: Landmark },
  { title: "Portafolio", url: "/portafolio", icon: LineChart },
  { title: "Fondo de Retiro", url: "/retiro", icon: PiggyBank },
  { title: "Cash Flow", url: "/cash-flow", icon: Waves },
  { title: "Objetivos", url: "/objetivos", icon: Target },
] as const;

const secondary = [
  { title: "AI Advisor", url: "/advisor", icon: Bot },
  { title: "Mis datos", url: "/mi-perfil", icon: UserCog },
  { title: "Cargar EEFF", url: "/configuracion", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { profile } = useProfile();
  const data = buildDataset(profile);

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
          <div className="wealth-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <Wallet className="h-4 w-4 text-background" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">Your north</p>
              <p className="truncate text-xs text-muted-foreground">Tu CFO personal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Patrimonio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{primary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inteligencia</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{secondary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3">
          <div className="surface p-3">
            <p className="text-xs text-muted-foreground">Patrimonio neto</p>
            <p className="numeric mt-1 text-lg font-semibold">{data.fmtCompact(data.netWorth)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ahorro {data.fmtCompact(data.savings)}/mes</p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
