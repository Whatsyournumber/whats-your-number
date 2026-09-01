import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Buddy, Card, Field, inputClass } from "@/components/mfn-ui";
import { useKidTheme } from "@/components/kid-shell";
import { useActiveProfile, useMembers, useSubscription } from "@/hooks/use-mfn";
import { kidLimit } from "@/lib/mfn-plan";
import { useI18n, LangToggle } from "@/lib/mfn-i18n";
import { CITIES, CURRENCIES, currencyForCity, currencyLabel } from "@/lib/mfn-currencies";
import { FUND_GOALS, TASK_IDEAS, WISH_IDEAS, seedHoldings, splitAmount, type Member } from "@/lib/mfn";

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

const AVATARS_BOY = ["🦊", "🐼", "🐯", "🐨", "🦁", "🐙", "🐧", "🐸", "🐲", "🦖"];
const AVATARS_GIRL = ["🦄", "🐰", "🐱", "🦢", "🦋", "🐞", "🐝", "🦩", "🐬", "🦜"];
const STEPS = [0, 1, 2, 3, 4, 5];
const DRAFT_KEY = "mfn-kid-onboarding-draft";

type Draft = {
  step: number; name: string; age: number; theme: "boy" | "girl"; avatar: string; city: string;
  currency: string; allowance: number; frequency: string; split: { spend: number; save: number; grow: number };
  wishTitle: string; wishPrice: number; initial: number; savedNow: number; targetAge: number; expected: number; goal: string;
  // Perfil ya creado desde la sección de perfiles: el onboarding lo actualiza, no duplica.
  memberId?: string;
};

function readDraft(): Partial<Draft> | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

