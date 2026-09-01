import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bitcoin,
  Building2,
  Check,
  Compass,
  CreditCard,
  Loader2,
  LogOut,
  Pencil,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";


import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FIXED_FIELDS, totalFixedExpenses } from "@/lib/onboarding";
import { StatementImporter } from "@/components/statement-importer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildInsights,
  buildPlan,
  childrenOptions,
  cities,
  compact,
  emptyLife,
  emptyOnboarding,
  estimateDesiredIncome,
  goals,
  housingOptions,
  lifestyles,
  maritalOptions,
  money,
  netWorth,
  plansChildrenOptions,
  totalAssets,
  travelOptions,
  type LifeData,
  type OnboardingData,
  currencies,
} from "@/lib/onboarding";
import { useFxRates } from "@/hooks/use-fx-rates";
import { convertAmount } from "@/lib/fx";
import { lifestyleCities } from "@/lib/lifestyle-cities";
import { comfortableCostEur } from "@/lib/city-cost";
import { currencyForCountry } from "@/lib/country-currency";

import { cn } from "@/lib/utils";
import { detectCurrency } from "@/lib/geo";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";
import { Amount } from "@/components/ui/amount";

const GOALS_EN: Record<string, string> = {
  libertad: "Achieve financial freedom",
  patrimonio: "Grow my net worth",
  gastos: "Understand and control my expenses",
  vivienda: "Save for a home",
  negocio: "Start my business",
  organizar: "Better organize my money",
  otro: "Another goal (write it down)",
};

const MARITAL_EN: Record<string, string> = {
  "Soltero": "Single",
  "En pareja": "In a relationship",
  "Casado": "Married",
  "Divorciado": "Divorced",
};

const PLANS_CHILDREN_EN: Record<string, string> = {
  "Sí": "Yes",
  "No": "No",
  "No estoy seguro": "Not sure",
};

const LIFESTYLE_EN: Record<string, { label: string; desc: string }> = {
  minimalista: { label: "Minimalist", desc: "The essentials, no excess." },
  comodo: { label: "Comfortable", desc: "A calm life, without rush." },
  premium: { label: "Premium", desc: "Good restaurants, good trips." },
  lujo: { label: "Luxury", desc: "No relevant spending limits." },
};

const TRAVEL_EN: Record<string, string> = {
  "nunca": "Never",
  "1-2": "1-2",
  "3-5": "3-5",
  "5+": "More than 5",
};

const HOUSING_EN: Record<string, string> = {
  pagada: "Yes, fully paid off",
  hipoteca: "Yes, with a mortgage",
  alquiler: "I rent",
  ns: "Prefer not to answer",
};

const CURRENCY_EN: Record<string, string> = {
  EUR: "Euro",
  USD: "US Dollar",
  GBP: "British Pound",
  CHF: "Swiss Franc",
  MXN: "Mexican Peso",
  COP: "Colombian Peso",
  CLP: "Chilean Peso",
  ARS: "Argentine Peso",
  UYU: "Uruguayan Peso",
  PEN: "Peruvian Sol",
  BRL: "Brazilian Real",
  CAD: "Canadian Dollar",
  DOP: "Dominican Peso",
  GTQ: "Quetzal",
  CRC: "Costa Rican Colón",
  PYG: "Guarani",
  BOB: "Boliviano",
  HNL: "Lempira",
  NIO: "Córdoba",
  VES: "Bolívar",
};

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Construye tu Número — plan financiero personalizado" },
      {
        name: "description",
        content:
          "Responde unas preguntas y nuestra IA construye tu plan: patrimonio, gastos, Your Number y tu edad de libertad financiera.",
      },
      { property: "og:title", content: "Construye tu Número — WhatsYournumber" },
      { property: "og:description", content: "Un plan financiero personalizado en 3 minutos con WhatsYournumber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingPage,
});

