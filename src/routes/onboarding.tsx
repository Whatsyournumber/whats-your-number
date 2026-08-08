import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  Pencil,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-language";

const GOALS_EN: Record<string, string> = {
  libertad: "Achieve financial freedom",
  patrimonio: "Grow my net worth",
  gastos: "Understand and control my expenses",
  vivienda: "Save for a home",
  viajar: "Travel more",
  organizar: "Better organize my money",
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
      { title: "Construye tu North — plan financiero personalizado" },
      {
        name: "description",
        content:
          "Responde unas preguntas y nuestra IA construye tu plan: patrimonio, gastos, Your Number y tu edad de libertad financiera.",
      },
      { property: "og:title", content: "Construye tu North — Your north" },
      { property: "og:description", content: "Un plan financiero personalizado en 3 minutos con Your north." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ ...emptyOnboarding, currency: "EUR", monthly_expenses: 0 });
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
      if (row) {
        const r = row as Record<string, unknown>;
        const next = { ...emptyOnboarding, currency: "EUR" };
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
        setStep(Math.min(QUESTIONS, Number(r["current_step"] ?? 0)));
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
  }, [user]);

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
  const setL = <K extends keyof LifeData>(key: K, value: LifeData[K]) => setLife((l) => ({ ...l, [key]: value }));

  const desiredIncome = useMemo(() => estimateDesiredIncome(life), [life]);
  const plan = useMemo(
    () => buildPlan({ ...data, desired_retirement_income: desiredIncome }),
    [data, desiredIncome],
  );
  const cur = data.currency || "EUR";

  const go = (dir: 1 | -1) => {
    const next = Math.min(SUMMARY_STEP, Math.max(0, step + dir));
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
  };

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canContinue = () => {
    if (step === 1) return !!life.goal;
    if (step === 2) return !!data.age;
    if (step === 4) return !!life.city;
    if (step === 5) return !!life.marital_status && !!life.children && !!life.plans_children;
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
            <Compass className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold">Your north</span>
            <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${isSummary ? 100 : progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="numeric w-16 text-right text-[11px] text-muted-foreground">
              {saving ? "Guardando…" : step === 0 || isSummary ? "" : `${step} / ${QUESTIONS}`}
            </span>
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
            {step === 0 && (
              <Screen>
                <div className="wealth-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-3xl">
                  <Compass className="h-7 w-7 text-background" />
                </div>
                <h1 className="mt-8 text-center font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
                  Vamos a construir tu North.
                </h1>
                <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
                  Unas preguntas, dos minutos, y nuestra IA construye un plan financiero hecho para tu vida. Podrás editar
                  cualquier respuesta después.
                </p>
              </Screen>
            )}

            {step === 1 && (
              <Screen
                title="¿Cuál es tu principal objetivo financiero?"
                hint="Queremos construir un plan financiero adaptado a ti."
              >
                <div className="space-y-2.5">
                  {goals.map((g) => (
                    <OptionRow
                      key={g.value}
                      emoji={g.emoji}
                      title={g.label}
                      selected={life.goal === g.value}
                      onClick={() => {
                        setL("goal", g.value);
                        setData((d) => ({ ...d, priority: g.value }));
                      }}
                    />
                  ))}
                </div>
              </Screen>
            )}

            {step === 2 && (
              <Screen title="¿Qué edad tienes?">
                <BigNumber value={data.age ?? 32} suffix="años" />
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
                title="¿A qué edad te gustaría alcanzar tu libertad financiera?"
                hint="La libertad financiera es cuando trabajar deja de ser una obligación y se convierte en una elección."
              >
                <BigNumber value={data.retire_age} suffix="años" />
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
                    Te quedan <span className="numeric text-foreground">{Math.max(0, data.retire_age - data.age)}</span>{" "}
                    años para construirlo.
                  </p>
                ) : null}
              </Screen>
            )}

            {step === 4 && (
              <Screen
                title="¿Dónde te gustaría vivir cuando alcances tu libertad financiera?"
                hint="Analizaremos automáticamente el coste de vida de esa ciudad para personalizar tu objetivo financiero."
              >
                <CityPicker
                  value={life.city}
                  onSelect={(c) => {
                    setL("city", c.name);
                    setData((d) => ({ ...d, country: c.country, currency: c.currency }));
                  }}
                />
              </Screen>
            )}

            {step === 5 && (
              <Screen title="¿Cuál es tu situación familiar?">
                <ChipGroup options={maritalOptions.map((m) => ({ value: m, label: m }))} value={life.marital_status} onSelect={(v) => setL("marital_status", v)} />
                <AnimatePresence>
                  {life.marital_status && (
                    <Reveal>
                      <SubQuestion title="¿Tienes hijos?" />
                      <ChipGroup options={childrenOptions.map((c) => ({ value: c, label: c }))} value={life.children} onSelect={(v) => setL("children", v)} />
                    </Reveal>
                  )}
                  {life.children && (
                    <Reveal>
                      <SubQuestion title="¿Planeas tener hijos?" />
                      <ChipGroup options={plansChildrenOptions.map((c) => ({ value: c, label: c }))} value={life.plans_children} onSelect={(v) => setL("plans_children", v)} />
                    </Reveal>
                  )}
                </AnimatePresence>
              </Screen>
            )}

            {step === 6 && (
              <Screen
                title="¿Cómo te gustaría vivir?"
                hint="Selecciona el estilo de vida que quieres mantener cuando alcances tu libertad financiera."
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
                      <p className="mt-3 text-sm font-medium">{l.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {life.lifestyle && (
                    <Reveal>
                      <SubQuestion title="¿Cuántas veces te gustaría viajar al año?" />
                      <ChipGroup
                        options={travelOptions.map((t) => ({ value: t.value, label: t.label }))}
                        value={life.travel_frequency}
                        onSelect={(v) => setL("travel_frequency", v)}
                      />
                    </Reveal>
                  )}
                </AnimatePresence>
                {life.lifestyle && life.travel_frequency && (
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    Objetivo estimado de vida:{" "}
                    <span className="numeric text-foreground">{money(desiredIncome, cur)}</span> al mes.
                  </p>
                )}
              </Screen>
            )}

            {step === 7 && (
              <Screen title="¿Tienes vivienda propia?">
                <div className="space-y-2.5">
                  {housingOptions.map((h) => (
                    <OptionRow
                      key={h.value}
                      emoji={h.emoji}
                      title={h.label}
                      selected={life.housing === h.value}
                      onClick={() => setL("housing", h.value)}
                    />
                  ))}
                </div>
              </Screen>
            )}

            {step === 8 && (
              <Screen
                title="¿Qué rendimiento anual quieres utilizar para planificar tu patrimonio?"
                hint="Solo utilizaremos este porcentaje para realizar simulaciones financieras. No representa una rentabilidad garantizada."
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
                      {r === 7 && <p className="mt-1 text-[10px] uppercase tracking-widest text-primary">⭐ Recom.</p>}
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
                  Personalizado
                </button>
                <AnimatePresence>
                  {customReturn && (
                    <Reveal>
                      <BigNumber value={data.expected_return} suffix="% anual" />
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
                title="Hablemos de tu patrimonio"
                hint="Antes de analizar tus movimientos, queremos conocer una estimación de tu patrimonio actual. Si no conoces alguna cifra, puedes dejarla en 0 o editarla más adelante."
              >
                <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                  <span className="text-lg">🤖</span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    No te preocupes si no conoces estos números. Nuestra IA puede calcularlos automáticamente analizando
                    tus extractos financieros. Solo completa lo que conozcas —{" "}
                    <span className="text-foreground">podrás modificarlo cuando quieras</span>.
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-elevated/40 px-5 py-3">
                  <div>
                    <p className="text-sm">Moneda</p>
                    <p className="text-xs text-muted-foreground">En la que verás todos tus importes</p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={cur}
                    onChange={(e) => set("currency", e.target.value)}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.label}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="mt-5 space-y-2.5">
                  <MoneyField
                    emoji="💰"
                    label="Ahorros"
                    desc="Cuentas bancarias y efectivo"
                    currency={cur}
                    value={data.assets_bank}
                    onChange={(v) => set("assets_bank", v)}
                  />
                  <MoneyField
                    emoji="📈"
                    label="Inversiones"
                    desc="Acciones, ETFs y fondos"
                    currency={cur}
                    value={data.assets_etf}
                    onChange={(v) => set("assets_etf", v)}
                  />
                  <MoneyField
                    emoji="₿"
                    label="Criptomonedas"
                    desc="Valor aproximado actual"
                    currency={cur}
                    value={data.assets_crypto}
                    onChange={(v) => set("assets_crypto", v)}
                  />
                  <MoneyField
                    emoji="🏠"
                    label="Bienes inmuebles"
                    desc="Valor de tus propiedades"
                    currency={cur}
                    value={data.assets_property}
                    onChange={(v) => set("assets_property", v)}
                  />
                  <MoneyField
                    emoji="💳"
                    label="Deudas"
                    desc="Hipotecas, préstamos y otras deudas"
                    currency={cur}
                    value={data.liabilities}
                    onChange={(v) => set("liabilities", v)}
                  />
                  <MoneyField
                    emoji="🪙"
                    label="Ingreso mensual"
                    desc="Neto, después de impuestos"
                    currency={cur}
                    value={data.income_salary}
                    onChange={(v) => set("income_salary", v)}
                  />
                  <MoneyField
                    emoji="🧾"
                    label="Gasto mensual"
                    desc="Aproximado, todo incluido"
                    currency={cur}
                    value={data.monthly_expenses}
                    onChange={(v) => set("monthly_expenses", v)}
                  />
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
                  <span className="text-sm text-muted-foreground">Patrimonio neto estimado</span>
                  <span className="numeric text-xl font-semibold text-primary">{money(netWorth(data), cur)}</span>
                </div>

                <div className="mt-10">
                  <h3 className="font-display text-xl font-semibold">📄 Sube tus extractos financieros</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Nuestra IA analizará automáticamente tus ingresos, gastos, inversiones y patrimonio. Aceptamos PDF y
                    CSV de bancos, brokers y exchanges.
                  </p>
                  <div className="mt-5 rounded-3xl border border-dashed border-border bg-elevated/30 p-4">
                    <StatementImporter />
                  </div>
                </div>

                <Button size="lg" className="mt-8 h-14 w-full rounded-full text-base" onClick={build}>
                  <Sparkles className="mr-2 h-4 w-4" /> Construir mi North
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
            {step > 0 && (
              <Button variant="ghost" size="lg" className="rounded-full" onClick={() => go(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
            )}
            <Button size="lg" className="ml-auto min-w-[160px] rounded-full" disabled={!canContinue()} onClick={() => go(1)}>
              {step === 0 ? "Comenzar" : "Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 9 && (
          <div className="mt-8">
            <Button variant="ghost" size="lg" className="rounded-full" onClick={() => go(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
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
}: {
  label: string;
  desc?: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  currency: string;
}) {
  return (
    <label className="flex items-center gap-3.5 rounded-2xl border border-border bg-elevated/50 px-5 py-4 transition-colors focus-within:border-primary/60">
      <span className="text-lg">{emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="numeric ml-auto w-28 bg-transparent text-right text-base font-semibold outline-none placeholder:text-muted-foreground/50"
      />
      <span className="text-xs text-muted-foreground">{currency}</span>
    </label>
  );
}

function CityPicker({ value, onSelect }: { value: string; onSelect: (c: (typeof cities)[number]) => void }) {
  const [q, setQ] = useState("");
  const term = q.toLowerCase().trim();
  const list = cities.filter((c) => c.name.toLowerCase().includes(term) || c.country.toLowerCase().includes(term));
  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-elevated/50 px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca una ciudad…"
          className="h-14 flex-1 bg-transparent text-base outline-none"
        />
      </div>
      <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {list.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelect(c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              value === c.name ? "border-primary bg-primary/10" : "border-transparent bg-elevated/40 hover:bg-elevated",
            )}
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.country}</span>
            <span className="numeric ml-auto text-xs text-muted-foreground">
              ~{new Intl.NumberFormat("es").format(c.cost)} {c.currency}/mes
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">Sin resultados.</p>}
      </div>
    </div>
  );
}

/* ───────────────────────── Pantalla 10: IA trabajando ───────────────────────── */

function BuildingScreen({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= BUILD_TASKS.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), done === 0 ? 500 : 620);
    return () => clearTimeout(t);
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

      <h2 className="mt-10 text-center font-display text-3xl font-semibold sm:text-4xl">Estamos construyendo tu North…</h2>
      <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Nuestra IA está analizando toda tu información financiera.
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
  const insights = buildInsights(plan, data, life, currency);
  const assets = totalAssets(data);
  const dist = [
    { label: "Ahorros", value: data.assets_cash + data.assets_bank, icon: <Banknote className="h-3.5 w-3.5" /> },
    { label: "Inversiones", value: data.assets_etf + data.assets_stocks + data.assets_retirement, icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { label: "Cripto", value: data.assets_crypto, icon: <Bitcoin className="h-3.5 w-3.5" /> },
    { label: "Inmuebles", value: data.assets_property, icon: <Building2 className="h-3.5 w-3.5" /> },
  ].filter((d) => d.value > 0);

  const metrics = [
    { emoji: "💰", label: "Patrimonio actual", value: money(plan.netWorth, currency) },
    { emoji: "📈", label: "Ingreso mensual", value: money(plan.income, currency) },
    { emoji: "💳", label: "Gasto mensual", value: money(plan.expenses, currency) },
    { emoji: "💵", label: "Tasa de ahorro", value: `${plan.savingsRate.toFixed(0)}%` },
  ];

  return (
    <div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center text-4xl">
        🎉
      </motion.div>
      <h2 className="mt-5 text-center font-display text-4xl font-semibold sm:text-5xl">Tu North está listo.</h2>
      <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        {data.full_name ? `${data.full_name}, esto` : "Esto"} es lo que la IA ha entendido de tus finanzas.
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
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">📊 Distribución del patrimonio</p>
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-primary">🎯 Your Number</p>
            <p className="numeric mt-2 text-4xl font-semibold">{compact(plan.targetCapital, currency)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              El capital que te permite vivir con {money(plan.desiredIncome, currency)} al mes
              {life.city ? ` en ${life.city}` : ""}.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">📅 Libertad financiera</p>
            <p className="numeric mt-2 text-4xl font-semibold text-primary">{plan.freedomAge} años</p>
            <p className="mt-2 text-xs text-muted-foreground">Tu meta eran los {plan.retireAge} años.</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>📈 Progreso hacia tu North</span>
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
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">✨ AI Insights</p>
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
        <CreditCard className="h-3.5 w-3.5" /> Todas tus respuestas quedan guardadas y las puedes editar cuando quieras.
      </p>

      <Button size="lg" className="mt-5 h-14 w-full rounded-full text-base" onClick={onEnter}>
        Entrar a mi dashboard <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <Button variant="ghost" size="lg" className="mt-2 w-full rounded-full" onClick={onEdit}>
        <Pencil className="mr-2 h-3.5 w-3.5" /> Editar mis respuestas
      </Button>
    </div>
  );
}
