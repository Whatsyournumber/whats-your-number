import { useMemo, useState } from "react";
import { Building2, GraduationCap, Landmark, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-language";
import {
  REGION_LABELS,
  UNIVERSITY_COUNTRIES,
  totalCost,
  type UniversityCountry,
} from "@/lib/university-costs";

type Props = {
  /** Projected amount available at 18, expressed in `currency` */
  amount: number;
  currency: "EUR" | "USD";
};

// Data is stored in USD; simple conversion for the EUR view.
const USD_TO_EUR = 0.92;

export function UniversityCostExplorer({ amount, currency }: Props) {
  const t = useT();
  const [type, setType] = useState<"public" | "private">("public");
  const [includeLiving, setIncludeLiving] = useState(true);
  const [region, setRegion] = useState<"all" | UniversityCountry["region"]>("all");
  const [query, setQuery] = useState("");

  const lang = t("es", "en") as "es" | "en";
  const symbol = currency === "EUR" ? "€" : "$";
  const rate = currency === "EUR" ? USD_TO_EUR : 1;
  const fmt = (v: number) =>
    `${symbol}${Math.round(v).toLocaleString(currency === "EUR" ? "es-ES" : "en-US")}`;

  const rows = useMemo(() => {
    return UNIVERSITY_COUNTRIES.filter((c) => (region === "all" ? true : c.region === region))
      .filter((c) =>
        query.trim()
          ? `${c.name.es} ${c.name.en}`.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      )
      .map((c) => {
        const cost = totalCost(c, type, includeLiving) * rate;
        const coverage = cost > 0 ? Math.min((amount / cost) * 100, 999) : 999;
        return { c, cost, coverage, gap: cost - amount };
      })
      .sort((a, b) => a.cost - b.cost);
  }, [region, query, type, includeLiving, rate, amount]);

  const covered = rows.filter((r) => r.gap <= 0).length;

  const regions: Array<"all" | UniversityCountry["region"]> = ["all", "eu", "latam", "na", "apac", "other"];

  return (
    <div className="text-left">
      <div className="surface flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-elevated p-0.5">
          {(["public", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                type === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "public" ? <Landmark className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
              {v === "public" ? t("Pública", "Public") : t("Privada", "Private")}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIncludeLiving((p) => !p)}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
            includeLiving
              ? "border-kid-mint/30 bg-kid-mint/10 text-kid-mint"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("+ Coste de vida", "+ Living costs")}
        </button>

        <div className="ml-auto flex min-w-[140px] flex-1 items-center gap-2 rounded-full border border-border bg-elevated px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Buscar país", "Search country")}
            className="h-8 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              region === r
                ? "bg-foreground text-background"
                : "bg-elevated text-muted-foreground hover:text-foreground"
            }`}
          >
            {r === "all" ? t("Todos", "All") : REGION_LABELS[r][lang]}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t(
          `Con ${fmt(amount)} cubres la carrera completa en ${covered} de ${rows.length} países mostrados`,
          `With ${fmt(amount)} you fully cover a degree in ${covered} of ${rows.length} countries shown`,
        )}
      </p>

      <ul className="mt-3 space-y-2">
        {rows.map(({ c, cost, coverage, gap }) => {
          const done = gap <= 0;
          return (
            <li key={c.code} className="surface px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg leading-none">{c.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name[lang]}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.years} {t("años", "years")} ·{" "}
                    {includeLiving ? t("matrícula + vida", "tuition + living") : t("solo matrícula", "tuition only")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="numeric text-sm font-semibold">{fmt(cost)}</p>
                  <p className={`text-[11px] font-medium ${done ? "text-kid-mint" : "text-muted-foreground"}`}>
                    {done
                      ? t(`Te sobran ${fmt(-gap)}`, `${fmt(-gap)} left over`)
                      : t(`Te faltan ${fmt(gap)}`, `${fmt(gap)} short`)}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className={`h-full rounded-full ${done ? "bg-kid-mint" : "bg-kid-sky"}`}
                    style={{ width: `${Math.min(coverage, 100)}%` }}
                  />
                </div>
                <span className="numeric w-10 text-right text-[11px] text-muted-foreground">
                  {Math.round(Math.min(coverage, 999))}%
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{c.note[lang]}</p>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="surface px-4 py-6 text-center text-xs text-muted-foreground">
            {t("Sin resultados", "No results")}
          </li>
        )}
      </ul>

      <p className="mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t(
          "Promedios orientativos por país (grado, tarifa local). Los costes reales varían por universidad, ciudad y becas.",
          "Indicative country averages (bachelor's, domestic rate). Real costs vary by university, city and scholarships.",
        )}
      </p>
    </div>
  );
}
