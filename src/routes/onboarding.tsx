import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Compass,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  Loader2,
  PiggyBank,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StatementImporter } from "@/components/statement-importer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPlan,
  compact,
  countries,
  emptyOnboarding,
  money,
  netWorth,
  priorities,
  riskProfiles,
  totalIncome,
  type OnboardingData,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Descubre tu Norte Financiero — Your north" },
      {
        name: "description",
        content:
          "En menos de 3 minutos construimos tu plan financiero personalizado: patrimonio, ahorro, retiro y objetivos.",
      },
      { property: "og:title", content: "Descubre tu Norte Financiero — Your north" },
      { property: "og:description", content: "Un plan financiero personalizado en 3 minutos con Your north." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const TOTAL_STEPS = 15; // 0 = bienvenida … 14 = resumen

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(emptyOnboarding);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signup" } });
  }, [loading, user, navigate]);

  // Carga inicial del progreso guardado
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
        const next = { ...emptyOnboarding };
        for (const key of Object.keys(emptyOnboarding) as (keyof OnboardingData)[]) {
          const v = r[key];
          if (v !== null && v !== undefined) (next as Record<string, unknown>)[key] = typeof v === "string" ? v : Number(v);
        }
        if (typeof r['full_name'] === "string") next.full_name = r['full_name'];
        setData(next);
        setStep(Math.min(TOTAL_STEPS - 1, Number(r['current_step'] ?? 0)));
      } else {
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        const name = typeof meta?.['full_name'] === "string" ? meta['full_name'] : "";
        setData((d) => ({
          ...d,
          full_name: name,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
        }));
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const persist = async (patch: Partial<OnboardingData> & { current_step?: number; completed?: boolean }) => {
    if (!user) return;
    setSaving(true);
    await supabase.from("onboarding_profiles").upsert(
      { user_id: user.id, ...data, ...patch, current_step: patch.current_step ?? step },
      { onConflict: "user_id" },
    );
    setSaving(false);
  };

  // Autosave con debounce en cada cambio
  useEffect(() => {
    if (!ready || !user) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist({}), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, step, ready]);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const go = (dir: 1 | -1) => {
    const next = Math.min(TOTAL_STEPS - 1, Math.max(0, step + dir));
    setStep(next);
    void persist({ current_step: next, ...(next === TOTAL_STEPS - 1 ? { completed: true } : {}) });
  };

  const plan = useMemo(() => buildPlan(data), [data]);
  const cur = data.currency || "USD";

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canContinue = () => {
    if (step === 1) return data.full_name.trim().length > 1;
    if (step === 2) return !!data.age && data.age > 15 && data.age < 100;
    if (step === 3) return !!data.country;
    if (step === 11) return !!data.priority;
    if (step === 12) return !!data.risk_profile;
    return true;
  };

  const progress = (step / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />

      {/* Barra de progreso */}
      <div className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <Compass className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold">Your north</span>
          <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="numeric w-16 text-right text-[11px] text-muted-foreground">
            {saving ? "Guardando…" : step === 0 ? "" : `${step} / ${TOTAL_STEPS - 2}`}
          </span>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-57px)] max-w-2xl flex-col justify-center px-5 py-10 sm:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <Screen>
                <div className="wealth-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-3xl">
                  <Compass className="h-7 w-7 text-background" />
                </div>
                <h1 className="mt-8 text-center font-display text-4xl font-semibold leading-tight sm:text-5xl">
                  Descubre tu Norte Financiero.
                </h1>
                <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
                  En menos de 3 minutos construiremos un plan financiero personalizado basado en tu estilo de vida,
                  patrimonio y objetivos.
                </p>
              </Screen>
            )}

            {step === 1 && (
              <Screen title="¿Cuál es tu nombre?" hint="Así personalizamos tu Norte.">
                <Input
                  autoFocus
                  value={data.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Oscar"
                  className="h-14 rounded-2xl border-border bg-elevated/60 text-center text-xl"
                />
              </Screen>
            )}

            {step === 2 && (
              <Screen
                title="¿Cuántos años tienes?"
                hint="Usaremos esta información para calcular tus proyecciones de retiro."
              >
                <Input
                  autoFocus
                  type="number"
                  inputMode="numeric"
                  value={data.age ?? ""}
                  onChange={(e) => set("age", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="32"
                  className="numeric h-14 rounded-2xl border-border bg-elevated/60 text-center text-2xl"
                />
              </Screen>
            )}

            {step === 3 && (
              <Screen title="¿En qué país vives?" hint="Detectamos tu moneda y zona horaria automáticamente.">
                <CountryPicker
                  value={data.country}
                  onSelect={(c) =>
                    setData((d) => ({ ...d, country: c.name, country_code: c.code, currency: c.currency, timezone: c.tz }))
                  }
                />
                {data.country && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                    <Pill>{data.country}</Pill>
                    <Pill>Moneda {data.currency}</Pill>
                    <Pill>{data.timezone}</Pill>
                  </div>
                )}
              </Screen>
            )}

            {step === 4 && (
              <Screen title="¿Cuánto ganas al mes después de impuestos?" hint="Separa por fuente — el total se calcula solo.">
                <div className="space-y-3">
                  <MoneyField icon={<Wallet className="h-4 w-4" />} label="Salario" currency={cur} value={data.income_salary} onChange={(v) => set("income_salary", v)} />
                  <MoneyField icon={<Sparkles className="h-4 w-4" />} label="Bonificaciones" currency={cur} value={data.income_bonus} onChange={(v) => set("income_bonus", v)} />
                  <MoneyField icon={<Building2 className="h-4 w-4" />} label="Rentas" currency={cur} value={data.income_rent} onChange={(v) => set("income_rent", v)} />
                  <MoneyField icon={<Banknote className="h-4 w-4" />} label="Otros ingresos" currency={cur} value={data.income_other} onChange={(v) => set("income_other", v)} />
                </div>
                <TotalRow label="Ingreso mensual total" value={money(totalIncome(data), cur)} />
              </Screen>
            )}

            {step === 5 && (
              <Screen title="¿Cuánto gastas aproximadamente cada mes?">
                <p className="numeric text-center text-4xl font-semibold text-primary">{money(data.monthly_expenses, cur)}</p>
                <Slider
                  className="mt-8"
                  min={0}
                  max={20000}
                  step={100}
                  value={[Math.min(20000, data.monthly_expenses)]}
                  onValueChange={(v) => set("monthly_expenses", v[0]!)}
                />
                <div className="mx-auto mt-8 max-w-xs">
                  <Label className="text-xs text-muted-foreground">O escribe el monto exacto</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={data.monthly_expenses || ""}
                    onChange={(e) => set("monthly_expenses", Number(e.target.value || 0))}
                    className="numeric mt-2 h-12 rounded-2xl bg-elevated/60 text-center text-lg"
                  />
                </div>
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Este valor nos ayudará a calcular tu tasa de ahorro y tu independencia financiera.
                </p>
              </Screen>
            )}

            {step === 6 && (
              <Screen title="¿Cuánto ahorras o inviertes cada mes?" hint="Suma lo que va a ahorro, ETFs, cripto o retiro.">
                <MoneyField icon={<PiggyBank className="h-4 w-4" />} label="Ahorro e inversión mensual" currency={cur} value={data.monthly_savings} onChange={(v) => set("monthly_savings", v)} big />
                {totalIncome(data) > 0 && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Tasa de ahorro:{" "}
                    <span className="numeric text-foreground">
                      {((data.monthly_savings / totalIncome(data)) * 100).toFixed(1)}%
                    </span>
                  </p>
                )}
              </Screen>
            )}

            {step === 7 && (
              <Screen title="¿Cuál es tu patrimonio actual?" hint="Todos los campos son opcionales — completa lo que sepas.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MoneyField icon={<Banknote className="h-4 w-4" />} label="Efectivo" currency={cur} value={data.assets_cash} onChange={(v) => set("assets_cash", v)} />
                  <MoneyField icon={<Landmark className="h-4 w-4" />} label="Cuentas bancarias" currency={cur} value={data.assets_bank} onChange={(v) => set("assets_bank", v)} />
                  <MoneyField icon={<PiggyBank className="h-4 w-4" />} label="Fondos de retiro" currency={cur} value={data.assets_retirement} onChange={(v) => set("assets_retirement", v)} />
                  <MoneyField icon={<TrendingUp className="h-4 w-4" />} label="ETFs" currency={cur} value={data.assets_etf} onChange={(v) => set("assets_etf", v)} />
                  <MoneyField icon={<TrendingUp className="h-4 w-4" />} label="Acciones" currency={cur} value={data.assets_stocks} onChange={(v) => set("assets_stocks", v)} />
                  <MoneyField icon={<Sparkles className="h-4 w-4" />} label="Cripto" currency={cur} value={data.assets_crypto} onChange={(v) => set("assets_crypto", v)} />
                  <MoneyField icon={<Building2 className="h-4 w-4" />} label="Propiedades" currency={cur} value={data.assets_property} onChange={(v) => set("assets_property", v)} />
                  <MoneyField icon={<CreditCard className="h-4 w-4" />} label="Deudas" currency={cur} value={data.liabilities} onChange={(v) => set("liabilities", v)} />
                </div>
                <TotalRow label="Patrimonio neto" value={money(netWorth(data), cur)} />
              </Screen>
            )}

            {step === 8 && (
              <Screen title="¿A qué edad te gustaría retirarte?">
                <RetireIllustration age={data.retire_age} />
                <p className="numeric mt-6 text-center text-5xl font-semibold">{data.retire_age}</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">años</p>
                <Slider
                  className="mt-8"
                  min={40}
                  max={70}
                  step={1}
                  value={[data.retire_age]}
                  onValueChange={(v) => set("retire_age", v[0]!)}
                />
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>40</span>
                  <span>70</span>
                </div>
                {data.age && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Te quedan <span className="numeric text-foreground">{Math.max(0, data.retire_age - data.age)}</span> años
                    para construirlo.
                  </p>
                )}
              </Screen>
            )}

            {step === 9 && (
              <Screen
                title="Cuando te retires… ¿cuánto dinero te gustaría recibir cada mes?"
                hint="No pienses en cuánto dinero quieres tener. Piensa en el estilo de vida que quieres mantener."
              >
                <div className="mb-5 flex flex-wrap justify-center gap-2">
                  {[3000, 5000, 8000, 10000].map((v) => (
                    <button
                      key={v}
                      onClick={() => set("desired_retirement_income", v)}
                      className={cn(
                        "numeric rounded-full border px-4 py-2 text-sm transition-colors",
                        data.desired_retirement_income === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-elevated/50 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {money(v, cur)}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={data.desired_retirement_income || ""}
                  onChange={(e) => set("desired_retirement_income", Number(e.target.value || 0))}
                  className="numeric h-14 rounded-2xl bg-elevated/60 text-center text-2xl"
                />
              </Screen>
            )}

            {step === 10 && (
              <Screen
                title="¿Cuál es tu rendimiento esperado a largo plazo?"
                hint="Es una expectativa de crecimiento anual promedio que usamos en tus proyecciones, no una garantía. Los mercados suben y bajan."
              >
                <div className="grid grid-cols-3 gap-3">
                  {[5, 6, 7, 8, 9, 10].map((r) => (
                    <button
                      key={r}
                      onClick={() => set("expected_return", r)}
                      className={cn(
                        "rounded-2xl border px-3 py-5 text-center transition-all",
                        data.expected_return === r
                          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]"
                          : "border-border bg-elevated/50 hover:border-muted-foreground/40",
                      )}
                    >
                      <p className="numeric text-2xl font-semibold">{r}%</p>
                      {r === 7 && <p className="mt-1 text-[10px] uppercase tracking-widest text-primary">Recomendado</p>}
                    </button>
                  ))}
                </div>
              </Screen>
            )}

            {step === 11 && (
              <Screen title="¿Cuál es tu prioridad financiera?">
                <div className="space-y-2.5">
                  {priorities.map((p) => (
                    <OptionRow
                      key={p.value}
                      selected={data.priority === p.value}
                      onClick={() => set("priority", p.value)}
                      title={p.label}
                      emoji={p.emoji}
                    />
                  ))}
                </div>
              </Screen>
            )}

            {step === 12 && (
              <Screen title="¿Cuál describe mejor tu perfil?">
                <div className="space-y-2.5">
                  {riskProfiles.map((p) => (
                    <OptionRow
                      key={p.value}
                      selected={data.risk_profile === p.value}
                      onClick={() => set("risk_profile", p.value)}
                      title={p.label}
                      desc={p.desc}
                    />
                  ))}
                </div>
              </Screen>
            )}

            {step === 13 && (
              <Screen title="Conecta tus finanzas." hint="Importa tus estados de cuenta y la IA clasifica cada movimiento.">
                <div className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-elevated/50 px-5 py-4 text-left transition-colors hover:border-primary/50">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Importar PDF</span>
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </button>
                    </DialogTrigger>
                    <ImporterDialog />
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-elevated/50 px-5 py-4 text-left transition-colors hover:border-primary/50">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Importar CSV</span>
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </button>
                    </DialogTrigger>
                    <ImporterDialog />
                  </Dialog>

                  <div className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl border border-dashed border-border px-5 py-4 opacity-60">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Conectar banco</span>
                    <span className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground">Próximamente</span>
                  </div>
                </div>
                <button
                  onClick={() => go(1)}
                  className="mx-auto mt-6 block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Omitir por ahora
                </button>
              </Screen>
            )}

            {step === 14 && <SummaryScreen data={data} plan={plan} currency={cur} onEnter={() => navigate({ to: "/dashboard" })} />}
          </motion.div>
        </AnimatePresence>

        {step < TOTAL_STEPS - 1 && (
          <div className="mt-12 flex items-center gap-3">
            {step > 0 && (
              <Button variant="ghost" size="lg" className="rounded-full" onClick={() => go(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
            )}
            <Button
              size="lg"
              className="ml-auto min-w-[160px] rounded-full"
              disabled={!canContinue()}
              onClick={() => go(1)}
            >
              {step === 0 ? "Comenzar" : step === TOTAL_STEPS - 2 ? "Ver mi Norte" : "Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ImporterDialog() {
  return (
    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
      <DialogTitle className="font-display text-lg">Importar estados de cuenta</DialogTitle>
      <StatementImporter />
    </DialogContent>
  );
}

function Screen({ title, hint, children }: { title?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <h2 className="text-center font-display text-3xl font-semibold leading-snug sm:text-[2.1rem]">{title}</h2>}
      {hint && <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="mt-10">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-elevated/60 px-3 py-1">{children}</span>;
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="numeric text-xl font-semibold text-primary">{value}</span>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  currency,
  icon,
  big,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  currency: string;
  icon?: React.ReactNode;
  big?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-elevated/50 px-4 py-3 transition-colors focus-within:border-primary/60">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className={cn(
          "numeric ml-auto w-32 bg-transparent text-right font-semibold outline-none placeholder:text-muted-foreground/50",
          big ? "text-2xl" : "text-base",
        )}
      />
      <span className="text-xs text-muted-foreground">{currency}</span>
    </label>
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
        "flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-all",
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

function CountryPicker({ value, onSelect }: { value: string; onSelect: (c: (typeof countries)[number]) => void }) {
  const [q, setQ] = useState("");
  const list = countries.filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-elevated/50 px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca tu país…"
          className="h-12 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
        {list.map((c) => (
          <button
            key={c.code}
            onClick={() => onSelect(c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
              value === c.name ? "border-primary bg-primary/10" : "border-transparent bg-elevated/40 hover:bg-elevated",
            )}
          >
            <span>{c.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">{c.currency}</span>
          </button>
        ))}
        {list.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">Sin resultados.</p>}
      </div>
    </div>
  );
}

function RetireIllustration({ age }: { age: number }) {
  const p = (age - 40) / 30;
  return (
    <div className="relative mx-auto h-32 w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-elevated/40">
      <div className="wealth-gradient absolute inset-0 opacity-[0.12]" />
      <svg viewBox="0 0 320 128" className="absolute inset-0 h-full w-full">
        <path d="M0 110 C 80 100, 140 60, 320 20" fill="none" stroke="var(--color-primary)" strokeWidth="2" opacity="0.5" />
        <circle cx={20 + p * 280} cy={110 - p * 88} r="7" fill="var(--color-primary)" />
        <circle cx={20 + p * 280} cy={110 - p * 88} r="14" fill="var(--color-primary)" opacity="0.18" />
      </svg>
    </div>
  );
}

function SummaryScreen({
  data,
  plan,
  currency,
  onEnter,
}: {
  data: OnboardingData;
  plan: ReturnType<typeof buildPlan>;
  currency: string;
  onEnter: () => void;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Patrimonio actual", value: money(plan.netWorth, currency) },
    { label: "Ingresos mensuales", value: money(plan.income, currency) },
    { label: "Gastos mensuales", value: money(plan.expenses, currency) },
    { label: "Tasa de ahorro", value: `${plan.savingsRate.toFixed(1)}%` },
    { label: "Edad objetivo de retiro", value: `${plan.retireAge} años` },
    { label: "Ingreso mensual deseado", value: money(plan.desiredIncome, currency) },
    { label: "Capital necesario", value: compact(plan.targetCapital, currency) },
    { label: "Años restantes", value: `${plan.yearsLeft}` },
    { label: "Meta de patrimonio", value: compact(plan.targetCapital, currency) },
  ];

  return (
    <div>
      <p className="text-center text-xs uppercase tracking-[0.24em] text-primary">Tu Norte</p>
      <h2 className="mt-3 text-center font-display text-4xl font-semibold">
        {data.full_name ? `${data.full_name}, este es tu plan` : "Este es tu plan"}
      </h2>

      <div className="surface mt-8 overflow-hidden p-0">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 last:border-0"
          >
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="numeric text-sm font-semibold">{r.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="surface mt-4 p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Probabilidad estimada</p>
            <p className="numeric mt-2 text-4xl font-semibold text-primary">{plan.probability}%</p>
          </div>
          <p className="max-w-[55%] text-right text-xs text-muted-foreground">
            Estimación basada en tu ritmo actual de ahorro y un rendimiento de {data.expected_return}% anual. No es una
            garantía.
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${plan.probability}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Proyección a los {plan.retireAge} años: <span className="numeric text-foreground">{compact(plan.projected, currency)}</span>
        </p>
      </div>

      <p className="mt-8 text-center text-base leading-relaxed text-muted-foreground">
        Tu objetivo es disfrutar de un ingreso mensual de{" "}
        <span className="text-foreground">{money(plan.desiredIncome, currency)}</span> a partir de los {plan.retireAge}{" "}
        años. Con tu ritmo actual de ahorro e inversión estás construyendo ese camino. Ahora comienza a seguir tu progreso
        desde Your north.
      </p>

      <Button size="lg" className="mt-8 w-full rounded-full" onClick={onEnter}>
        Entrar a mi Dashboard <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
