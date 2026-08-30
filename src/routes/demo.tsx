import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle, useLanguage, useT } from "@/hooks/use-language";
import { saveDemoSnapshot } from "@/lib/demo-snapshot";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

export const Route = createFileRoute("/demo")({
  validateSearch: demoSearchSchema,
  head: () => ({
    meta: [
      { title: "Calculadora de Libertad Financiera | Descubre tu Número" },
      {
        name: "description",
        content:
          "Calcula cuánto capital necesitas para vivir de tus inversiones y alcanzar tu libertad financiera. Responde 3 preguntas en 30 segundos. Gratis y sin registro.",
      },
      { property: "og:title", content: "Calculadora de Libertad Financiera | Descubre tu Número" },
      {
        property: "og:description",
        content:
          "Calcula cuánto capital necesitas para vivir de tus inversiones y alcanzar tu libertad financiera. 3 preguntas, 30 segundos, gratis y sin registro.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Calculadora de Libertad Financiera | Descubre tu Número" },
      {
        name: "twitter:description",
        content:
          "Calcula cuánto capital necesitas para vivir de tus inversiones y alcanzar tu libertad financiera. 3 preguntas, 30 segundos, gratis y sin registro.",
      },
      { property: "og:url", content: "https://whatsyour-number.com/demo" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://whatsyour-number.com/demo" },
      { rel: "alternate", hrefLang: "es", href: "https://whatsyour-number.com/demo" },
      { rel: "alternate", hrefLang: "en", href: "https://whatsyour-number.com/en/demo" },
      { rel: "alternate", hrefLang: "x-default", href: "https://whatsyour-number.com/demo" },
    ],
  }),
  component: DemoPage,
});

const RETURN_RATE = 0.07;
const WITHDRAW_RATE = 0.07;


function yearsToTarget(target: number, current: number, monthly: number) {
  if (current >= target) return 0;
  const r = RETURN_RATE / 12;
  let balance = current;
  for (let m = 1; m <= 12 * 80; m++) {
    balance = balance * (1 + r) + monthly;
    if (balance >= target) return Math.round((m / 12) * 10) / 10;
  }
  return null;
}

export function DemoPage() {
  const t = useT();
  const { lang } = useLanguage();
  const { start } = useSearch({ strict: false }) as { start?: number };
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [step, setStep] = useState(start === 1 ? 1 : 0); // 0 = intro, 1..3 = preguntas, 4 = resultado
  const [monthlyLife, setMonthlyLife] = useState("");
  const [netWorth, setNetWorth] = useState("");
  const [monthlyInvest, setMonthlyInvest] = useState("");

  useEffect(() => {
    if (start === 1 && step === 0) setStep(1);
  }, [start, step]);

  // Guardamos el resultado del demo para poder alimentar el dashboard.
  useEffect(() => {
    if (step < 4) return;
    const parse = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
    saveDemoSnapshot({
      monthlySpend: parse(monthlyLife),
      netWorth: parse(netWorth),
      monthlyInvest: parse(monthlyInvest),
      currency,
    });
  }, [step, monthlyLife, netWorth, monthlyInvest, currency]);

  const symbol = currency === "EUR" ? "€" : "$";
  const money = (n: number) =>
    `${symbol}${Math.round(n).toLocaleString(currency === "EUR" ? "es-ES" : "en-US")}`;

  const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
  const spend = num(monthlyLife);
  const have = num(netWorth);
  const invest = num(monthlyInvest);

  const target = (spend * 12) / WITHDRAW_RATE;
  const missing = Math.max(target - have, 0);
  const progress = target > 0 ? Math.min((have / target) * 100, 100) : 0;
  const baseYears = yearsToTarget(target, have, invest);
  const scenarios = [invest + 1000, invest + 2000].map((m) => ({
    monthly: m,
    years: yearsToTarget(target, have, m),
  }));

  const questions = [
    {
      q: t(
        "¿Cuánto dinero quieres tener disponible al mes para vivir?",
        "How much money do you want available each month to live on?",
      ),
      hint: t("Tu estilo de vida ideal, hoy.", "Your ideal lifestyle, today."),
      value: monthlyLife,
      set: setMonthlyLife,
      placeholder: "5,000",
    },
    {
      q: t("¿Cuánto patrimonio o inversiones tienes hoy?", "How much net worth or investments do you have today?"),
      hint: t("Suma cuentas, inversiones y activos líquidos.", "Add up accounts, investments and liquid assets."),
      value: netWorth,
      set: setNetWorth,
      placeholder: "350,000",
    },
    {
      q: t("¿Cuánto puedes invertir cada mes?", "How much can you invest each month?"),
      hint: t("Lo que aportas de forma constante.", "What you contribute consistently."),
      value: monthlyInvest,
      set: setMonthlyInvest,
      placeholder: "2,000",
    },
  ];

  const reset = () => {
    setStep(0);
    setMonthlyLife("");
    setNetWorth("");
    setMonthlyInvest("");
  };

  const current = questions[step - 1];
  const canContinue = current ? num(current.value) > 0 : true;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-5 py-6">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between">
        <Link to={lang === "en" ? "/en" : "/"} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Inicio", "Home")}
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-elevated/70 p-0.5 text-[11px]">
            {(["EUR", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  currency === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              <BrandLogo className="h-8 w-8" />
              <h1 className="mt-8 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {t("Toca para", "Tap to")}
                <span className="block bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                  {t("descubrir tu número", "discover your number")}
                </span>
              </h1>

              <motion.button
                type="button"
                onClick={() => setStep(1)}
                whileTap={{ scale: 0.96 }}
                className="glow group relative mt-10 flex h-44 w-44 items-center justify-center rounded-full bg-elevated ring-1 ring-border transition-transform hover:scale-[1.03]"
              >
                <span className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-2xl" />
                <span className="absolute inset-3 rounded-full ring-1 ring-primary/40" />
                <Target className="absolute h-24 w-24 text-primary/25" strokeWidth={1} />
                <span className="relative font-display text-5xl font-semibold text-primary">?</span>
              </motion.button>

              <p className="mt-10 max-w-xs text-sm text-muted-foreground">
                {t(
                  "En 30 segundos descubre cuánto necesitas para vivir de tus inversiones. Sin registro.",
                  "In 30 seconds find out how much you need to live off your investments. No sign-up.",
                )}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("3 preguntas · gratis", "3 questions · free")}
              </p>
            </motion.section>
          )}

          {step >= 1 && step <= 3 && current && (
            <motion.section
              key={`q-${step}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-elevated"}`}
                  />
                ))}
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {step}/3
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-snug tracking-tight">{current.q}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{current.hint}</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canContinue) setStep(step + 1);
                }}
                className="mt-8"
              >
                <div className="surface flex items-center gap-2 px-4 py-3">
                  <span className="numeric text-2xl text-muted-foreground">{symbol}</span>
                  <Input
                    autoFocus
                    inputMode="decimal"
                    value={current.value}
                    onChange={(e) => current.set(e.target.value)}
                    placeholder={current.placeholder}
                    className="numeric h-12 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setStep(step - 1)}
                  >
                    {t("Atrás", "Back")}
                  </Button>
                  <Button type="submit" disabled={!canContinue} className="ml-auto gap-2 rounded-full px-6">
                    {step === 3 ? t("Ver mi número", "See my number") : t("Continuar", "Continue")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="surface glow relative overflow-hidden p-6 text-center">
                <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />
                <p className="relative text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Tu número", "Your number")}
                </p>
                <p className="numeric relative mt-2 text-5xl font-semibold tracking-tight text-positive md:text-6xl">
                  {money(target)}
                </p>

                <div className="relative mx-auto mt-6 max-w-xs space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("Tienes", "You have")}</span>
                    <span className="numeric font-medium">{money(have)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("Te faltan", "You're missing")}</span>
                    <span className="numeric font-medium">{money(missing)}</span>
                  </div>
                </div>

                <div className="relative mx-auto mt-5 h-2.5 max-w-xs overflow-hidden rounded-full bg-elevated">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-positive"
                  />
                </div>
                <p className="relative mx-auto mt-2 max-w-xs text-xs text-muted-foreground">
                  {progress.toFixed(0)}% {t("completado", "completed")}
                </p>
              </div>

              <div className="surface p-6">
                <p className="text-sm">
                  {t("Al ritmo actual llegas en", "At your current pace you get there in")}{" "}
                  <span className="font-semibold text-positive">
                    {baseYears === null
                      ? t("más de 80 años", "over 80 years")
                      : baseYears === 0
                        ? t("ya llegaste 🎉", "you're already there 🎉")
                        : `${baseYears} ${t("años", "years")}`}
                  </span>
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {scenarios.map((s) => (
                    <div key={s.monthly} className="rounded-2xl bg-elevated/60 p-4 ring-1 ring-border">
                      <p className="numeric text-xs text-muted-foreground">
                        {money(s.monthly)}/{t("mes", "mo")}
                      </p>
                      <p className="numeric mt-1 text-xl font-semibold">
                        {s.years === null ? "80+" : `${s.years} ${t("años", "yrs")}`}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {t(
                    "Estimación con regla del 7% de retiro y 7% de rentabilidad anual.",
                    "Estimate based on the 7% withdrawal rule and 7% annual return.",
                  )}

                </p>
              </div>

              <div className="surface p-6 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-medium">
                  {t("¿Quieres llegar antes?", "Want to get there sooner?")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    "Crea tu cuenta gratis, sube tus estados de cuenta y la IA arma tu plan personalizado.",
                    "Create your free account, upload your statements and the AI builds your personalized plan.",
                  )}
                </p>
                <Button asChild size="lg" className="mt-5 w-full gap-2 rounded-full">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    {t("Quiero llegar antes", "I want to get there sooner")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> {t("Calcular de nuevo", "Calculate again")}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
