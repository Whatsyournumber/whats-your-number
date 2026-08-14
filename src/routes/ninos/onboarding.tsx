import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Buddy, Card, Field, GrowthChart, inputClass } from "@/components/mfn-ui";
import { useKidTheme } from "@/components/kid-shell";
import { useActiveProfile, useMembers, useSubscription } from "@/hooks/use-mfn";
import { kidLimit } from "@/lib/mfn-plan";
import { useI18n, LangToggle } from "@/lib/mfn-i18n";
import { CITIES, CURRENCIES, currencyForCity, currencyLabel } from "@/lib/mfn-currencies";
import {
  FUND_GOALS,
  RETURN_OPTIONS,
  TASK_IDEAS,
  WISH_IDEAS,
  disclaimer,
  goalLabel,
  money,
  projectFund,
  seedHoldings,
} from "@/lib/mfn";

export const Route = createFileRoute("/ninos/onboarding")({
  head: () => ({
    meta: [
      { title: "Crear el perfil de tu hijo/a | My First Number" },
      {
        name: "description",
        content:
          "Configura en seis pasos el perfil de tu hijo/a: ciudad y moneda, mesada, bolsillos, primer deseo y Fondo del Futuro.",
      },
      { property: "og:title", content: "Crear el perfil de tu hijo/a | My First Number" },
      {
        property: "og:description",
        content: "Onboarding conversacional para empezar a construir el patrimonio de tus hijos.",
      },
    ],
  }),
  component: Onboarding,
});

const AVATARS = ["🦊", "🐼", "🦄", "🐯", "🐨", "🦁", "🐙", "🐧", "🐸", "🐷"];
const STEPS = [0, 1, 2, 3, 4, 5];