function Onboarding() {
  const router = useRouter();
  const { select } = useActiveProfile();
  const { data: members = [] } = useMembers();
  const { data: subscription } = useSubscription();
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [theme, setTheme] = useState<"boy" | "girl">("boy");
  const [avatar, setAvatar] = useState("🦊");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [allowance, setAllowance] = useState(10);
  const [frequency, setFrequency] = useState("semanal");
  const [split, setSplit] = useState({ spend: 20, save: 40, grow: 40 });
  const [wish, setWish] = useState(WISH_IDEAS[0]!);
  const [wishPrice, setWishPrice] = useState(WISH_IDEAS[0]!.price);
  const [initial, setInitial] = useState(1000);
  const [savedNow, setSavedNow] = useState(0);
  const [monthly] = useState(50);
  const [targetAge, setTargetAge] = useState(18);
  const [expected, setExpected] = useState(10);
  const [goal, setGoal] = useState(FUND_GOALS[0]!);
  const restored = useRef(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  // Restaura el borrador si el padre salió a mitad del onboarding.
  useEffect(() => {
    const d = readDraft();
    restored.current = true;
    if (!d) return;
    if (typeof d.step === "number") setStep(Math.min(5, Math.max(0, d.step)));
    if (typeof d.memberId === "string") setMemberId(d.memberId);
    if (d.name) setName(d.name);
    if (typeof d.age === "number") setAge(d.age);
    if (d.theme) setTheme(d.theme);
    if (d.avatar) setAvatar(d.avatar);
    if (d.city) setCity(d.city);
    if (d.currency) setCurrency(d.currency);
    if (typeof d.allowance === "number") setAllowance(d.allowance);
    if (d.frequency) setFrequency(d.frequency);
    if (d.split) setSplit(d.split);
    if (d.wishTitle) {
      const found = WISH_IDEAS.find((w) => w.title === d.wishTitle);
      if (found) setWish(found);
    }
    if (typeof d.wishPrice === "number") setWishPrice(d.wishPrice);
    if (typeof d.initial === "number") setInitial(d.initial);
    if (typeof d.savedNow === "number") setSavedNow(d.savedNow);
    if (typeof d.targetAge === "number") setTargetAge(d.targetAge);
    if (typeof d.expected === "number") setExpected(d.expected);
    if (d.goal) {
      const g = FUND_GOALS.find((x) => x === d.goal);
      if (g) setGoal(g);
    }
    if (d.name) toast.message(t("Retomamos donde lo dejaste", "Picking up where you left off"));
  }, []);

  // Guarda el borrador en cada cambio.
  useEffect(() => {
    if (!restored.current) return;
    const draft: Draft = {
      step, name, age, theme, avatar, city, currency, allowance, frequency, split,
      wishTitle: wish.title, wishPrice, initial, savedNow, targetAge, expected, goal: goal as string,
      ...(memberId ? { memberId } : {}),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [step, name, age, theme, avatar, city, currency, allowance, frequency, split, wish, wishPrice, initial, savedNow, targetAge, expected, goal, memberId]);

  useKidTheme(theme);

  const citySuggestions = CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(city.trim().toLowerCase()) &&
      c.city.toLowerCase() !== city.trim().toLowerCase(),
  ).slice(0, 6);

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
    // El titular cuenta como primer adulto; las filas "parent" son adultos adicionales.
    // Con memberId el perfil ya existe (creado desde Perfiles): no vuelve a consumir cupo.
    const maxKids = kidLimit(subscription, 1 + members.filter((m) => m.role === "parent").length);
    if (!memberId && members.filter((m) => m.role === "child").length >= maxKids) {
      toast.error(
        t(
          `Tu plan permite ${maxKids} ${maxKids === 1 ? "perfil" : "perfiles"} de niño`,
          `Your plan allows ${maxKids} child ${maxKids === 1 ? "profile" : "profiles"}`,
        ),
      );
      router.navigate({ to: "/precios", search: { plan: "familiar" } });
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth.user?.id;
      if (!user_id) throw new Error(t("Sesión no disponible", "Session not available"));

      const values = {
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
      };
      let member: { id: string };
      if (memberId) {
        // Perfil pre-creado desde la sección de perfiles: se actualiza, no se duplica.
        const { data: updated, error } = await supabase
          .from("kid_members")
          .update(values)
          .eq("id", memberId)
          .select("id")
          .single();
        if (error) throw error;
        member = updated;
      } else {
        const { data: inserted, error } = await supabase
          .from("kid_members")
          .insert({ user_id, ...values })
          .select("id")
          .single();
        if (error) throw error;
        member = inserted;
      }

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
      // El monto inicial del fondo ya forma parte del dinero ahorrado:
      // solo repartimos en bolsillos la diferencia para no duplicar montos.
      const toPockets = Math.max(0, savedNow - initial);
      if (toPockets > 0) {
        const parts = splitAmount(toPockets, {
          split_spend: split.spend,
          split_save: split.save,
          split_grow: split.grow,
        });
        const now = new Date().toISOString();
        await supabase.from("kid_movements").insert(
          (["gastar", "ahorrar", "crecer"] as const)
            .filter((k) => parts[k] > 0)
            .map((k) => ({
              user_id,
              member_id: member.id,
              amount: parts[k],
              pocket: k,
              label: t("Ahorro inicial", "Starting savings"),
              source: t("Ahorro previo", "Previous savings"),
              occurred_at: now,
            })),
        );
      }
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

      window.localStorage.removeItem(DRAFT_KEY);
      select(member.id);
      // Refresca la lista de perfiles antes de navegar para que el guard
      // del panel infantil encuentre al nuevo perfil y no rebote a /ninos.
      await queryClient.refetchQueries({ queryKey: ["kid_members"] });
      toast.success(
        t(`¡${name.trim()} ya tiene su primer número!`, `${name.trim()} now has a first number!`),
      );
      await router.navigate({ to: "/ninos/kid/numero" });

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
                {(theme === "girl" ? AVATARS_GIRL : AVATARS_BOY).map((a) => (
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
                {t("Niño o niña", "Boy or girl")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["boy", "girl"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setTheme(option);
                      setAvatar((option === "girl" ? AVATARS_GIRL : AVATARS_BOY)[0]!);
                    }}
                    className={`rounded-2xl border p-4 text-left text-sm font-semibold ${
                      theme === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                    }`}
                  >
                    {option === "boy" ? t("👦 Niño", "👦 Boy") : t("👧 Niña", "👧 Girl")}
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
                  value={city}
                  onChange={(e) => pickCity(e.target.value)}
                  placeholder={t(
                    "Escribe tu ciudad (ej. Madrid, Lima, Miami…)",
                    "Type your city (e.g. Madrid, Lima, Miami…)",
                  )}
                />
              </Field>
              {city.trim().length > 0 && citySuggestions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {citySuggestions.map((c) => (
                    <button
                      key={c.city}
                      onClick={() => pickCity(c.city)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      {c.flag} {c.city} · {c.country}
                    </button>
                  ))}
                </div>
              ) : null}
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
                `¿Cuánto dinero le quieres poner a ${name || "tu hijo/a"} y con qué frecuencia?`,
                `How much money do you want to give ${name || "your child"}, and how often?`,
              )}
            </Buddy>
            <Card>
              <div className="space-y-4">
                <Field label={`${t("Monto inicial para abrir su fondo", "Initial amount to open their fund")} (${currency})`}>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="0"
                    value={initial || ""}
                    onChange={(e) => setInitial(Number(e.target.value))}
                  />
                </Field>
                <Field label={`${t("¿Cuánto dinero tiene ahorrado hasta ahora?", "How much money do they have saved so far?")} (${currency})`}>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="0"
                    value={savedNow || ""}
                    onChange={(e) => setSavedNow(Number(e.target.value))}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`${t("Monto mensual", "Monthly amount")} (${currency})`}>
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
              hint={`${t("Invertir", "Invest")} ${split.grow}% · ${t("Ahorrar", "Save")} ${split.save}% · ${t("Gastar", "Spend")} ${split.spend}%`}
            >
              <div className="space-y-5">
                {(() => {
                  type K = "spend" | "save" | "grow";
                  const reorder = (key: K, next: number) => {
                    const rem = 100 - next;
                    const all: K[] = ["spend", "save", "grow"];
                    let o1: K = "spend";
                    let o2: K = "save";
                    const rest = all.filter((k) => k !== key);
                    o1 = rest[0]!;
                    o2 = rest[1]!;
                    const sum = split[o1] + split[o2];
                    const a = sum === 0 ? Math.round(rem / 2) : Math.round((split[o1] / sum) * rem);
                    const b = rem - a;
                    const upd: Record<K, number> = { spend: split.spend, save: split.save, grow: split.grow };
                    upd[key] = next;
                    upd[o1] = a;
                    upd[o2] = b;
                    setSplit(upd);
                  };
                  const items: { key: K; emoji: string; labelEs: string; labelEn: string }[] = [
                    { key: "grow", emoji: "📈", labelEs: "Invertir", labelEn: "Invest" },
                    { key: "save", emoji: "🌱", labelEs: "Ahorrar", labelEn: "Save" },
                    { key: "spend", emoji: "🛍", labelEs: "Gastar", labelEn: "Spend" },
                  ];
                  return items.map((item) => (
                    <Field
                      key={item.key}
                      label={`${item.emoji} ${t(item.labelEs, item.labelEn)} — ${split[item.key]}%`}
                    >
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={split[item.key]}
                        onChange={(e) => reorder(item.key, Number(e.target.value))}
                        className="w-full accent-[var(--color-primary)]"
                      />
                    </Field>
                  ));
                })()}
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
                `¡Gracias por completar todo! Ya podemos crear el perfil de ${name.trim() || "tu hijo/a"}.`,
                `Thanks for completing everything! We can now create ${name.trim() || "your child"}'s profile.`,
              )}
            </Buddy>
            <Card>
              <div className="relative overflow-hidden py-10 text-center">
                <style>{`@keyframes mfnFloat{0%{transform:translateY(120%) rotate(-6deg);opacity:0}15%{opacity:1}100%{transform:translateY(-140%) rotate(6deg);opacity:0}}`}</style>
                {["🎈", "🎉", "🎈", "🎊", "🎈", "✨", "🎈", "🎉"].map((e, i) => (
                  <span
                    key={i}
                    className="pointer-events-none absolute text-3xl"
                    style={{
                      left: `${6 + i * 12}%`,
                      bottom: 0,
                      animation: `mfnFloat ${4 + (i % 4)}s linear ${i * 0.45}s infinite`,
                    }}
                  >
                    {e}
                  </span>
                ))}
                <p className="relative text-2xl font-black text-foreground">
                  {t("¡Gracias por completar!", "Thanks for completing!")}
                </p>
                <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {t(
                    "Todo listo. Pulsa «Crear perfil» y empezamos a construir su primer número.",
                    "All set. Tap “Create profile” and we'll start building their first number.",
                  )}
                </p>
              </div>
            </Card>
          </div>
        ) : null}



        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.navigate({ to: "/ninos" }) : setStep(step - 1))}
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
