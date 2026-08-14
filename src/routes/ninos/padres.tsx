import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Buddy, Card, Field, GrowthChart, Progress, Tile, inputClass } from "@/components/mfn-ui";
import { ParentShell } from "@/components/kid-shell";
import {
  useActiveMember,
  useApproveTask,
  useCreateTask,
  useDeleteTask,
  useFund,
  useMembers,
  useMovements,
  useSaveFund,
  useTasks,
  useUpdateMember,
  useWishes,
} from "@/hooks/use-mfn";
import {
  RETURN_OPTIONS,
  TASK_IDEAS,
  disclaimer,
  money,
  pocketTotals,
  projectFund,
  type Member,
} from "@/lib/mfn";
import { useI18n } from "@/lib/mfn-i18n";
import { CURRENCIES, currencyLabel } from "@/lib/mfn-currencies";

export const Route = createFileRoute("/_authenticated/padres")({
  head: () => ({
    meta: [
      { title: "Panel de padres | My First Number" },
      {
        name: "description",
        content:
          "Controla mesadas, aprueba tareas, ajusta el reparto por bolsillos y proyecta el Fondo del Futuro de cada hijo.",
      },
      { property: "og:title", content: "Panel de padres | My First Number" },
      {
        property: "og:description",
        content: "Planificación familiar del patrimonio con proyecciones a 18, 21, 25 y 30 años.",
      },
    ],
  }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const { member: active, ready } = useActiveMember();
  const { data: members = [] } = useMembers();
  const kids = members.filter((m) => m.role === "child");
  const [kidId, setKidId] = useState<string | null>(null);
  const kid = kids.find((k) => k.id === kidId) ?? kids[0] ?? null;

  useEffect(() => {
    if (ready && active && active.role !== "parent") router.navigate({ to: "/" });
  }, [ready, active, router]);

  return (
    <ParentShell
      title={active ? t(`Hola, ${active.name}`, `Hi, ${active.name}`) : t("Panel de padres", "Parent dashboard")}
      subtitle={t(
        "Aquí planificas el futuro. Tus hijos practican en su propio mundo.",
        "Here you plan the future. Your kids practice in their own world.",
      )}
    >
      {kids.length === 0 ? (
        <Card title={t("Añade tu primer hijo/a", "Add your first child")}>
          <p className="text-sm text-muted-foreground">
            {t("Crea un perfil infantil para empezar a construir su patrimonio.", "Create a child profile to start building their wealth.")}
          </p>
          <Button className="mt-4" onClick={() => router.navigate({ to: "/onboarding" })}>
            <Plus className="h-4 w-4" /> {t("Crear perfil", "Create profile")}
          </Button>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {kids.map((k) => (
              <button
                key={k.id}
                onClick={() => setKidId(k.id)}
                className={`tap rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                  kid?.id === k.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                }`}
              >
                {k.avatar} {k.name}
              </button>
            ))}
            <Button variant="ghost" onClick={() => router.navigate({ to: "/onboarding" })}>
              <Plus className="h-4 w-4" /> {t("Añadir", "Add")}
            </Button>
          </div>
          {kid ? <KidPanel kid={kid} /> : null}
        </>
      )}
    </ParentShell>
  );
}

function KidPanel({ kid }: { kid: Member }) {
  const { t, lang } = useI18n();
  const { data: movements = [] } = useMovements(kid.id);
  const { data: tasks = [] } = useTasks(kid.id);
  const { data: wishes = [] } = useWishes(kid.id);
  const { data: fund } = useFund(kid.id);
  const approve = useApproveTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const updateMember = useUpdateMember();
  const saveFund = useSaveFund();

  const [allowance, setAllowance] = useState(String(kid.allowance_amount));
  const [split, setSplit] = useState({
    spend: kid.split_spend,
    save: kid.split_save,
    grow: kid.split_grow,
  });
  const [monthly, setMonthly] = useState<number | null>(null);
  const [targetAge, setTargetAge] = useState<number | null>(null);
  const [expected, setExpected] = useState<number | null>(null);
  const [taskIdea, setTaskIdea] = useState(TASK_IDEAS[0]!);

  const disclaimerText = disclaimer(lang);
  const totals = pocketTotals(movements);
  const balance = totals.gastar + totals.ahorrar + totals.crecer;
  const pendingApproval = tasks.filter((t) => t.status === "completada");
  const fundMonthly = monthly ?? Number(fund?.monthly_contribution ?? 0);
  const fundTarget = targetAge ?? Number(fund?.target_age ?? 18);
  const fundReturn = expected ?? Number(fund?.expected_return ?? 7);
  const projection = projectFund(
    Number(fund?.current_balance ?? 0) + totals.crecer,
    fundMonthly,
    kid.age,
    fundTarget,
    fundReturn,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile emoji="💰" label={t("Dinero disponible", "Available money")} value={balance} currency={kid.currency} />
        <Tile emoji="🌱" label={t("Ahorrado", "Saved")} value={totals.ahorrar} currency={kid.currency} />
        <Tile emoji="📈" label={t("Invertido", "Invested")} value={totals.crecer} currency={kid.currency} />
        <Tile
          emoji="🚀"
          label={t(`Número a los ${fundTarget}`, `Number at ${fundTarget}`)}
          value={projection.future}
          currency={kid.currency}
          hint={fund?.goal ?? ""}
        />
      </div>

      {pendingApproval.length > 0 ? (
        <Card title={t("Tareas por aprobar", "Tasks to approve")} hint={t(`${pendingApproval.length} esperando`, `${pendingApproval.length} waiting`)}>
          <ul className="space-y-3">
            {pendingApproval.map((task) => (
              <li
                key={task.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3"
              >
                <span className="text-xl">{task.emoji}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{task.title}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {t("Recompensa", "Reward")} {money(Number(task.reward), kid.currency)}
                  </span>
                </span>
                <Button
                  className="shrink-0 px-4 py-2"
                  onClick={() =>
                    approve.mutate(
                      { task, member: kid },
                      { onSuccess: () => toast.success(t("Aprobado y repartido en sus bolsillos 🪙", "Approved and split into their pockets 🪙")) },
                    )
                  }
                >
                  <Check className="h-4 w-4" /> {t("Aprobar", "Approve")}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("Mesada y reparto", "Allowance and split")} hint={t("Se aplica a cada ingreso futuro", "Applies to every future deposit")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t(`Cantidad (${kid.allowance_frequency})`, `Amount (${kid.allowance_frequency})`)}>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
              />
            </Field>
            <Field label={t("Frecuencia", "Frequency")}>
              <select
                className={inputClass}
                value={kid.allowance_frequency}
                onChange={(e) =>
                  updateMember.mutate({ id: kid.id, patch: { allowance_frequency: e.target.value } })
                }
              >
                <option value="semanal">{t("Semanal", "Weekly")}</option>
                <option value="mensual">{t("Mensual", "Monthly")}</option>
                <option value="ocasional">{t("Ocasional", "Occasional")}</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label={t(`🛍 Gastar ${split.spend}%`, `🛍 Spend ${split.spend}%`)}>
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
            <Field label={t(`🌱 Ahorrar ${split.save}% · 📈 Crecer ${split.grow}%`, `🌱 Save ${split.save}% · 📈 Grow ${split.grow}%`)}>
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
          </div>
          <Button
            className="mt-5"
            onClick={() =>
              updateMember.mutate(
                {
                  id: kid.id,
                  patch: {
                    allowance_amount: Number(allowance),
                    split_spend: split.spend,
                    split_save: split.save,
                    split_grow: split.grow,
                  },
                },
                { onSuccess: () => toast.success(t("Configuración guardada", "Settings saved")) },
              )
            }
          >
            {t("Guardar cambios", "Save changes")}
          </Button>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Moneda", "Currency")}
            </span>
            <select
              className={inputClass}
              value={kid.currency}
              onChange={(e) =>
                updateMember.mutate(
                  { id: kid.id, patch: { currency: e.target.value } },
                  { onSuccess: () => toast.success(t("Moneda actualizada", "Currency updated")) },
                )
              }
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyLabel(c.code, lang)}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <Card title={t("Fondo del Futuro", "Future Fund")} hint={disclaimerText}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("Aporte mensual", "Monthly contribution")}>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={fundMonthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
              />
            </Field>
            <Field label={t("Edad objetivo", "Target age")}>
              <select
                className={inputClass}
                value={fundTarget}
                onChange={(e) => setTargetAge(Number(e.target.value))}
              >
                {[18, 21, 25, 30].map((a) => (
                  <option key={a} value={a}>
                    {t(`${a} años`, `${a} years`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Rentabilidad", "Return")}>
              <select
                className={inputClass}
                value={fundReturn}
                onChange={(e) => setExpected(Number(e.target.value))}
              >
                {RETURN_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold text-foreground">
            {money(projection.future, kid.currency)}
          </p>
          <GrowthChart
            data={projection.points}
            currency={kid.currency}
            height={190}
            areas={[
              { key: "total", color: "var(--color-chart-1)" },
              { key: "aportes", color: "var(--color-chart-4)" },
            ]}
          />
          <Button
            className="mt-4"
            variant="soft"
            onClick={() =>
              saveFund.mutate(
                {
                  memberId: kid.id,
                  patch: {
                    monthly_contribution: fundMonthly,
                    target_age: fundTarget,
                    expected_return: fundReturn,
                  },
                },
                { onSuccess: () => toast.success(t("Fondo actualizado", "Fund updated")) },
              )
            }
          >
            {t("Guardar fondo", "Save fund")}
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("Tareas asignadas", "Assigned tasks")}>
          <div className="flex flex-wrap gap-2">
            {TASK_IDEAS.map((idea) => (
              <button
                key={idea.title}
                onClick={() => setTaskIdea(idea)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  taskIdea.title === idea.title
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {idea.emoji} {t(idea.title, idea.titleEn)}
              </button>
            ))}
          </div>
          <Button
            className="mt-4"
            variant="ghost"
            onClick={() =>
              createTask.mutate(
                {
                  memberId: kid.id,
                  title: taskIdea.title,
                  emoji: taskIdea.emoji,
                  reward: taskIdea.reward,
                  frequency: "semanal",
                },
                { onSuccess: () => toast.success(t("Tarea añadida", "Task added")) },
              )
            }
          >
            <Plus className="h-4 w-4" /> {t("Añadir tarea", "Add task")}
          </Button>
          <ul className="mt-4 space-y-2">
            {tasks.slice(0, 12).map((task) => (
              <li key={task.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {task.emoji} {task.title}{" "}
                  <span className="text-xs text-muted-foreground">· {task.status}</span>
                </span>
                <button
                  onClick={() => deleteTask.mutate({ id: task.id, memberId: kid.id })}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={t(`Eliminar ${task.title}`, `Delete ${task.title}`)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t("Deseos de tu hijo/a", "Your child's wishes")}>
          {wishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Todavía no tiene deseos.", "No wishes yet.")}</p>
          ) : (
            <ul className="space-y-4">
              {wishes.map((w) => (
                <li key={w.id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      {w.emoji} {w.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {money(Number(w.saved), kid.currency)} / {money(Number(w.price), kid.currency)}
                    </span>
                  </div>
                  <Progress className="mt-2" value={(Number(w.saved) / Number(w.price)) * 100} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Buddy>
        {t(
          `Consejo: aporta cada mes al Fondo del Futuro de ${kid.name}. Empezar temprano vale más que aportar mucho más tarde.`,
          `Tip: contribute every month to ${kid.name}'s Future Fund. Starting early is worth more than contributing more later.`,
        )}
      </Buddy>
    </div>
  );
}
