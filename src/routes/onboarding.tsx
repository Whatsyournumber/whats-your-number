import { queueAppTour } from "@/components/app-tour";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  FileUp,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";


import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SPEND_PLAN_FIELDS, totalSpendPlan, type SpendPlanKey } from "@/lib/onboarding";

/** Categorías base del plan de gastos del onboarding, agrupadas. */
const ONBOARDING_FIXED_KEYS: SpendPlanKey[] = [
  "fixed_housing",
  "fixed_utilities",
  "fixed_insurance",
  "fixed_transport",
  "fixed_subscriptions",
];
const ONBOARDING_VARIABLE_KEYS: SpendPlanKey[] = [
  "fixed_groceries",
  "fixed_restaurants",
  "fixed_delivery",
  "fixed_professional",
  "fixed_travel",
  "fixed_nightlife",
  "fixed_shopping",
  "fixed_health",
  "fixed_family",
  "fixed_other",
];
const ONBOARDING_SPEND_KEYS: SpendPlanKey[] = [...ONBOARDING_FIXED_KEYS, ...ONBOARDING_VARIABLE_KEYS];
/** Mínimo de categorías con monto para poder construir tu número. */
const MIN_SPEND_CATEGORIES = 5;
import { seedSpendPlanFromOnboarding } from "@/lib/spend-plan-seed";
import { syncHomeHolding } from "@/hooks/use-holdings";
import { StatementImporter } from "@/components/statement-importer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  minMonthlyForRetirement,
  buildPlan,
  childrenOptions,
  cities,
  emptyLife,
  emptyOnboarding,
  estimateDesiredIncome,
  goals,
  housingOptions,
  lifestyles,
  analysisScopeOptions,
  maritalOptions,
  money,
  netWorth,
  plansChildrenOptions,
  travelOptions,
  type LifeData,
  type OnboardingData,
  currencies,
  currencyDisplay,
} from "@/lib/onboarding";
import { useFxRates } from "@/hooks/use-fx-rates";

import { lifestyleCities } from "@/lib/lifestyle-cities";
import { comfortableCostEur } from "@/lib/city-cost";
import { currencyForCountry } from "@/lib/country-currency";

import { cn } from "@/lib/utils";
import { defaultCurrency } from "@/lib/geo";
import { useT, LanguageToggle } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";


