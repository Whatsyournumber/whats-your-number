import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button, Card, Field, Progress, inputClass } from "@/components/mfn-ui";
import { KidPage } from "@/components/kid-page";
import { useI18n } from "@/lib/mfn-i18n";
import {
  useCompleteTaskForWish,
  useCreateTask,
  useDeleteTask,
  useMovements,
  useTasks,
  useUpdateTask,
  useUncompleteTask,
  useWishes,
} from "@/hooks/use-mfn";
import { money, TASK_IDEAS, type Member, type Task } from "@/lib/mfn";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ninos/kid/tareas")({
  head: () => ({
    meta: [
      { title: "Mis Tareas | My First Number" },
      {
        name: "description",
        content:
          "Completa tareas, gana tu incentivo y alcanza tus metas. Racha diaria, progreso mensual y próximos logros.",
      },
      { property: "og:title", content: "Mis Tareas | My First Number" },
      {
        property: "og:description",
        content: "Gamificación con XP, rachas y recompensas por hábitos reales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <KidPage>{(member) => <MyTasks member={member} />}</KidPage>,
});

type Filter = "todas" | "pendientes" | "revision" | "aprobadas";

function Ring({ value, size = 62 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          className="stroke-primary transition-all duration-700"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, Math.max(0, value))) / 100}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-primary">{Math.round(value)}%</span>
    </span>
  );
}

