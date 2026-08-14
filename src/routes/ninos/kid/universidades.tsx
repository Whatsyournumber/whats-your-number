import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Search, Sparkles, Check, TrendingUp, Loader2 } from "lucide-react";

import { KidPage, PageTitle } from "@/components/kid-page";
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
import { getCollegeAdvice } from "@/lib/college-ai.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
  const fundInitial = Math.round((Number(fund?.current_balance ?? 0) + totals.crecer) * fx.factor);
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
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

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
  const stretch = list.filter((r) => r.total > effectiveBudget);

  const monthsLeft = Math.max(1, yearsLeft * 12);
  const monthlyExtraFor1 = stretch[0]
    ? Math.max(0, (stretch[0].total - effectiveBudget) / monthsLeft)
    : 0;

  const interests = field ? FIELD_LABELS[field][lang === "en" ? "en" : "es"] : "";


  const askBuddy = async () => {
    setLoadingAdvice(true);
    setAdvice(null);
    try {
      const res = await getCollegeAdvice({
        data: {
          lang: lang === "en" ? "en" : "es",
          childName: member.name,
          childAge: member.age,
          currency,
          budget: effectiveBudget,
          interests,
          monthlyExtraFor1,
          initial,
          monthly,
          years: yearsLeft,
          rate,
          homeCountry: homeCountry || "",
          homeCity: profile?.city ?? "",

          affordable: affordable.slice(0, 8).map((r) => ({
            name: r.u.name,
            city: r.u.city,
            country: lang === "en" ? r.u.country : r.u.countryEs,
            total: r.total,
            rank: r.u.rank,
          })),
          stretch: stretch.slice(0, 5).map((r) => ({
            name: r.u.name,
            city: r.u.city,
            country: lang === "en" ? r.u.country : r.u.countryEs,
            total: r.total,
            rank: r.u.rank,
            gap: r.total - effectiveBudget,
          })),
        },
      });
      setAdvice(res.answer);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("No se pudo generar la recomendación", "Could not generate the recommendation"),
      );
    } finally {
      setLoadingAdvice(false);
    }
  };

  const maxBudget = Math.max(400000, Math.round(projected * 2));

  return (
    <>
      <PageTitle
        emoji="🎓"
        title={t("¿Dónde puede estudiar?", "Where can they study?")}
        subtitle={t(
          `Con el dinero que ${member.name} tendrá a los ${targetAge}, estas son las universidades del mundo a su alcance.`,
          `With the money ${member.name} will have at ${targetAge}, these are the universities within reach.`,
        )}
      />

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
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

          {/* Filtros */}
          <section className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Busca universidad, ciudad o país…", "Search university, city or country…")}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={!region} onClick={() => setRegion(null)}>
                🌍 {t("Todo el mundo", "Worldwide")}
              </Chip>
              {REGIONS.map((r) => (
                <Chip key={r} active={region === r} onClick={() => setRegion(region === r ? null : r)}>
                  {UNI_REGION_LABELS[r][lang === "en" ? "en" : "es"]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {FIELDS.map((f) => (
                <Chip key={f} active={field === f} onClick={() => setField(field === f ? null : f)}>
                  {FIELD_LABELS[f].emoji} {FIELD_LABELS[f][lang === "en" ? "en" : "es"]}
                </Chip>
              ))}
            </div>
          </section>

          {/* Resultados */}
          <section>
            <p className="mb-3 text-sm font-semibold text-foreground">
              {affordable.length}{" "}
              <span className="font-normal text-muted-foreground">
                {t("universidades que ya puedes pagar", "universities you can already afford")}
              </span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map(({ u, total }) => {
                const ok = total <= effectiveBudget;
                const gap = total - effectiveBudget;
                return (
                  <article
                    key={u.id}
                    className={cn(
                      "rounded-2xl border p-4 transition",
                      ok ? "border-primary/40 bg-primary/[0.06]" : "border-border/70 bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold text-foreground">
                          {u.flag} {u.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.city}, {lang === "en" ? u.country : u.countryEs} · #{u.rank}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          ok ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {ok ? t("Puedes pagarlo", "Affordable") : t("Te falta", "Short by")}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-lg font-bold text-foreground">
                      {money(total, currency, true)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t(
                        `Coste total del grado (${u.years} años)`,
                        `Total degree cost (${u.years} years)`,
                      )}
                    </p>
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
                          {t("Te sobrarían", "You'd have left")} {money(effectiveBudget - total, currency, true)}
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3.5 w-3.5" />
                          {t("Faltan", "Missing")} {money(gap, currency, true)} ·{" "}
                          {money(gap / monthsLeft, currency, true)}
                          {t("/mes extra", "/mo extra")}
                        </>
                      )}
                    </p>
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

        {/* Panel IA */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary">
                <GraduationCap className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  {t("Buddy te aconseja", "Buddy advises you")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("IA sobre tu presupuesto real", "AI on your real budget")}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <Stat label={t("A tu alcance", "Within reach")} value={String(affordable.length)} />
              <Stat
                label={t("Extra/mes para la 1ª soñada", "Extra/mo for dream #1")}
                value={monthlyExtraFor1 > 0 ? money(monthlyExtraFor1, currency, true) : "—"}
              />
            </div>

            <Button className="mt-4 w-full" onClick={askBuddy} disabled={loadingAdvice}>
              {loadingAdvice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Pensando…", "Thinking…")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("Recomiéndame universidades", "Recommend universities")}
                </>
              )}
            </Button>

            {advice ? (
              <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-secondary/50 p-4 text-sm leading-relaxed text-foreground">
                {advice}
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {t(
                  "Ajusta el capital y los filtros, y Buddy te dirá dónde encaja mejor tu hijo/a y cuánto falta para la universidad soñada.",
                  "Adjust the capital and filters, and Buddy will tell you where your child fits best and how far the dream school is.",
                )}
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 px-3 py-3">
      <p className="font-display text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
