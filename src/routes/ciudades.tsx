import { Block, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, BookOpen, Info, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { PlanGate } from "@/components/plan-gate";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { CityDetailDialog } from "@/components/city-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { money } from "@/lib/onboarding";
import {
  defaultFilters,
  hourlyRate,
  rankCities,
  type CityData,
  type CityScore,
  type Filters,
} from "@/lib/lifestyle-cities";
import { stabilityBadge } from "@/lib/political-stability";
import { PILLAR_META, pillarWeights, type PillarKey } from "@/lib/north-score";
import { suggestedFilters, suggestionReasons } from "@/lib/city-suggestions";
import { buildDataset } from "@/lib/profile-data";
import { nomadVisa, nomadFriendly } from "@/lib/nomad-visas";
import { readMyCities, saveMyCities } from "@/lib/my-cities";
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

/** Filtro premium tipo dropdown con icono y label alineados. */
function SelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];
  const isStar = selected?.icon?.startsWith("★") ?? false;
  return (
    <div className="min-w-0">
      {label ? (
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          {label}
        </p>
      ) : null}
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className={label ? "mt-1.5 h-9 w-full rounded-xl border-border/60 bg-elevated/40 px-3 text-xs transition-colors hover:border-primary/40 hover:bg-elevated/60" : "h-9 w-full rounded-xl border-border/60 bg-elevated/40 px-3 text-xs transition-colors hover:border-primary/40 hover:bg-elevated/60"}>
          <span className="inline-flex min-w-0 items-center gap-2.5">
            {selected ? (
              <span className={cn(
                "inline-flex shrink-0 items-center justify-start",
                isStar ? "w-12 text-[9px] text-primary" : "w-5 text-xs"
              )}>
                {selected.icon}
              </span>
            ) : null}
            <span className={cn("truncate", isStar && "hidden xl:inline")}>{selected?.label}</span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              <span className="inline-flex items-center gap-2.5">
                <span className={cn(
                  "inline-flex shrink-0 items-center justify-start",
                  o.icon.startsWith("★") ? "w-12 text-[9px] text-primary" : "w-5 text-xs"
                )}>
                  {o.icon}
                </span>
                <span>{o.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Grupo de filtros con título y grid consistente. */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">{title}</p>
      <div className="grid grid-cols-1 gap-3 *:min-h-[60px] *:self-start sm:grid-cols-2 sm:grid-rows-2">{children}</div>
    </div>
  );
}

