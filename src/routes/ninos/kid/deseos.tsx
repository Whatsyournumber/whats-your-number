import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronRight, Flame, Plus, Rocket, Share2, Trash2, Trophy, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Field, Progress, inputClass } from "@/components/mfn-ui";
import { KidPage } from "@/components/kid-page";
import { useI18n } from "@/lib/mfn-i18n";
import {
  useCompleteTaskForWish,
  useCreateWish,
  useDeleteWish,
  useMovements,
  useTasks,
  useWishes,
} from "@/hooks/use-mfn";
import {
  WISH_IDEAS,
  money,
  monthlySavingPace,
  wishForecast,
  type Member,
  type Movement,
  type Task,
  type Wish,
} from "@/lib/mfn";

export const Route = createFileRoute("/ninos/kid/deseos")({
  head: () => ({
    meta: [
      { title: "Mis Sueños | My First Number" },
      {
        name: "description",
        content:
          "Convierte tus sueños en metas de ahorro: progreso, racha de ahorro, aportaciones de familia y cuándo lo conseguirás.",
      },
      { property: "og:title", content: "Mis Sueños | My First Number" },
      {
        property: "og:description",
        content: "Metas de ahorro visuales con proyección de tiempo para cada sueño.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <KidPage>{(member) => <MyDreams member={member} />}</KidPage>,
});

function Ring({ value, size = 132 }: { value: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={13} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={13}
          strokeLinecap="round"
          className="stroke-primary transition-all duration-700"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, Math.max(0, value))) / 100}
        />
      </svg>
      <span className="absolute font-display text-xl font-semibold text-primary">{Math.round(value)}%</span>
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function savedThisMonth(movements: Movement[], offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  const key = d.toISOString().slice(0, 7);
  return movements
    .filter((m) => m.pocket === "ahorrar" && m.occurred_at.slice(0, 7) === key)
    .reduce((s, m) => s + Number(m.amount), 0);
}

function savingStreakWeeks(movements: Movement[]) {
  const weeks = new Set(
    movements
      .filter((m) => m.pocket === "ahorrar")
      .map((m) => {
        const d = new Date(m.occurred_at);
        return Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));
      }),
  );
  let streak = 0;
  let cursor = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

function MyDreams({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { data: wishes = [], isLoading } = useWishes(member.id);
  const { data: movements = [] } = useMovements(member.id);
  const { data: tasks = [] } = useTasks(member.id);
  const create = useCreateWish();
  const remove = useDeleteWish();

  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState(WISH_IDEAS[0]!);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>(String(WISH_IDEAS[0]!.price));
  const [targetDate, setTargetDate] = useState<string>("");

  const pace = monthlySavingPace(movements) || Number(member.allowance_amount) * 0.4;
  const active = wishes.filter((w) => !w.achieved);
  const achieved = wishes.filter((w) => w.achieved);

  const totals = useMemo(() => {
    const saved = wishes.reduce((s, w) => s + Math.min(Number(w.saved), Number(w.price)), 0);
    const price = wishes.reduce((s, w) => s + Number(w.price), 0);
    return { saved, price, progress: price > 0 ? Math.min(100, (saved / price) * 100) : 0 };
  }, [wishes]);

  const thisMonth = savedThisMonth(movements);
  const lastMonth = savedThisMonth(movements, 1);
  const streak = savingStreakWeeks(movements);
  const points = Math.round(totals.saved);

  const contributions = useMemo(
    () =>
      movements
        .filter((m) => m.pocket === "ahorrar" && m.source !== "mesada")
        .slice(0, 3),
    [movements],
  );

  const boosters = useMemo(
    () => tasks.filter((x) => Number(x.reward) > 0 && x.status !== "aprobada").slice(0, 3),
    [tasks],
  );
  const boost = useCompleteTaskForWish();

  const submit = () =>
    create.mutate(
      {
        memberId: member.id,
        title: title.trim() || (lang === "en" ? idea.titleEn : idea.title),
        emoji: idea.emoji,
        price: Number(price) || idea.price,
        targetDate: targetDate || null,
      },
      {
        onSuccess: () => {
          toast.success(t("¡Sueño añadido!", "Dream added!"));
          setOpen(false);
          setTitle("");
          setTargetDate("");
        },
        onError: (err: unknown) =>
          toast.error(
            t("No se pudo guardar", "Could not save") + ": " + ((err as Error)?.message ?? ""),
          ),
      },
    );

  return (
    <>
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 whitespace-nowrap font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <span>⭐</span> {t("Mis Sueños", "My Dreams")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Cada moneda que ahorras te acerca a algo increíble.", "Every coin you save brings you closer to something amazing.")}
            </p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
            <Bell className="h-4 w-4" />
          </span>
        </div>
        <Button className="mt-4 w-full sm:w-auto" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> {t("Nuevo sueño", "New dream")}
        </Button>
      </header>

      <Card className="mb-4">
        <div className="grid gap-5 sm:grid-cols-3">
          <Kpi
            icon={<Wallet className="h-5 w-5 text-primary" />}
            tone="bg-primary/10"
            label={t("Ahorrado este mes", "Saved this month")}
            value={money(thisMonth, member.currency)}
            hint={`${thisMonth - lastMonth >= 0 ? "+" : ""}${money(thisMonth - lastMonth, member.currency)} ${t("vs mes pasado", "vs last month")}`}
          />
          <Kpi
            icon={<Flame className="h-5 w-5 text-chart-3" />}
            tone="bg-chart-3/15"
            label={t("Racha de ahorro", "Saving streak")}
            value={`${streak} ${streak === 1 ? t("semana", "week") : t("semanas", "weeks")}`}
            hint={t("¡Sigue así!", "Keep it up!")}
          />
          <Kpi
            icon={<Trophy className="h-5 w-5 text-primary" />}
            tone="bg-accent"
            label={t("Sueños cumplidos", "Dreams achieved")}
            value={String(achieved.length)}
            hint={t("¡Eres imparable!", "You're unstoppable!")}
          />
        </div>
      </Card>

      {open ? (
        <Card className="mb-4" title={t("¿Qué quieres conseguir?", "What do you want to get?")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WISH_IDEAS.map((w) => (
              <button
                key={w.title}
                onClick={() => {
                  setIdea(w);
                  setPrice(String(w.price));
                }}
                className={`rounded-2xl border p-4 text-center ${
                  idea.title === w.title ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <span className="text-2xl">{w.emoji}</span>
                <span className="mt-1 block text-xs font-semibold text-foreground">
                  {lang === "en" ? w.titleEn : w.title}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <Field label={t("Nombre", "Name")}>
              <input
                className={inputClass}
                placeholder={lang === "en" ? idea.titleEn : idea.title}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label={t("Precio", "Price")}>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label={t("¿Para cuándo?", "By when?")}>
              <input
                type="date"
                className={inputClass}
                min={new Date().toISOString().slice(0, 10)}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Field>
            <Button disabled={create.isPending} onClick={submit}>
              {t("Guardar", "Save")}
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card title={t("Mis sueños activos", "My active dreams")}>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("Cargando…", "Loading…")}</p>
          ) : active.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("Todavía no tienes sueños. ¡Añade el primero!", "No dreams yet. Add the first one!")}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {active.map((w) => (
                <DreamRow
                  key={w.id}
                  wish={w}
                  member={member}
                  pace={pace}
                  boosters={boosters}
                  onBoost={(task) =>
                    boost.mutate(
                      { task, member, wishId: w.id },
                      {
                        onSuccess: (res) =>
                          toast.success(
                            t(
                              `¡+${money(res.amount, member.currency)} para ${w.title}!`,
                              `+${money(res.amount, member.currency)} towards ${w.title}!`,
                            ),
                          ),
                      },
                    )
                  }
                  onDelete={() => remove.mutate({ id: w.id, memberId: member.id })}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" /> {t("Añadir un nuevo sueño", "Add a new dream")}
          </button>
        </Card>

        <div className="grid content-start gap-4">
          <Card title={t("Progreso general", "Overall progress")}>
            <div className="flex items-center gap-4">
              <Ring value={totals.progress} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {achieved.length} {t("de", "of")} {wishes.length} {t("sueños", "dreams")}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-chart-2">
                  {money(totals.saved, member.currency)} {t("ahorrados", "saved")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("de", "of")} {money(totals.price, member.currency)}
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-2xl bg-accent p-4 text-center text-xs italic leading-relaxed text-foreground">
              {t(
                "“Los sueños no se cumplen por arte de magia, se cumplen por ahorro.”",
                "“Dreams don't come true by magic, they come true by saving.”",
              )}
              <span className="mt-1 block not-italic font-semibold text-primary">– Buddy 🤖</span>
            </p>
          </Card>

          {achieved.length > 0 ? (
            <Card title={t("Sueños cumplidos", "Achieved dreams")}>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {achieved.map((w) => (
                  <div key={w.id} className="w-28 shrink-0 rounded-2xl border border-border p-3 text-center">
                    <span className="text-2xl">{w.emoji}</span>
                    <p className="mt-1 truncate text-xs font-semibold text-foreground">{w.title}</p>
                    <p className="text-[11px] text-muted-foreground">{money(Number(w.price), member.currency)}</p>
                    <p className="mt-1 text-[11px] font-medium text-chart-2">{t("Cumplido", "Achieved")}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card title={t("Aportaciones de familia y amigos", "Family & friends contributions")}>
            {contributions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("Aún no hay aportaciones. ¡Comparte tus sueños!", "No contributions yet. Share your dreams!")}
              </p>
            ) : (
              <ul className="grid gap-3">
                {contributions.map((m) => (
                  <li key={m.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-sm">🎁</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t("Aportó", "Contributed")} {money(Number(m.amount), member.currency)}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(m.occurred_at).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              className="mt-4 w-full justify-center"
              onClick={() => toast.success(t("¡Enlace de tus sueños copiado!", "Dreams link copied!"))}
            >
              <Share2 className="h-4 w-4" /> {t("Compartir mis sueños", "Share my dreams")}
            </Button>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-xl">🤖</span>
            <div className="min-w-0 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t("Consejo de Buddy", "Buddy's tip")}
              </p>
              <p className="mt-1 leading-relaxed text-foreground">
                {active[0]
                  ? `${t("Si ahorras", "If you save")} ${money(pace, member.currency)} ${t("al mes, tu", "a month, your")} ${active[0].title} ${t("llegará en ~", "arrives in ~")}${Math.max(1, Math.round(wishForecast(active[0], pace).months))} ${t("meses.", "months.")} 🚀`
                  : t("Añade un sueño y te digo cuánto ahorrar cada mes.", "Add a dream and I'll tell you how much to save each month.")}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl">🏅</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t("Nivel de soñador", "Dreamer level")}</p>
              <p className="font-display text-base font-semibold text-foreground">
                {points >= 400
                  ? t("Soñador Experto ⭐⭐", "Expert Dreamer ⭐⭐")
                  : points >= 150
                    ? t("Soñador Constante ⭐", "Steady Dreamer ⭐")
                    : t("Soñador Novato", "Rookie Dreamer")}
              </p>
              <Progress className="mt-2" value={Math.min(100, (points / 500) * 100)} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {points} / 500 {t("puntos · ahorra y cumple sueños para subir de nivel.", "points · save and achieve dreams to level up.")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function DreamRow({
  wish,
  member,
  pace,
  boosters,
  onBoost,
  onDelete,
}: {
  wish: Wish;
  member: Member;
  pace: number;
  boosters: Task[];
  onBoost: (task: Task) => void;
  onDelete: () => void;
}) {
  const { t, lang } = useI18n();
  const [boostOpen, setBoostOpen] = useState(false);
  const f = wishForecast(wish, pace);
  const months = Number.isFinite(f.months) ? Math.max(1, Math.round(f.months)) : null;
  const locale = lang === "en" ? "en-US" : "es-ES";
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="grid gap-4 py-4 first:pt-0 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <span className="grid size-24 place-items-center rounded-2xl bg-surface-2 text-4xl">{wish.emoji}</span>
      <div className={`grid gap-4 ${boostOpen ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" : ""}`}>
        <div className="min-w-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-foreground">{wish.title}</p>
              <p className="text-xs text-muted-foreground">{money(Number(wish.price), member.currency)}</p>
            </div>
            <button
              onClick={onDelete}
              className="shrink-0 text-muted-foreground transition hover:text-destructive"
              aria-label={`${t("Eliminar", "Delete")} ${wish.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Progress value={f.progress} />
            <span className="font-display text-base font-semibold text-chart-2">{Math.round(f.progress)}%</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-chart-2">
              {money(Number(wish.saved), member.currency)} {t("ahorrados", "saved")}
            </span>
            <span className="text-muted-foreground">
              {t("Te faltan", "You need")} {money(f.missing, member.currency)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {f.etaDate ? (
              <span className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="grid leading-tight">
                  <span className="whitespace-nowrap">
                    {t("Llegará el", "Arrives on")} {fmtDate(f.etaDate)}
                  </span>
                  {months ? (
                    <span className="whitespace-nowrap text-[11px] font-normal text-muted-foreground">
                      {months} {months === 1 ? t("mes", "month") : t("meses", "months")}
                    </span>
                  ) : null}
                </span>
              </span>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="leading-tight">{t("Empieza a ahorrar para ver la fecha", "Start saving to see the date")}</span>
              </span>
            )}
            <Button variant="success" className="h-8 shrink-0 whitespace-nowrap px-3 text-xs" onClick={() => setBoostOpen((v) => !v)}>
              <Rocket className="h-3.5 w-3.5" /> {t("Acelerar", "Speed up")}
            </Button>
          </div>



          {f.targetDate ? (
            <p className={`mt-2 text-xs font-medium ${f.onTrack ? "text-chart-2" : "text-destructive"}`}>
              {f.onTrack
                ? t("¡Vas a tiempo para tu fecha!", "You're on track for your date!")
                : `${t("Para llegar el", "To make it by")} ${fmtDate(f.targetDate)} ${t("necesitas ahorrar", "you need to save")} ${money(Math.round(f.neededMonthly), member.currency)}/${t("mes", "mo")}`}
            </p>
          ) : null}

        </div>

        <div className="grid content-start gap-3">
          {boostOpen ? (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5 text-success" />
                {t("Haz tareas y adelanta tu sueño", "Do tasks and bring your dream closer")}
              </p>
              {boosters.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("No hay tareas pendientes. ¡Crea una nueva!", "No pending tasks. Create a new one!")}
                </p>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {boosters.map((b) => {
                    const reward = Number(b.reward);
                    const newMonths = pace > 0 ? Math.max(0, (f.missing - reward) / pace) : null;
                    const savedM = months && newMonths !== null ? Math.max(0, months - Math.round(newMonths)) : 0;
                    return (
                      <li key={b.id}>
                        <button
                          onClick={() => onBoost(b)}
                          className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-xl border border-success/20 bg-card px-2.5 py-2 text-xs transition hover:bg-success/10"
                          aria-label={`${t("Completar", "Complete")} ${b.title}`}
                        >
                          <span className="row-span-2 text-base leading-none">{b.emoji}</span>
                          <span className="min-w-0 text-left leading-snug text-foreground">{b.title}</span>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left text-[11px]">
                            <span className="font-semibold text-success">+{money(reward, member.currency)}</span>
                            {savedM > 0 ? (
                              <span className="text-muted-foreground">
                                −{savedM} {savedM === 1 ? t("mes", "mo") : t("meses", "mo")}
                              </span>
                            ) : null}
                          </span>
                        </button>

                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                to="/ninos/kid/tareas"
                className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-primary"
              >
                {t("Ver todas las tareas", "View all tasks")} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
