import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { benchmark, fmt, holdings } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portafolio")({
  head: () => ({
    meta: [
      { title: "Portafolio — Finance OS" },
      { name: "description", content: "ETFs, acciones, cripto y cash con costo promedio, rentabilidad, dividendos y benchmark." },
      { property: "og:title", content: "Portafolio — Finance OS" },
      { property: "og:description", content: "Rentabilidad de tu portafolio comparada contra el S&P 500." },
    ],
  }),
  component: Portafolio;
});

function Portafolio() {
  return null;
}
