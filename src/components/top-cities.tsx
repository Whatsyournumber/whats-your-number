import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/hooks/use-language";
import type { Profile } from "@/hooks/use-profile";
import { suggestedFilters } from "@/lib/city-suggestions";
import { readMyCities, subscribeMyCities } from "@/lib/my-cities";
import { rankCities, type CityScore } from "@/lib/lifestyle-cities";


/** Top 3 ciudades calculadas con tu perfil: presupuesto mensual y camino a tu meta. */
export function TopCitiesPanel({
  profile,
  netWorth,
  monthlySavings,
  fmt,
}: {
  profile: Profile;
  netWorth: number;
  monthlySavings: number;
  fmt: (n: number) => string;
}) {
  const t = useT();
  const filters = useMemo(() => suggestedFilters(profile), [profile]);
  // Ciudades guardadas por ti en el simulador (si las hay, mandan).
  const [mine, setMine] = useState<string[]>([]);
  useEffect(() => {
    setMine(readMyCities());
    return subscribeMyCities(() => setMine(readMyCities()));
  }, []);
  const top = useMemo(() => {
    const ctx = {
      netWorth,
      age: profile.age ?? 30,
      expectedReturn: profile.expected_return || 7,
    };
    if (mine.length > 0) {
      const all = rankCities({ ...filters, region: "any", climate: "any", stability: "any" }, ctx);
      const picked = mine.map((id) => all.find((r) => r.city.id === id)).filter(Boolean) as ReturnType<
        typeof rankCities
      >;
      if (picked.length > 0) return picked;
    }
    // Ranking 100% según tu perfil: sin ciudades fijas.
    return rankCities(filters, ctx).slice(0, 3);
  }, [filters, mine, netWorth, profile.age, profile.expected_return]);
  // Ciudad abierta en el pop-up de detalle.
  const [detail, setDetail] = useState<CityScore | null>(null);

  if (top.length === 0) return null;

  return (
    <Panel
      title={
        mine.length > 0
          ? t("Mis ciudades guardadas", "My saved cities")
          : t("Top city acorde con tu presupuesto", "Top city matching your budget")
      }

      description={t(
        "Calculado con tus ingresos, gastos y patrimonio: cuánto necesitas al mes y cuánto tardas en llegar a tu número.",
        "Calculated from your income, expenses and net worth: monthly budget and time to reach your number.",
      )}
      actions={
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to="/ciudades">{t("Ver todas", "See all")}</Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {top.map((r, i) => {
          const target = r.cost * 12 * 25;
          const years = r.yearsToRetire;
          return (
            <button
              key={r.city.id}
              type="button"
              onClick={() => setDetail(r)}
              className="group overflow-hidden rounded-xl border border-border/70 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src={r.city.photo}
                  alt={`${r.city.name}, ${r.city.country}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  #{i + 1} · Your next city
                </span>
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-sm font-semibold leading-tight">{r.city.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.city.country}</p>
                </div>
              </div>
              <div className="space-y-2 p-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Presupuesto mensual", "Monthly budget")}</span>
                  <span className="numeric font-medium text-foreground">{fmt(r.cost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Tu número allí", "Your number there")}</span>
                  <span className="numeric font-medium text-foreground">{fmt(target)}</span>
                </div>
                <p className="text-muted-foreground">
                  {years === 0
                    ? t("Ya puedes vivir allí", "You can already live there")
                    : years
                      ? t(`${years} años ahorrando ${fmt(monthlySavings)}/mes`, `${years} yrs saving ${fmt(monthlySavings)}/mo`)
                      : t("Aumenta tu ahorro para llegar", "Increase savings to get there")}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <CityQuickDialog r={detail} fmt={fmt} monthlySavings={monthlySavings} onClose={() => setDetail(null)} />
    </Panel>
  );
}

/** Pop-up minimalista con la info clave de la ciudad. */
function CityQuickDialog({
  r,
  fmt,
  monthlySavings,
  onClose,
}: {
  r: CityScore | null;
  fmt: (n: number) => string;
  monthlySavings: number;
  onClose: () => void;
}) {
  const t = useT();
  if (!r) return null;
  const c = r.city;
  const costs = [
    { label: t("Vivienda", "Housing"), value: c.housing },
    { label: t("Alimentación", "Food"), value: c.food },
    { label: t("Transporte", "Transport"), value: c.transport },
    { label: t("Salud", "Healthcare"), value: c.healthcare },
    { label: t("Ocio", "Leisure"), value: c.entertainment },
    { label: t("Internet", "Internet"), value: c.internet },
  ].filter((x) => x.value > 0);
  const maxCost = Math.max(...costs.map((x) => x.value), 1);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto p-0">
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          <img src={c.photo} alt={`${c.name}, ${c.country}`} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-3 left-5 right-5">
            <DialogHeader className="space-y-0 text-left">
              <DialogTitle className="text-2xl">{c.name}</DialogTitle>
              <DialogDescription>{c.country}</DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 p-5 pt-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickStat label={t("Presupuesto/mes", "Budget/mo")} value={fmt(r.cost)} />
            <QuickStat label={t("Tu número allí", "Your number")} value={fmt(r.cost * 12 * 25)} />
            <QuickStat label={t("Score", "Score")} value={`${Math.round(r.north.total)}/100`} />
            <QuickStat
              label={t("Libertad", "Freedom")}
              value={
                r.yearsToRetire === 0
                  ? t("Ya", "Now")
                  : r.yearsToRetire
                    ? t(`${r.yearsToRetire} años`, `${r.yearsToRetire} yrs`)
                    : "—"
              }
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("Costos mensuales estimados", "Estimated monthly costs")}
            </p>
            <div className="space-y-2">
              {costs.map((x) => (
                <div key={x.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{x.label}</span>
                    <span className="numeric text-xs text-muted-foreground">{fmt(x.value)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(x.value / maxCost) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-4">
            <QuickStat label={t("Seguridad", "Safety")} value={`${c.safety}/100`} />
            <QuickStat label={t("Salud", "Healthcare")} value={`${c.healthcareScore}/100`} />
            <QuickStat label={t("Calidad de vida", "Quality of life")} value={`${c.qualityOfLife}/100`} />
            <QuickStat label={t("Clima", "Climate")} value={t(c.climateLabelEs, c.climateLabelEn)} />
          </div>

          <p className="text-xs text-muted-foreground">
            {t(
              `Ahorrando ${fmt(monthlySavings)}/mes con tu ritmo actual.`,
              `Saving ${fmt(monthlySavings)}/mo at your current pace.`,
            )}
          </p>

          <Button asChild size="sm" className="w-full rounded-full">
            <Link to="/ciudades">{t("Ver análisis completo", "See full analysis")}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-elevated/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="numeric mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