const GOALS_EN: Record<string, string> = {
  libertad: "Achieve financial freedom",
  patrimonio: "Grow my net worth",
  gastos: "Understand, control and track my spending",
  vivienda: "Save for a home",
  negocio: "Start my business",
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

  const [data, setData] = useState<OnboardingData>({ ...emptyOnboarding, currency: defaultCurrency(), monthly_expenses: 0 });
  const [life, setLife] = useState<LifeData>(emptyLife);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customReturn, setCustomReturn] = useState(false);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const salaryFieldRef = useRef<HTMLDivElement | null>(null);
  const spendPlanRef = useRef<HTMLDivElement | null>(null);

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
        const next = { ...emptyOnboarding, currency: defaultCurrency() };
        for (const key of Object.keys(emptyOnboarding) as (keyof OnboardingData)[]) {
          const v = r[key];
          if (v !== null && v !== undefined) {
            // Ningún importe del perfil puede ser negativo: limpiamos valores corruptos.
            const num = Number(v);
            (next as Record<string, unknown>)[key] =
              typeof v === "string" ? v : Number.isFinite(num) ? Math.max(0, num) : 0;
          }
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
    // La vivienda del onboarding también vive en Mis datos: valor como activo
    // (Propiedades) y saldo de la hipoteca como pasivo ligado.
    await syncHomeHolding(supabase, user.id, { housing: life.housing, assets_property: data.assets_property, mortgage_balance: data.mortgage_balance }, t("Mi vivienda", "My home"));
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
  const setFixed = (key: SpendPlanKey, value: number) =>
    setData((d) => {
      const next = { ...d, [key]: value };
      const planTotal = totalSpendPlan(next);
      if (next.monthly_expenses < planTotal) next.monthly_expenses = planTotal;
      return next;
    });
  const setL = <K extends keyof LifeData>(key: K, value: LifeData[K]) => setLife((l) => ({ ...l, [key]: value }));

  // Categorías personalizadas que la persona agrega a su plan en el onboarding.
  const [customCats, setCustomCats] = useState<{ id: string; name: string; amount: number }[]>([]);
  const addCustomCat = () =>
    setCustomCats((cats) => [...cats, { id: `cc-${Date.now()}-${cats.length}`, name: "", amount: 0 }]);
  const setCustomCat = (id: string, patch: Partial<{ name: string; amount: number }>) =>
    setCustomCats((cats) => cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const customCatsTotal = customCats.reduce((s, c) => s + (c.amount || 0), 0);

  const cur = data.currency || defaultCurrency();
  const hasPartner = life.marital_status === "Casado" || life.marital_status === "En pareja";
  // Análisis de hogar: pedimos ingresos y gastos de las dos personas.
  const household = hasPartner && life.analysis_scope === "pareja";
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

  // El aviso de campos obligatorios se marca solo en la caja del encabezado del plan.
  const filledSpendCount =
    ONBOARDING_SPEND_KEYS.filter((k) => (data[k] ?? 0) > 0).length +
    customCats.filter((c) => c.amount > 0 && c.name.trim()).length;
  const spendPlanMissing = filledSpendCount < MIN_SPEND_CATEGORIES;
  const planMissing = showRequiredErrors && spendPlanMissing;

  const go = (dir: 1 | -1) => {
    const next = Math.min(SUMMARY_STEP, Math.max(1, step + dir));
    setStep(next);
    void persist({ current_step: Math.min(QUESTIONS, next) });
  };


  const build = () => {
    const salaryMissing = data.income_salary <= 0;
    if (salaryMissing || spendPlanMissing) {
      setShowRequiredErrors(true);
      const firstInvalid = salaryMissing ? salaryFieldRef.current : spendPlanRef.current;
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowRequiredErrors(false);
    setStep(BUILD_STEP);
    void persist({ current_step: QUESTIONS, desired_retirement_income: desiredIncome });
  };

  const finish = () => {
    queueAppTour();
    setStep(SUMMARY_STEP);
    void persist({ completed: true, completed_at: new Date().toISOString(), desired_retirement_income: desiredIncome });
    // El plan del onboarding queda listo como plan de gastos personalizado.
    seedSpendPlanFromOnboarding(
      user?.id ?? null,
      data,
      customCats
        .filter((c) => c.amount > 0 && c.name.trim())
        .map((c) => ({ id: `custom:${norm(c.name)}`, label: c.name.trim(), amount: c.amount })),
    );
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
    if (step === 4)
      return (
        !!life.marital_status &&
        (!hasPartner || !!life.analysis_scope) &&
        !!life.children &&
        !!life.plans_children
      );
    if (step === 5) return !!life.lifestyle && !!life.travel_frequency;
    if (step === 6) return !!life.city;
    if (step === 7) return !!life.housing;
    // Salario y las 5 categorías del plan de gastos son obligatorios para construir el número.
    if (step === 9) return data.income_salary > 0 && filledSpendCount >= MIN_SPEND_CATEGORIES;
    return true;
  };

  const progress = (Math.min(step, QUESTIONS) / QUESTIONS) * 100;
  const isBuilding = step === BUILD_STEP;
  const isSummary = step === SUMMARY_STEP;

  // The final result must begin at its celebration, even when the previous
  // questionnaire was scrolled to the bottom on a small screen.
  useEffect(() => {
    if (step === SUMMARY_STEP) window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

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
            <span className="numeric w-16 shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground">
              {saving ? t("Guardando…", "Saving…") : isSummary ? "" : `${step} / ${QUESTIONS}`}
            </span>
            <LanguageToggle />
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

      <div
        className={`relative mx-auto flex min-h-[calc(100vh-57px)] flex-col justify-center px-5 ${
          isSummary ? "max-w-5xl justify-start py-4 sm:py-5" : "max-w-2xl py-10 sm:py-16"
        }`}
      >
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
                  {hasPartner && (
                    <Reveal>
                      <SubQuestion title={t("¿Sobre quién hacemos el análisis?", "Who should we analyze?")} />
                      <ChipGroup
                        options={analysisScopeOptions.map((o) => ({ value: o.value, label: t(o.label, o.en) }))}
                        value={life.analysis_scope}
                        onSelect={(v) => setL("analysis_scope", v)}
                      />
                    </Reveal>
                  )}
                  {life.marital_status && (!hasPartner || life.analysis_scope) && (
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


            {step === 6 && (
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
                                  emoji="🏠"
                                  label={t("Valor de la propiedad", "Property value")}
                                  desc={t("Valor de tu vivienda", "Current home value")}
                                  currency={cur}
                                  value={data.assets_property}
                                  hint={t("Escribe aquí", "Type here")}
                                  onChange={(v) => set("assets_property", v)}
                                />
                                <MoneyField
                                  emoji="🏦"
                                  label={t("Saldo pendiente", "Outstanding balance")}
                                  desc={t("Deuda con el banco", "Bank debt")}
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
                                  desc={t("Años por pagar", "Years left to pay")}
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
                                desc={t("Alquiler mensual", "Monthly rent payment")}
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
                title={t(
                  "Hablemos de tu patrimonio",
                  "Let's talk about your net worth",
                )}
              >
                <p className="mx-auto max-w-xl text-center text-sm text-muted-foreground">
                  🤖 {t(
                    "No te preocupes si no conoces estos números. Nuestra IA puede calcularlos automáticamente analizando tus extractos financieros.",
                    "Don't worry if you don't know these numbers. Our AI can calculate them automatically by analyzing your financial statements.",
                  )}{" "}
                  <span className="text-foreground">{t("Puedes completarlo luego", "You can complete it later")}</span>.
                </p>

                <div className="mt-8 space-y-1">
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t("Moneda", "Currency")}</p>
                      <p className="truncate text-[11px] leading-tight text-muted-foreground/80">{t("Donde verás tus importes", "Where your amounts appear")}</p>
                    </div>
                    <select
                      className="h-8 shrink-0 rounded-full border-0 bg-transparent px-0 text-sm font-medium focus:outline-none focus:ring-0"
                      value={cur}
                      onChange={(e) => set("currency", e.target.value)}
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {currencyDisplay(c.code, c.symbol)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasPartner && (
                    <div className="flex items-center justify-between gap-4 border-t border-border/20 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t("Análisis de", "Analysis for")}</p>
                        <p className="truncate text-[11px] leading-tight text-muted-foreground/80">
                          {t("Tuyo o del hogar", "Yours or household")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1 rounded-full p-1">
                        {analysisScopeOptions.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setL("analysis_scope", o.value)}
                            className={cn(
                              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition",
                              life.analysis_scope === o.value
                                ? "bg-primary/15 text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {t(o.label, o.en)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>



                <div className="mt-6">
                  <SubQuestion
                    title={
                      household
                        ? t("Tus ingresos mensuales (mandatorio)", "Your monthly income (required)")
                        : t("Ingresos y flujo mensual (mandatorio)", "Income and monthly flow (required)")
                    }
                  />
                  <div className="mt-4 space-y-2.5">
                    <div ref={salaryFieldRef}>
                      <MoneyField
                        emoji="🪙"
                        label={t("Salario mensual", "Monthly salary")}
                        desc={t("Neto tras impuestos", "Net, after tax")}
                        currency={cur}
                        value={data.income_salary}
                        onChange={(v) => set("income_salary", v)}
                        error={showRequiredErrors && data.income_salary <= 0}
                      />
                    </div>
                    <MoneyField
                      emoji="🎯"
                      label={t("Bonos / variables", "Bonuses / variable")}
                      desc={t("Promedio mensual", "Monthly average")}
                      currency={cur}
                      value={data.income_bonus}
                      onChange={(v) => set("income_bonus", v)}
                    />
                    <MoneyField
                      emoji="🏘"
                      label={t("Alquileres", "Rental income")}
                      desc={t("Rentas mensuales", "Rent you receive")}
                      currency={cur}
                      value={data.income_rent}
                      onChange={(v) => set("income_rent", v)}
                    />
                    <MoneyField
                      emoji="✨"
                      label={t("Otros ingresos", "Other income")}
                      desc={t("Dividendos y extras", "Dividends and extras")}
                      currency={cur}
                      value={data.income_other}
                      onChange={(v) => set("income_other", v)}
                    />
                  </div>
                </div>

                {household && (
                  <div className="mt-8">
                    <SubQuestion title={t("Ingresos y gastos de tu pareja", "Your partner's income and expenses")} />
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(
                        "Los sumamos a los tuyos para el número del hogar.",
                        "We add them to yours for your household number.",
                      )}
                    </p>
                    <div className="mt-4 space-y-2.5">
                      <MoneyField
                        emoji="🪙"
                        label={t("Salario mensual de tu pareja", "Partner's monthly salary")}
                        desc={t("Neto tras impuestos", "Net, after tax")}
                        currency={cur}
                        value={data.income_partner_salary ?? 0}
                        onChange={(v) => set("income_partner_salary", v)}
                      />
                      <MoneyField
                        emoji="✨"
                        label={t("Otros ingresos de tu pareja", "Partner's other income")}
                        desc={t("Bonos y dividendos", "Bonuses, dividends")}
                        currency={cur}
                        value={data.income_partner_other ?? 0}
                        onChange={(v) => set("income_partner_other", v)}
                      />
                      <MoneyField
                        emoji="💳"
                        label={t("Gastos mensuales de tu pareja", "Partner's monthly expenses")}
                        desc={t("Fuera de tus fijos", "Not in fixed costs")}
                        currency={cur}
                        value={data.expenses_partner ?? 0}
                        onChange={(v) => set("expenses_partner", v)}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <SubQuestion
                    title={
                      household
                        ? t("Activos (en pareja)", "Assets (as a couple)")
                        : t("Activos", "Assets")
                    }
                  />
                  <div className="mt-4 space-y-2.5">
                    <MoneyField
                      emoji="💵"
                      label={t("Efectivo", "Cash")}
                      desc={t("Efectivo disponible", "Available cash")}
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
                      desc={t("Pensión, AFP, 401k", "Pension, 401k")}
                      currency={cur}
                      value={data.assets_retirement}
                      onChange={(v) => set("assets_retirement", v)}
                    />
                    <MoneyField
                      emoji="📈"
                      label={t("ETFs / fondos", "ETFs / funds")}
                      desc={t("Fondos indexados", "Index funds, ETFs")}
                      currency={cur}
                      value={data.assets_etf}
                      onChange={(v) => set("assets_etf", v)}
                    />
                    <MoneyField
                      emoji="📊"
                      label={t("Acciones", "Stocks")}
                      desc={t("Listadas en bolsa", "Individual stocks")}
                      currency={cur}
                      value={data.assets_stocks}
                      onChange={(v) => set("assets_stocks", v)}
                    />
                    <MoneyField
                      emoji="₿"
                      label={t("Criptomonedas", "Cryptocurrencies")}
                      desc={t("Valor aproximado", "Approximate value")}
                      currency={cur}
                      value={data.assets_crypto}
                      onChange={(v) => set("assets_crypto", v)}
                    />
                    <MoneyField
                      emoji="🏠"
                      label={t("Bienes inmuebles", "Real estate")}
                      desc={t("Tus propiedades", "Your properties")}
                      currency={cur}
                      value={data.assets_property}
                      onChange={(v) => set("assets_property", v)}
                    />

                  </div>
                </div>

                <div className="mt-8">
                  <SubQuestion
                    title={
                      household
                        ? t("Pasivos (en pareja)", "Liabilities (as a couple)")
                        : t("Pasivos", "Liabilities")
                    }
                  />
                  <div className="mt-4 space-y-2.5">
                    <MoneyField
                      emoji="💳"
                      label={t("Deudas", "Debts")}
                      desc={t("Préstamos y tarjetas", "Loans and cards")}
                      currency={cur}
                      value={data.liabilities}
                      onChange={(v) => set("liabilities", v)}
                    />
                    <MoneyField
                      emoji="🏦"
                      label={t("Hipoteca: saldo pendiente", "Mortgage: outstanding balance")}
                      desc={t("Deuda con el banco", "Bank debt")}
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
                      desc={t("Años por pagar", "Years left to pay")}
                      currency={t("años", "years")}
                      value={data.mortgage_term}
                      onChange={(v) => set("mortgage_term", v)}
                    />
                  </div>
                </div>


                <div ref={spendPlanRef} className="mt-8 scroll-mt-24">
                  <div
                    className={cn(
                      "mt-9 mb-4 rounded-2xl border bg-elevated/50 px-5 py-4 text-center transition-colors focus-within:border-primary/60",
                      planMissing ? "border-destructive" : "border-border",
                    )}
                  >
                    <p className="font-display text-lg font-medium">
                      {household
                        ? t("Tu plan de gastos mensuales (en pareja, mandatorio)", "Your monthly spending plan (as a couple, required)")
                        : t("Tu plan de gastos mensuales (mandatorio)", "Your monthly spending plan (required)")}
                    </p>
                  </div>
                  {planMissing && (
                    <p role="alert" className="-mt-2 mb-3 text-center text-sm font-medium text-destructive">
                      {t(
                        `Debes llenar ${MIN_SPEND_CATEGORIES} categorías mínimo`,
                        `You must fill in at least ${MIN_SPEND_CATEGORIES} categories`,
                      )}
                    </p>
                  )}
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `Crea tu presupuesto mensual por categoría: llena mínimo ${MIN_SPEND_CATEGORIES} categorías y luego podrás cambiarlas o editarlas.`,
                      `Create your monthly budget by category: fill in at least ${MIN_SPEND_CATEGORIES} categories and you can change or edit them later.`,
                    )}
                  </p>
                  <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t("Gastos fijos", "Fixed expenses")}
                  </p>
                  <div className="space-y-2.5">
                    {SPEND_PLAN_FIELDS.filter((f) => ONBOARDING_FIXED_KEYS.includes(f.key)).map((f) => (
                      <MoneyField
                        key={f.key}
                        emoji={f.emoji}
                        label={t(f.es, f.en)}
                        currency={cur}
                        value={data[f.key]}
                        onChange={(v) => setFixed(f.key, v)}
                      />
                    ))}
                  </div>
                  <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t("Gastos variables", "Variable expenses")}
                  </p>
                  <div className="space-y-2.5">
                    {SPEND_PLAN_FIELDS.filter((f) => ONBOARDING_VARIABLE_KEYS.includes(f.key)).map((f) => (
                      <MoneyField
                        key={f.key}
                        emoji={f.emoji}
                        label={t(f.es, f.en)}
                        currency={cur}
                        value={data[f.key]}
                        onChange={(v) => setFixed(f.key, v)}
                      />
                    ))}
                    {customCats.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3.5 rounded-2xl border border-border bg-elevated/50 px-5 py-4 transition-colors focus-within:border-primary/60"
                      >
                        <span className="text-lg">✨</span>
                        <input
                          type="text"
                          value={c.name}
                          placeholder={t("Nombre de la categoría", "Category name")}
                          onChange={(e) => setCustomCat(c.id, { name: e.target.value })}
                          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                        />
                        <span className="ml-auto flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            value={c.amount || ""}
                            placeholder={t("Escribe aquí", "Type here")}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) => {
                              const n = Number(e.target.value || 0);
                              setCustomCat(c.id, { amount: Number.isFinite(n) ? Math.max(0, n) : 0 });
                            }}
                            className="numeric w-28 max-sm:w-24 border-b border-dashed border-border bg-transparent text-right text-base font-semibold outline-none transition-colors focus:border-primary/60 placeholder:text-xs placeholder:font-normal placeholder:text-muted-foreground/50"
                          />
                          <span className="text-xs text-muted-foreground">{cur}</span>
                        </span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCustomCat}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-5 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" /> {t("Añadir categoría", "Add category")}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-elevated/40 px-5 py-3">
                    <span className="text-sm text-muted-foreground">{t("Gastos totales aprox", "Approximate total expenses")}</span>
                    <span className="numeric text-lg font-semibold">{money(totalSpendPlan(data) + customCatsTotal, cur)}{t("/mes", "/mo")}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                  <span className="text-sm text-muted-foreground">{t("Patrimonio neto estimado", "Estimated net worth")}</span>
                  <span className="numeric text-xl font-semibold text-primary">{money(netWorth(data), cur)}</span>
                </div>

                <div className="mt-10">
                  <h3 className="font-display flex items-center gap-2.5 text-xl font-semibold">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <FileUp className="h-5 w-5" />
                    </span>
                    {t("Sube tus Estados financieros", "Upload your financial statements")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      "La IA clasifica tus movimientos en tu plan de gastos. 100% encriptado.",
                      "AI classifies your transactions into your spending plan. 100% encrypted.",
                    )}
                  </p>
                  <div className="mt-5 rounded-3xl border border-dashed border-border bg-elevated/30 p-4">
                    <StatementImporter showHeader={false} showCompletionPopup={false} />
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
              <Button asChild variant="ghost" size="lg" className="rounded-full">
                <Link to={isPatrimonio ? "/ninos" : "/"}>
                  <ArrowLeft className="mr-2 h-4 w-4" />{" "}
                  {isPatrimonio ? t("Perfiles", "Profiles") : t("Inicio", "Home")}
                </Link>
              </Button>
            )}

            <Button size="lg" className="ml-auto min-w-[160px] rounded-full" disabled={!canContinue()} onClick={() => go(1)}>
              {t("Continuar", "Continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}


        {step === 9 && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => go(-1)}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" /> {t("Atrás", "Back")}
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

function SubQuestion({ title, error = false }: { title: string; error?: boolean }) {
  return (
    <p className={cn("mt-9 mb-4 text-center font-display text-lg font-medium", error && "text-destructive")}>
      {title}
    </p>
  );
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
  error = false,
}: {
  label: string;
  desc?: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  currency: string;
  hint?: string;
  error?: boolean;
}) {
  const t = useT();
  return (
    <div>
      <label
        className={cn(
          "flex items-center gap-3.5 rounded-2xl border bg-elevated/50 px-5 py-4 transition-colors focus-within:border-primary/60",
          error ? "border-destructive" : "border-border",
        )}
      >
        <span className="text-lg">{emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
        </div>
        <span className="ml-auto flex items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={value || ""}
            aria-invalid={error}
            placeholder={hint ?? t("Escribe aquí", "Type here")}
            // La rueda del ratón sobre un input numérico cambiaba el importe sin querer.
            onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => {
              const n = Number(e.target.value || 0);
              onChange(Number.isFinite(n) ? Math.max(0, n) : 0);
            }}
            className={cn(
              "numeric w-28 max-sm:w-20 border-b border-dashed bg-transparent text-right text-base font-semibold outline-none transition-colors focus:border-primary/60 placeholder:text-xs placeholder:font-normal placeholder:text-muted-foreground/50",
              error ? "border-destructive" : "border-border",
            )}
          />
          <span className="text-xs text-muted-foreground">{currency}</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {t("Debes llenar este campo", "You must fill in this field")}
        </p>
      )}
    </div>
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

function CityPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (c: (typeof cities)[number]) => void;
}) {
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

const CONFETTI = [
  { x: -104, y: -42, c: "var(--color-chart-1)", r: -120 },
  { x: -86, y: -76, c: "var(--color-chart-2)", r: 160 },
  { x: -64, y: -98, c: "var(--color-chart-3)", r: -180 },
  { x: -34, y: -112, c: "var(--color-chart-4)", r: 130 },
  { x: 0, y: -120, c: "var(--color-chart-5)", r: -150 },
  { x: 34, y: -112, c: "var(--color-chart-6)", r: 180 },
  { x: 64, y: -98, c: "var(--color-chart-7)", r: -130 },
  { x: 86, y: -76, c: "var(--color-chart-8)", r: 150 },
  { x: 104, y: -42, c: "var(--color-chart-1)", r: -170 },
  { x: -118, y: 2, c: "var(--color-chart-3)", r: 140 },
  { x: 118, y: 2, c: "var(--color-chart-5)", r: -140 },
  { x: -78, y: -26, c: "var(--color-chart-7)", r: 190 },
  { x: 78, y: -26, c: "var(--color-chart-2)", r: -190 },
  { x: -48, y: -62, c: "var(--color-chart-6)", r: 125 },
  { x: 48, y: -62, c: "var(--color-chart-4)", r: -125 },
  { x: -18, y: -86, c: "var(--color-chart-8)", r: 170 },
  { x: 18, y: -86, c: "var(--color-chart-1)", r: -170 },
];

function PartyPopper() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: [0.5, 1.22, 0.94, 1] }}
      transition={{ duration: 0.72, ease: "easeOut" }}
      className="relative flex h-20 w-64 shrink-0 items-center justify-center"
    >
      {CONFETTI.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, x: 0, y: 16, scale: 0.25, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, p.x * 0.72, p.x, p.x * 1.08],
            y: [16, p.y * 0.72, p.y, p.y + 28],
            scale: [0.25, 1.35, 1, 0.7],
            rotate: [0, p.r * 0.55, p.r, p.r * 1.3],
          }}
          transition={{ duration: 1.45, delay: 0.12 + (i % 5) * 0.035, ease: "easeOut", times: [0, 0.18, 0.68, 1] }}
          className="absolute h-2 w-2 rounded-[2px]"
          style={{ background: p.c }}
        />
      ))}
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.15, rotate: -42, y: 12 }}
        animate={{
          opacity: [0, 1, 1, 1, 1, 1],
          scale: [0.15, 1.55, 0.86, 1.18, 0.96, 1],
          rotate: [-42, 22, -13, 8, -3, 0],
          y: [12, -5, 2, -2, 0, 0],
        }}
        transition={{ duration: 1.15, ease: "easeOut", times: [0, 0.22, 0.42, 0.62, 0.8, 1] }}
        className="relative text-5xl leading-none"
      >
        🎉
      </motion.span>
    </motion.div>
  );
}


