import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/page";
import { CityDetailDialog } from "@/components/city-detail-dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import type { Profile } from "@/hooks/use-profile";
import { suggestedFilters } from "@/lib/city-suggestions";
import { readMyCities, subscribeMyCities } from "@/lib/my-cities";
import { rankCities, type CityScore } from "@/lib/lifestyle-cities";
import { fromUsd } from "@/lib/fx";

/** Top 3 ciudades calculadas con tu perfil: presupuesto mensual y camino a tu meta. */
export function TopCitiesPanel({
  profile,
  netWorth,
  monthlySavings,
  fmt,
  currency,
}: {
  profile: Profile;
  netWorth: number;
  monthlySavings: number;
  fmt: (n: number) => string;
  currency: string;
}) {
  const t = useT();
  // El dataset de ciudades está en USD: se convierte a la moneda del perfil antes de mostrarlo.
  const fmtCity = (n: number) => fmt(fromUsd(n, currency));
  const filters = useMemo(() => suggestedFilters(profile), [profile]);
  // Ciudades guardadas por ti en el simulador (si las hay, mandan).
  const [mine, setMine] = useState<string[]>([]);
  useEffect(() => {
    setMine(readMyCities());
    return subscribeMyCities(() => setMine(readMyCities()));
  }, []);
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const top = useMemo(() => {
    const ctx = {
      netWorth,
      age: profile.age ?? 30,
      expectedReturn: profile.expected_return || 7,
    };
    const all = rankCities({ ...filters, region: "any", climate: "any", stability: "any" }, ctx);
    // 1) La ciudad donde vives hoy (si está en el catálogo) siempre va primero.
    const home = profile.city
      ? all.find((r) => norm(r.city.name) === norm(profile.city as string)) ??
        all.find((r) => norm(profile.city as string).includes(norm(r.city.name)))
      : undefined;

    // 2) Ciudades parecidas: mismo continente, países distintos, presupuesto
    // similar o menor y que te acerquen antes a tu número.
    const rest = all.filter((r) => r.city.id !== home?.city.id);
    if (home) {
      const homeYears = home.yearsToRetire ?? Number.POSITIVE_INFINITY;
      // Solo ciudades del mismo continente y de otro país.
      const sameContinent = rest.filter(
        (r) => r.city.region === home.city.region && r.city.country !== home.city.country,
      );
      const faster = sameContinent.filter((r) => {
        const y = r.yearsToRetire ?? Number.POSITIVE_INFINITY;
        return r.cost <= home.cost * 1.1 && y <= homeYears;
      });
      const pool = faster.length > 0 ? faster : sameContinent.filter((r) => r.cost <= home.cost * 1.25);
      const sorted = (pool.length > 0 ? pool : sameContinent.length > 0 ? sameContinent : rest)
        .slice()
        .sort((a, b) => {
          const ya = a.yearsToRetire ?? Number.POSITIVE_INFINITY;
          const yb = b.yearsToRetire ?? Number.POSITIVE_INFINITY;
          if (ya !== yb) return ya - yb;
          return Math.abs(a.cost - home.cost) - Math.abs(b.cost - home.cost);
        });
      // Como mucho una ciudad por país para que las tarjetas sean variadas.
      const similar: CityScore[] = [];
      const seenCountries = new Set<string>([home.city.country]);
      for (const r of sorted) {
        if (seenCountries.has(r.city.country)) continue;
        seenCountries.add(r.city.country);
        similar.push(r);
        if (similar.length === 2) break;
      }
      return [home, ...similar];
    }

    // Sin ciudad de residencia conocida: usa las guardadas o el ranking del perfil.
    if (mine.length > 0) {
      const picked = mine.map((id) => all.find((r) => r.city.id === id)).filter(Boolean) as CityScore[];
      if (picked.length > 0) return picked.slice(0, 3);
    }
    return rankCities(filters, ctx).slice(0, 3);
  }, [filters, mine, netWorth, profile.age, profile.city, profile.expected_return]);

  // Ciudad abierta en el pop-up de detalle.
  const [detail, setDetail] = useState<CityScore | null>(null);

  if (top.length === 0) return null;

  // La primera tarjeta es tu ciudad actual cuando coincide con el catálogo.
  const homeCard =
    profile.city && top[0] && norm(top[0].city.name) === norm(profile.city) ? top[0] : null;
  const homeYears = homeCard?.yearsToRetire ?? null;

  return (
    <Panel
      title={
        homeCard
          ? t("Tu ciudad y otras parecidas", "Your city and similar ones")
          : mine.length > 0
            ? t("Mis ciudades guardadas", "My saved cities")
            : t("Top city acorde con tu presupuesto", "Top city matching your budget")
      }

      description={
        homeCard
          ? t(
              "Donde vives hoy y ciudades similares con tu presupuesto que te acercan antes a tu número.",
              "Where you live today plus similar cities within your budget that get you to your number sooner.",
            )
          : t(
              "Calculado con tus ingresos, gastos y patrimonio: cuánto necesitas al mes y cuánto tardas en llegar a tu número.",
              "Calculated from your income, expenses and net worth: monthly budget and time to reach your number.",
            )
      }
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
          const isHome = homeCard?.city.id === r.city.id;
          const sooner =
            !isHome && homeYears != null && years != null && homeYears - years > 0
              ? Math.round(homeYears - years)
              : 0;
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
                  {isHome
                    ? t("Donde vives hoy", "Where you live today")
                    : sooner > 0
                      ? t(`${sooner} años antes`, `${sooner} yrs sooner`)
                      : homeCard
                        ? t("Similar a tu ciudad", "Similar to your city")
                        : `#${i + 1} · Your next city`}
                </span>

                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-sm font-semibold leading-tight">{r.city.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.city.country}</p>
                </div>
              </div>
              <div className="space-y-2 p-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Presupuesto mensual", "Monthly budget")}</span>
                  <span className="numeric font-medium text-foreground">{fmtCity(r.cost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Tu número allí", "Your number there")}</span>
                  <span className="numeric font-medium text-foreground">{fmtCity(target)}</span>
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

      <CityDetailDialog r={detail} filters={filters} fmt={fmtCity} onClose={() => setDetail(null)} />
    </Panel>
  );
}
