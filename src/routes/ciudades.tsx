import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeftRight, Info, MapPin, RotateCcw, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { axisProps, ChartTooltip } from "@/components/chart-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { money } from "@/lib/onboarding";
import {
  costBreakdown,
  defaultFilters,
  rankCities,
  type CityData,
  type CityScore,
  type Filters,
} from "@/lib/lifestyle-cities";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ciudades")({
  head: () => ({
    meta: [
      { title: "Lifestyle Simulator — Find Your Next City" },
      {
        name: "description",
        content:
          "Descubre la mejor ciudad para vivir según tu presupuesto, estilo de vida, impuestos, seguridad y metas financieras.",
      },
      { property: "og:title", content: "Lifestyle Simulator — Find Your Next City" },
      {
        property: "og:description",
        content: "Compara ciudades del mundo por costo, ahorro potencial, salario, clima y calidad de vida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LifestyleSimulator,
});

type Opt<T> = { value: T; label: string; icon: string };

/** Filtro compacto tipo dropdown, en línea con el resto del panel. */
function SelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="mt-1 h-8 w-full border-border bg-elevated/40 px-2.5 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              <span className="mr-1.5">{o.icon}</span>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Grupo de filtros con título, para ordenar visualmente el panel. */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">{title}</p>
      <div className="grid grid-cols-2 items-end gap-3">{children}</div>
    </div>
  );
}



