import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { axisProps, ChartTooltip } from "@/components/chart-kit";
import { useT } from "@/hooks/use-language";
import { money } from "@/lib/onboarding";
import {
  costBreakdown,
  type CityData,
  type CityScore,
  type Filters,
  hourlyRate,
} from "@/lib/lifestyle-cities";
import { stabilityBadge } from "@/lib/political-stability";
import { PILLAR_META, type PillarBreakdown, type PillarKey } from "@/lib/north-score";
import { nomadVisa, nomadFriendly } from "@/lib/nomad-visas";
import { cn } from "@/lib/utils";

function SourcesTooltip({ t }: { t: (es: string, en: string) => string }) {
  const sources = [
    { name: "Numbeo", desc: t("costo de vida, crimen, calidad", "cost of living, crime, quality") },
    { name: "OECD", desc: t("ingresos, impuestos, educación", "income, taxes, education") },
    { name: "World Bank", desc: t("gobernanza, salud, esperanza", "governance, health, life expectancy") },
    { name: "WHO / IQAir", desc: t("salud y calidad del aire", "healthcare and air quality") },
    { name: "Global Peace Index", desc: t("paz y seguridad", "peace and safety") },
    { name: "World Happiness Report", desc: t("bienestar subjetivo", "subjective well-being") },
    { name: "Ookla Speedtest", desc: t("velocidad de internet", "internet speed") },
    { name: "InterNations 2026", desc: t("satisfacción expatriados", "expat satisfaction") },
    { name: "Nomad List / EF EPI", desc: t("nómadas e inglés", "nomads and English") },
    { name: "OpenWeather / OSM", desc: t("clima, sol, naturaleza", "climate, sun, nature") },
    { name: "Mercer / EIU", desc: t("liveability global", "global liveability") },
  ];
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-border/60 bg-elevated/40 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground">
          <BookOpen className="h-3 w-3" />
          {t("Fuentes", "Sources")}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="max-w-[260px] border border-border/80 bg-card p-3 text-card-foreground shadow-2xl"
      >
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
            {t("Fuentes", "Sources")}
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {t(
              "Datos públicos y estimaciones de referencia. No son cifras oficiales en tiempo real.",
              "Public data and reference estimates. Not official real-time figures.",
            )}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {sources.map((s) => (
              <div key={s.name} className="rounded-md border border-border/60 bg-elevated/40 p-1.5">
                <p className="text-[10px] font-medium leading-tight text-foreground">{s.name}</p>
                <p className="text-[9px] leading-tight text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function regionLabel(region: CityData["region"], t: (es: string, en: string) => string) {
  switch (region) {
    case "northamerica":
      return t("Norteamérica", "North America");
    case "latam":
      return "Latam";
    case "europe":
      return t("Europa", "Europe");
    case "asia":
      return t("Asia / Oceanía", "Asia / Oceania");
    default:
      return t("África", "Africa");
  }
}

function Stat({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string | undefined;
  highlight?: "positive" | "negative" | "neutral";
}) {
  const valueColor =
    highlight === "positive"
      ? "text-positive"
      : highlight === "negative"
        ? "text-negative"
        : "text-foreground";

  return (
    <div className="rounded-xl border border-border/60 bg-elevated/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
        <span className="text-base">{icon}</span>
      </div>
      <p className={cn("numeric mt-1 text-sm font-semibold leading-tight", valueColor)}>{value}</p>
      {sub && <p className="numeric mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PillarRow({ pillar, t }: { pillar: PillarBreakdown; t: (es: string, en: string) => string }) {
  const meta = PILLAR_META[pillar.key];
  return (
    <details className="rounded-xl border border-border/60 bg-elevated/40 p-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs">
        <span>{meta.emoji}</span>
        <span className="font-medium">{t(meta.es, meta.en)}</span>
        <span className="text-[10px] text-muted-foreground">{pillar.weight}%</span>
        <span className="numeric ml-auto text-sm font-semibold">{pillar.score}</span>
      </summary>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pillar.score}%` }} />
      </div>
      <ul className="mt-2 space-y-1">
        {pillar.factors.map((f) => (
          <li key={f.es} className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              {t(f.es, f.en)} <span className="opacity-60">· {f.source}</span>
            </span>
            <span className="numeric text-foreground">{f.value}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function CityDetailDialog({
  r,
  filters,
  fmt,
  onClose,
}: {
  r: CityScore | null;
  filters: Filters;
  fmt: (n: number) => string;
  onClose: () => void;
}) {
  const t = useT();
  if (!r) return null;
  const c: CityData = r.city;
  const b = costBreakdown(c, filters.stage, filters.comfort);
  const taxes = Math.round((c.avgSalary * c.taxRate) / 100);
  const stability = stabilityBadge(c.country, t);

  const chart = [
    { name: t("Vivienda", "Housing"), value: b.housing, color: "var(--color-chart-1)" },
    { name: t("Alimentación", "Food"), value: b.food, color: "var(--color-chart-2)" },
    { name: t("Transporte", "Transportation"), value: b.transport, color: "var(--color-chart-3)" },
    { name: t("Salud", "Healthcare"), value: b.healthcare, color: "var(--color-chart-4)" },
    ...(b.education > 0
      ? [{ name: t("Educación", "Education"), value: b.education, color: "var(--color-chart-6)" }]
      : []),
    ...(b.travel > 0 ? [{ name: t("Viajes", "Travel"), value: b.travel, color: "var(--color-chart-7)" }] : []),
    { name: t("Impuestos", "Taxes"), value: taxes, color: "var(--color-chart-5)" },
    { name: t("Ocio", "Entertainment"), value: b.entertainment, color: "var(--color-chart-2)" },
    { name: t("Ahorro potencial", "Potential savings"), value: Math.max(0, r.savings), color: "var(--color-positive)" },
  ];


  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/7] w-full flex-shrink-0 overflow-hidden">
          <img src={c.photo} alt={c.name} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl">{c.name}</DialogTitle>
              <SourcesTooltip t={t} />
            </div>

            <DialogDescription>
              <span className="inline-flex items-center gap-2">
                <span>{c.country}</span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-primary">{r.north.total}</span>
                  <span>/100</span>
                </span>
                <span className="text-border">·</span>
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px]">
                  {stability.dot} {stability.text}
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Quick context row */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-elevated/30 p-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span>🌍</span>
              {regionLabel(c.region, t)}
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <span>💰</span>
              {t("Impuestos", "Taxes")}: {c.taxRate}%
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <span>💼</span>
              {t("Ingreso/hora", "Hourly income")}: ${hourlyRate(c)}/h · {fmt(c.avgSalary)}/m
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <span>✈</span>
              {c.intlAirport ? t("Aeropuerto intl.", "Intl. airport") : "—"}
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <span>🏖</span>
              {c.beachKm === 0 ? t("En la costa", "On the coast") : `${c.beachKm} km ${t("al mar", "to sea")}`}
            </span>
          </div>
          {filters.comfort === "luxury" && (
            <div className="rounded-xl border border-border/60 bg-elevated/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              🥂{" "}
              {t(
                "Escenario de lujo: alquiler de 2 habitaciones en barrio de alto nivel, coche de marca con seguro y parking, restaurantes de gama alta, seguro médico privado, colegio internacional si hay hijos y viajes frecuentes.",
                "Luxury scenario: 2-bedroom rental in a high-end neighborhood, premium branded car with insurance and parking, high-end restaurants, private health insurance, international school if you have kids, and frequent travel.",
              )}
            </div>
          )}


          {filters.goal === "nomad" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  🌍 {t("Trabajo remoto y visa nómada", "Remote work & nomad visa")}
                </p>
                <p className="numeric text-sm">
                  <span className="text-lg font-semibold text-primary">{nomadFriendly(c)}</span>
                  <span className="text-muted-foreground">/100</span>
                </p>
              </div>
              <p className="text-[13px] font-medium">{nomadVisa(c.country).name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat
                  icon="🛂"
                  label={t("Estado", "Status")}
                  value={nomadVisa(c.country).exists ? t("Disponible", "Available") : t("No existe", "None")}
                />
                <Stat
                  icon="💵"
                  label={t("Ingreso mínimo", "Min. income")}
                  value={nomadVisa(c.country).incomeUsd > 0 ? `${fmt(nomadVisa(c.country).incomeUsd)}/m` : "—"}
                />
                <Stat
                  icon="⏳"
                  label={t("Duración", "Duration")}
                  value={
                    nomadVisa(c.country).months > 0
                      ? `${nomadVisa(c.country).months} ${t("meses", "months")}${nomadVisa(c.country).renewable ? " ↻" : ""}`
                      : "—"
                  }
                />
                <Stat icon="💻" label={t("Internet", "Internet")} value={`${c.internetSpeed} Mbps`} />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {t(nomadVisa(c.country).taxEs, nomadVisa(c.country).taxEn)}
              </p>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">Your next city</p>
              <p className="numeric text-sm">
                <span className="text-lg font-semibold text-primary">{r.north.total}</span>
                <span className="text-muted-foreground">/100</span>
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {r.north.pillars.map((p) => (
                <PillarRow key={p.key} pillar={p} t={t} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">
              {t("Distribución mensual estimada", "Estimated monthly breakdown")}
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ left: 20, right: 16 }}>
                  <XAxis type="number" {...axisProps} tickFormatter={(v: number) => fmt(v)} />
                  <YAxis type="category" dataKey="name" width={110} {...axisProps} />
                  <RTooltip cursor={{ fill: "var(--color-elevated)" }} content={<ChartTooltip formatter={fmt} />} />
                  <Bar dataKey="value" name={t("Monto", "Amount")} radius={[0, 6, 6, 0]}>
                    {chart.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