/** Tooltip informativo con caja card-style. */
function InfoTooltip({
  icon: Icon,
  label,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        sideOffset={6}
        className="max-w-[340px] border border-border/80 bg-card p-0 text-card-foreground shadow-2xl"
      >
        <div className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
          {children}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function MethodologyTooltip({ t, filters }: { t: (es: string, en: string) => string; filters: Filters }) {
  const weights = pillarWeights(filters);
  const active =
    filters.stage !== "any" ||
    filters.goal !== "save" ||
    filters.climate !== "any" ||
    filters.tax !== "any" ||
    filters.salary !== "any" ||
    filters.safety !== "important" ||
    filters.stability !== "any";
  const pillars = Object.entries(weights).map(([key, weight]) => {
    const meta = PILLAR_META[key as PillarKey];
    return { key, weight, emoji: meta.emoji, label: t(meta.es, meta.en) };
  });
  return (
    <InfoTooltip
      icon={Info}
      label={t("Metodología", "Methodology")}
      title={t("Metodología", "Methodology")}
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-border/60 bg-elevated/40 p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t(
              "El ranking combina tu perfil (etapa, objetivo, presupuesto, clima, impuestos, seguridad y estabilidad) con una puntuación objetiva de la ciudad. Cuanto más específicos son tus filtros, más peso tiene tu perfil.",
              "The ranking combines your profile (life stage, goal, budget, climate, taxes, safety and stability) with an objective city score. The more specific your filters, the more weight your profile has.",
            )}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("Your Next City Score", "Your Next City Score")}
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {active
              ? t(
                  "Pesos ajustados a tus filtros (base 30/25/15/15/10/5).",
                  "Weights adjusted to your filters (base 30/25/15/15/10/5).",
                )
              : t("Pesos base, sin filtros activos.", "Base weights, no active filters.")}
          </p>
          {pillars.map((p) => (
            <div key={p.key} className="flex items-center gap-2 rounded-lg border border-border/60 bg-elevated/40 p-2">
              <span className="text-sm">{p.emoji}</span>
              <span className="flex-1 text-[11px] text-foreground">{p.label}</span>
              <span className="numeric rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {p.weight}%
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/60 bg-elevated/40 p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t(
              "Se aplica una penalización proporcional si el costo mensual supera tu presupuesto. Los desempates usan: score final, Your Next City Score, calidad de vida, seguridad y menor costo.",
              "A proportional penalty is applied if the monthly cost exceeds your budget. Tie-breakers use: final score, Your Next City Score, quality of life, safety and lower cost.",
            )}
          </p>
        </div>
      </div>
    </InfoTooltip>
  );
}

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


function LifestyleSimulatorContent() {
  const t = useT();
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const currency = d.currency;
  const fmt = (n: number) => money(n, currency);

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    budget: Math.max(1000, Math.min(15000, Math.round((d.income || 5000) / 100) * 100)),
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
  // Ciudades elegidas a mano (máx. 3). Se guardan sólo al confirmar.
  const [saved, setSaved] = useState<string[]>(() => readMyCities());
  const [picks, setPicks] = useState<string[]>(() => readMyCities());
  const dirty = picks.join(",") !== saved.join(",");
  const savePicks = () => {
    saveMyCities(picks);
    setSaved(picks);
    toast.success(t("Ciudades guardadas", "Cities saved"), {
      description: t("Las verás en tu dashboard.", "You'll see them on your dashboard."),
    });
  };
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const allCities = useMemo(
    () => rankCities({ ...filters, region: "any", climate: "any", stability: "any" }, ctx),
    [filters, ctx],
  );


  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)));

  const compared = compare
    .map((id) => ranked.find((r) => r.city.id === id))
    .filter((x): x is CityScore => Boolean(x));

  // Al tener 2 o más ciudades marcadas, baja automáticamente a la comparativa.
  useEffect(() => {
    if (compared.length < 2) return;
    const el = document.getElementById("city-compare");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // solo cuando cambia la cantidad/selección
  }, [compare.join(","), compared.length]);


  const best = ranked[0];

  return (
    <PageShell>
      <Block shouldBlockFn={() => dirty} withResolver>
        {(blocker) => (
          <Dialog open={blocker.status === "blocked"} onOpenChange={(open) => !open && blocker.reset?.()}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t("¿Quieres guardar tus ciudades?", "Do you want to save your cities?")}
                </DialogTitle>
                <DialogDescription>
                  {t(
                    "Si las guardas, aparecerán en tu dashboard inicial como tus ciudades sugeridas.",
                    "If you save them, they'll show on your dashboard as your suggested cities.",
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => blocker.reset?.()}>
                  {t("Seguir eligiendo", "Keep choosing")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPicks(saved);
                    blocker.proceed?.();
                  }}
                >
                  {t("Descartar", "Discard")}
                </Button>
                <Button
                  onClick={() => {
                    savePicks();
                    blocker.proceed?.();
                  }}
                >
                  {t("Guardar y salir", "Save and leave")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Block>
      <PageHeader

        eyebrow="Lifestyle Simulator"
        title={t("🌍 Encuentra tu próxima ciudad", "🌍 Find Your Next City")}
        subtitle={t(
          "Descubre las mejores ciudades según tu presupuesto, estilo de vida y objetivos financieros.",
          "Discover the best cities based on your budget, lifestyle and financial goals.",
        )}
      />

      <div className="surface overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-elevated/30 px-4 py-2.5 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider">{t("Filtros", "Filters")}</p>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {ranked.length} {t("ciudades", "cities")}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...defaultFilters, budget: f.budget }))}
              className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              {t("Reiniciar", "Reset")}
            </button>
            <TooltipProvider delayDuration={100}>
              <MethodologyTooltip t={t} filters={filters} />
              <SourcesTooltip t={t} />
            </TooltipProvider>
          </div>
        </div>

        <CitySearchBar
          all={allCities}
          picks={picks}
          setPicks={setPicks}
          dirty={dirty}
          onSave={savePicks}
          t={t}
        />

        <div className="grid divide-y divide-border/60 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
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
            <SelectFilter
              label={t("Política", "Politics")}
              value={filters.stability}
              onChange={(v) => set("stability", v)}
              options={[
                { value: "any", label: t("Indiferente", "Any"), icon: "🌍" },
                { value: "medium", label: t("Media o superior", "Medium or higher"), icon: "🟡" },
                { value: "high", label: t("Alta", "High"), icon: "🟢" },
                { value: "veryhigh", label: t("Muy alta", "Very high"), icon: "🛡️" },
              ]}
            />
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
          </FilterGroup>

          {/* Dinero */}
          <FilterGroup title={t("Dinero", "Money")}>
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {t("Presupuesto mensual", "Monthly budget")}
                </p>
                <p className="numeric text-xs font-semibold text-primary">
                  {fmt(filters.budget)}
                  {filters.budget >= 15000 && "+"}
                </p>
              </div>
              <div className="mt-1.5 flex h-9 items-center">
              <Slider
                className="w-full"
                min={1000}
                max={15000}
                step={100}
                value={[filters.budget]}
                onValueChange={([v]) => set("budget", v ?? 1000)}
              />
              </div>
            </div>
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
              label={t("Ingreso por hora", "Hourly income")}
              value={filters.salary}
              onChange={(v) => set("salary", v)}
              options={[
                { value: "any", label: t("Indiferente", "Doesn't matter"), icon: "🌍" },
                { value: "under_25", label: t("< $25/h", "Under $25/hr"), icon: "💵" },
                { value: "25_50", label: "$25 – $50/h", icon: "💰" },
                { value: "50_75", label: "$50 – $75/h", icon: "💎" },
                { value: "75_100", label: "$75 – $100/h", icon: "🚀" },
                { value: "100_plus", label: t("$100+/h", "$100+/hr"), icon: "👑" },
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
            <div className="col-span-1 sm:col-span-2">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {t("Objetivo", "Goal")}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SelectFilter
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
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
                  onClick={() => {
                    document.getElementById("city-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  aria-label={t("Buscar ciudades", "Search cities")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FilterGroup>
        </div>
      </div>


      <SuggestedForYou
        profile={profile}
        ctx={ctx}
        fmt={fmt}
        t={t}
        picks={picks}
        all={allCities}
        onOpen={(r) => setDetail(r)}
      />


      {best && <AiRecommendation r={best} filters={filters} fmt={fmt} t={t} />}

      {compared.length >= 2 && (
        <div id="city-compare" className="scroll-mt-24">
          <ComparePanel items={compared} fmt={fmt} t={t} onClear={() => setCompare([])} />
        </div>
      )}



      <TooltipProvider delayDuration={200}>
        <div id="city-results" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ranked.map((r, i) => (
            <CityCard
              key={r.city.id}
              r={r}
              rank={i}
              fmt={fmt}
              t={t}
              selected={compare.includes(r.city.id)}
              nomadMode={filters.goal === "nomad"}
              onCompare={() => toggleCompare(r.city.id)}
              onOpen={() => setDetail(r)}
            />
          ))}
        </div>
      </TooltipProvider>



      <CityDetailDialog r={detail} filters={filters} fmt={fmt} onClose={() => setDetail(null)} />
    </PageShell>
  );
}

/* ---------------- Buscador minimalista de ciudades ---------------- */

function CitySearchBar({
  all,
  picks,
  setPicks,
  dirty,
  onSave,
  t,
}: {
  all: CityScore[];
  picks: string[];
  setPicks: React.Dispatch<React.SetStateAction<string[]>>;
  dirty: boolean;
  onSave: () => void;
  t: (es: string, en: string) => string;
}) {

  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return all
      .filter((r) => !picks.includes(r.city.id))
      .filter((r) => `${r.city.name} ${r.city.country}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, all, picks]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 px-4 py-2.5 sm:flex sm:flex-wrap">
      <div className="relative min-w-0 flex-1">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            picks.length >= 3
              ? t("Ya elegiste 3 ciudades", "You already picked 3 cities")
              : t("Busca y elige hasta 3 ciudades…", "Search and pick up to 3 cities…")
          }
          disabled={picks.length >= 3}
          className="h-9 rounded-xl border-border/60 bg-elevated/40 pl-9 text-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:bg-elevated/60 focus-visible:ring-0"
        />
        {matches.length > 0 && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {matches.map((r) => (
              <button
                key={r.city.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-elevated"
                onClick={() => {
                  setPicks((p) => [...p, r.city.id].slice(0, 3));
                  setQuery("");
                }}
              >
                <span>{r.city.name}</span>
                <span className="text-muted-foreground">{r.city.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {picks.map((id) => {
        const c = all.find((r) => r.city.id === id)?.city;
        if (!c) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px]"
          >
            {c.name}
            <button
              type="button"
              onClick={() => setPicks((p) => p.filter((x) => x !== id))}
              aria-label={`Quitar ${c.name}`}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </span>
        );
      })}
      {picks.length > 0 && (
        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setPicks([])}>
          {t("Usar las sugeridas", "Use suggested")}
        </Button>
      )}
      {dirty && (
        <Button size="sm" className="h-7 rounded-full text-[11px]" onClick={onSave}>
          {t("Guardar", "Save")}
        </Button>
      )}

    </div>
  );
}

/* ---------------- Sugerencias según tu onboarding ---------------- */

function SuggestedForYou({
  profile,
  ctx,
  fmt,
  t,
  picks,
  all,
  onOpen,
}: {
  profile: ReturnType<typeof useProfile>["profile"];
  ctx: { netWorth: number; age: number; expectedReturn: number };
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
  picks: string[];
  all: CityScore[];
  onOpen: (r: CityScore) => void;
}) {
  const f = useMemo(() => suggestedFilters(profile), [profile]);
  const auto = useMemo(() => rankCities(f, ctx).slice(0, 3), [f, ctx]);
  const top = useMemo(() => {
    if (picks.length === 0) return auto;
    return picks.map((id) => all.find((r) => r.city.id === id)).filter((r): r is CityScore => Boolean(r));
  }, [picks, auto, all]);

  if (!profile.completed || top.length === 0) return null;
  const reasons = suggestionReasons(profile, f, t);

  return (
    <Panel
      title={picks.length > 0 ? t("Mis ciudades", "My cities") : t("Sugeridas para ti", "Suggested for you")}
      description={
        picks.length > 0
          ? t("Las ciudades que elegiste arriba, con tus números.", "The cities you picked above, with your numbers.")
          : t(
              "Según tu perfil: presupuesto, etapa de vida, estilo, seguridad y estabilidad.",
              "Based on your profile: budget, life stage, lifestyle, safety and stability.",
            )
      }
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <Chip key={r}>{r}</Chip>
        ))}
      </div>



      <div className="grid gap-3 sm:grid-cols-3">

        {top.map((r, i) => {
          const st = stabilityBadge(r.city.country, t);
          return (
            <button
              key={r.city.id}
              type="button"
              onClick={() => onOpen(r)}
              className="group relative overflow-hidden rounded-xl border border-border/70 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src={r.city.photo}
                  alt={`${r.city.name}, ${r.city.country}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  #{i + 1}
                </span>
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-sm font-semibold leading-tight">{r.city.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.city.country}</p>
                </div>
              </div>
              <div className="space-y-1.5 px-3 py-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Presupuesto mensual", "Monthly budget")}</span>
                  <span className="numeric text-foreground">{fmt(r.cost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Tu número allí", "Your number there")}</span>
                  <span className="numeric text-foreground">{fmt(r.cost * 12 * 25)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {r.yearsToRetire === 0
                      ? t("Ya puedes mudarte", "You can move now")
                      : r.yearsToRetire
                        ? t(`${r.yearsToRetire} años para llegar`, `${r.yearsToRetire} yrs to get there`)
                        : t("Sube tu ahorro", "Increase savings")}
                  </span>
                  <span className="text-muted-foreground">
                    {st.dot} {st.score}
                  </span>
                </div>
              </div>

            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/* ---------------- Card ---------------- */

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? "text-positive" : score >= 55 ? "text-chart-4" : "text-muted-foreground";
  const R = 20;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-background/70 backdrop-blur-md">
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={R} className="fill-none stroke-border/50" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={R}
          className={cn("fill-none stroke-current transition-all duration-700", tone)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * Math.min(100, score)) / 100}
        />
      </svg>
      <span className={cn("numeric text-base font-semibold leading-none", tone)}>{score}</span>
    </div>
  );
}

function taxBadge(level: "low" | "medium" | "high", t: (es: string, en: string) => string) {
  if (level === "low") return { dot: "🟢", text: t("Impuestos bajos", "Low taxes") };
  if (level === "medium") return { dot: "🟡", text: t("Impuestos medios", "Medium taxes") };
  return { dot: "🔴", text: t("Impuestos altos", "High taxes") };
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/60 bg-elevated/60 px-2 py-0.5 text-[10px] text-muted-foreground">
      {children}
    </span>
  );
}

function CityCard({
  r,
  rank,
  fmt,
  t,
  selected,
  nomadMode,
  onCompare,
  onOpen,
}: {
  r: CityScore;
  rank: number;
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
  selected: boolean;
  nomadMode?: boolean;
  onCompare: () => void;
  onOpen: () => void;
}) {
  const c = r.city;
  const visa = nomadVisa(c.country);
  const tax = taxBadge(r.taxLevel, t);
  const stability = stabilityBadge(c.country, t);
  const affordable = r.savings >= 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(rank * 0.03, 0.3) }}
      className={cn(
        "group surface relative flex flex-col overflow-hidden rounded-2xl border border-border/70 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl",
        selected && "ring-2 ring-primary",
      )}
    >
      <button type="button" onClick={onOpen} className="relative block aspect-[16/10] w-full overflow-hidden text-left">
        <img
          src={c.photo}
          alt={`${c.name}, ${c.country}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-background/10" />

        {rank === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-lg">
            ★ {t("Mejor match", "Best match")}
          </span>
        )}
        <div className="absolute right-3 top-3">
          <ScoreRing score={r.score} />
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <p className="flex items-center gap-1.5 text-lg font-semibold leading-tight">
            <MapPin className="h-4 w-4 text-primary" />
            {c.name}
          </p>
          <p className="text-xs text-muted-foreground">{c.country}</p>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60">
          <div className="bg-elevated/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("Costo mensual", "Monthly cost")}
            </p>
            <p className="numeric mt-0.5 text-sm font-semibold">{fmt(r.cost)}</p>
          </div>
          <div className="bg-elevated/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("Ahorro potencial", "Potential savings")}
            </p>
            <p className={cn("numeric mt-0.5 text-sm font-semibold", affordable ? "text-positive" : "text-negative")}>
              {fmt(r.savings)}
            </p>
          </div>
          <div className="bg-elevated/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {nomadMode ? t("Visa nómada", "Nomad visa") : t("Ingreso/hora prom.", "Avg. hourly income")}
            </p>
            {nomadMode ? (
              <p className="mt-0.5 text-sm font-medium">
                {visa.exists ? (
                  <>
                    <span className="text-positive">✓ {visa.months}m</span>
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      {visa.incomeUsd > 0 ? `${fmt(visa.incomeUsd)}/m` : t("sin mínimo", "no minimum")}
                    </span>
                  </>
                ) : (
                  <span className="text-negative">{t("No disponible", "Not available")}</span>
                )}
              </p>
            ) : (
              <p className="numeric mt-0.5 text-sm font-medium">
                ${hourlyRate(c)}/h
                <span className="ml-1 text-[10px] text-muted-foreground">({fmt(c.avgSalary)}/m)</span>
              </p>
            )}
          </div>
          <div className="bg-elevated/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("Retiro estimado", "Est. retirement")}
            </p>
            <p className="numeric mt-0.5 text-sm font-medium">
              {r.yearsToRetire === 0
                ? t("Ya libre", "Already free")
                : r.retireAge
                  ? `${r.retireAge} ${t("años", "yrs")}`
                  : "—"}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{t("Tasa de ahorro", "Savings rate")}</span>
            <span className="numeric">{Math.round(Math.max(0, r.savingsRate) * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
            <div
              className={cn("h-full rounded-full transition-all", affordable ? "bg-positive" : "bg-negative")}
              style={{ width: `${Math.min(100, Math.max(3, Math.max(0, r.savingsRate) * 100))}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip>
            {tax.dot} {tax.text}
          </Chip>
          <Chip>🛡 {c.safety}/100</Chip>
          <Chip>
            {stability.dot} {stability.text}
          </Chip>
          <Chip>🌤 {t(c.climateLabelEs, c.climateLabelEn)}</Chip>
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={onOpen}>
            {t("Ver detalles", "View details")}
          </Button>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={onCompare}
                aria-label={t("Comparar", "Compare")}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="px-2 py-1 text-[11px]">
              {selected
                ? t("Quitar de comparar", "Remove from compare")
                : t("compara 2 ciudades", "compare 2 cities")}
            </TooltipContent>
          </Tooltip>

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
  items,
  fmt,
  t,
  onClear,
}: {
  items: CityScore[];
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
  onClear: () => void;
}) {
  type Row = { label: string; values: string[]; best: number };
  const bestBy = (nums: number[], higher: boolean) =>
    nums.reduce((bi, v, i) => (higher ? (v > nums[bi]! ? i : bi) : v < nums[bi]! ? i : bi), 0);

  const num = (get: (x: CityScore) => number) => items.map(get);
  const rows: Row[] = [
    {
      label: t("Costo de vida", "Cost of living"),
      values: items.map((x) => fmt(x.cost)),
      best: bestBy(num((x) => x.cost), false),
    },
    {
      label: t("Salario neto est.", "Est. net salary"),
      values: items.map((x) => fmt(x.city.avgSalary)),
      best: bestBy(num((x) => x.city.avgSalary), true),
    },
    {
      label: t("Ahorro potencial", "Potential savings"),
      values: items.map((x) => fmt(x.savings)),
      best: bestBy(num((x) => x.savings), true),
    },
    {
      label: t("Impuestos", "Taxes"),
      values: items.map((x) => `${x.city.taxRate}%`),
      best: bestBy(num((x) => x.city.taxRate), false),
    },
    {
      label: t("Seguridad", "Safety"),
      values: items.map((x) => `${x.city.safety}/100`),
      best: bestBy(num((x) => x.city.safety), true),
    },
    {
      label: t("Clima", "Climate"),
      values: items.map((x) => t(x.city.climateLabelEs, x.city.climateLabelEn)),
      best: -1,
    },
    {
      label: t("Salud", "Healthcare"),
      values: items.map((x) => `${x.city.healthcareScore}/100`),
      best: bestBy(num((x) => x.city.healthcareScore), true),
    },
    {
      label: t("Calidad de vida", "Quality of life"),
      values: items.map((x) => `${x.city.qualityOfLife}/100`),
      best: bestBy(num((x) => x.city.qualityOfLife), true),
    },
    {
      label: t("Tiempo hasta retirarte", "Time to retire"),
      values: items.map((x) => (x.yearsToRetire !== null ? `${x.yearsToRetire} ${t("años", "yrs")}` : "—")),
      best: bestBy(num((x) => x.yearsToRetire ?? 999), false),
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
      <div
        className="grid gap-2 text-sm"
        style={{ gridTemplateColumns: `minmax(90px,1.2fr) repeat(${items.length}, minmax(0,1fr))` }}
      >
        <div />
        {items.map((x) => (
          <div key={x.city.id} className="text-center">
            <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60">
              <img src={x.city.photo} alt={x.city.name} className="absolute inset-0 h-full w-full object-cover object-center" />
            </div>

            <p className="mt-2 font-semibold">{x.city.name}</p>
            <p className="numeric text-xs text-muted-foreground">Score {x.score}</p>
          </div>
        ))}
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className="border-t border-border/60 py-2 text-xs text-muted-foreground">{row.label}</div>
            {row.values.map((v, i) => (
              <div
                key={`${row.label}-${i}`}
                className={cn(
                  "numeric border-t border-border/60 py-2 text-center",
                  row.best === i && "font-semibold text-positive",
                )}
              >
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}


/* ---------------- Detail ---------------- */


function LifestyleSimulator() {
  return (
    <PlanGate required="pro">
      <LifestyleSimulatorContent />
    </PlanGate>
  );
}