function Onboarding() {
  const router = useRouter();
  const { select } = useActiveProfile();
  const { data: members = [] } = useMembers();
  const { data: subscription } = useSubscription();
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState(8);
  const [avatar, setAvatar] = useState("🦊");
  const [theme, setTheme] = useState<"boy" | "girl">("boy");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [allowance, setAllowance] = useState(10);
  const [frequency, setFrequency] = useState("semanal");
  const [split, setSplit] = useState({ spend: 40, save: 40, grow: 20 });
  const [wish, setWish] = useState(WISH_IDEAS[0]!);
  const [wishPrice, setWishPrice] = useState(WISH_IDEAS[0]!.price);
  const [initial, setInitial] = useState(1000);
  const [monthly, setMonthly] = useState(50);
  const [targetAge, setTargetAge] = useState(18);
  const [expected, setExpected] = useState(7);
  const [goal, setGoal] = useState(FUND_GOALS[0]!);

  useKidTheme(theme);

  const projection = projectFund(initial, monthly, age, targetAge, expected);
  const canNext = [
    name.trim().length > 1,
    city.trim().length > 1,
    allowance >= 0,
    true,
    wishPrice > 0,
    monthly >= 0,
  ][step];

  function pickCity(value: string) {
    setCity(value);
    const detected = currencyForCity(value);
    if (detected) setCurrency(detected);
  }

  async function finish() {
    const maxKids = kidLimit(subscription);
    if (members.filter((m) => m.role === "child").length >= maxKids) {
      toast.error(
        t(
          `Tu plan permite ${maxKids} ${maxKids === 1 ? "perfil" : "perfiles"} de niño`,
          `Your plan allows ${maxKids} child ${maxKids === 1 ? "profile" : "profiles"}`,
        ),
      );
      router.navigate({ to: "/ninos/kid/suscripcion" });
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth.user?.id;
      if (!user_id) throw new Error(t("Sesión no disponible", "Session not available"));

      const { data: member, error } = await supabase
        .from("kid_members")
        .insert({
          user_id,
          name: name.trim(),
          role: "child",
          theme,
          avatar,
          age,
          currency,
          base_currency: currency,

          allowance_amount: allowance,
          allowance_frequency: frequency,
          split_spend: split.spend,
          split_save: split.save,
          split_grow: split.grow,
          onboarded: true,
        })
        .select("*")
        .single();
      if (error) throw error;

      await supabase.from("kid_future_funds").insert({
        user_id,
        member_id: member.id,
        initial_balance: initial,
        current_balance: initial,
        monthly_contribution: monthly,
        target_age: targetAge,
        expected_return: expected,
        goal,
      });
      await supabase.from("kid_wishes").insert({
        user_id,
        member_id: member.id,
        title: wish.title,
        emoji: wish.emoji,
        price: wishPrice,
      });
      await supabase.from("kid_tasks").insert(
        TASK_IDEAS.slice(0, 4).map((task) => ({
          user_id,
          member_id: member.id,
          title: task.title,
          emoji: task.emoji,
          reward: task.reward,
          frequency: "semanal",
        })),
      );
      await supabase.from("kid_holdings").insert(
        seedHoldings(initial).map((h) => ({ ...h, user_id, member_id: member.id })),
      );

      select(member.id);
      toast.success(
        t(`¡${member.name} ya tiene su primer número!`, `${member.name} now has a first number!`),
      );
      router.navigate({ to: "/ninos/kid/numero" });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("No se pudo crear el perfil", "Could not create profile"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-6 flex justify-end">
          <LangToggle />
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <div className="mt-8 space-y-5">
            <Buddy>
              {t(
                "¡Hola! Vamos a crear el perfil de tu hijo/a. ¿Cómo se llama?",
                "Hi! Let's create your child's profile. What's their name?",
              )}
            </Buddy>
            <Card>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("Nombre", "Name")}>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Ej. Lucas", "e.g. Lucas")}
                  />
                </Field>
                <Field label={t("Años", "Years")}>
                  <input
                    type="number"
                    min={0}
                    max={17}
                    className={inputClass}
                    placeholder="0"
                    value={Math.floor(age) || ""}
                    onChange={(e) =>
                      setAge(Math.round((Number(e.target.value) + (age % 1)) * 100) / 100)
                    }
                  />
                </Field>
                <Field label={t("Meses", "Months")}>
                  <select
                    className={inputClass}
                    value={Math.round((age % 1) * 12)}
                    onChange={(e) =>
                      setAge(Math.round((Math.floor(age) + Number(e.target.value) / 12) * 100) / 100)
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="mt-5 text-xs font-medium text-muted-foreground">
                {t("Avatar", "Avatar")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${
                      avatar === a ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-xs font-medium text-muted-foreground">
                {t("Estilo visual", "Visual style")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["boy", "girl"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTheme(option)}
                    className={`rounded-2xl border p-4 text-left text-sm font-semibold ${
                      theme === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                    }`}
                  >
                    {option === "boy"
                      ? t("🚀 Explorador", "🚀 Explorer")
                      : t("✨ Creativa", "✨ Creative")}
                    <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                      {option === "boy"
                        ? t("Baby blue, tecnología, espacio", "Baby blue, tech, space")
                        : t("Rosa, creativo, minimalista", "Pink, creative, minimal")}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-8 space-y-5">
            <Buddy>
              {t(
                "¿En qué ciudad vivís? Así configuro la moneda base de la familia.",
                "Which city do you live in? I'll set the family's base currency.",
              )}
            </Buddy>
            <Card>
              <Field label={t("Ciudad", "City")}>
                <input
                  className={inputClass}
                  list="mfn-cities"
                  value={city}
                  onChange={(e) => pickCity(e.target.value)}
                  placeholder={t("Ej. Madrid, Lima, Miami…", "e.g. Madrid, Lima, Miami…")}
                />
                <datalist id="mfn-cities">
                  {CITIES.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.flag} {c.country}
                    </option>
                  ))}
                </datalist>
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                {CITIES.slice(0, 10).map((c) => (
                  <button
                    key={c.city}
                    onClick={() => pickCity(c.city)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      city.toLowerCase() === c.city.toLowerCase()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {c.flag} {c.city}
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <Field label={t("Moneda base", "Base currency")}>
                  <select
                    className={inputClass}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {currencyLabel(c.code, lang)}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t(
                    `Todos los importes se mostrarán en ${currency}. Puedes cambiarlo después en Mis Datos.`,
                    `All amounts will be shown in ${currency}. You can change it later in My Data.`,
                  )}
                </p>
              </div>
            </Card>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 space-y-5">
            <Buddy>
              {t(
                `¿Cuánto dinero recibe ${name || "tu hijo/a"} y cada cuánto?`,
                `How much money does ${name || "your child"} get, and how often?`,
              )}
            </Buddy>
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t("Cantidad", "Amount")} (${currency})`}>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="0"
                    value={allowance || ""}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                  />
                </Field>
                <Field label={t("Frecuencia", "Frequency")}>
                  <select
                    className={inputClass}
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="semanal">{t("Semanal", "Weekly")}</option>
                    <option value="mensual">{t("Mensual", "Monthly")}</option>
                    <option value="ocasional">{t("Ocasional", "Occasional")}</option>
                  </select>
                </Field>
              </div>
            </Card>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-5">
            <Buddy>
              {t(
                "Cada vez que reciba dinero lo repartimos en tres bolsillos. La regla 40/40/20 funciona muy bien para empezar.",
                "Every time they get money we split it into three pockets. The 40/40/20 rule is a great start.",
              )}
            </Buddy>
            <Card
              title={t("Reparto automático", "Automatic split")}
              hint={`${t("Gastar", "Spend")} ${split.spend}% · ${t("Ahorrar", "Save")} ${split.save}% · ${t("Crecer", "Grow")} ${split.grow}%`}
            >
              <div className="space-y-5">
                <Field label={`🛍 ${t("Gastar", "Spend")} — ${split.spend}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={split.spend}
                    onChange={(e) => {
                      const spend = Number(e.target.value);
                      const save = Math.min(split.save, 100 - spend);
                      setSplit({ spend, save, grow: 100 - spend - save });
                    }}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>
                <Field label={`🌱 ${t("Ahorrar", "Save")} — ${split.save}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={split.save}
                    onChange={(e) => {
                      const save = Math.min(Number(e.target.value), 100 - split.spend);
                      setSplit({ ...split, save, grow: 100 - split.spend - save });
                    }}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>
                <p className="text-sm text-muted-foreground">
                  📈 {t("Hacer crecer", "Grow")}:{" "}
                  <span className="font-semibold text-foreground">{split.grow}%</span>
                </p>
              </div>
            </Card>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-8 space-y-5">
            <Buddy>
              {t(
                "¿Qué le gustaría conseguir? Ese será su primer deseo.",
                "What would they love to get? That will be their first wish.",
              )}
            </Buddy>
            <Card>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {WISH_IDEAS.map((w) => (
                  <button
                    key={w.title}
                    onClick={() => {
                      setWish(w);
                      setWishPrice(w.price);
                    }}
                    className={`rounded-2xl border p-4 text-center ${
                      wish.title === w.title ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <span className="text-2xl">{w.emoji}</span>
                    <span className="mt-1 block text-xs font-semibold text-foreground">
                      {lang === "en" ? w.titleEn : w.title}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <Field label={`${t("Precio aproximado", "Approximate price")} (${currency})`}>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    placeholder="0"
                    value={wishPrice || ""}
                    onChange={(e) => setWishPrice(Number(e.target.value))}
                  />
                </Field>
              </div>
            </Card>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="mt-8 space-y-5">
            <Buddy>
              {t(
                `Y ahora lo importante: el Fondo del Futuro. Mira cómo puede crecer hasta sus ${targetAge} años.`,
                `Now the important part: the Future Fund. See how it can grow by age ${targetAge}.`,
              )}
            </Buddy>
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t("Aporte inicial", "Initial deposit")} (${currency})`}>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="0"
                    value={initial || ""}
                    onChange={(e) => setInitial(Number(e.target.value))}
                  />
                </Field>
                <Field label={`${t("Aporte mensual", "Monthly contribution")} (${currency})`}>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="0"
                    value={monthly || ""}
                    onChange={(e) => setMonthly(Number(e.target.value))}
                  />
                </Field>
                <Field label={t("Edad objetivo", "Target age")}>
                  <select
                    className={inputClass}
                    value={targetAge}
                    onChange={(e) => setTargetAge(Number(e.target.value))}
                  >
                    {[18, 21, 25, 30].map((a) => (
                      <option key={a} value={a}>
                        {a} {t("años", "years")}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Rentabilidad esperada", "Expected return")}>
                  <select
                    className={inputClass}
                    value={expected}
                    onChange={(e) => setExpected(Number(e.target.value))}
                  >
                    {RETURN_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}% {t("anual", "per year")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <Field label={t("Objetivo del fondo", "Fund goal")}>
                  <select
                    className={inputClass}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    {FUND_GOALS.map((g) => (
                      <option key={g} value={g}>
                        {goalLabel(g, lang)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="mt-6 font-display text-2xl font-semibold text-foreground">
                {money(projection.future, currency)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {t(`a los ${targetAge} años`, `at age ${targetAge}`)}
                </span>
              </p>
              <GrowthChart
                data={projection.points}
                height={200}
                areas={[
                  { key: "total", color: "var(--color-chart-1)" },
                  { key: "aportes", color: "var(--color-chart-4)" },
                ]}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">{disclaimer(lang)}</p>
            </Card>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.navigate({ to: "/" }) : setStep(step - 1))}
          >
            <ArrowLeft className="h-4 w-4" /> {t("Atrás", "Back")}
          </Button>
          {step < 5 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
              {t("Siguiente", "Next")} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={saving} onClick={finish}>
              <Check className="h-4 w-4" /> {t("Crear perfil", "Create profile")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