function LifestyleSimulator() {
  const t = useT();
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const currency = d.currency;
  const fmt = (n: number) => money(n, currency);

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    budget: Math.max(2000, Math.min(15000, Math.round((d.income || 5000) / 500) * 500)),
    stage:
      profile.marital_status === "married"
        ? profile.children && profile.children !== "0"
          ? "family"
          : "married"
        : "any",
  });
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const ctx = useMemo(
    () => ({ netWorth: d.netWorth, age: profile.age ?? 30, expectedReturn: profile.expected_return || 6 }),
    [d.netWorth, profile.age, profile.expected_return],
  );

  const ranked = useMemo(() => rankCities(filters, ctx), [filters, ctx]);
  const [detail, setDetail] = useState<CityScore | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)));

  const compared = compare
    .map((id) => ranked.find((r) => r.city.id === id))
    .filter((x): x is CityScore => Boolean(x));

  const best = ranked[0];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Lifestyle Simulator"
        title={t("🌍 Encuentra tu próxima ciudad", "🌍 Find Your Next City")}
        subtitle={t(
          "Descubre las mejores ciudades según tu presupuesto, estilo de vida y objetivos financieros.",
          "Discover the best cities based on your budget, lifestyle and financial goals.",
        )}
      />

      <div className="surface overflow-hidden rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/30 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wider">{t("Filtros", "Filters")}</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {ranked.length} {t("ciudades", "cities")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...defaultFilters, budget: f.budget }))}
              className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              {t("Reiniciar", "Reset")}
            </button>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {t("Fuentes", "Sources")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[280px] text-xs leading-relaxed">
                  {t(
                    "Costos de vida y calidad de vida estimados con datos públicos tipo Numbeo, OCDE y Mercer, ajustados por tu etapa de vida y nivel de vida. El retiro usa tu patrimonio, ahorro y la regla del 4%. Los resultados se recalculan al instante con cada filtro.",
                    "Cost of living and quality-of-life estimates based on public data (Numbeo, OECD, Mercer), adjusted for your life stage and comfort level. Retirement uses your net worth, savings and the 4% rule. Results recalculate instantly with every filter.",
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid divide-y divide-border/60 lg:grid-cols-[1.15fr_1.35fr_1fr] lg:divide-x lg:divide-y-0">
          {/* Dónde */}
          <FilterGroup title={t("Dónde", "Where")}>
            <SelectFilter
              label={t("Región", "Region")}
              value={filters.region}
              onChange={(v) => set("region", v)}
              options={[
                { value: "any", label: t("Todas", "All"), icon: "🌍" },
                { value: "northamerica", label: t("Norteamérica", "North America"), icon: "🇺🇸" },
                { value: "latam", label: t("Latam", "Latam"), icon: "🌎" },
                { value: "europe", label: t("Europa", "Europe"), icon: "🇪🇺" },
                { value: "asia", label: t("Asia / Oceanía", "Asia / Oceania"), icon: "🌏" },
                { value: "africa", label: t("África", "Africa"), icon: "🦁" },
              ]}
            />
            <SelectFilter
              label={t("Clima", "Climate")}
              value={filters.climate}
              onChange={(v) => set("climate", v)}
              options={[
                { value: "any", label: t("Cualquiera", "Any"), icon: "🌍" },
                { value: "warm", label: t("Cálido", "Warm"), icon: "☀️" },
                { value: "beach", label: t("Playa", "Beach"), icon: "🏖️" },
                { value: "temperate", label: t("Templado", "Temperate"), icon: "🌤️" },
                { value: "cold", label: t("Frío", "Cold"), icon: "❄️" },
              ]}
            />
          </FilterGroup>

          {/* Dinero */}
          <FilterGroup title={t("Dinero", "Money")}>
            <div className="col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("Presupuesto mensual", "Monthly budget")}
                </p>
                <p className="numeric text-xs font-semibold text-primary">
                  {fmt(filters.budget)}
                  {filters.budget >= 15000 && "+"}
                </p>
              </div>
              <Slider
                className="mt-3"
                min={2000}
                max={15000}
                step={250}
                value={[filters.budget]}
                onValueChange={([v]) => set("budget", v ?? 2000)}
              />
            </div>
            <SelectFilter
              label={t("Cómo vivir", "Comfort level")}
              value={filters.comfort}
              onChange={(v) => set("comfort", v)}
              options={[
                { value: "tight", label: t("Ajustado", "Tight"), icon: "🪙" },
                { value: "comfortable", label: t("Cómodo", "Comfortable"), icon: "🛋️" },
                { value: "luxury", label: t("Lujo", "Luxury"), icon: "🥂" },
              ]}
            />
            <SelectFilter
              label={t("Impuestos", "Taxes")}
              value={filters.tax}
              onChange={(v) => set("tax", v)}
              options={[
                { value: "any", label: t("Indiferente", "Any"), icon: "🌍" },
                { value: "low", label: t("Bajos", "Low"), icon: "🟢" },
                { value: "medium", label: t("Medios", "Medium"), icon: "🟡" },
                { value: "high", label: t("Altos", "High"), icon: "🔴" },
              ]}
            />
            <SelectFilter
              label={t("Salario", "Salary")}
              value={filters.salary}
              onChange={(v) => set("salary", v)}
              options={[
                { value: "any", label: t("Cualquiera", "Any"), icon: "🌍" },
                { value: "low_cost", label: t("Costo bajo", "Lower cost"), icon: "💸" },
                { value: "balanced", label: t("Equilibrado", "Balanced"), icon: "⚖️" },
                { value: "high_income", label: t("Alto potencial", "High income"), icon: "📈" },
                { value: "highest_paying", label: t("Mejor pagadas", "Highest paying"), icon: "💎" },
              ]}
            />
          </FilterGroup>

          {/* Tú */}
          <FilterGroup title={t("Tú", "You")}>
            <SelectFilter
              label={t("Etapa", "Life stage")}
              value={filters.stage}
              onChange={(v) => set("stage", v)}
              options={[
                { value: "any", label: t("Cualquiera", "Any"), icon: "🌍" },
                { value: "single", label: t("Soltero/a", "Single"), icon: "👤" },
                { value: "relationship", label: t("En pareja", "Couple"), icon: "❤️" },
                { value: "married", label: t("Casado/a", "Married"), icon: "💍" },
                { value: "family", label: t("Con hijos", "With children"), icon: "👨‍👩‍👧" },
                { value: "single_parent", label: t("Monoparental", "Single parent"), icon: "👨‍👦" },
              ]}
            />
            <SelectFilter
              label={t("Seguridad", "Safety")}
              value={filters.safety}
              onChange={(v) => set("safety", v)}
              options={[
                { value: "essential", label: t("Esencial", "Essential"), icon: "★★★★★" },
                { value: "important", label: t("Importante", "Important"), icon: "★★★★" },
                { value: "neutral", label: t("Neutral", "Neutral"), icon: "★★★" },
              ]}
            />
            <div className="col-span-2">
              <SelectFilter
                label={t("Objetivo", "Goal")}
                value={filters.goal}
                onChange={(v) => set("goal", v)}
                options={[
                  { value: "save", label: t("Ahorrar más", "Save more"), icon: "💰" },
                  { value: "lifestyle", label: t("Estilo de vida", "Lifestyle"), icon: "🌴" },
                  { value: "retire", label: t("Retirarme antes", "Retire earlier"), icon: "🚀" },
                  { value: "family", label: t("Familia", "Family"), icon: "👨‍👩‍👧" },
                  { value: "career", label: t("Carrera", "Career"), icon: "💼" },
                  { value: "nomad", label: t("Nómada digital", "Digital nomad"), icon: "🌍" },
                ]}
              />
            </div>
          </FilterGroup>
        </div>
      </div>


      {best && <AiRecommendation r={best} filters={filters} fmt={fmt} t={t} />}

      {compared.length === 2 && (
        <ComparePanel a={compared[0]!} b={compared[1]!} fmt={fmt} t={t} onClear={() => setCompare([])} />
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {ranked.map((r, i) => (
          <CityCard
            key={r.city.id}
            r={r}
            rank={i}
            fmt={fmt}
            t={t}
            selected={compare.includes(r.city.id)}
            onCompare={() => toggleCompare(r.city.id)}
            onOpen={() => setDetail(r)}
          />
        ))}
      </div>


      <CityDetail r={detail} filters={filters} fmt={fmt} t={t} onClose={() => setDetail(null)} />
    </PageShell>
  );
}

/* ---------------- Card ---------------- */

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? "text-positive" : score >= 55 ? "text-chart-4" : "text-muted-foreground";
  return (
    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/70 backdrop-blur">
      <span className={cn("numeric text-lg font-semibold leading-none", tone)}>{score}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">score</span>
    </div>
  );
}

function taxBadge(level: "low" | "medium" | "high", t: (es: string, en: string) => string) {
  if (level === "low") return { dot: "🟢", text: t("Impuestos bajos", "Low taxes") };
  if (level === "medium") return { dot: "🟡", text: t("Impuestos medios", "Medium taxes") };
  return { dot: "🔴", text: t("Impuestos altos", "High taxes") };
}

function CityCard({
  r,
  rank,
  fmt,
  t,
  selected,
  onCompare,
  onOpen,
}: {
  r: CityScore;
  rank: number;
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
  selected: boolean;
  onCompare: () => void;
  onOpen: () => void;
}) {
  const c = r.city;
  const tax = taxBadge(r.taxLevel, t);
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(rank * 0.03, 0.3) }}
      className={cn(
        "group surface overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-2xl",
        selected && "ring-2 ring-primary",
      )}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={c.photo}
          alt={`${c.name}, ${c.country}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute right-3 top-3">
          <ScoreRing score={r.score} />
        </div>
        <div className="absolute bottom-3 left-4">
          <p className="flex items-center gap-1 text-lg font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            {c.name}
          </p>
          <p className="text-xs text-muted-foreground">{c.country}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Costo mensual", "Monthly cost")}</p>
            <p className="numeric font-semibold">{fmt(r.cost)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Ahorro potencial", "Potential savings")}</p>
            <p className={cn("numeric font-semibold", r.savings >= 0 ? "text-positive" : "text-negative")}>
              {fmt(r.savings)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Salario medio", "Average salary")}</p>
            <p className="numeric font-medium">{fmt(c.avgSalary)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Retiro estimado", "Estimated retirement")}</p>
            <p className="numeric font-medium">
              {r.yearsToRetire === 0
                ? t("Ya libre", "Already free")
                : r.retireAge
                  ? `${r.retireAge} ${t("años", "yrs")}`
                  : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full bg-elevated px-2 py-0.5">
            {tax.dot} {tax.text}
          </span>
          <span className="rounded-full bg-elevated px-2 py-0.5">🛡 {c.safety}/100</span>
          <span className="rounded-full bg-elevated px-2 py-0.5">
            🌤 {t(c.climateLabelEs, c.climateLabelEn)}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={onOpen}>
            {t("Ver detalles", "View details")}
          </Button>
          <Button size="sm" variant={selected ? "default" : "outline"} onClick={onCompare}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------------- AI recommendation ---------------- */

function AiRecommendation({
  r,
  filters,
  fmt,
  t,
}: {
  r: CityScore;
  filters: Filters;
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
}) {
  const climate = {
    warm: t("clima cálido", "warm weather"),
    beach: t("vida de playa", "beach living"),
    temperate: t("clima templado", "a temperate climate"),
    cold: t("clima frío", "cold weather"),
    any: t("cualquier clima", "any climate"),
  }[filters.climate];
  const goal = {
    save: t("ahorrar más", "saving more"),
    lifestyle: t("mejorar tu estilo de vida", "improving your lifestyle"),
    retire: t("retirarte antes", "retiring earlier"),
    family: t("la vida en familia", "family life"),
    career: t("crecer profesionalmente", "career growth"),
    nomad: t("vivir como nómada digital", "living as a digital nomad"),
  }[filters.goal];

  return (
    <Panel className="border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("Recomendación de la IA", "AI Recommendation")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t(
              `Con un presupuesto de ${fmt(filters.budget)} al mes, preferencia por ${climate} y el objetivo de ${goal}, ${r.city.name} es tu mejor opción: costaría unos ${fmt(r.cost)} al mes, te permitiría ahorrar cerca de ${fmt(Math.max(0, r.savings))} mensuales (${Math.round(r.savingsRate * 100)}% de tu presupuesto)${r.yearsToRetire !== null ? ` y alcanzar tu independencia financiera en ~${r.yearsToRetire} años, a los ${r.retireAge}` : ""}. Seguridad ${r.city.safety}/100, salud ${r.city.healthcareScore}/100 y ${taxBadge(r.taxLevel, t).text.toLowerCase()}.`,
              `With a ${fmt(filters.budget)} monthly budget, a preference for ${climate} and a goal of ${goal}, ${r.city.name} is your best option: it would cost about ${fmt(r.cost)} per month and let you save around ${fmt(Math.max(0, r.savings))} monthly (${Math.round(r.savingsRate * 100)}% of your budget)${r.yearsToRetire !== null ? `, reaching financial independence in ~${r.yearsToRetire} years, at age ${r.retireAge}` : ""}. Safety ${r.city.safety}/100, healthcare ${r.city.healthcareScore}/100 and ${taxBadge(r.taxLevel, t).text.toLowerCase()}.`,
            )}
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- Compare ---------------- */

function ComparePanel({
  a,
  b,
  fmt,
  t,
  onClear,
}: {
  a: CityScore;
  b: CityScore;
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
  onClear: () => void;
}) {
  const rows: { label: string; a: string; b: string; aWin: boolean }[] = [
    {
      label: t("Costo de vida", "Cost of living"),
      a: fmt(a.cost), b: fmt(b.cost), aWin: a.cost < b.cost,
    },
    {
      label: t("Salario medio", "Average salary"),
      a: fmt(a.city.avgSalary), b: fmt(b.city.avgSalary), aWin: a.city.avgSalary > b.city.avgSalary,
    },
    {
      label: t("Ahorro potencial", "Potential savings"),
      a: fmt(a.savings), b: fmt(b.savings), aWin: a.savings > b.savings,
    },
    {
      label: t("Impuestos", "Taxes"),
      a: `${a.city.taxRate}%`, b: `${b.city.taxRate}%`, aWin: a.city.taxRate < b.city.taxRate,
    },
    { label: t("Seguridad", "Safety"), a: `${a.city.safety}/100`, b: `${b.city.safety}/100`, aWin: a.city.safety > b.city.safety },
    {
      label: t("Clima", "Climate"),
      a: t(a.city.climateLabelEs, a.city.climateLabelEn),
      b: t(b.city.climateLabelEs, b.city.climateLabelEn),
      aWin: false,
    },
    {
      label: t("Salud", "Healthcare"),
      a: `${a.city.healthcareScore}/100`, b: `${b.city.healthcareScore}/100`, aWin: a.city.healthcareScore > b.city.healthcareScore,
    },
    {
      label: t("Calidad de vida", "Quality of life"),
      a: `${a.city.qualityOfLife}/100`, b: `${b.city.qualityOfLife}/100`, aWin: a.city.qualityOfLife > b.city.qualityOfLife,
    },
    {
      label: t("Tiempo hasta retirarte", "Time to retire"),
      a: a.yearsToRetire !== null ? `${a.yearsToRetire} ${t("años", "yrs")}` : "—",
      b: b.yearsToRetire !== null ? `${b.yearsToRetire} ${t("años", "yrs")}` : "—",
      aWin: (a.yearsToRetire ?? 999) < (b.yearsToRetire ?? 999),
    },
  ];

  return (
    <Panel
      title={t("Comparar ciudades", "Compare cities")}
      actions={
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div />
        {[a, b].map((x) => (
          <div key={x.city.id} className="text-center">
            <img src={x.city.photo} alt={x.city.name} className="mx-auto h-20 w-full rounded-xl object-cover" />
            <p className="mt-2 font-semibold">{x.city.name}</p>
            <p className="numeric text-xs text-muted-foreground">Score {x.score}</p>
          </div>
        ))}
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className="border-t border-border/60 py-2 text-xs text-muted-foreground">{row.label}</div>
            <div className={cn("numeric border-t border-border/60 py-2 text-center", row.aWin && "font-semibold text-positive")}>
              {row.a}
            </div>
            <div className={cn("numeric border-t border-border/60 py-2 text-center", !row.aWin && "font-semibold text-positive")}>
              {row.b}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Detail ---------------- */

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-elevated/40 p-3">
      <p className="text-[11px] text-muted-foreground">
        {icon} {label}
      </p>
      <p className="numeric mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function CityDetail({
  r,
  filters,
  fmt,
  t,
  onClose,
}: {
  r: CityScore | null;
  filters: Filters;
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
  onClose: () => void;
}) {
  if (!r) return null;
  const c: CityData = r.city;
  const b = costBreakdown(c, filters.stage, filters.comfort);
  const taxes = Math.round((c.avgSalary * c.taxRate) / 100);

  const chart = [
    { name: t("Vivienda", "Housing"), value: b.housing, color: "var(--color-chart-1)" },
    { name: t("Alimentación", "Food"), value: b.food, color: "var(--color-chart-2)" },
    { name: t("Transporte", "Transportation"), value: b.transport, color: "var(--color-chart-3)" },
    { name: t("Salud", "Healthcare"), value: b.healthcare, color: "var(--color-chart-4)" },
    { name: t("Impuestos", "Taxes"), value: taxes, color: "var(--color-chart-5)" },
    { name: t("Ocio", "Entertainment"), value: b.entertainment, color: "var(--color-chart-2)" },
    { name: t("Ahorro potencial", "Potential savings"), value: Math.max(0, r.savings), color: "var(--color-positive)" },
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        <div className="relative h-52">
          <img src={c.photo} alt={c.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-4 left-5">
            <DialogHeader>
              <DialogTitle className="text-2xl">{c.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {c.country} · Lifestyle Score {r.score}/100
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat icon="🏠" label={t("Vivienda", "Housing")} value={fmt(b.housing)} />
            <Stat icon="🍽" label={t("Alimentación", "Food")} value={fmt(b.food)} />
            <Stat icon="🚗" label={t("Transporte", "Transport")} value={fmt(b.transport)} />
            <Stat icon="🏥" label={t("Salud", "Healthcare")} value={fmt(b.healthcare)} />
            <Stat icon="🎓" label={t("Educación", "Education")} value={b.education ? fmt(b.education) : "—"} />
            <Stat icon="💻" label="Internet" value={`${fmt(c.internet)} · ${c.internetSpeed} Mbps`} />
            <Stat icon="🌤" label={t("Clima", "Climate")} value={t(c.climateLabelEs, c.climateLabelEn)} />
            <Stat icon="🛡" label={t("Seguridad", "Safety")} value={`${c.safety}/100`} />
            <Stat icon="💰" label={t("Impuestos", "Taxes")} value={`${c.taxRate}%`} />
            <Stat icon="💼" label={t("Salario medio", "Average salary")} value={fmt(c.avgSalary)} />
            <Stat icon="📈" label={t("Poder adquisitivo", "Purchasing power")} value={`${c.purchasingPower}/100`} />
            <Stat icon="🌎" label={t("Calidad de vida", "Quality of life")} value={`${c.qualityOfLife}/100`} />
            <Stat icon="🚶" label="Walkability" value={`${c.walkability}/100`} />
            <Stat icon="🌳" label={t("Espacios verdes", "Green spaces")} value={`${c.greenSpaces}/100`} />
            <Stat icon="🏖" label={t("Distancia al mar", "Distance to sea")} value={c.beachKm === 0 ? t("En la costa", "On the coast") : `${c.beachKm} km`} />
            <Stat icon="✈" label={t("Aeropuerto intl.", "Intl. airport")} value={c.intlAirport ? t("Sí", "Yes") : "—"} />
            <Stat icon="🌍" label="Digital nomad" value={`${c.remoteWork}/100`} />
            <Stat icon="🗣" label={t("Inglés", "English friendly")} value={`${c.englishFriendly}/100`} />
            <Stat icon="🌫" label={t("Calidad del aire", "Air quality")} value={`${c.airQuality}/100`} />
            <Stat
              icon="🎯"
              label={t("Retiro estimado", "Estimated retirement")}
              value={r.retireAge ? `${r.retireAge} ${t("años", "yrs")}` : "—"}
            />
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
