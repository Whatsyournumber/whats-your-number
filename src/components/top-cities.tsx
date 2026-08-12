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
            <div key={r.city.id} className="overflow-hidden rounded-xl border border-border/70">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src={r.city.photo}
                  alt={`${r.city.name}, ${r.city.country}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
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
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