export function SummaryScreen({
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

  const metrics = [
    {
      emoji: "💰",
      label: t("Patrimonio actual", "Current net worth"),
      short: t("Patrimonio", "Net worth"),
      value: money(plan.netWorth, currency),
    },
    {
      emoji: "📈",
      label: t("Ingreso mensual", "Monthly income"),
      short: t("Ingreso", "Income"),
      value: money(plan.income, currency),
    },
    {
      emoji: "💳",
      label: t("Gasto mensual", "Monthly expenses"),
      short: t("Gasto", "Expenses"),
      value: money(plan.expenses, currency),
    },
    {
      emoji: "💵",
      label: t("Tasa de ahorro", "Savings rate"),
      short: t("Ahorro", "Savings"),
      value: `${plan.savingsRate.toFixed(0)}%`,
    },
  ];


  const city = (life.city || "").trim();
  const investableAssets = Math.max(
    0,
    data.assets_cash +
      data.assets_bank +
      data.assets_retirement +
      data.assets_etf +
      data.assets_stocks +
      data.assets_crypto,
  );
  const numberProgress = plan.targetCapital > 0
    ? Math.min(100, Math.max(0, (investableAssets / plan.targetCapital) * 100))
    : 0;
  const numberNote =
    plan.mode === "home"
      ? t("La entrada que necesitas para tu primera vivienda.", "The down payment you need for your first home.")
      : plan.mode === "business"
        ? t("El capital que necesitas para montar tu negocio.", "The capital you need to start your business.")
        : city
          ? t(
              `El capital que te permite vivir con ${money(plan.desiredIncome, currency)} al mes en ${city}.`,
              `The capital that lets you live on ${money(plan.desiredIncome, currency)} a month in ${city}.`,
            )
          : t(
              `El capital que te permite vivir con ${money(plan.desiredIncome, currency)} al mes.`,
              `The capital that lets you live on ${money(plan.desiredIncome, currency)} a month.`,
            );
  const freedomNote = t(
    `Retiro estimado a los ${plan.retireAge} años.`,
    `Estimated retirement at age ${plan.retireAge}.`,
  );

  // 4 accionables claros, calculados con los datos del onboarding.
  const savings = Math.max(0, plan.savings);
  const invest20 = Math.round(plan.income * 0.2);
  const gap = Math.max(0, invest20 - savings);
  const cutPct = plan.expenses > 0 && gap > 0 ? Math.min(40, Math.max(3, Math.ceil((gap / plan.expenses) * 100))) : 0;
  const needed = minMonthlyForRetirement({
    target: plan.targetCapital,
    invested: Math.max(0, plan.netWorth),
    years: Math.max(1, plan.yearsLeft),
  });
  const extra = Math.max(0, Math.round(needed - savings));
  const liquidCash = Math.max(0, data.assets_cash + data.assets_bank);
  const emergencyTarget = Math.round(plan.expenses * 6);
  const emergencyGap = Math.max(0, emergencyTarget - liquidCash);

  const actions = [
    {
      emoji: "🌱",
      title: t("Invierte el 20% de tu ingreso", "Invest 20% of your income"),
      text: t(
        `Son ${money(invest20, currency)} al mes. Si no sabes dónde, un índice S&P 500.`,
        `That's ${money(invest20, currency)} a month. If unsure, an S&P 500 index fund.`,
      ),
    },
    {
      emoji: "✂️",
      title:
        cutPct > 0
          ? t(`Recorta un ${cutPct}% de tus gastos`, `Cut ${cutPct}% of your expenses`)
          : t("Mantén tus gastos bajo control", "Keep your expenses under control"),
      text:
        cutPct > 0
          ? t(
              `Libera ${money(gap, currency)} al mes; tu IA te dirá en qué categorías.`,
              `Free up ${money(gap, currency)} a month; your AI will show which categories.`,
            )
          : t(
              "Ya inviertes más del 20%; tu IA vigilará las fugas cada mes.",
              "You already invest over 20%; your AI will watch for leaks each month.",
            ),
    },
    {
      emoji: "🚀",
      title: t("Genera dinero extra", "Generate extra income"),
      text:
        extra > 0
          ? t(
              `Tu número exige ${money(needed, currency)}/mes: te faltan ${money(extra, currency)}.`,
              `Your number needs ${money(needed, currency)}/mo: you're short ${money(extra, currency)}.`,
            )
          : t(
              "Ya cubres el aporte de tu número; cada extra lo adelanta.",
              "You already cover it; every extra speeds your number up.",
            ),
    },
    {
      emoji: "🛡️",
      title: t("Ten tu fondo de emergencia", "Build your emergency fund"),
      text:
        emergencyGap > 0
          ? t(
              `Necesitas ${money(emergencyTarget, currency)} (6 meses); tienes ${money(liquidCash, currency)} en efectivo y bancos.`,
              `You need ${money(emergencyTarget, currency)} (6 months); you hold ${money(liquidCash, currency)} in cash and banks.`,
            )
          : t(
              `Cubierto: ${money(liquidCash, currency)} en efectivo y bancos, más de 6 meses de gastos.`,
              `Covered: ${money(liquidCash, currency)} in cash and banks, over 6 months of expenses.`,
            ),
    },
  ];

  const firstName = (data.full_name || "").trim().split(/\s+/)[0] ?? "";

  return (
    <div className="mx-auto -mt-6 flex w-full max-w-5xl flex-col gap-3 sm:-mt-8 sm:gap-4">
      <div className="flex flex-col items-center text-center">
        <PartyPopper />
        <h2 className="font-display -mt-1 text-2xl font-semibold sm:text-3xl">
          {t("Tu Número está listo.", "Your Number is ready.")}
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {firstName
            ? t(`${firstName}, esto entendió la IA de tus finanzas.`, `${firstName}, this is what the AI understood.`)
            : t("Esto entendió la IA de tus finanzas.", "This is what the AI understood about your finances.")}
        </p>
      </div>

      <div className="surface px-5 py-5 sm:px-6 sm:py-5">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-2 sm:text-left">
          <div className="min-w-0">
            <p className="numeric text-2xl font-semibold sm:text-3xl">{money(plan.targetCapital, currency)}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-primary">🎯 Your Number</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{numberNote}</p>
          </div>
          <div className="w-full shrink-0 border-t border-border/60 pt-4 sm:w-auto sm:border-0 sm:pt-0 sm:text-right">
            <p className="numeric text-xl font-semibold text-primary sm:text-2xl">
              {plan.mode === "freedom"
                ? `${plan.yearsLeft} ${t("años", "yrs")}`
                : plan.monthsToGoal > 0
                  ? `${Math.max(1, Math.ceil(plan.monthsToGoal / 12))} ${t("años", "yrs")}`
                  : t("Listo", "Ready")}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              📅 {plan.mode === "freedom"
                ? t("Años restantes para retirarte", "Years until retirement")
                : t("Tiempo estimado", "Estimated time")}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{freedomNote}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-2.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>📈 {t("Progreso hacia tu Número", "Progress to your Number")}</span>
            <span className="numeric text-foreground">{numberProgress.toFixed(1)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(1, numberProgress)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="surface flex min-h-24 flex-col justify-center px-4 py-4 sm:min-h-28 sm:px-5"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <span aria-hidden="true" className="mr-1">{m.emoji}</span>
              <span className="sm:hidden">{m.short}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </p>
            <p className="numeric mt-2 text-xl font-semibold sm:text-2xl">{m.value}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          ✨ {t("Tus 4 acciones", "Your 4 actions")}
        </p>
        <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {actions.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex h-full items-start gap-2.5 rounded-2xl border border-border bg-elevated/50 px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-sm">
                {a.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight">{a.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{a.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] leading-snug text-muted-foreground">
        {t(
          "Cálculos orientativos con lo que respondiste; no son asesoramiento financiero.",
          "Estimates based on your answers; not financial advice.",
        )}
      </p>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center">
        <Button size="lg" className="h-11 w-full rounded-full text-sm sm:w-auto sm:min-w-[260px]" onClick={onEnter}>
          {t("Entrar a mi dashboard", "Enter my dashboard")} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="ghost" size="lg" className="h-11 w-full rounded-full text-sm sm:w-auto" onClick={onEdit}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> {t("Editar mis respuestas", "Edit my answers")}
        </Button>
      </div>
    </div>
  );
}
