import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { type City, cities } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";

export const Route = createFileRoute("/ciudades")({
  head: () => ({
    meta: [
      { title: "Ciudades para vivir — WhatsYournumber" },
      {
        name: "description",
        content:
          "Compara ciudades del mundo según tu presupuesto mensual y descubre dónde podrías vivir mejor con tu renta.",
      },
      { property: "og:title", content: "Ciudades para vivir — WhatsYournumber" },
      {
        property: "og:description",
        content: "Descubre en qué ciudades alcanza tu presupuesto mensual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ciudades,
});

function Ciudades() {
  const t = useT();
  const { profile } = useProfile();
  const d = buildDataset(profile);

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Estilo de vida", "Lifestyle")}
        title={t("Ciudades para vivir", "Cities to live in")}
        subtitle={t(
          "Ingresa tu presupuesto mensual y descubre dónde podrías vivir mejor.",
          "Enter your monthly budget and discover where you could live better.",
        )}
      />

      <Panel
        title={t("Simulador de ciudades", "City simulator")}
        description={t(
          "Ordenadas según cuánto margen te deja tu presupuesto.",
          "Ranked by how much room your budget leaves you.",
        )}
      >
        <CitySearch defaultBudget={d.expenses} fmt={d.fmt} t={t} />
      </Panel>
    </PageShell>
  );
}

function CitySearch({
  defaultBudget,
  fmt,
  t,
}: {
  defaultBudget: number;
  fmt: (v: number) => string;
  t: (es: string, en: string) => string;
}) {
  const [budget, setBudget] = useState(defaultBudget || 2000);
  const [query, setQuery] = useState(fmt(defaultBudget || 2000));

  useEffect(() => {
    setBudget(defaultBudget || 2000);
    setQuery(fmt(defaultBudget || 2000));
  }, [defaultBudget]);

  const presets = useMemo(() => {
    const b = defaultBudget || 2000;
    return [
      { label: t("Tus gastos", "Your expenses"), value: b },
      { label: "1.5x", value: Math.round(b * 1.5) },
      { label: "2x", value: Math.round(b * 2) },
      { label: "3x", value: Math.round(b * 3) },
    ];
  }, [defaultBudget, t]);

  const ranked = useMemo(() => {
    if (!budget || budget <= 0) return [];
    const comfort = budget * 0.75;
    return [...cities].sort((a: City, b: City) => {
      const aFit = a.cost <= budget;
      const bFit = b.cost <= budget;
      if (aFit && !bFit) return -1;
      if (!aFit && bFit) return 1;
      if (aFit && bFit) return Math.abs(a.cost - comfort) - Math.abs(b.cost - comfort);
      return a.cost - b.cost;
    });
  }, [budget]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setQuery(raw);
    const n = Number(raw);
    if (!Number.isNaN(n)) setBudget(n);
  };

  const badge = (cost: number) => {
    if (cost <= budget * 0.75) return { text: t("Cómodo", "Comfortable"), tone: "bg-positive/15 text-positive" };
    if (cost <= budget) return { text: t("Ajustado", "Tight"), tone: "bg-chart-4/15 text-chart-4" };
    return { text: t("Excede", "Exceeds"), tone: "bg-destructive/15 text-destructive" };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="city-budget" className="text-xs font-medium text-muted-foreground">
            {t("Presupuesto mensual", "Monthly budget")}
          </label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="city-budget"
              type="text"
              inputMode="numeric"
              value={query}
              onChange={handleChange}
              onBlur={() => setQuery(fmt(budget))}
              placeholder={t("Ej: 3.000", "E.g: 3,000")}
              className="pl-9 text-base"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setBudget(p.value);
                setQuery(fmt(p.value));
              }}
              className="rounded-full border border-border bg-elevated/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-elevated"
            >
              {p.label}: {fmt(p.value)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ranked.slice(0, 24).map((c: City) => {
          const { text, tone } = badge(c.cost);
          const ratio = Math.min(100, Math.round((c.cost / budget) * 100));
          return (
            <div key={c.name} className="surface flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.country}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
                  {text}
                </span>
              </div>
              <div className="mt-3">
                <p className="numeric text-lg font-semibold">{fmt(c.cost)}</p>
                <p className="text-xs text-muted-foreground">
                  {ratio}% {t("de tu presupuesto", "of your budget")}
                </p>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${ratio}%`, backgroundColor: "var(--color-chart-4)" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {ranked.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("Escribe un presupuesto mensual para ver sugerencias de ciudades.", "Enter a monthly budget to see city suggestions.")}
        </p>
      )}
    </div>
  );
}
