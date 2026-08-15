import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Check, Heart, Info, Pencil, Search, TrendingUp, X } from "lucide-react";

import { KidPage } from "@/components/kid-page";
import heroGirl from "@/assets/uni-hero-girl.jpg";
import heroBoy from "@/assets/uni-hero-boy.jpg";
import { useFund, useMovements } from "@/hooks/use-mfn";
import { useProfile } from "@/hooks/use-profile";

import { money, pocketTotals, type Member } from "@/lib/mfn";
import { useI18n } from "@/lib/mfn-i18n";
import { useFx } from "@/lib/mfn-fx";
import {
  FIELD_LABELS,
  UNIVERSITIES,
  projectCapital,
  uniFields,
  uniTotalUsd,
  type UniField,
  type University,
} from "@/lib/universities";
import { uniPhoto, uniPhotoFallback } from "@/lib/uni-photos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export const Route = createFileRoute("/ninos/kid/universidades")({
  head: () => ({
    meta: [
      { title: "Buscador de universidades | My First Number" },
      {
        name: "description",
        content:
          "Descubre en qué universidades del mundo puede estudiar tu hijo con el capital que tendrá a los 18 años.",
      },
      { property: "og:title", content: "Buscador de universidades | My First Number" },
      {
        property: "og:description",
        content: "Busca universidades según el dinero acumulado y deja que la IA te recomiende las mejores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <KidPage>{(member) => <CollegeFinder member={member} />}</KidPage>,
});

const FIELDS = Object.keys(FIELD_LABELS) as UniField[];

const HOME_REGION: Record<string, University["region"]> = {
  ES: "eu", FR: "eu", IT: "eu", PT: "eu", DE: "eu", GB: "eu", CH: "eu", NL: "eu",
  US: "na", CA: "na", MX: "latam", AR: "latam", CL: "latam", CO: "latam", PE: "latam",
  UY: "latam", PY: "latam", BO: "latam", EC: "latam", VE: "latam", BR: "latam",
  CR: "latam", PA: "latam", GT: "latam", HN: "latam", NI: "latam", SV: "latam", DO: "latam",
};

type Bucket = "home" | "eu" | "na" | "rest";

type Continent = "latam" | "nam" | "eu" | "asia" | "oceania" | "africa";

const OCEANIA = new Set([
  "Australia", "New Zealand", "Nueva Zelanda", "Fiji", "Fiyi",
  "Papua New Guinea", "Papúa Nueva Guinea", "Samoa",
]);
const AFRICA_ME = new Set([
  "Sudáfrica", "South Africa", "Israel", "Emiratos Árabes", "United Arab Emirates",
]);

function continentOf(u: University): Continent {
  if (u.region === "latam") return "latam";
  if (u.region === "na") return "nam";
  if (u.region === "eu") return "eu";
  if (OCEANIA.has(u.country) || OCEANIA.has(u.countryEs)) return "oceania";
  if (AFRICA_ME.has(u.country) || AFRICA_ME.has(u.countryEs)) return "africa";
  if (u.region === "apac") return "asia";
  return "africa";
}


function CollegeFinder({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { data: fund } = useFund(member.id);
  const { data: movements = [] } = useMovements(member.id);
  const { profile } = useProfile();

  const currency = member.currency || "EUR";
  const fx = useFx(member.base_currency, currency);
  const usdFx = useFx("USD", currency);

  const homeCountry = profile?.country ?? "";
  const homeCode = (profile?.country_code ?? "").toUpperCase();
  const homeRegion = HOME_REGION[homeCode] ?? null;

  const totals = pocketTotals(movements);
  const fundInitial = Math.round(Math.max(totals.crecer, Number(fund?.current_balance ?? 0)) * fx.factor);
  const fundMonthly = Math.round(Number(fund?.monthly_contribution ?? 0) * fx.factor);
  const targetAge = Number(fund?.target_age ?? 18);
  const rate = Number(fund?.expected_return ?? 10);
  const yearsLeft = Math.max(0, targetAge - member.age);
  const monthsLeft = Math.max(1, yearsLeft * 12);

  const [editOpen, setEditOpen] = useState(false);
  const [initialInput, setInitialInput] = useState<number | null>(null);
  const [monthlyInput, setMonthlyInput] = useState<number | null>(null);
  const initial = initialInput ?? fundInitial;
  const monthly = monthlyInput ?? fundMonthly;

  const projected = Math.max(
    5000,
    Math.round(projectCapital(initial, monthly, yearsLeft, rate) / 1000) * 1000,
  );

  const [includeLiving, setIncludeLiving] = useState(true);
  const [simMonthly, setSimMonthly] = useState<number>(Math.max(50, monthly || 50));
  const simProjected = Math.round(projectCapital(initial, simMonthly, yearsLeft, rate) / 1000) * 1000;

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [continent, setContinent] = useState<Continent | null>(null);

  const [tab, setTab] = useState<"afford" | "close" | "all">("afford");
  const [country, setCountry] = useState<string>("");
  const [field, setField] = useState<UniField | "">("");
  const [rankMax, setRankMax] = useState<string>("");
  const [sort, setSort] = useState<"cost" | "rank">("cost");
  const [saved, setSaved] = useState<string[]>([]);
  const [detail, setDetail] = useState<University | null>(null);

  const cost = (u: University) => uniTotalUsd(u, includeLiving) * usdFx.factor;
  const isHome = (u: University) => !!homeCountry && (u.countryEs === homeCountry || u.country === homeCountry);

  const bucketOf = (u: University): Bucket => {
    if (isHome(u)) return "home";
    if (u.region === "eu") return "eu";
    if (u.region === "na") return "na";
    return "rest";
  };

  const priced = useMemo(
    () => UNIVERSITIES.map((u) => ({ u, total: cost(u) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [includeLiving, usdFx.factor],
  );

  const counts = useMemo(() => {
    const afford = priced.filter((r) => r.total <= projected).length;
    const close = priced.filter((r) => r.total > projected && r.total <= projected * 1.35).length;
    return { afford, close, all: priced.length };
  }, [priced, projected]);

  const simCounts = useMemo(() => {
    const afford = priced.filter((r) => r.total <= simProjected).length;
    const top100 = priced.filter((r) => r.total <= simProjected && r.u.rank <= 100).length;
    const top100Now = priced.filter((r) => r.total <= projected && r.u.rank <= 100).length;
    return { afford, top100, top100Now };
  }, [priced, simProjected, projected]);

  const buckets = useMemo(() => {
    const defs: { key: Continent; label: string; flag: string }[] = [
      { key: "latam", label: t("Latinoamérica", "Latin America"), flag: "🌎" },
      { key: "nam", label: t("EE.UU. / Canadá", "US / Canada"), flag: "🇺🇸" },
      { key: "eu", label: t("Europa", "Europe"), flag: "🇪🇺" },
      { key: "asia", label: t("Asia", "Asia"), flag: "🌏" },
      { key: "oceania", label: t("Oceanía", "Oceania"), flag: "🇦🇺" },
      { key: "africa", label: t("África / M. Oriente", "Africa / Mid. East"), flag: "🌍" },
    ];
    return defs.map((d) => {
      const items = priced.filter((r) => continentOf(r.u) === d.key);
      const ok = items.filter((r) => r.total <= projected);
      const minGap = items.length ? Math.min(...items.map((r) => Math.max(0, r.total - projected))) : 0;
      return { ...d, count: ok.length, minGap };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priced, projected, lang]);

  const countries = useMemo(
    () =>
      Array.from(new Set(UNIVERSITIES.map((u) => (lang === "en" ? u.country : u.countryEs)))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [lang],
  );

  const list = useMemo(() => {
    return priced
      .filter(({ u, total }) => {
        if (bucket && bucketOf(u) !== bucket) return false;
        if (continent && continentOf(u) !== continent) return false;

        if (country && (lang === "en" ? u.country : u.countryEs) !== country) return false;
        if (field && !uniFields(u).includes(field)) return false;
        if (rankMax && u.rank > Number(rankMax)) return false;
        if (tab === "afford" && total > projected) return false;
        if (tab === "close" && !(total > projected && total <= projected * 1.35)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "rank") return a.u.rank - b.u.rank;
        const aHome = isHome(a.u) ? 0 : homeRegion && a.u.region === homeRegion ? 1 : 2;
        const bHome = isHome(b.u) ? 0 : homeRegion && b.u.region === homeRegion ? 1 : 2;
        if (aHome !== bHome) return aHome - bHome;
        return a.total - b.total;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priced, bucket, continent, country, field, rankMax, tab, sort, projected, homeCountry, homeRegion, lang]);



  const heroImg = member.theme === "girl" ? heroGirl : heroBoy;

  const toggleSaved = (id: string) =>
    setSaved((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <>
      {/* Hero a sangre */}
      <section className="relative mb-6 -mt-6 min-h-[460px] overflow-hidden sm:min-h-[580px]">
        <img
          src={heroImg}
          alt={t("Familia mirando universidades", "Family looking at universities")}
          width={1280}
          height={960}
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-right"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 14%, rgba(0,0,0,0.55) 34%, rgba(0,0,0,0.88) 52%, #000 66%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 80%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 14%, rgba(0,0,0,0.55) 34%, rgba(0,0,0,0.88) 52%, #000 66%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 80%, transparent 100%)",
            WebkitMaskComposite: "source-in",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent sm:via-background/25" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

        <div className="relative flex min-h-[460px] max-w-lg flex-col justify-center py-10 pr-6 sm:min-h-[580px] sm:py-16">
          <h1 className="font-display text-4xl font-black leading-[1.05] text-foreground drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] sm:text-6xl">
            {t("¿Dónde podrá", "Where can they")}
            <br />
            {t("estudiar", "study")}{" "}
            <span className="text-primary">{t(`a los ${targetAge}?`, `at ${targetAge}?`)}</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm text-foreground/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
            {t(
              "Descubre qué universidades podrá alcanzar con el capital que estás construyendo hoy.",
              "Discover which universities they can reach with the capital you're building today.",
            )}
          </p>

          <div className="mt-6 w-full max-w-sm rounded-[28px] border border-border/60 bg-background/85 p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <p className="text-xs font-semibold text-muted-foreground">
              {t(`A los ${targetAge} años tendrá`, `At age ${targetAge} they'll have`)}
            </p>
            <p className="font-display text-4xl font-black text-primary sm:text-5xl">
              {money(projected, currency, true)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("Con tu plan actual", "With your current plan")}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border/60 py-3">
              {[
                { v: money(initial, currency, true), l: t("Inicial", "Initial") },
                { v: `${money(monthly, currency, true)}/${t("mes", "mo")}`, l: t("Aporte mensual", "Monthly") },
                { v: `${rate}%`, l: t("Rentabilidad estimada", "Estimated return") },
              ].map((s) => (
                <div key={s.l} className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-foreground">{s.v}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-full rounded-full bg-primary" />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>
                {t("Hoy", "Today")}
                <br />
                <span className="font-semibold text-foreground">{money(initial, currency, true)}</span>
              </span>
              <span className="text-right">
                {targetAge} {t("años", "yrs")}
                <br />
                <span className="font-semibold text-foreground">{money(projected, currency, true)}</span>
              </span>
            </div>

            <Button
              variant="outline"
              className="mt-4 h-10 w-full rounded-full border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setEditOpen((p) => !p)}
            >
              {t("Editar mi plan", "Edit my plan")} <Pencil className="ml-2 h-3.5 w-3.5" />
            </Button>

            {editOpen ? (
              <div className="mt-3 space-y-2">
                <label className="block rounded-2xl bg-secondary/50 px-3 py-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("Monto inicial", "Initial amount")}
                  </span>
                  <Input
                    className="h-7 border-0 bg-transparent px-0 font-display text-base font-bold shadow-none focus-visible:ring-0"
                    inputMode="numeric"
                    value={initial}
                    onChange={(e) => setInitialInput(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
                  />
                </label>
                <label className="block rounded-2xl bg-secondary/50 px-3 py-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("Aporte mensual", "Monthly contribution")}
                  </span>
                  <Input
                    className="h-7 border-0 bg-transparent px-0 font-display text-base font-bold shadow-none focus-visible:ring-0"
                    inputMode="numeric"
                    value={monthly}
                    onChange={(e) => setMonthlyInput(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
                  />
                </label>
                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("Incluir coste de vida", "Include living costs")}
                  </span>
                  <Switch checked={includeLiving} onCheckedChange={setIncludeLiving} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Con X podrá estudiar en */}
      <section className="mb-5 rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-baseline gap-1.5 font-display text-lg font-bold text-foreground">
            {t(
              `Con ${money(projected, currency, true)} podrá estudiar en`,
              `With ${money(projected, currency, true)} they can study in`,
            )}
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t(
                `(${counts.afford}/${counts.all})`,
                `(${counts.afford}/${counts.all})`,
              )}
            </span>
          </p>


          <button
            type="button"
            onClick={() => setBucket(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            {t("Ver todas las regiones", "See all regions")} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {buckets.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => {
                setBucket(null);
                setCountry("");
                setContinent(continent === b.key ? null : b.key);
                requestAnimationFrame(() =>
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                );
              }}
              className={cn(
                "rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                continent === b.key ? "border-primary bg-primary/[0.07]" : "border-border/70 bg-background/50",
              )}
            >
              <p className="flex items-center gap-1.5 text-[12px] font-semibold leading-tight text-foreground">
                <span className="text-base leading-none">{b.flag}</span>
                {b.label}
              </p>
              <p className="mt-1 font-display text-2xl font-black leading-none text-primary">{b.count}</p>
              <p className="text-[10px] text-muted-foreground">{t("universidades", "universities")}</p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                {t("Desde", "From")} {money(b.minGap, currency, true)} {t("de deuda", "of debt")}
              </p>

            </button>
          ))}
        </div>
      </section>

      {/* ¿Qué pasa si aportas más cada mes? */}
      <section className="mb-5 rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {t("¿Qué pasa si aportas más cada mes?", "What if you contribute more each month?")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Simula y ve cómo crecen sus oportunidades.", "Simulate and watch their options grow.")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground">
            <BarChart3 className="h-3.5 w-3.5 text-primary" /> {t("Ver escenarios", "See scenarios")}
          </span>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {money(50, currency, true)} / {t("mes", "mo")}
              </span>
              <span>
                {money(1000, currency, true)} / {t("mes", "mo")}
              </span>
            </div>
            <Slider
              className="mt-3"
              value={[Math.min(1000, Math.max(50, simMonthly))]}
              min={50}
              max={1000}
              step={10}
              onValueChange={(v) => setSimMonthly(v[0] ?? 50)}
            />
            <p className="mt-2 text-xs font-semibold text-foreground">
              {money(simMonthly, currency, true)} / {t("mes", "mo")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-primary/[0.06] p-4">
            {[
              {
                l: t(`A los ${targetAge} años tendría`, `At ${targetAge} they'd have`),
                v: money(simProjected, currency, true),
                d: simProjected - projected,
                money: true,
              },
              {
                l: t("Opciones que puedes pagar", "Options you can afford"),
                v: String(simCounts.afford),
                d: simCounts.afford - counts.afford,
              },
              {
                l: t("Top 100 a tu alcance", "Top 100 within reach"),
                v: String(simCounts.top100),
                d: simCounts.top100 - simCounts.top100Now,
              },
            ].map((s) => (
              <div key={s.l} className="min-w-0">
                <p className="text-[10px] leading-tight text-muted-foreground">{s.l}</p>
                <p className="mt-1 font-display text-xl font-black text-primary">{s.v}</p>
                {s.d !== 0 ? (
                  <p className="text-[10px] font-semibold text-primary/80">
                    ({s.d > 0 ? "+" : ""}
                    {s.money ? money(s.d, currency, true) : s.d})
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtros */}
      <div className="mb-4 rounded-[28px] border border-border/70 bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["afford", t(`Puede pagar (${counts.afford})`, `Affordable (${counts.afford})`)],
              ["close", t(`Casi llega (${counts.close})`, `Almost there (${counts.close})`)],
              ["all", t(`Todas (${counts.all})`, `All (${counts.all})`)],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition",
                tab === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-background/50 p-0.5">
              {(
                [
                  [false, t("Solo matrícula", "Tuition only")],
                  [true, t("Matrícula + vida", "Tuition + living")],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIncludeLiving(v)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-bold transition",
                    includeLiving === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <SourcesTip />

            <CountryCombobox
              value={country}
              onChange={setCountry}
              options={countries}
              placeholder={t("Buscar país", "Search country")}
            />

            <Select
              value={field}
              onChange={(v) => setField(v as UniField | "")}
              placeholder={t("Carrera", "Field")}
            >
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABELS[f][lang === "en" ? "en" : "es"]}
                </option>
              ))}
            </Select>
            <Select value={rankMax} onChange={setRankMax} placeholder={t("Ranking", "Ranking")}>
              <option value="100">Top 100</option>
              <option value="300">Top 300</option>
              <option value="500">Top 500</option>
            </Select>
            <Select
              value={sort}
              onChange={(v) => setSort(v as "cost" | "rank")}
              placeholder={t("Coste total", "Total cost")}
              clearable={false}
            >
              <option value="cost">{t("Coste total", "Total cost")}</option>
              <option value="rank">{t("Mejor ranking", "Best ranking")}</option>
            </Select>
          </div>
        </div>

        {(continent || country || field || rankMax || bucket) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {t(`${list.length} resultados`, `${list.length} results`)}
            </span>
            <button
              type="button"
              onClick={() => {
                setContinent(null);
                setBucket(null);
                setCountry("");
                setField("");
                setRankMax("");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-3 w-3" /> {t("Limpiar filtros", "Clear filters")}
            </button>
          </div>
        ) : null}
      </div>


      {/* Resultados */}
      <div ref={resultsRef} className="scroll-mt-24 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(({ u, total }) => {
          const ok = total <= projected;
          const gap = total - projected;
          const coverage = Math.max(0, Math.min(100, Math.round((projected / Math.max(1, total)) * 100)));
          return (
            <article
              key={u.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(u)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setDetail(u);
              }}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-border/70 bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden bg-secondary">
                <img
                  src={uniPhoto(u)}
                  alt={`${u.name} — ${u.city}`}
                  loading="lazy"
                  width={1024}
                  height={576}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const fb = uniPhotoFallback(u);
                    if (img.src !== fb) img.src = fb;
                  }}
                  className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.06] contrast-[1.05] saturate-[1.1] transition duration-700 group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
                <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-xl bg-background/80 text-lg backdrop-blur">
                  {u.flag}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaved(u.id);
                  }}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur"
                  aria-label={t("Guardar", "Save")}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      saved.includes(u.id) ? "fill-primary text-primary" : "text-muted-foreground",
                    )}
                  />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground backdrop-blur">
                  #{u.rank}
                </span>
              </div>

              <div className="p-4">
                <p className="truncate font-display text-base font-bold text-foreground">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.city}, {lang === "en" ? u.country : u.countryEs}
                </p>

                <p className="mt-3 flex items-center gap-1.5 text-sm">
                  <span
                    className={cn(
                      "font-display text-xl font-black",
                      ok ? "text-primary" : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {coverage}%
                  </span>
                  <span className="text-xs text-muted-foreground">{t("cubierto", "covered")}</span>
                  {ok ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                </p>
                {!ok ? (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${coverage}%` }} />
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/50 px-3 py-2 text-center">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-bold text-foreground">
                      {money(u.tuition * usdFx.factor, currency, true)}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground">{t("Matrícula/año", "Tuition/yr")}</p>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate font-display text-xs font-bold",
                        includeLiving ? "text-foreground" : "text-muted-foreground line-through",
                      )}
                    >
                      {money(u.living * usdFx.factor, currency, true)}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground">{t("Vida/año", "Living/yr")}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-bold text-foreground">{u.years}</p>
                    <p className="truncate text-[9px] text-muted-foreground">{t("Años", "Years")}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {includeLiving ? t("Coste total carrera", "Total degree cost") : t("Matrícula total", "Total tuition")}
                    </p>
                    <p className="font-display text-lg font-bold text-foreground">{money(total, currency, true)}</p>
                  </div>
                  <p className="text-right text-[11px] leading-tight">
                    <span className="block text-muted-foreground">
                      {ok ? t("Te quedarían", "You'd have left") : t("Te faltarían", "You'd be short")}
                    </span>
                    <span className={cn("font-bold", ok ? "text-primary" : "text-amber-600 dark:text-amber-400")}>
                      {money(ok ? projected - total : gap, currency, true)}
                    </span>
                  </p>
                </div>

                {ok ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {uniFields(u).slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        {FIELD_LABELS[f][lang === "en" ? "en" : "es"]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <TrendingUp className="h-3.5 w-3.5" />+{money(gap / monthsLeft, currency, true)}
                    {t(" / mes desde hoy podría cerrar la brecha", " / mo from today could close the gap")}
                  </p>
                )}

                <p className="mt-3 flex items-center justify-between text-xs font-semibold text-primary">
                  {ok ? t("Ver detalles", "See details") : t("Ver cómo conseguirlo", "See how to get there")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </article>
          );
        })}

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("No hay universidades con esos filtros.", "No universities match those filters.")}
          </p>
        ) : null}
      </div>

      <UniDetailDialog
        uni={detail}
        onClose={() => setDetail(null)}
        currency={currency}
        usdFactor={usdFx.factor}
        projected={projected}
        monthsLeft={monthsLeft}
        includeLiving={includeLiving}
      />



      {/* CTA final */}
      <section className="mt-6 flex flex-wrap items-center gap-4 rounded-[28px] border border-primary/20 bg-primary/[0.07] p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-background/80">
          <Heart className="h-5 w-5 fill-primary text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-foreground">
            {t("Hoy construyes su futuro. Mañana elige su camino.", "Today you build their future. Tomorrow they choose their path.")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("Cada aportación de hoy abre más puertas mañana.", "Every contribution today opens more doors tomorrow.")}
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setEditOpen(true)}>
          {t("Comenzar ahora", "Start now")} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>
    </>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
  clearable = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  clearable?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-full border border-border/70 bg-card px-3 text-xs font-semibold text-foreground outline-none transition focus:border-primary",
        !value && "text-muted-foreground",
      )}
    >
      {clearable ? <option value="">{placeholder}</option> : null}
      {children}
    </select>
  );
}

function CountryCombobox({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = options
    .filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 40);

  return (
    <div
      className="relative"
      onBlur={() => {
        blurTimer.current = setTimeout(() => setOpen(false), 120);
      }}
      onFocus={() => {
        if (blurTimer.current) clearTimeout(blurTimer.current);
      }}
    >
      <div
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border bg-card px-3 transition",
          open ? "border-primary" : "border-border/70",
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={open ? q : value || q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-28 bg-transparent text-xs font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground sm:w-36"
        />
        {value || q ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQ("");
              onChange("");
              setOpen(false);
            }}
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <ul className="absolute right-0 z-30 mt-2 max-h-64 w-56 overflow-auto rounded-2xl border border-border/70 bg-card p-1 shadow-2xl">
          {filtered.map((c) => (
            <li key={c}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c);
                  setQ(c);
                  setOpen(false);
                }}
                className={cn(
                  "w-full truncate rounded-xl px-3 py-2 text-left text-xs font-semibold transition hover:bg-secondary",
                  value === c ? "bg-primary/10 text-primary" : "text-foreground",
                )}
              >
                {c}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">—</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