const QUESTIONS = 9; // pantallas 1..9
const BUILD_STEP = 10;
const SUMMARY_STEP = 11;

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const { isPatrimonio } = useSubscription();
  const [step, setStep] = useState(1);

  const [data, setData] = useState<OnboardingData>({ ...emptyOnboarding, currency: detectCurrency(), monthly_expenses: 0 });
  const [life, setLife] = useState<LifeData>(emptyLife);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customReturn, setCustomReturn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signup" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const { data: row } = await supabase
        .from("onboarding_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      // Si ya completó el onboarding, no lo repetimos.
      if (row && (row as Record<string, unknown>)["completed"]) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (row) {
        const r = row as Record<string, unknown>;
        const next = { ...emptyOnboarding, currency: detectCurrency() };
        for (const key of Object.keys(emptyOnboarding) as (keyof OnboardingData)[]) {
          const v = r[key];
          if (v !== null && v !== undefined) (next as Record<string, unknown>)[key] = typeof v === "string" ? v : Number(v);
        }
        if (typeof r["full_name"] === "string") next.full_name = r["full_name"];
        const nextLife = { ...emptyLife };
        for (const key of Object.keys(emptyLife) as (keyof LifeData)[]) {
          const v = r[key];
          if (typeof v === "string") nextLife[key] = v;
        }
        setData(next);
        setLife(nextLife);
        setStep(Math.min(QUESTIONS, Math.max(1, Number(r["current_step"] ?? 1))));
      } else {
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        const name = typeof meta?.["full_name"] === "string" ? meta["full_name"] : "";
        setData((d) => ({ ...d, full_name: name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "" }));
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [user, navigate]);

  const persist = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("onboarding_profiles")
      .upsert({ user_id: user.id, ...data, ...life, current_step: step, ...patch }, { onConflict: "user_id" });
    setSaving(false);
  };

  useEffect(() => {
    if (!ready || !user) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist({}), 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, life, step, ready]);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setFixed = (key: (typeof FIXED_FIELDS)[number]["key"], value: number) =>
    setData((d) => {
      const next = { ...d, [key]: value };
      const fixedTotal = totalFixedExpenses(next);
      if (next.monthly_expenses < fixedTotal) next.monthly_expenses = fixedTotal;
      return next;
    });
  const setL = <K extends keyof LifeData>(key: K, value: LifeData[K]) => setLife((l) => ({ ...l, [key]: value }));

  const cur = data.currency || detectCurrency();
  // Las tasas del día alimentan la conversión del objetivo estimado.
  const { updatedAt: fxUpdatedAt } = useFxRates();
  const desiredIncome = useMemo(
    () => estimateDesiredIncome(life, { currency: cur }),
    [life, cur, fxUpdatedAt],
  );
  const plan = useMemo(
    () => buildPlan({ ...data, desired_retirement_income: desiredIncome }),
    [data, desiredIncome],
  );

  const go = (dir: 1 | -1) => {
    const next = Math.min(SUMMARY_STEP, Math.max(1, step + dir));
    setStep(next);
    void persist({ current_step: Math.min(QUESTIONS, next) });
  };


  const build = () => {
    setStep(BUILD_STEP);
    void persist({ current_step: QUESTIONS, desired_retirement_income: desiredIncome });
  };

  const finish = () => {
    setStep(SUMMARY_STEP);
    void persist({ completed: true, completed_at: new Date().toISOString(), desired_retirement_income: desiredIncome });
    // Sin prueba automática: toda cuenta nueva entra en el plan gratis.
  };


  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canContinue = () => {
    if (step === 1) {
      if (life.goal === "otro") return life.goal_note.trim().length > 2;
      if (life.goal === "negocio") return data.business_target > 0;
      return !!life.goal;
    }
    if (step === 2) return !!data.age;
    if (step === 4) return !!life.marital_status && !!life.children && !!life.plans_children;
    if (step === 5) return !!life.city;
    if (step === 6) return !!life.lifestyle && !!life.travel_frequency;
    if (step === 7) return !!life.housing;
    return true;
  };

  const progress = (Math.min(step, QUESTIONS) / QUESTIONS) * 100;
  const isBuilding = step === BUILD_STEP;
  const isSummary = step === SUMMARY_STEP;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[960px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />

      {!isBuilding && (
        <div className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
            <Link
              to="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >

              <Compass className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-semibold">WhatsYournumber</span>
            </Link>
            <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${isSummary ? 100 : progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="numeric w-16 text-right text-[11px] text-muted-foreground">
              {saving ? t("Guardando…", "Saving…") : isSummary ? "" : `${step} / ${QUESTIONS}`}
            </span>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={t("Salir y usar otra cuenta", "Sign out and use another account")}
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("Salir", "Sign out")}
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto flex min-h-[calc(100vh-57px)] max-w-2xl flex-col justify-center px-5 py-10 sm:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >




            {step === 1 && (
              <Screen
                title={t("¿Cuál es tu principal objetivo financiero?", "What's your main financial goal?")}
                hint={t("Queremos construir un plan financiero adaptado a ti.", "We want to build a financial plan tailored to you.")}
              >
                <div className="space-y-2.5">
                  {goals.map((g) => (
                    <div key={g.value} className="space-y-2.5">
                      <OptionRow
                        emoji={g.emoji}
                        title={t(g.label, GOALS_EN[g.value] ?? g.label)}
                        selected={life.goal === g.value}
                        onClick={() => {
                          setL("goal", g.value);
                          setData((d) => ({ ...d, priority: g.value }));
                        }}
                      />
                      <AnimatePresence>
                        {life.goal === g.value && g.value === "vivienda" && (
                          <Reveal>
                            <SubQuestion title={t("¿Cuánto cuesta la vivienda que quieres?", "How much does the home you want cost?")} />
                            <div className="grid gap-2.5 sm:grid-cols-2">
                              <MoneyField
                                emoji="🏡"
                                label={t("Precio de la vivienda", "Home price")}
                                currency={cur}
                                value={data.home_price}
                                hint={t("Escribe aquí", "Type here")}
                                onChange={(v) => set("home_price", v)}
                              />
                              <div className="rounded-2xl border border-border bg-elevated/50 px-5 py-4">
                                <p className="text-xs text-muted-foreground">{t("Entrada (down payment)", "Down payment")}</p>
                                <p className="numeric mt-1 text-lg font-semibold">{data.down_payment_pct}%</p>
                                <Slider
                                  className="mt-3"
                                  min={5}
                                  max={100}
                                  step={5}
                                  value={[data.down_payment_pct || 20]}
                                  onValueChange={(v) => set("down_payment_pct", v[0]!)}
                                />
                              </div>
                            </div>
                          </Reveal>
                        )}
                        {life.goal === g.value && g.value === "negocio" && (
                          <Reveal>
                            <SubQuestion title={t("¿Cuánto capital necesitas para montarlo?", "How much capital do you need to start it?")} />
                            <MoneyField
                              emoji="🚀"
                              label={t("Capital para mi negocio", "Capital for my business")}
                              currency={cur}
                              value={data.business_target}
                              hint={t("Escribe aquí", "Type here")}
                              onChange={(v) => set("business_target", v)}
                            />
                          </Reveal>
                        )}
                        {life.goal === g.value && g.value === "otro" && (
                          <Reveal>
                            <SubQuestion title={t("Cuéntanos tu objetivo y cuánto cuesta", "Tell us your goal and how much it costs")} />
                            <div className="grid gap-2.5 sm:grid-cols-2">
                              <div className="rounded-2xl border border-border bg-elevated/50 px-5 py-4">
                                <p className="text-xs text-muted-foreground">{t("¿Cuál es tu objetivo?", "What's your goal?")}</p>
                                <input
                                  value={life.goal_note}
                                  onChange={(e) => setL("goal_note", e.target.value.slice(0, 120))}
                                  maxLength={120}
                                  placeholder={t("Ej: hacer un MBA", "E.g. do an MBA")}
                                  className="mt-2 w-full border-b border-dashed border-border bg-transparent pb-1 text-lg font-semibold outline-none transition-colors placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground focus:border-primary"
                                />
                              </div>
                              <MoneyField
                                emoji="🎯"
                                label={t("¿Cuánto necesitas?", "How much do you need?")}
                                currency={cur}
                                value={data.business_target}
                                hint={t("Escribe aquí", "Type here")}
                                onChange={(v) => set("business_target", v)}
                              />
                            </div>
                          </Reveal>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

              </Screen>
            )}

            {step === 2 && (
              <Screen title={t("¿Qué edad tienes?", "How old are you?")}>
                <BigNumber value={data.age ?? 32} suffix={t("años", "years")} />
                <Slider
                  className="mt-10"
                  min={18}
                  max={75}
                  step={1}
                  value={[data.age ?? 32]}
                  onValueChange={(v) => set("age", v[0]!)}
                />
                <ScaleLabels left="18" right="75" />
              </Screen>
            )}

            {step === 3 && (
              <Screen
                title={t(
                  "¿A qué edad te gustaría alcanzar tu objetivo financiero?",
                  "At what age would you like to reach your financial goal?",
                )}
                hint={t(
                  "Tu objetivo puede ser la libertad financiera, tu primera vivienda, montar tu negocio o el que tú elijas.",
                  "Your goal can be financial freedom, your first home, starting your business or whichever you choose.",
                )}
              >
                <BigNumber value={data.retire_age} suffix={t("años", "years")} />
                <Slider
                  className="mt-10"
                  min={Math.min(75, (data.age ?? 30) + 1)}
                  max={80}
                  step={1}
                  value={[data.retire_age]}
                  onValueChange={(v) => set("retire_age", v[0]!)}
                />
                <ScaleLabels left={`${Math.min(75, (data.age ?? 30) + 1)}`} right="80" />
                {data.age ? (
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    {t("Te quedan", "You have")}{" "}
                    <span className="numeric text-foreground">{Math.max(0, data.retire_age - data.age)}</span>{" "}
                    {t("años para construirlo.", "years left to build it.")}
                  </p>
                ) : null}
              </Screen>
            )}

            {step === 4 && (
              <Screen title={t("¿Cuál es tu situación familiar?", "What's your family situation?")}>
                <ChipGroup
                  options={maritalOptions.map((m) => ({ value: m, label: t(m, MARITAL_EN[m] ?? m) }))}
                  value={life.marital_status}
                  onSelect={(v) => setL("marital_status", v)}
                />
                <AnimatePresence>
                  {life.marital_status && (
                    <Reveal>
                      <SubQuestion title={t("¿Tienes hijos?", "Do you have children?")} />
                      <ChipGroup options={childrenOptions.map((c) => ({ value: c, label: c }))} value={life.children} onSelect={(v) => setL("children", v)} />
                    </Reveal>
                  )}
                  {life.children && (
                    <Reveal>
                      <SubQuestion
                        title={
                          life.children === "0"
                            ? t("¿Planeas tener hijos?", "Are you planning to have children?")
                            : t("¿Planeas tener más hijos?", "Are you planning to have more children?")
                        }
                      />
                      <ChipGroup
                        options={plansChildrenOptions.map((c) => ({ value: c, label: t(c, PLANS_CHILDREN_EN[c] ?? c) }))}
                        value={life.plans_children}
                        onSelect={(v) => setL("plans_children", v)}
                      />
                    </Reveal>
                  )}
                </AnimatePresence>
              </Screen>
            )}

            {step === 5 && (
              <Screen
                title={t(
                  "¿Dónde te gustaría vivir cuando alcances tu libertad financiera?",
                  "Where would you like to live once you reach financial freedom?",
                )}
                hint={t(
                  "Analizaremos el coste de vida de esa ciudad para tu familia y personalizaremos tu objetivo financiero.",
                  "We'll analyze that city's cost of living for your household and personalize your financial goal.",
                )}
              >
                <CityPicker
                  value={life.city}
                  onSelect={(c) => {
                    setL("city", c.name);
                    setData((d) => ({ ...d, country: c.country, currency: c.currency }));
                  }}
                />
                {life.city && (() => {
                  const kidsCount = life.children === "1" ? 1 : life.children === "2" ? 2 : life.children === "3+" ? 3 : 0;
                  const hasPartner = life.marital_status === "Casado" || life.marital_status === "En pareja";
                  const parts: string[] = [t("ti", "you")];
                  if (hasPartner) parts.push(t("tu pareja", "your partner"));
                  if (kidsCount > 0) parts.push(`${kidsCount} ${kidsCount === 1 ? t("hijo", "child") : t("hijos", "children")}`);
                  if (life.plans_children === "Sí") parts.push(t("hijos planeados", "planned children"));
                  return (
                    <div className="mt-8 space-y-1 text-center text-sm text-muted-foreground">
                      <p>
                        {t("Ingreso necesario estimado en", "Estimated income needed in")} {life.city}:{" "}
                        <span className="numeric text-foreground">{money(desiredIncome, cur)}</span> {t("al mes.", "per month.")}
                      </p>
                      <p className="text-xs">
                        {t("Calculado para", "Calculated for")} {parts.join(t(" y ", " and "))}.
                      </p>
                    </div>
                  );
                })()}
              </Screen>
            )}


            {step === 6 && (
              <Screen
                title={t("¿Cómo te gustaría vivir?", "How would you like to live?")}
                hint={t(
                  "Selecciona el estilo de vida que quieres mantener cuando alcances tu libertad financiera.",
                  "Select the lifestyle you want to maintain once you reach financial freedom.",
                )}
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {lifestyles.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setL("lifestyle", l.value)}
                      className={cn(
                        "rounded-2xl border px-5 py-5 text-left transition-all",
                        life.lifestyle === l.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-elevated/50 hover:border-muted-foreground/40",
                      )}
                    >
                      <span className="text-2xl">{l.emoji}</span>
                      <p className="mt-3 text-sm font-medium">{t(l.label, LIFESTYLE_EN[l.value]?.label ?? l.label)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t(l.desc, LIFESTYLE_EN[l.value]?.desc ?? l.desc)}</p>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {life.lifestyle && (
                    <Reveal>
                      <SubQuestion title={t("¿Cuántas veces te gustaría viajar al año?", "How many times a year would you like to travel?")} />
                      <ChipGroup
                        options={travelOptions.map((o) => ({ value: o.value, label: t(o.label, TRAVEL_EN[o.value] ?? o.label) }))}
                        value={life.travel_frequency}
                        onSelect={(v) => setL("travel_frequency", v)}
                      />
                    </Reveal>
                  )}
                </AnimatePresence>
                {life.lifestyle && life.travel_frequency && (() => {
                  const kidsCount = life.children === "1" ? 1 : life.children === "2" ? 2 : life.children === "3+" ? 3 : 0;
                  const hasPartner = life.marital_status === "Casado" || life.marital_status === "En pareja";
                  const family = hasPartner || kidsCount > 0 || life.plans_children === "Sí";
                  const parts: string[] = [];
                  if (hasPartner) parts.push(t("pareja", "partner"));
                  if (kidsCount > 0) parts.push(`${kidsCount} ${kidsCount === 1 ? t("hijo", "child") : t("hijos", "children")}`);
                  if (life.plans_children === "Sí") parts.push(t("hijos planeados", "planned children"));
                  return (
                    <div className="mt-8 space-y-1 text-center text-sm text-muted-foreground">
                      <p>
                        {family
                          ? t("Objetivo estimado de vida familiar:", "Estimated family lifestyle target:")
                          : t("Objetivo estimado de vida:", "Estimated lifestyle target:")}{" "}
                        <span className="numeric text-foreground">{money(desiredIncome, cur)}</span> {t("al mes.", "per month.")}
                      </p>
                      {parts.length > 0 && (
                        <p className="text-xs">
                          {t("Incluye", "Includes")} {parts.join(t(" y ", " and "))}.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </Screen>
            )}

            {step === 7 && (
              <Screen title={t("¿Tienes vivienda propia?", "Do you own your home?")}>
                <div className="space-y-2.5">
                  {housingOptions.map((h) => (
                    <div key={h.value} className="space-y-2.5">
                      <OptionRow
                        emoji={h.emoji}
                        title={t(h.label, HOUSING_EN[h.value] ?? h.label)}
                        selected={life.housing === h.value}
                        onClick={() => setL("housing", h.value)}
                      />
                      <AnimatePresence>
                        {life.housing === h.value && h.value === "hipoteca" && (
                          <Reveal>
                            <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                              <div className="space-y-2.5">
                                <MoneyField
                                  emoji="🏦"
                                  label={t("Saldo pendiente", "Outstanding balance")}
                                  desc={t("Lo que aún debes al banco", "What you still owe the bank")}
                                  currency={cur}
                                  value={data.mortgage_balance}
                                  hint={t("Escribe aquí", "Type here")}
                                  onChange={(v) => set("mortgage_balance", v)}
                                />
                                <MoneyField
                                  emoji="📊"
                                  label={t("Tasa de interés", "Interest rate")}
                                  desc={t("Tasa anual actual", "Current annual rate")}
                                  currency="%"
                                  value={data.mortgage_rate}
                                  hint={t("Escribe aquí", "Type here")}
                                  onChange={(v) => set("mortgage_rate", v)}
                                />
                                <MoneyField
                                  emoji="📅"
                                  label={t("Plazo restante", "Remaining term")}
                                  desc={t("Años que te faltan por pagar", "Years left to pay")}
                                  currency={t("años", "years")}
                                  value={data.mortgage_term}
                                  hint={t("Escribe aquí", "Type here")}
                                  onChange={(v) => set("mortgage_term", v)}
                                />
                              </div>
                            </div>
                          </Reveal>
                        )}
                        {life.housing === h.value && h.value === "alquiler" && (
                          <Reveal>
                            <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                              <MoneyField
                                emoji="🏢"
                                label={t("Alquiler mensual", "Monthly rent")}
                                desc={t("Lo que pagas de alquiler cada mes", "What you pay in rent each month")}
                                currency={cur}
                                value={data.fixed_housing}
                                hint={t("Escribe aquí", "Type here")}
                                onChange={(v) => setFixed("fixed_housing", v)}
                              />
                            </div>
                          </Reveal>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </Screen>
            )}

            {step === 8 && (
              <Screen
                title={t(
                  "¿Qué rendimiento anual quieres utilizar para planificar tu patrimonio?",
                  "What annual return do you want to use to plan your net worth?",
                )}
                hint={t(
                  "Solo utilizaremos este porcentaje para realizar simulaciones financieras. No representa una rentabilidad garantizada.",
                  "We only use this percentage for financial simulations. It does not represent a guaranteed return.",
                )}
              >
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {[4, 5, 6, 7, 8].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setCustomReturn(false);
                        set("expected_return", r);
                      }}
                      className={cn(
                        "rounded-2xl border px-3 py-5 text-center transition-all",
                        !customReturn && data.expected_return === r
                          ? "border-primary bg-primary/10"
                          : "border-border bg-elevated/50 hover:border-muted-foreground/40",
                      )}
                    >
                      <p className="numeric text-xl font-semibold">{r}%</p>
                      {r === 7 && <p className="mt-1 text-[10px] uppercase tracking-widest text-primary">⭐ {t("Recom.", "Recom.")}</p>}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCustomReturn(true)}
                  className={cn(
                    "mt-2.5 w-full rounded-2xl border px-5 py-4 text-sm transition-all",
                    customReturn ? "border-primary bg-primary/10" : "border-border bg-elevated/50 hover:border-muted-foreground/40",
                  )}
                >
                  {t("Personalizado", "Custom")}
                </button>
                <AnimatePresence>
                  {customReturn && (
                    <Reveal>
                            <BigNumber value={data.expected_return} suffix={t("% anual", "% annual")} />
                      <Slider
                        className="mt-8"
                        min={1}
                        max={15}
                        step={0.5}
                        value={[data.expected_return]}
                        onValueChange={(v) => set("expected_return", v[0]!)}
                      />
                    </Reveal>
                  )}
                </AnimatePresence>
              </Screen>
            )}

            {step === 9 && (
              <Screen
                title={t("Hablemos de tu patrimonio", "Let's talk about your net worth")}
                hint={t(
                  "Antes de analizar tus movimientos, queremos conocer una estimación de tu patrimonio actual. Si no conoces alguna cifra, puedes dejarla en 0 o editarla más adelante.",
                  "Before analyzing your transactions, we want an estimate of your current net worth. If you don't know a figure, leave it at 0 or edit it later.",
                )}
              >
                <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                  <span className="text-lg">🤖</span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "No te preocupes si no conoces estos números. Nuestra IA puede calcularlos automáticamente analizando tus extractos financieros. Solo completa lo que conozcas —",
                      "Don't worry if you don't know these numbers. Our AI can calculate them automatically by analyzing your financial statements. Just fill in what you know —",
                    )}{" "}
                    <span className="text-foreground">{t("podrás modificarlo cuando quieras", "you can edit it anytime")}</span>.
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-elevated/40 px-5 py-3">
                  <div>
                    <p className="text-sm">{t("Moneda", "Currency")}</p>
                    <p className="text-xs text-muted-foreground">{t("En la que verás todos tus importes", "The one you'll see all your amounts in")}</p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={cur}
                    onChange={(e) => set("currency", e.target.value)}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {t(c.label, CURRENCY_EN[c.code] ?? c.label)}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="mt-6">
                  <SubQuestion title={t("Ingresos y flujo mensual", "Income and monthly flow")} />
                  <div className="mt-4 space-y-2.5">
                    <MoneyField
                      emoji="🪙"
                      label={t("Salario mensual", "Monthly salary")}
                      desc={t("Neto, después de impuestos", "Net, after taxes")}
                      currency={cur}
                      value={data.income_salary}
                      onChange={(v) => set("income_salary", v)}
                    />
                    <MoneyField
                      emoji="🎯"
                      label={t("Bonos / variables", "Bonuses / variable pay")}
                      desc={t("Promedio mensual", "Monthly average")}
                      currency={cur}
                      value={data.income_bonus}
                      onChange={(v) => set("income_bonus", v)}
                    />
                    <MoneyField
                      emoji="🏘"
                      label={t("Alquileres", "Rental income")}
                      desc={t("Rentas que recibes cada mes", "Rent you receive each month")}
                      currency={cur}
                      value={data.income_rent}
                      onChange={(v) => set("income_rent", v)}
                    />
                    <MoneyField
                      emoji="✨"
                      label={t("Otros ingresos", "Other income")}
                      desc={t("Dividendos, side projects…", "Dividends, side projects…")}
                      currency={cur}
                      value={data.income_other}
                      onChange={(v) => set("income_other", v)}
                    />
                    <MoneyField
                      emoji="🧾"
                      label={t("Gasto mensual", "Monthly expenses")}
                      desc={t("Aproximado, todo incluido", "Approximate, all included")}
                      currency={cur}
                      value={data.monthly_expenses}
                      onChange={(v) => set("monthly_expenses", v)}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <SubQuestion title={t("Activos", "Assets")} />
                  <div className="mt-4 space-y-2.5">
                    <MoneyField
                      emoji="💵"
                      label={t("Efectivo", "Cash")}
                      desc={t("Dinero disponible fuera del banco", "Money available outside the bank")}
                      currency={cur}
                      value={data.assets_cash}
                      onChange={(v) => set("assets_cash", v)}
                    />
                    <MoneyField
                      emoji="💰"
                      label={t("Cuentas bancarias", "Bank accounts")}
                      desc={t("Ahorros en el banco", "Savings in the bank")}
                      currency={cur}
                      value={data.assets_bank}
                      onChange={(v) => set("assets_bank", v)}
                    />
                    <MoneyField
                      emoji="🏦"
                      label={t("Fondo de retiro", "Retirement fund")}
                      desc={t("Pensión, AFP, 401k…", "Pension, 401k…")}
                      currency={cur}
                      value={data.assets_retirement}
                      onChange={(v) => set("assets_retirement", v)}
                    />
                    <MoneyField
                      emoji="📈"
                      label={t("ETFs / fondos", "ETFs / funds")}
                      desc={t("Fondos indexados y ETFs", "Index funds and ETFs")}
                      currency={cur}
                      value={data.assets_etf}
                      onChange={(v) => set("assets_etf", v)}
                    />
                    <MoneyField
                      emoji="📊"
                      label={t("Acciones", "Stocks")}
                      desc={t("Acciones individuales", "Individual stocks")}
                      currency={cur}
                      value={data.assets_stocks}
                      onChange={(v) => set("assets_stocks", v)}
                    />
                    <MoneyField
                      emoji="₿"
                      label={t("Criptomonedas", "Cryptocurrencies")}
                      desc={t("Valor aproximado actual", "Current approximate value")}
                      currency={cur}
                      value={data.assets_crypto}
                      onChange={(v) => set("assets_crypto", v)}
                    />
                    <MoneyField
                      emoji="🏠"
                      label={t("Bienes inmuebles", "Real estate")}
                      desc={t("Valor de tus propiedades", "Value of your properties")}
                      currency={cur}
                      value={data.assets_property}
                      onChange={(v) => set("assets_property", v)}
                    />

                  </div>
                </div>

                <div className="mt-8">
                  <SubQuestion title={t("Pasivos", "Liabilities")} />
                  <div className="mt-4 space-y-2.5">
                    <MoneyField
                      emoji="💳"
                      label={t("Deudas", "Debts")}
                      desc={t("Préstamos, tarjetas y otras deudas", "Loans, cards and other debts")}
                      currency={cur}
                      value={data.liabilities}
                      onChange={(v) => set("liabilities", v)}
                    />
                    <MoneyField
                      emoji="🏦"
                      label={t("Hipoteca: saldo pendiente", "Mortgage: outstanding balance")}
                      desc={t("Lo que aún debes al banco", "What you still owe the bank")}
                      currency={cur}
                      value={data.mortgage_balance}
                      onChange={(v) => set("mortgage_balance", v)}
                    />
                    <MoneyField
                      emoji="📊"
                      label={t("Hipoteca: tasa de interés", "Mortgage: interest rate")}
                      desc={t("Tasa anual actual", "Current annual rate")}
                      currency="%"
                      value={data.mortgage_rate}
                      onChange={(v) => set("mortgage_rate", v)}
                    />
                    <MoneyField
                      emoji="📅"
                      label={t("Hipoteca: plazo restante", "Mortgage: remaining term")}
                      desc={t("Años que te faltan por pagar", "Years left to pay")}
                      currency={t("años", "years")}
                      value={data.mortgage_term}
                      onChange={(v) => set("mortgage_term", v)}
                    />
                  </div>
                </div>


                <div className="mt-8">
                  <SubQuestion title={t("Tus gastos fijos mensuales", "Your monthly fixed expenses")} />
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "La letra de la hipoteca, servicios, seguros… Con esto rellenamos automáticamente tu pestaña de Gastos.",
                      "Your mortgage payment, utilities, insurance… We use this to auto-fill your Expenses tab.",
                    )}
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {FIXED_FIELDS.map((f) => (
                      <MoneyField
                        key={f.key}
                        emoji={f.emoji}
                        label={t(f.es, f.en)}
                        desc={t("Monto mensual", "Monthly amount")}
                        currency={cur}
                        value={data[f.key] as number}
                        onChange={(v) => setFixed(f.key, v)}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-elevated/40 px-5 py-3">
                    <span className="text-sm text-muted-foreground">{t("Total gastos fijos", "Total fixed expenses")}</span>
                    <span className="numeric text-lg font-semibold">{money(totalFixedExpenses(data), cur)}{t("/mes", "/mo")}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                  <span className="text-sm text-muted-foreground">{t("Patrimonio neto estimado", "Estimated net worth")}</span>
                  <span className="numeric text-xl font-semibold text-primary">{money(netWorth(data), cur)}</span>
                </div>

                <div className="mt-10">
                  <h3 className="font-display text-xl font-semibold">📄 {t("Sube tus extractos financieros", "Upload your financial statements")}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(
                      "Nuestra IA analizará automáticamente tus ingresos, gastos, inversiones y patrimonio. Aceptamos PDF y CSV de bancos, brokers y exchanges.",
                      "Our AI will automatically analyze your income, expenses, investments and net worth. We accept PDF and CSV from banks, brokers and exchanges.",
                    )}
                  </p>
                  <div className="mt-5 rounded-3xl border border-dashed border-border bg-elevated/30 p-4">
                    <StatementImporter />
                  </div>
                </div>

                <Button size="lg" className="mt-8 h-14 w-full rounded-full text-base" onClick={build}>
                  <Sparkles className="mr-2 h-4 w-4" /> {t("Construir mi Número", "Build my Number")}
                </Button>
              </Screen>
            )}

            {isBuilding && <BuildingScreen onDone={finish} />}

            {isSummary && (
              <SummaryScreen
                data={{ ...data, desired_retirement_income: desiredIncome }}
                life={life}
                plan={plan}
                currency={cur}
                onEdit={() => setStep(1)}
                onEnter={() => navigate({ to: "/dashboard" })}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {step < 9 && (
          <div className="mt-12 flex items-center gap-3">
            {step > 1 ? (
              <Button variant="ghost" size="lg" className="rounded-full" onClick={() => go(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("Atrás", "Back")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full"
                onClick={() => navigate({ to: isPatrimonio ? "/ninos" : "/" })}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />{" "}
                {isPatrimonio ? t("Perfiles", "Profiles") : t("Inicio", "Home")}
              </Button>
            )}

            <Button size="lg" className="ml-auto min-w-[160px] rounded-full" disabled={!canContinue()} onClick={() => go(1)}>
              {t("Continuar", "Continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}


        {step === 9 && (
          <div className="mt-8">
            <Button variant="ghost" size="lg" className="rounded-full" onClick={() => go(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Atrás", "Back")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── UI primitives ───────────────────────── */


function Screen({ title, hint, children }: { title?: string; hint?: string; children: React.ReactNode }) {

  return (
    <div>
      {title && (
        <h2 className="text-center font-display text-3xl font-semibold leading-[1.15] sm:text-[2.35rem]">{title}</h2>
      )}
      {hint && <p className="mx-auto mt-5 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="mt-12">{children}</div>
    </div>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function SubQuestion({ title }: { title: string }) {
  return <p className="mt-9 mb-4 text-center font-display text-lg font-medium">{title}</p>;
}

function BigNumber({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="text-center">
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="numeric text-6xl font-semibold tracking-tight text-primary sm:text-7xl"
      >
        {value}
      </motion.p>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">{suffix}</p>
    </div>
  );
}

function ScaleLabels({ left, right }: { left: string; right: string }) {
  return (
    <div className="numeric mt-3 flex justify-between text-[11px] text-muted-foreground">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onSelect,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={cn(
            "rounded-full border px-6 py-3 text-sm transition-all",
            value === o.value
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-elevated/50 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function OptionRow({
  title,
  desc,
  emoji,
  selected,
  onClick,
}: {
  title: string;
  desc?: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl border px-5 py-4 text-left transition-all",
        selected ? "border-primary bg-primary/10" : "border-border bg-elevated/50 hover:border-muted-foreground/40",
      )}
    >
      {emoji && <span className="text-lg">{emoji}</span>}
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <span
        className={cn(
          "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary text-background" : "border-border",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

function MoneyField({
  label,
  desc,
  emoji,
  value,
  onChange,
  currency,
  hint,
}: {
  label: string;
  desc?: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  currency: string;
  hint?: string;
}) {
  const t = useT();
  return (
    <label className="flex items-center gap-3.5 rounded-2xl border border-border bg-elevated/50 px-5 py-4 transition-colors focus-within:border-primary/60">
      <span className="text-lg">{emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <span className="ml-auto flex items-center gap-1.5">
        <input
          type="number"
          inputMode="decimal"
          value={value || ""}
          placeholder={hint ?? t("Escribe aquí", "Type here")}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          className="numeric w-28 border-b border-dashed border-border bg-transparent text-right text-base font-semibold outline-none transition-colors focus:border-primary/60 placeholder:text-xs placeholder:font-normal placeholder:text-muted-foreground/50"
        />
        <span className="text-xs text-muted-foreground">{currency}</span>
      </span>
    </label>
  );
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function editDistance(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (cur[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n] ?? 0;
}

function CityPicker({ value, onSelect }: { value: string; onSelect: (c: (typeof cities)[number]) => void }) {
  const t = useT();
  const [q, setQ] = useState("");
  const term = norm(q);

  // Catálogo ampliado: ciudades base + catálogo de estilo de vida (costes en USD).
  const catalog = useMemo(() => {
    const base = cities.map((c) => ({ ...c }));
    const known = new Set(base.map((c) => norm(c.name)));
    for (const lc of lifestyleCities) {
      if (known.has(norm(lc.name))) continue;
      base.push({
        name: lc.name,
        country: lc.country,
        currency: "USD",
        // Coste de vida cómodo (no mínimo de subsistencia).
        cost: comfortableCostEur({ name: lc.name, country: lc.country }),
      });
      known.add(norm(lc.name));
    }
    return base.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Búsqueda global (todas las ciudades del mundo) vía geocoding público.
  const [remote, setRemote] = useState<((typeof cities)[number] & { pop: number })[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setRemote([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=es&format=json`,
        );
        const json = (await res.json()) as {
          results?: {
            name: string;
            country?: string;
            country_code?: string;
            admin1?: string;
            population?: number;
            feature_code?: string;
          }[];
        };
        if (cancelled) return;
        const byCountry = new Map<string, (typeof cities)[number] & { pop: number }>();
        for (const r of json.results ?? []) {
          if (!r.name) continue;
          if (r.feature_code && !r.feature_code.startsWith("PPL")) continue;
          const pop = r.population ?? 0;
          const country = r.country ?? r.admin1 ?? "";
          const key = norm(country);
          const item = {
            name: r.name,
            country,
            currency: currencyForCountry(r.country_code, r.country),
            // Coste de vida cómodo estimado por país y tamaño de ciudad.
            cost: comfortableCostEur({
              name: r.name,
              country: r.country,
              countryCode: r.country_code,
              population: pop,
            }),
            pop,
          };
          const prev = byCountry.get(key);
          if (!prev || pop > prev.pop) byCountry.set(key, item);
        }
        setRemote(
          [...byCountry.values()]
            .filter((c) => c.pop >= 50000)
            .sort((a, b) => b.pop - a.pop)
            .slice(0, 4),
        );
      } catch {
        if (!cancelled) setRemote([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  const list = useMemo(() => {
    if (!term) return catalog;
    const scored = catalog
      .map((c) => {
        const n = norm(c.name);
        const co = norm(c.country);
        let score = -1;
        if (n === term) score = -1000;
        else if (n.startsWith(term)) score = 0;
        else if (n.includes(term) || co.includes(term)) score = 1;
        else {
          const d = editDistance(n, term);
          const tol = term.length <= 4 ? 1 : term.length <= 7 ? 2 : 3;
          if (d <= tol) score = 2 + d;
        }
        return { c, score };
      })
      .filter((x) => x.score >= -1000 && x.score !== -1)
      .sort((a, b) => a.score - b.score || a.c.name.localeCompare(b.c.name));
    const local = scored.map((x) => x.c);
    const seen = new Set(local.map((c) => `${norm(c.name)}|${norm(c.country)}`));
    const seenCountry = new Set(local.map((c) => norm(c.country)));
    const extras = remote.filter((c) => {
      const k = `${norm(c.name)}|${norm(c.country)}`;
      if (seen.has(k) || seenCountry.has(norm(c.country))) return false;
      seen.add(k);
      seenCountry.add(norm(c.country));
      return true;
    });
    return [...local, ...extras].slice(0, 6);
  }, [catalog, term, remote]);


  const exact = list.some((c) => norm(c.name) === term);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const keyOf = (c: { name: string; country: string }) => `${norm(c.name)}|${norm(c.country)}`;
  const selected =
    catalog.find((c) => c.name === value) ??
    remote.find((c) => c.name === value) ??
    (value ? { name: value, country: "", currency: "USD", cost: comfortableCostEur({ name: value }) } : undefined);
  const cityCost = (c: (typeof cities)[number]) => {
    const v = convertAmount(c.cost, "EUR", c.currency);
    const step = v >= 100000 ? 5000 : v >= 10000 ? 500 : v >= 1000 ? 50 : 10;
    return Math.round(v / step) * step;
  };
  const customName = q.trim().replace(/\s+/g, " ");

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-elevated/50 px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Escribe cualquier ciudad…", "Type any city…")}
          className="h-14 flex-1 bg-transparent text-base outline-none"
        />
      </div>
      <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {searching && (
          <p className="px-1 py-1 text-xs text-muted-foreground">
            {t("Buscando ciudades en todo el mundo…", "Searching cities worldwide…")}
          </p>
        )}
        {customName.length >= 2 && !exact && (
          <button
            onClick={() => {
              const pretty = customName.charAt(0).toUpperCase() + customName.slice(1);
              setPickedKey(`${norm(customName)}|`);
              setQ(pretty);
              onSelect({
                name: pretty,
                country: "",
                currency: "USD",
                cost: comfortableCostEur({ name: pretty }),
              });
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-left text-sm transition-colors",
              "border-primary/50 bg-primary/5 hover:bg-primary/10",
            )}
          >
            <span className="font-medium">
              {t("Usar", "Use")} “{customName}”
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {t("análisis en USD, ajustable después", "analysis in USD, editable later")}
            </span>
          </button>
        )}

        {list.map((c) => (
          <button
            key={`${c.name}-${c.country}`}
            onClick={() => {
              setPickedKey(keyOf(c));
              setQ(c.name);
              onSelect(c);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              (pickedKey ? pickedKey === keyOf(c) : value === c.name)
                ? "border-primary bg-primary/10"
                : "border-transparent bg-elevated/40 hover:bg-elevated",
            )}
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.country}</span>
            <span className="numeric ml-auto text-xs text-muted-foreground">
              ~{new Intl.NumberFormat("es").format(cityCost(c))} {c.currency}/mes
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("Moneda del análisis:", "Analysis currency:")}{" "}
          <span className="font-medium text-foreground">{selected.currency}</span>{" "}
          {t("· podrás cambiarla más adelante.", "· you can change it later.")}
        </p>
      )}
    </div>
  );
}


/* ───────────────────────── Pantalla 10: IA trabajando ───────────────────────── */

function BuildingScreen({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [done, setDone] = useState(0);

  const BUILD_TASKS = useMemo(
    () => [
      t("Detectando ingresos", "Detecting income"),
      t("Clasificando transacciones", "Classifying transactions"),
      t("Calculando gastos mensuales", "Calculating monthly expenses"),
      t("Detectando inversiones", "Detecting investments"),
      t("Analizando criptomonedas", "Analyzing cryptocurrencies"),
      t("Calculando patrimonio", "Calculating net worth"),
      t("Detectando suscripciones", "Detecting subscriptions"),
      t("Calculando tu patrimonio objetivo", "Calculating your target net worth"),
      t("Estimando tu edad de libertad financiera", "Estimating your financial freedom age"),
      t("Construyendo recomendaciones personalizadas", "Building personalized recommendations"),
    ],
    [t],
  );

  useEffect(() => {
    if (done >= BUILD_TASKS.length) {
      const timeout = setTimeout(onDone, 700);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setDone((d) => d + 1), done === 0 ? 500 : 620);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, onDone]);

  return (
    <div className="py-8">
      <div className="relative mx-auto h-24 w-24">
        <motion.span
          className="absolute inset-0 rounded-full border border-primary/30"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        <motion.span
          className="absolute inset-2 rounded-full border border-primary/40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.3 }}
        />
        <div className="wealth-gradient absolute inset-5 flex items-center justify-center rounded-full">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
            <Compass className="h-7 w-7 text-background" />
          </motion.div>
        </div>
      </div>

      <h2 className="mt-10 text-center font-display text-3xl font-semibold sm:text-4xl">{t("Estamos construyendo tu Número…", "We're building your Number…")}</h2>
      <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        {t("Nuestra IA está analizando toda tu información financiera.", "Our AI is analyzing all your financial information.")}
      </p>

      <div className="mx-auto mt-12 max-w-md space-y-2.5">
        {BUILD_TASKS.map((task, i) => {
          const state = i < done ? "done" : i === done ? "active" : "idle";
          return (
            <motion.div
              key={task}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: state === "idle" ? 0.35 : 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                state === "done"
                  ? "border-primary/25 bg-primary/5"
                  : state === "active"
                    ? "border-border bg-elevated/60"
                    : "border-transparent",
              )}
            >
              {state === "done" ? (
                <Check className="h-4 w-4 text-primary" />
              ) : state === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-border" />
              )}
              <span className={state === "done" ? "text-foreground" : "text-muted-foreground"}>{task}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="mx-auto mt-10 h-1 max-w-md overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${(done / BUILD_TASKS.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Resumen ───────────────────────── */

function SummaryScreen({
  data,
  life,
  plan,
  currency,
  onEnter,
  onEdit,
}: {
  data: OnboardingData;
  life: LifeData;
  plan: ReturnType<typeof buildPlan>;
  currency: string;
  onEnter: () => void;
  onEdit: () => void;
}) {
  const t = useT();
  const insights = buildInsights(plan, data, life, currency);
  const assets = totalAssets(data);
  const dist = [
    { label: t("Ahorros", "Savings"), value: data.assets_cash + data.assets_bank, icon: <Banknote className="h-3.5 w-3.5" /> },
    { label: t("Inversiones", "Investments"), value: data.assets_etf + data.assets_stocks + data.assets_retirement, icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { label: t("Cripto", "Crypto"), value: data.assets_crypto, icon: <Bitcoin className="h-3.5 w-3.5" /> },
    { label: t("Inmuebles", "Real estate"), value: data.assets_property, icon: <Building2 className="h-3.5 w-3.5" /> },
  ].filter((d) => d.value > 0);

  const metrics = [
    { emoji: "💰", label: t("Patrimonio actual", "Current net worth"), value: money(plan.netWorth, currency) },
    { emoji: "📈", label: t("Ingreso mensual", "Monthly income"), value: money(plan.income, currency) },
    { emoji: "💳", label: t("Gasto mensual", "Monthly expenses"), value: money(plan.expenses, currency) },
    { emoji: "💵", label: t("Tasa de ahorro", "Savings rate"), value: `${plan.savingsRate.toFixed(0)}%` },
  ];

  return (
    <div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center text-4xl">
        🎉
      </motion.div>
      <h2 className="mt-5 text-center font-display text-4xl font-semibold sm:text-5xl">{t("Tu Número está listo.", "Your Number is ready.")}</h2>
      <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        {data.full_name
          ? t(`${data.full_name}, esto es lo que la IA ha entendido de tus finanzas.`, `${data.full_name}, this is what our AI has understood about your finances.`)
          : t("Esto es lo que la IA ha entendido de tus finanzas.", "This is what our AI has understood about your finances.")}
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="surface p-5"
          >
            <span className="text-base">{m.emoji}</span>
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{m.label}</p>
            <p className="numeric mt-1.5 text-xl font-semibold">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {dist.length > 0 && (
        <div className="surface mt-3 p-6">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">📊 {t("Distribución del patrimonio", "Net worth distribution")}</p>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
            {dist.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / assets) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 * i, ease: "easeOut" }}
                className="h-full"
                style={{ background: `color-mix(in oklab, var(--color-primary) ${100 - i * 20}%, transparent)` }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {dist.map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{d.icon}</span>
                <span className="text-muted-foreground">{d.label}</span>
                <span className="numeric ml-auto font-medium">{Math.round((d.value / assets) * 100)}%</span>
                <span className="numeric w-24 text-right text-muted-foreground">{compact(d.value, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface mt-3 overflow-hidden p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="order-first">

            <p className="text-[11px] uppercase tracking-[0.14em] text-primary">🎯 Your Number</p>
            <p className="mt-2 text-4xl font-semibold"><Amount full={money(plan.targetCapital, currency)} short={compact(plan.targetCapital, currency)} from="md" /></p>
            {plan.mode === "home" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("La entrada de tu primera vivienda", "The down payment for your first home")} ({money(plan.homePrice, currency)}){". "}
                {plan.monthlyToGoal > 0
                  ? t(
                      `Necesitas ahorrar ${money(plan.monthlyToGoal, currency)} al mes para lograrlo en 3 años.`,
                      `You need to save ${money(plan.monthlyToGoal, currency)} per month to get there in 3 years.`,
                    )
                  : t("Ya tienes cubierta la entrada.", "You already have the down payment covered.")}
              </p>
            ) : plan.mode === "business" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {life.goal === "otro"
                  ? life.goal_note.trim()
                    ? `${t("El capital para", "The capital for")}: ${life.goal_note.trim()}`
                    : t("El capital para tu objetivo", "The capital for your goal")
                  : t("El capital para montar tu negocio", "The capital to start your business")}{". "}
                {plan.monthlyToGoal > 0
                  ? t(
                      `Necesitas ahorrar ${money(plan.monthlyToGoal, currency)} al mes para lograrlo en 3 años.`,
                      `You need to save ${money(plan.monthlyToGoal, currency)} per month to get there in 3 years.`,
                    )
                  : t("Ya tienes el capital cubierto.", "You already have the capital covered.")}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("El capital que te permite vivir con", "The capital that lets you live on")} {money(plan.desiredIncome, currency)} {t("al mes", "per month")}
                {life.city ? ` ${t("en", "in")} ${life.city}` : ""}.
              </p>
            )}
          </div>
          <div className="sm:text-right">
            {plan.mode === "business" || plan.mode === "home" ? (
              <>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  ⏳ {plan.mode === "business" ? t("Montar tu negocio", "Start your business") : t("Comprar tu vivienda", "Buy your home")}
                </p>
                <p className="numeric mt-2 text-4xl font-semibold text-primary">
                  {plan.monthsToGoal > 0
                    ? `${Math.max(1, Math.ceil(plan.monthsToGoal / 12))} ${plan.monthsToGoal <= 12 ? t("año", "year") : t("años", "years")}`
                    : t("Listo", "Ready")}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.monthsToGoal > 0
                    ? t(
                        `A tu ritmo de ahorro actual lo alcanzas a los ${(data.age ?? 30) + Math.max(1, Math.ceil(plan.monthsToGoal / 12))} años.`,
                        `At your current savings rate you reach it at age ${(data.age ?? 30) + Math.max(1, Math.ceil(plan.monthsToGoal / 12))}.`,
                      )
                    : t("Ya tienes el capital necesario.", "You already have the capital you need.")}
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">📅 {t("Libertad financiera", "Financial freedom")}</p>
                <p className="numeric mt-2 text-4xl font-semibold text-primary">{plan.freedomAge} {t("años", "years")}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t("Tu meta eran los", "Your goal was")} {plan.retireAge} {t("años.", "years old.")}</p>
              </>
            )}
          </div>

        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>📈 {t("Progreso hacia tu Número", "Progress towards your Number")}</span>
            <span className="numeric text-foreground">{plan.progress.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(1, plan.progress)}%` }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">✨ {t("AI Insights", "AI Insights")}</p>
        <div className="mt-4 space-y-2.5">
          {insights.map((text, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i }}
              className="flex gap-3 rounded-2xl border border-border bg-elevated/50 px-5 py-4"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5" /> {t("Todas tus respuestas quedan guardadas y las puedes editar cuando quieras.", "All your answers are saved and you can edit them anytime.")}
      </p>

      <Button size="lg" className="mt-5 h-14 w-full rounded-full text-base" onClick={onEnter}>
        {t("Entrar a mi dashboard", "Enter my dashboard")} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <Button variant="ghost" size="lg" className="mt-2 w-full rounded-full" onClick={onEdit}>
        <Pencil className="mr-2 h-3.5 w-3.5" /> {t("Editar mis respuestas", "Edit my answers")}
      </Button>
    </div>
  );
}
