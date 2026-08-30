import { useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Gift, GraduationCap, Sparkles, Star } from "lucide-react";

import { KidsBrandLogo, KidsBrandMark } from "@/components/brand-logo";
import { UniversityCostExplorer } from "@/components/university-cost-explorer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle, useT } from "@/hooks/use-language";

const CURRENCIES = { EUR: "€", USD: "$" } as const;
type CurrencyCode = keyof typeof CURRENCIES;

export function DemoNinosPage() {
  const t = useT();
  const { start } = useSearch({ strict: false }) as { start?: number };
  const [step, setStep] = useState(start === 1 ? 1 : 0); // 0 intro, 1..3 preguntas, 4 muro de registro
  const [monthly, setMonthly] = useState("");
  const [initial, setInitial] = useState("");
  const [age, setAge] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [resultTab, setResultTab] = useState<"number" | "uni">("number");

  const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
  const symbol = CURRENCIES[currency];

  const questions = [
    {
      prefix: symbol,
      q: t("¿Con cuánto dinero puedes empezar hoy?", "How much can you start with today?"),
      hint: t("El dinero que ya tiene ahorrado (puede ser 0).", "Money already saved (can be 0)."),
      value: initial,
      set: setInitial,
      placeholder: "1,000",
      optional: true,
    },
    {
      prefix: symbol,
      q: t("¿Cuánto dinero le pudieras poner cada mes?", "How much could you add every month?"),
      hint: t("Aunque sean 50 al mes, cuentan.", "Even 50 a month counts."),
      value: monthly,
      set: setMonthly,
      placeholder: "100",
      optional: false,
    },
    {
      prefix: "🎂",
      q: t("¿Qué edad tiene tu hijo?", "How old is your child?"),
      hint: t("Calculamos hasta que cumpla 18 años.", "We calculate until they turn 18."),
      value: age,
      set: setAge,
      placeholder: "6",
      optional: false,
    },
  ];

  const current = questions[step - 1];
  const canContinue = current ? num(current.value) > 0 || current.optional : true;
  const years = Math.max(18 - Math.min(num(age), 17), 1);

  const rate = 0.1;
  const months = years * 12;
  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  const futureValue =
    num(initial) * Math.pow(1 + rate, years) +
    (monthlyRate > 0 ? num(monthly) * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : 0);
  const contributed = num(initial) + num(monthly) * months;
  const fmt = (v: number) =>
    `${symbol}${Math.round(v).toLocaleString(currency === "EUR" ? "es-ES" : "en-US")}`;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-5 py-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-kid-sky/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between">
        <Link
          to="/finanzas-para-ninos"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Volver", "Back")}
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-elevated p-0.5">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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
              <KidsBrandLogo />
              <h1 className="mt-8 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {t("Descubre el número", "Discover your child's")}
                <span className="block bg-gradient-to-r from-kid-sky to-kid-mint bg-clip-text text-transparent">
                  {t("de tu hijo a los 18", "number at 18")}
                </span>
              </h1>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                {t(
                  "3 preguntas y calculamos cuánto tendrá invirtiendo en el S&P 500 al 10% anual.",
                  "3 questions and we calculate what they'd have investing in the S&P 500 at 10% a year.",
                )}
              </p>

              <motion.button
                type="button"
                onClick={() => setStep(1)}
                whileTap={{ scale: 0.96 }}
                className="group relative mt-10 flex h-40 w-40 items-center justify-center rounded-full bg-elevated ring-1 ring-kid-sky/40 transition-transform hover:scale-[1.03]"
              >
                <span className="absolute inset-0 animate-pulse rounded-full bg-kid-sky/15 blur-2xl" />
                <KidsBrandMark className="h-20 w-20" />
              </motion.button>

              <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
              {step === 1 && (
                <div className="mb-10 flex flex-col items-center text-center">
                  <KidsBrandLogo />
                  <h1 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight">
                    {t("Descubre el número", "Discover your child's")}
                    <span className="block bg-gradient-to-r from-kid-sky to-kid-mint bg-clip-text text-transparent">
                      {t("de tu hijo a los 18", "number at 18")}
                    </span>
                  </h1>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-kid-mint" : "bg-elevated"}`} />
                ))}
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">{step}/3</p>
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
                  <span className="numeric text-2xl text-muted-foreground">{current.prefix}</span>
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
                  <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStep(step - 1)}>
                    {t("Atrás", "Back")}
                  </Button>
                  <Button type="submit" disabled={!canContinue} className="ml-auto gap-2 rounded-full px-6">
                    {step === 3 ? t("Calcular su número", "Calculate their number") : t("Continuar", "Continue")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="gate"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-kid-mint/25 bg-kid-mint/10 px-3 py-1 text-xs font-medium text-kid-mint">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Cálculo listo", "Calculation ready")}
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {t("El número de tu hijo a los 18", "Your child's number at 18")}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                {t(
                  `Con ${years} años de interés compuesto al 10% anual (rentabilidad histórica del S&P 500).`,
                  `With ${years} years of compound interest at 10% a year (historical S&P 500 return).`,
                )}
              </p>

              <div className="mx-auto mt-6 flex w-full max-w-sm items-center gap-0.5 rounded-full border border-border bg-elevated p-0.5">
                {(
                  [
                    { id: "number" as const, label: t("Su número", "Their number"), icon: Sparkles },
                    { id: "uni" as const, label: t("Universidades", "Universities"), icon: GraduationCap },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setResultTab(tab.id)}
                    className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                      resultTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {resultTab === "number" ? (
                <div className="surface relative mt-6 overflow-hidden px-6 py-10">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("Su número a los 18", "Their number at 18")}
                  </p>
                  <p className="numeric mt-3 bg-gradient-to-r from-kid-sky to-kid-mint bg-clip-text text-4xl font-semibold text-transparent md:text-5xl">
                    {fmt(futureValue)}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                    <div className="rounded-xl bg-elevated px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{t("Tú aportas", "You contribute")}</p>
                      <p className="numeric mt-1 text-sm font-semibold">{fmt(contributed)}</p>
                    </div>
                    <div className="rounded-xl bg-elevated px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{t("Lo genera el interés", "Compound interest adds")}</p>
                      <p className="numeric mt-1 text-sm font-semibold text-kid-mint">
                        {fmt(Math.max(futureValue - contributed, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-left text-sm text-muted-foreground">
                    {t(
                      "¿Alcanza para la universidad? Compara el coste medio de una carrera por país, pública vs privada.",
                      "Is it enough for university? Compare the average cost of a degree by country, public vs private.",
                    )}
                  </p>
                  <div className="mt-4">
                    <UniversityCostExplorer amount={futureValue} currency={currency} />
                  </div>
                </div>
              )}


              <div className="mt-7 rounded-2xl border border-kid-mint/25 bg-kid-mint/10 px-5 py-6 text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-kid-mint/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-kid-mint">
                  <Gift className="h-3.5 w-3.5" />
                  {t("10% de descuento", "10% off")}
                </span>
                <p className="mt-3 text-sm font-medium">
                  {t(
                    "Gracias por llegar hasta aquí: te damos un 10% de descuento por completar los pasos al crear tu cuenta.",
                    "Thanks for making it this far: get 10% off when you complete signup.",
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    "Ahora entiende cómo mejorar ese número, organiza sus finanzas y deja que aprenda el valor del dinero mientras tú estás tranquilo.",
                    "Now learn how to improve that number, organize their finances and let them learn the value of money while you stay relaxed.",
                  )}
                </p>
              </div>

              <div className="mt-7 flex flex-col items-center gap-3">
                <Button asChild size="lg" className="w-full gap-2 rounded-full sm:w-auto sm:px-8">
                  <Link to="/auth" search={{ mode: "signup", next: "/finanzas-para-ninos" }}>
                    <Star className="h-4 w-4" />
                    {t("Crear cuenta y activar mi 10%", "Create account & claim my 10%")}
                  </Link>
                </Button>
                <Link
                  to="/auth"
                  search={{ mode: "login", next: "/finanzas-para-ninos" }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("Ya tengo cuenta", "I already have an account")}
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                >
                  {t("Cambiar respuestas", "Change answers")}
                </button>
              </div>

              <p className="mt-8 text-[11px] text-muted-foreground">
                {t(
                  "Rentabilidad estimada, no garantizada. Solo con fines educativos.",
                  "Estimated, non-guaranteed return. For educational purposes only.",
                )}
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