function KpiCard({
  emoji,
  label,
  value,
  hint,
  right,
}: {
  emoji?: string;
  label: string;
  value: string;
  hint: string;
  right?: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {emoji ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl">
            {emoji}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {right}
      </div>
    </Card>
  );
}

function MyTasks({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { data: tasks = [], isLoading } = useTasks(member.id);
  const { data: wishes = [] } = useWishes(member.id);
  const { data: movements = [] } = useMovements(member.id);
  const completeToWish = useCompleteTaskForWish();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const uncompleteTask = useUncompleteTask();

  const [filter, setFilter] = useState<Filter>("todas");
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState(TASK_IDEAS[0]!);
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");
  const [frequency, setFrequency] = useState("semanal");

  const pending = tasks.filter((x) => x.status === "pendiente");
  const waiting = tasks.filter((x) => x.status === "completada");
  const approved = tasks.filter((x) => x.status === "aprobada");

  const visible = useMemo(() => {
    if (filter === "pendientes") return pending;
    if (filter === "revision") return waiting;
    if (filter === "aprobadas") return approved;
    return [...pending, ...waiting, ...approved];
  }, [filter, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthKey = new Date().toISOString().slice(0, 7);
  const earnedMonth = movements
    .filter((m) => m.source === "Tareas" && Number(m.amount) > 0 && m.occurred_at.startsWith(monthKey))
    .reduce((s, m) => s + Number(m.amount), 0);
  const available = movements.reduce((s, m) => s + Number(m.amount), 0);
  const doneMonth = approved.filter((x) => (x.approved_at ?? "").startsWith(monthKey)).length;
  const totalMonth = Math.max(tasks.length, doneMonth);
  const donePct = totalMonth > 0 ? (doneMonth / totalMonth) * 100 : 0;

  const level = Math.floor(member.xp / 50) + 1;
  const weekDays = lang === "es" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  const streakDays = Math.min(7, member.streak);

  const recent = [...approved]
    .sort((a, b) => (b.approved_at ?? "").localeCompare(a.approved_at ?? ""))
    .slice(0, 3);
  const goal = wishes.find((w) => !w.achieved) ?? wishes[0];
  const goalPct = goal ? Math.min(100, (Number(goal.saved) / Math.max(1, Number(goal.price))) * 100) : 0;

  const badges = [
    { emoji: "🥇", label: t("10 tareas completadas", "10 tasks completed"), now: approved.length, max: 10 },
    { emoji: "🐷", label: t("100 ganados", "100 earned"), now: Math.round(earnedMonth), max: 100 },
    { emoji: "📅", label: t("14 días seguidos", "14 days streak"), now: member.streak, max: 14 },
    { emoji: "🏆", label: t("Maestro de tareas", "Task master"), now: approved.length, max: 20 },
  ];

  function submit() {
    const name = title.trim() || (lang === "es" ? idea.title : idea.titleEn);
    createTask.mutate(
      {
        memberId: member.id,
        title: name,
        emoji: idea.emoji,
        reward: Number(reward) || idea.reward,
        frequency,
      },
      {
        onSuccess: () => {
          toast.success(t("Tarea añadida", "Task added"));
          setOpen(false);
          setTitle("");
          setReward("");
        },
      },
    );
  }

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <span className="mr-2">✅</span>
            {t("Mis tareas", "My tasks")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t(
              "Completa tus tareas, gana tu incentivo y alcanza tus metas.",
              "Complete your tasks, earn your reward and reach your goals.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" className="px-4 py-2.5" onClick={() => setOpen((v) => !v)}>
            <Plus className="size-4" />
            {t("Nueva tarea", "New task")}
          </Button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todas">{t("Todas", "All")}</option>
            <option value="pendientes">{t("Por hacer", "To do")}</option>
            <option value="revision">{t("En revisión", "In review")}</option>
            <option value="aprobadas">{t("Aprobadas", "Approved")}</option>
          </select>
        </div>
      </header>

      {open ? (
        <Card className="mb-5" title={t("Nueva tarea", "New task")}>
          <div className="mb-3 flex flex-wrap gap-2">
            {TASK_IDEAS.map((it) => (
              <button
                key={it.title}
                type="button"
                onClick={() => setIdea(it)}
                className={cn(
                  "tap rounded-full px-3 py-1.5 text-xs font-medium",
                  idea.title === it.title
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {it.emoji} {lang === "es" ? it.title : it.titleEn}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("Nombre de la tarea", "Task name")}>
              <input
                className={inputClass}
                value={title}
                placeholder={lang === "es" ? idea.title : idea.titleEn}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label={t("Incentivo", "Reward")}>
              <input
                className={inputClass}
                inputMode="decimal"
                value={reward}
                placeholder={String(idea.reward)}
                onChange={(e) => setReward(e.target.value)}
              />
            </Field>
            <Field label={t("Frecuencia", "Frequency")}>
              <select
                className={inputClass}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="diaria">{t("Diaria", "Daily")}</option>
                <option value="semanal">{t("Semanal", "Weekly")}</option>
                <option value="puntual">{t("Puntual", "One-off")}</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={submit}>{t("Guardar tarea", "Save task")}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("Cancelar", "Cancel")}
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard
              emoji="👛"
              label={t("Ingresos totales", "Total income")}
              value={money(available, member.currency)}
              hint={t("Listo para usar", "Ready to use")}
            />
            <KpiCard
              emoji="🪙"
              label={t("Incentivos este mes", "Earned this month")}
              value={money(earnedMonth, member.currency)}
              hint={t("Ganado con tus tareas", "Earned with your tasks")}
            />
          </div>

          <Card
            title={t("Mis tareas", "My tasks")}
            hint={`${pending.length} ${t("por hacer", "to do")} · ${t("nivel", "level")} ${level}`}
          >
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("Cargando…", "Loading…")}</p>
            ) : visible.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("Nada por aquí. Crea una tarea nueva.", "Nothing here. Create a new task.")}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {visible.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    member={member}
                    onComplete={() =>
                      completeToWish.mutate(
                        { task, member },
                        {
                          onSuccess: (res) =>
                            toast.success(
                              res.wish
                                ? t(
                                    `¡+${money(res.amount, member.currency)} para ${res.wish.title}! 🎉`,
                                    `+${money(res.amount, member.currency)} towards ${res.wish.title}! 🎉`,
                                  )
                                : t("¡Tarea completada! 🎉", "Task completed! 🎉"),
                            ),
                        },
                      )
                    }
                    onUncomplete={() =>
                      uncompleteTask.mutate(
                        { task, member },
                        {
                          onSuccess: () =>
                            toast.success(t("Tarea marcada como pendiente", "Task set back to pending")),
                          onError: () => toast.error(t("No se pudo deshacer", "Could not undo")),
                        },
                      )
                    }
                    onDelete={() => deleteTask.mutate({ id: task.id, memberId: member.id })}
                  />
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card title={t("Mis metas", "My goals")}>
              {goal ? (
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {goal.emoji} {goal.title}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-primary">
                    {Math.round(goalPct)}%
                  </p>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    {money(Number(goal.saved), member.currency)} {t("de", "of")}{" "}
                    {money(Number(goal.price), member.currency)}
                  </p>
                  <Progress value={goalPct} />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("Te faltan", "You still need")}{" "}
                    {money(Math.max(0, Number(goal.price) - Number(goal.saved)), member.currency)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("Crea un deseo para verlo aquí.", "Create a wish to see it here.")}
                </p>
              )}
            </Card>

            <Card title={t("Próximos logros", "Next achievements")}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {badges.map((b) => (
                  <li key={b.label} className="text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-surface-2 text-xl">
                      {b.emoji}
                    </span>
                    <p className="mt-1.5 text-[10px] leading-tight text-muted-foreground">{b.label}</p>
                    <p className="text-[10px] font-semibold text-foreground">
                      {Math.min(b.now, b.max)} / {b.max}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <KpiCard
            label={t("Tareas completadas", "Tasks completed")}
            value={String(doneMonth)}
            hint={`${t("De", "Of")} ${totalMonth} ${t("tareas este mes", "tasks this month")}`}
            right={<Ring value={donePct} />}
          />

          <Card title={t("Tu progreso este mes", "Your progress this month")}>
            <Progress value={donePct} />
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {doneMonth} / {totalMonth} {t("tareas completadas", "tasks completed")}
              </span>
              <span className="font-semibold text-foreground">{Math.round(donePct)}%</span>
            </div>
          </Card>

          <Card title={t("Racha actual 🔥", "Current streak 🔥")}>
            <p className="font-display text-2xl font-semibold text-foreground">
              {member.streak}{" "}
              <span className="text-xs font-medium text-muted-foreground">
                {t("días seguidos", "days in a row")}
              </span>
            </p>
            <ul className="mt-3 flex justify-between">
              {weekDays.map((d, i) => (
                <li key={`${d}-${i}`} className="text-center">
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-[11px] font-bold",
                      i < streakDays
                        ? "bg-success text-success-foreground"
                        : "border border-border text-muted-foreground",
                    )}
                  >
                    {i < streakDays ? "✓" : ""}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-accent/60">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-xl">🏆</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t("¡Sigue así!", "Keep going!")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Completa", "Complete")} {Math.max(1, 10 - approved.length)}{" "}
                  {t("tareas más para tu próximo logro.", "more tasks for your next achievement.")}
                </p>
              </div>
            </div>
          </Card>

          <Card title={t("Actividad reciente", "Recent activity")}>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("Aún no hay actividad.", "No activity yet.")}
              </p>
            ) : (
              <ul className="space-y-3">
                {recent.map((task) => (
                  <li key={task.id} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-surface-2">
                      {task.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{task.title}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {t("Completada", "Completed")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold text-success">
                      +{money(Number(task.reward), member.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function TaskRow({
  task,
  member,
  onComplete,
  onUncomplete,
  onDelete,
}: {
  task: Task;
  member: Member;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const updateTask = useUpdateTask();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [reward, setReward] = useState(String(task.reward));
  const [frequency, setFrequency] = useState(task.frequency);
  const [emoji, setEmoji] = useState(task.emoji);
  const done = task.status !== "pendiente";

  const startEdit = () => {
    setTitle(task.title);
    setReward(String(task.reward));
    setFrequency(task.frequency);
    setEmoji(task.emoji);
    setEditing(true);
  };

  const save = () => {
    const name = title.trim();
    if (!name) {
      toast.error(t("Escribe un nombre", "Write a name"));
      return;
    }
    updateTask.mutate(
      {
        id: task.id,
        memberId: member.id,
        patch: { title: name, emoji, reward: Number(reward) || 0, frequency },
      },
      {
        onSuccess: () => {
          toast.success(t("Tarea actualizada", "Task updated"));
          setEditing(false);
        },
      },
    );
  };

  if (editing) {
    return (
      <li className="rounded-2xl bg-surface-2 p-3">
        <div className="grid gap-2 sm:grid-cols-[64px_minmax(0,1fr)_90px_120px]">
          <input
            className={inputClass}
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            aria-label={t("Icono", "Icon")}
          />
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label={t("Nombre de la tarea", "Task name")}
          />
          <input
            className={inputClass}
            inputMode="decimal"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            aria-label={t("Incentivo", "Reward")}
          />
          <select className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="diaria">{t("Diaria", "Daily")}</option>
            <option value="semanal">{t("Semanal", "Weekly")}</option>
            <option value="puntual">{t("Puntual", "One-off")}</option>
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <Button className="px-3 py-2" disabled={updateTask.isPending} onClick={save}>
            {t("Guardar", "Save")}
          </Button>
          <Button variant="ghost" className="px-3 py-2" onClick={() => setEditing(false)}>
            {t("Cancelar", "Cancel")}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2.5">
      <span className="grid size-10 place-items-center rounded-2xl bg-card text-lg">{task.emoji}</span>
      <button type="button" onClick={startEdit} className="min-w-0 text-left">
        <span className="block truncate text-sm font-medium text-foreground hover:text-primary">{task.title}</span>
        <span className="block text-[11px] text-muted-foreground">
          {task.frequency}
          {task.status === "completada" ? ` · ${t("en revisión", "in review")}` : ""}
        </span>
      </button>
      <span className="shrink-0 text-sm font-semibold text-success">
        {money(Number(task.reward), member.currency)}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={startEdit}
          aria-label={t("Editar tarea", "Edit task")}
          className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-primary"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={done ? onUncomplete : onComplete}
          title={done ? t("Deshacer tarea", "Undo task") : t("Marcar como hecha", "Mark as done")}
          aria-label={done ? t("Deshacer tarea", "Undo task") : t("Marcar como hecha", "Mark as done")}
          className={cn(
            "grid size-8 place-items-center rounded-full text-xs font-bold transition-colors",
            task.status === "aprobada"
              ? "bg-success text-success-foreground"
              : task.status === "completada"
                ? "bg-accent text-foreground"
                : "border border-border text-muted-foreground hover:border-primary hover:text-primary",
          )}
        >
          {task.status === "aprobada" ? "✓" : task.status === "completada" ? "⏳" : ""}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("Borrar tarea", "Delete task")}
          className="grid size-8 place-items-center rounded-full text-xs text-muted-foreground hover:bg-card hover:text-destructive"
        >
          ✕
        </button>
      </span>
    </li>
  );
}
