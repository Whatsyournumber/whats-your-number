import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Check, TrendingUp } from "lucide-react";

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
  UNI_REGION_LABELS,
  projectCapital,
  uniTotalUsd,
  type UniField,
  type University,
} from "@/lib/universities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

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

const REGIONS = ["eu", "na", "latam", "apac", "other"] as const;
const FIELDS = Object.keys(FIELD_LABELS) as UniField[];

const HOME_REGION: Record<string, University["region"]> = {
  ES: "eu", FR: "eu", IT: "eu", PT: "eu", DE: "eu", GB: "eu", CH: "eu", NL: "eu",
  US: "na", CA: "na", MX: "latam", AR: "latam", CL: "latam", CO: "latam", PE: "latam",
  UY: "latam", PY: "latam", BO: "latam", EC: "latam", VE: "latam", BR: "latam",
  CR: "latam", PA: "latam", GT: "latam", HN: "latam", NI: "latam", SV: "latam", DO: "latam",
};

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
  const rate = Number(fund?.expected_return ?? 7);
  const yearsLeft = Math.max(0, targetAge - member.age);

  const [initialInput, setInitialInput] = useState<number | null>(null);
  const [monthlyInput, setMonthlyInput] = useState<number | null>(null);
  const initial = initialInput ?? fundInitial;
  const monthly = monthlyInput ?? fundMonthly;

  const projected = Math.max(
    5000,
    Math.round(projectCapital(initial, monthly, yearsLeft, rate) / 1000) * 1000,
  );

  const [budget, setBudget] = useState<number>(projected);
  const [touched, setTouched] = useState(false);
  const effectiveBudget = touched ? budget : projected;

  const [includeLiving, setIncludeLiving] = useState(true);
  const [nearHome, setNearHome] = useState(true);
  const [region, setRegion] = useState<string | null>(null);
  const [field, setField] = useState<UniField | null>(null);
  const [query, setQuery] = useState("");
  const [compare, setCompare] = useState<string[]>([]);


  const cost = (u: University) => uniTotalUsd(u, includeLiving) * usdFx.factor;

  const proximity = (u: University) => {
    if (!nearHome) return 0;
    if (homeCountry && (u.countryEs === homeCountry || u.country === homeCountry)) return 0;
    if (homeRegion && u.region === homeRegion) return 1;
    return 2;
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIVERSITIES.filter((u) => {
      if (region && u.region !== region) return false;
      if (field && !u.fields.includes(field)) return false;
      if (q) {
        const hay = `${u.name} ${u.city} ${u.country} ${u.countryEs}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
      .map((u) => ({ u, total: cost(u) }))
      .sort((a, b) => {
        const aOk = a.total <= effectiveBudget ? 0 : 1;
        const bOk = b.total <= effectiveBudget ? 0 : 1;
        if (aOk !== bOk) return aOk - bOk;
        const p = proximity(a.u) - proximity(b.u);
        if (p !== 0) return p;
        return a.u.rank - b.u.rank;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, field, query, includeLiving, effectiveBudget, usdFx.factor, nearHome, homeCountry, homeRegion]);

  const affordable = list.filter((r) => r.total <= effectiveBudget);


  const monthsLeft = Math.max(1, yearsLeft * 12);
  const maxBudget = Math.max(400000, Math.round(projected * 2));

  const heroImg = member.theme === "girl" ? heroGirl : heroBoy;

  const toggleCompare = (id: string) =>
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );

  const compared = compare
    .map((id) => list.find((r) => r.u.id === id) ?? null)
    .filter(Boolean) as { u: University; total: number }[];

  return (
    <>
      {/* Hero difuminado, sin bordes — imagen protagonista */}
      <section className="relative mb-8 -mt-6 min-h-[380px] overflow-hidden sm:min-h-[460px]">
        <img
          src={heroImg}
          alt={t("Familia mirando universidades", "Family looking at universities")}
          width={1280}
          height={960}
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-right opacity-100 sm:w-[88%]"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.10) 10%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.80) 50%, #000 68%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 10%, #000 84%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.10) 10%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.80) 50%, #000 68%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 10%, #000 84%, transparent 100%)",
            WebkitMaskComposite: "source-in",
          }}
        />
        {/* Scrim solo en la columna del texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent sm:via-background/35 sm:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="relative flex min-h-[380px] max-w-md flex-col justify-center py-10 pr-6 sm:min-h-[460px] sm:py-14">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-sm">
            🎓 {t("Buscador de universidades", "College finder")}
          </p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight text-foreground drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] sm:text-5xl">
            {t("¿Dónde podrá estudiar", "Where can they study")}{" "}
            <span className="text-primary">{t(`a los ${targetAge}?`, `at ${targetAge}?`)}</span>
          </h1>
          <p className="mt-2 max-w-sm text-sm text-foreground/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
            {t(
              `Con el capital que estás construyendo hoy para ${member.name}.`,
              `With the capital you're building today for ${member.name}.`,
            )}
          </p>
          <div className="mt-5 w-fit rounded-3xl border border-primary/20 bg-background/80 p-4 shadow-lg backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`A los ${targetAge} años tendrá`, `At age ${targetAge} they'll have`)}
            </p>
            <p className="font-display text-4xl font-black text-primary">
              {money(effectiveBudget, currency, true)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {touched ? t("Escenario manual", "Manual scenario") : t("Con tu plan actual", "With your current plan")}
            </p>
          </div>
        </div>
      </section>


      <div className="grid gap-5">
        <div className="space-y-5">
          {/* Presupuesto */}
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Capital para estudiar", "College capital")}
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
                  {money(effectiveBudget, currency, true)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {touched
                    ? t("Escenario manual", "Manual scenario")
                    : t(
                        `Proyección con tu plan actual a los ${targetAge} años`,
                        `Projection with your current plan at age ${targetAge}`,
                      )}
                </p>
              </div>
              {touched ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTouched(false);
                    setBudget(projected);
                  }}
                >
                  {t("Volver a mi plan", "Back to my plan")}
                </Button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl bg-secondary/50 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("¿Cuánto pones inicialmente?", "How much do you put in initially?")}
                </span>
                <Input
                  className="mt-1 border-0 bg-transparent px-0 font-display text-xl font-bold shadow-none focus-visible:ring-0"
                  inputMode="numeric"
                  value={initial}
                  onChange={(e) => {
                    setInitialInput(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0));
                    setTouched(false);
                  }}
                />
              </label>
              <label className="rounded-2xl bg-secondary/50 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("¿Cuánto pones cada mes?", "How much do you add monthly?")}
                </span>
                <Input
                  className="mt-1 border-0 bg-transparent px-0 font-display text-xl font-bold shadow-none focus-visible:ring-0"
                  inputMode="numeric"
                  value={monthly}
                  onChange={(e) => {
                    setMonthlyInput(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0));
                    setTouched(false);
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t(
                `Durante ${yearsLeft} años al ${rate}% anual → ${money(projected, currency, true)} a los ${targetAge}.`,
                `Over ${yearsLeft} years at ${rate}% a year → ${money(projected, currency, true)} at age ${targetAge}.`,
              )}
            </p>

            <Slider
              className="mt-5"
              value={[Math.min(effectiveBudget, maxBudget)]}
              min={5000}
              max={maxBudget}
              step={1000}
              onValueChange={(v) => {
                setTouched(true);
                setBudget(v[0] ?? projected);
              }}
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{money(5000, currency, true)}</span>
              <span>{money(maxBudget, currency, true)}</span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("Incluir coste de vida", "Include living costs")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Alojamiento, comida y transporte", "Housing, food and transport")}
                </p>
              </div>
              <Switch checked={includeLiving} onCheckedChange={setIncludeLiving} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("Priorizar cerca de casa", "Prioritize close to home")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.city || homeCountry
                    ? `${profile?.city ? `${profile.city}, ` : ""}${homeCountry}`
                    : t("Añade tu ciudad en tu perfil", "Add your city in your profile")}
                </p>
              </div>
              <Switch checked={nearHome} onCheckedChange={setNearHome} />
            </div>

          </section>

          {/* Filtros premium */}
          <section className="sticky top-2 z-20 overflow-hidden rounded-[28px] border border-primary/15 bg-card/75 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <div className="bg-gradient-to-b from-primary/[0.08] via-transparent to-transparent p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative lg:w-[340px] lg:shrink-0">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("Busca universidad, ciudad o país…", "Search university, city or country…")}
                    className="h-11 rounded-full border-primary/15 bg-background/70 pl-11 pr-4 text-sm shadow-inner focus-visible:ring-primary/30"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="hidden w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:block">
                      {t("Región", "Region")}
                    </span>
                    <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <Chip active={!region} onClick={() => setRegion(null)}>
                        🌍 <span className="hidden sm:inline">{t("Todo", "All")}</span>
                      </Chip>
                      {REGIONS.map((r) => (
                        <Chip key={r} active={region === r} onClick={() => setRegion(region === r ? null : r)}>
                          {UNI_REGION_LABELS[r][lang === "en" ? "en" : "es"]}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <span className="hidden w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:block">
                      {t("Área", "Field")}
                    </span>
                    <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <Chip active={!field} onClick={() => setField(null)}>
                        ✨ <span className="hidden sm:inline">{t("Todas", "All")}</span>
                      </Chip>
                      {FIELDS.map((f) => (
                        <Chip key={f} active={field === f} onClick={() => setField(field === f ? null : f)}>
                          {FIELD_LABELS[f].emoji}{" "}
                          <span className="hidden sm:inline">{FIELD_LABELS[f][lang === "en" ? "en" : "es"]}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>

                {compare.length > 0 ? (
                  <div className="flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                    <p className="whitespace-nowrap text-[11px] font-bold text-primary">
                      {compare.length}/3 {t("para comparar", "to compare")}
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setCompare([])}>
                      {t("Limpiar", "Clear")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>


          {compared.length >= 2 ? (
            <ComparePanel
              items={compared}
              currency={currency}
              budget={effectiveBudget}
              monthsLeft={monthsLeft}
              lang={lang}
              t={t}
              onRemove={toggleCompare}
              onClear={() => setCompare([])}
            />
          ) : null}

          {/* Resultados */}
          <section>
            <p className="mb-3 text-sm font-semibold text-foreground">
              {affordable.length}{" "}
              <span className="font-normal text-muted-foreground">
                {t("universidades que ya puedes pagar", "universities you can already afford")}
              </span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                · {t("selecciona hasta 3 para comparar", "pick up to 3 to compare")}
              </span>
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {list.map(({ u, total }) => {
                const ok = total <= effectiveBudget;
                const gap = total - effectiveBudget;
                const coverage = Math.max(0, Math.min(100, Math.round((effectiveBudget / Math.max(1, total)) * 100)));
                const picked = compare.includes(u.id);
                const full = compare.length >= 3 && !picked;
                return (
                  <article
                    key={u.id}
                    className={cn(
                      "group relative overflow-hidden rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
                      ok
                        ? "border-primary/30 bg-gradient-to-b from-primary/[0.09] to-card"
                        : "border-border/60 bg-card",
                      picked && "ring-2 ring-primary",
                    )}
                  >

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary/70 text-xl">
                          {u.flag}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-display text-base font-bold text-foreground">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.city}, {lang === "en" ? u.country : u.countryEs} · #{u.rank}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          ok ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {coverage}% {t("cubierto", "covered")}
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", ok ? "bg-primary" : "bg-amber-500")}
                        style={{ width: `${coverage}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t("Coste total", "Total cost")}
                        </p>
                        <p className="font-display text-lg font-bold text-foreground">
                          {money(total, currency, true)}
                        </p>
                      </div>
                      <p className="text-right text-[11px] leading-tight">
                        <span className="block text-muted-foreground">
                          {ok ? t("Te quedarían", "You'd have left") : t("Te faltarían", "You'd be short")}
                        </span>
                        <span className={cn("font-bold", ok ? "text-primary" : "text-amber-600 dark:text-amber-400")}>
                          {money(ok ? effectiveBudget - total : gap, currency, true)}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {u.fields.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                        >
                          {FIELD_LABELS[f].emoji} {FIELD_LABELS[f][lang === "en" ? "en" : "es"]}
                        </span>
                      ))}
                      {u.scholarship ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          🎁 {t("Becas", "Scholarships")}
                        </span>
                      ) : null}
                    </div>

                    <p
                      className={cn(
                        "mt-3 flex items-center gap-1.5 text-[11px] font-semibold",
                        ok ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {ok ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          {t("Puede pagarlo con su plan", "Affordable with the plan")}
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3.5 w-3.5" />
                          +{money(gap / monthsLeft, currency, true)}
                          {t("/mes desde hoy lo consigue", "/mo from today closes the gap")}
                        </>
                      )}
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      variant={picked ? "default" : "outline"}
                      disabled={full}
                      onClick={() => toggleCompare(u.id)}
                      className="mt-3 h-8 w-full rounded-full text-[11px] font-bold"
                    >
                      {picked
                        ? t("Quitar de comparar", "Remove from compare")
                        : full
                          ? t("Máximo 3", "Max 3")
                          : t("Comparar", "Compare")}
                    </Button>
                  </article>

                );
              })}

              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("No hay universidades con esos filtros.", "No universities match those filters.")}
                </p>
              ) : null}
            </div>
          </section>
        </div>

      </div>
    </>
  );
}

function ComparePanel({
  items,
  currency,
  budget,
  monthsLeft,
  lang,
  t,
  onRemove,
  onClear,
}: {
  items: { u: University; total: number }[];
  currency: string;
  budget: number;
  monthsLeft: number;
  lang: string;
  t: (es: string, en: string) => string;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const cheapest = Math.min(...items.map((i) => i.total));
  const best = Math.min(...items.map((i) => i.u.rank));

  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-b from-primary/[0.07] to-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-display text-lg font-black text-foreground">
          {t("Comparar universidades", "Compare universities")}
        </p>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
          {t("Limpiar", "Clear")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(({ u, total }) => {
          const ok = total <= budget;
          const gap = total - budget;
          return (
            <div key={u.id} className="relative rounded-3xl border border-border/60 bg-background/70 p-4">
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                aria-label={t("Quitar", "Remove")}
                className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-secondary text-xs text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
              >
                ×
              </button>
              <p className="text-xl">{u.flag}</p>
              <p className="mt-1 pr-6 font-display text-sm font-bold leading-tight text-foreground">{u.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {u.city}, {lang === "en" ? u.country : u.countryEs}
              </p>

              <dl className="mt-3 space-y-2 text-xs">
                <Row label={t("Coste total", "Total cost")}>
                  <span className={cn("font-bold", total === cheapest && "text-primary")}>
                    {money(total, currency, true)}
                    {total === cheapest ? " 🏆" : ""}
                  </span>
                </Row>
                <Row label={t("Ranking", "Ranking")}>
                  <span className={cn("font-bold", u.rank === best && "text-primary")}>#{u.rank}</span>
                </Row>
                <Row label={t("Cobertura", "Coverage")}>
                  <span className="font-bold">
                    {Math.max(0, Math.min(100, Math.round((budget / Math.max(1, total)) * 100)))}%
                  </span>
                </Row>
                <Row label={ok ? t("Te sobra", "Left over") : t("Falta al mes", "Monthly gap")}>
                  <span className={cn("font-bold", ok ? "text-primary" : "text-amber-600 dark:text-amber-400")}>
                    {ok ? money(budget - total, currency, true) : `+${money(gap / monthsLeft, currency, true)}`}
                  </span>
                </Row>
                <Row label={t("Becas", "Scholarships")}>
                  <span className="font-bold">{u.scholarship ? "🎁 Sí" : "—"}</span>
                </Row>
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

function Chip({

  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

