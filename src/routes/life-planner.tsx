import { createFileRoute } from "@tanstack/react-router";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { CalendarDays, Compass, GripVertical, Pencil, Plus, Sparkles, Star, Target, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { PlanGate } from "@/components/plan-gate";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-language";
import { useLifeGoals, type LifeGoal } from "@/hooks/use-life-goals";
import { usePrimaryGoal } from "@/hooks/use-primary-goal";
import { useProfile } from "@/hooks/use-profile";
import { GOAL_TEMPLATES, defaultValues, parseMeta, templateById, type TemplateId } from "@/lib/goal-templates";
import { addMonths, formatImpact, monthsToTarget, yearsDiff, type SimGoal } from "@/lib/life-planner";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";
import { Amount } from "@/components/ui/amount";

export const Route = createFileRoute("/life-planner")({
  head: () => ({
    meta: [
      { title: "Life Planner — WhatsYournumber" },
      {
        name: "description",
        content: "Simula tus metas de vida y descubre cómo cada decisión adelanta o retrasa tu libertad financiera.",
      },
      { property: "og:title", content: "Life Planner — WhatsYournumber" },
      { property: "og:description", content: "Cada meta de vida, con su impacto real en tu fecha de retiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LifePlanner,
});

type Draft = {
  id?: string;
  name: string;
  emoji: string;
  template: TemplateId | null;
  target_year: number;
  values: Record<string, number>;
};

const newDraft = (): Draft => ({
  name: "",
  emoji: "🎯",
  template: null,
  target_year: new Date().getFullYear() + 2,
  values: {},
});

function draftFromGoal(g: LifeGoal): Draft {
  const meta = parseMeta(g.note);
  const tpl = templateById(meta?.template);
  return {
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    template: tpl.id,
    target_year: g.target_year,
    values: meta?.values ?? { ...defaultValues(tpl), cost: g.cost, monthly: g.monthly, saved: g.saved },
  };
}

function toSim(g: LifeGoal): SimGoal {
  const meta = parseMeta(g.note);
  return {
    kind: g.kind,
    cost: g.cost,
    monthly: g.monthly,
    saved: g.saved,
    ...(meta?.payout ? { payout: meta.payout, payoutYears: meta.payoutYears ?? 0 } : {}),
  };
}

function LifePlannerContent() {
  const t = useT();
  const { profile } = useProfile();
  const { goals, create, update, remove, reorder, busy } = useLifeGoals();
  const { primary, setPrimary } = usePrimaryGoal();
  const data = buildDataset(profile);
  const [draft, setDraft] = useState<Draft | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedGoals.findIndex((s) => s.g.id === active.id);
    const newIndex = sortedGoals.findIndex((s) => s.g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(sortedGoals, oldIndex, newIndex);
    void reorder(next.map((s) => s.g.id));
  };

  const target = data.plan.targetCapital;
  // Solo patrimonio líquido/invertible: las propiedades no cuentan para llegar al número.
  const liquid =
    (profile.assets_cash ?? 0) +
    (profile.assets_bank ?? 0) +
    (profile.assets_retirement ?? 0) +
    (profile.assets_etf ?? 0) +
    (profile.assets_stocks ?? 0) +
    (profile.assets_crypto ?? 0) -
    (profile.liabilities ?? 0);
  const start = Math.max(0, liquid);
  // Todo el dinero que entra (ahorro y ventas tipo exit) capitaliza al menos al 7% anual.
  const annualReturn = Math.max(7, profile.expected_return || 7);
  const savings = data.savings;

  const sim = (list: LifeGoal[]) =>
    monthsToTarget({ start, target, annualReturn, savings, goals: list.map(toSim) });

  const simRaw = (g: SimGoal) => monthsToTarget({ start, target, annualReturn, savings, goals: [g] });

  const baseMonths = useMemo(() => sim([]), [start, target, annualReturn, savings]);
  const allMonths = useMemo(() => sim(goals), [goals, start, target, annualReturn, savings]);

  const retireDate = allMonths !== null ? addMonths(new Date(), allMonths) : null;
  const baseProgress = target > 0 ? Math.min(100, (start / target) * 100) : 0;
  // Las decisiones de vida consumen (o liberan) capital: la base se mueve con ellas.
  const goalsCapital = useMemo(
    () =>
      goals.reduce((acc, g) => {
        const upfront = Math.max(0, g.cost - g.saved);
        const payout = parseMeta(g.note)?.payout ?? 0;
        return acc + payout - upfront;
      }, 0),
    [goals],
  );
  const adjustedStart = start + goalsCapital;
  const progress = target > 0 ? Math.max(0, Math.min(100, (adjustedStart / target) * 100)) : 0;
  const progressDelta = progress - baseProgress;
  const combined = yearsDiff(baseMonths, allMonths);
  const monthsDelta = baseMonths !== null && allMonths !== null ? allMonths - baseMonths : null;


  const scoredGoals = useMemo(
    () => goals.map((g) => {
      const meta = parseMeta(g.note);
      return {
        g,
        impact: yearsDiff(baseMonths, sim([g])) ?? 0,
        payout: meta?.payout ?? 0,
      };
    }),
    [goals, baseMonths, sim],
  );

  const sortedGoals = useMemo(
    () => [...scoredGoals].sort((a, b) => {
      // Las ventas de capital (payout) tienen prioridad: se ordenan por monto descendente.
      if (b.payout !== a.payout && (a.payout > 0 || b.payout > 0)) {
        return b.payout - a.payout;
      }
      // El resto se ordena por impacto absoluto (años) de mayor a menor.
      return Math.abs(b.impact) - Math.abs(a.impact);
    }),
    [scoredGoals],
  );

  const best = useMemo(() => {
    const worst = [...scoredGoals].sort((a, b) => b.impact - a.impact)[0];
    const accel = [...scoredGoals].sort((a, b) => a.impact - b.impact)[0];
    return { worst, accel };
  }, [scoredGoals]);

  const tpl = draft?.template ? templateById(draft.template) : null;
  const derived = tpl && draft ? tpl.derive(draft.values) : null;
  const draftImpact =
    derived
      ? yearsDiff(
          baseMonths,
          simRaw({
            kind: derived.kind,
            cost: derived.cost,
            monthly: derived.monthly,
            saved: draft?.values['saved'] ?? 0,
            ...(derived.payout ? { payout: derived.payout, payoutYears: derived.payoutYears ?? 0 } : {}),
          }),
        )
      : null;

  const submit = async () => {
    if (!draft || !tpl || !derived) return;
    const patch = {
      name: draft.name,
      emoji: draft.emoji,
      kind: derived.kind,
      target_year: draft.target_year,
      cost: derived.cost,
      monthly: derived.monthly,
      saved: draft.values['saved'] ?? 0,
      note: JSON.stringify({
        template: tpl.id,
        values: draft.values,
        payout: derived.payout ?? 0,
        payoutYears: derived.payoutYears ?? 0,
      }),
    };
    if (draft.id) await update({ id: draft.id, patch });
    else await create(patch);
    setDraft(null);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Planificación", "Planning")}
        title="Life Planner"
        subtitle={t(
          "Simula tus metas de vida y descubre cómo impactan tu libertad financiera.",
          "Simulate your life goals and see how they impact your financial freedom.",
        )}
        actions={
          <Button onClick={() => setDraft(newDraft())} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("Nueva meta", "New goal")}
          </Button>
        }
      />

      <Panel className="relative overflow-hidden">
        <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_2fr]">
          <div className="lg:border-r lg:border-border/60 lg:pr-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("Tu norte", "Your north")}</p>
            <h2 className="mt-1 text-2xl font-semibold">{t("Independencia financiera", "Financial independence")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Tu objetivo principal y no negociable.", "Your main, non-negotiable goal.")}
            </p>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("Avance actual con nuevas decisiones", "Current progress with new decisions")}</span>
              <span className="numeric text-sm font-semibold text-foreground">{progress.toFixed(0)}%</span>
            </div>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
              {/* Referencia sin metas de vida */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                style={{ width: `${baseProgress}%` }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`relative h-full rounded-full ${
                  progressDelta < -0.05 ? "bg-amber-400" : progressDelta > 0.05 ? "bg-emerald-300" : "bg-primary"
                }`}
              />
            </div>
            {Math.abs(monthsDelta ?? 0) > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("Con tus decisiones de vida", "With your life decisions")}:{" "}
                <span className={`numeric font-semibold ${monthsDelta! < 0 ? "text-emerald-300" : "text-amber-400"}`}>
                  {monthsDelta! < 0
                    ? t(`Acelera ${Math.abs(monthsDelta!)} meses`, `Accelerates ${Math.abs(monthsDelta!)} months`)
                    : t(`Retrasa ${monthsDelta!} meses`, `Delays ${monthsDelta!} months`)}
                </span>{" "}
                <span className="text-muted-foreground/70">
                  ({t("base", "base")} {baseProgress.toFixed(0)}%)
                </span>
              </p>
            )}

          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <HeroStat icon={Target} label={t("Patrimonio objetivo", "Target capital")} value={<Amount full={data.fmt(target)} short={data.fmtCompact(target)} from="xl" />} />
            <HeroStat
              icon={CalendarDays}
              label={t("Fecha estimada de retiro", "Estimated freedom date")}
              value={
                retireDate
                  ? retireDate.toLocaleDateString("es", { month: "long", year: "numeric" }).replace(/^./, (c) => c.toUpperCase())
                  : t("+60 años", "+60 years")
              }
            />
            <HeroStat icon={Wallet} label={t("Patrimonio líquido actual", "Current liquid net worth")} value={<Amount full={data.fmt(start)} short={data.fmtCompact(start)} from="xl" />} />
            <HeroStat
              icon={Compass}
              label={t("Con nuevas decisiones", "With new decisions")}
              value={<Amount full={data.fmt(Math.max(0, adjustedStart))} short={data.fmtCompact(Math.max(0, adjustedStart))} from="xl" />}
              {...(progressDelta > 0.05 ? { tone: "up" as const } : progressDelta < -0.05 ? { tone: "down" as const } : {})}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("Tus metas de vida", "Your life goals")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("Cada decisión que tomas impacta tu fecha de retiro.", "Every decision you make moves your retirement date.")}
          </p>
        </div>
        {combined !== null && goals.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t("Impacto combinado", "Combined impact")}:{" "}
            <span className={cn("numeric font-semibold", combined > 0 ? "text-negative" : "text-positive")}>
              {formatImpact(combined)}
            </span>
          </p>
        )}
      </div>

      {goals.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 py-12 text-center">
          <Target className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("Aún no tienes metas. Añade la primera y simula su impacto.", "No goals yet. Add your first one and simulate its impact.")}
          </p>
          <Button variant="outline" onClick={() => setDraft(newDraft())} className="gap-2">
            <Plus className="h-4 w-4" /> {t("Nueva meta", "New goal")}
          </Button>
        </Panel>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedGoals.map((s) => s.g.id)}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedGoals.map((s, idx) => (
                <SortableGoalCard
                  key={s.g.id}
                  g={s.g}
                  idx={idx}
                  data={data}
                  profile={profile}
                  baseMonths={baseMonths}
                  isPrimary={primary?.id === s.g.id}
                  onEdit={() => setDraft(draftFromGoal(s.g))}
                  onRemove={() => void remove(s.g.id)}
                  onSetPrimary={() => setPrimary(s.g.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {goals.length > 1 && best.worst && best.accel && (
        <Panel className="flex flex-wrap items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <p className="flex-1 text-sm text-muted-foreground">
            {t(
              `Si eliminas «${best.worst.g.name}» y mantienes «${best.accel.g.name}», podrías retirarte ${formatImpact(
                -(best.worst.impact - Math.min(0, best.accel.impact)),
              ).replace("-", "")} antes.`,
              `If you drop “${best.worst.g.name}” and keep “${best.accel.g.name}”, you could retire ${formatImpact(
                -(best.worst.impact - Math.min(0, best.accel.impact)),
              ).replace("-", "")} earlier.`,
            )}
          </p>
        </Panel>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id
                ? t("Editar meta", "Edit goal")
                : tpl
                  ? `${tpl.emoji} ${t(tpl.es, tpl.en)}`
                  : t("Nueva meta de vida", "New life goal")}
            </DialogTitle>
          </DialogHeader>

          {draft && !tpl && (
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_TEMPLATES.map((tp) => (
                <button
                  key={tp.id}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      template: tp.id,
                      emoji: tp.emoji,
                      name: draft.name || t(tp.es, tp.en),
                      values: defaultValues(tp),
                    })
                  }
                  className="flex items-start gap-3 rounded-xl border border-border bg-elevated/40 p-3 text-left transition hover:border-primary/40 hover:bg-elevated"
                >
                  <span className="text-lg">{tp.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t(tp.es, tp.en)}</span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">{t(tp.hintEs, tp.hintEn)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {draft && tpl && (
            <div className="grid gap-3">
              <div className="grid grid-cols-[70px_1fr] gap-3">
                <Field label={t("Emoji", "Emoji")}>
                  <Input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value.slice(0, 2) })} />
                </Field>
                <Field label={t("Nombre", "Name")}>
                  <Input
                    value={draft.name}
                    placeholder={t("Comprar casa en Madrid", "Buy a house in Madrid")}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("Año objetivo", "Target year")}>
                  <Input
                    type="number"
                    value={draft.target_year}
                    onChange={(e) => setDraft({ ...draft, target_year: Number(e.target.value) })}
                  />
                </Field>
                {tpl.fields.map((f) => {
                  const num = draft.values[f.key] ?? 0;
                  return (
                    <Field key={f.key} label={t(f.es, f.en)}>
                      <NumberInput
                        value={num}
                        onChange={(v) =>
                          setDraft({ ...draft, values: { ...draft.values, [f.key]: v } })
                        }
                      />
                    </Field>
                  );
                })}
              </div>

              {derived && (
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
                    draftImpact !== null && draftImpact < -0.08 && "border-positive/30 bg-positive/10",
                    draftImpact !== null && draftImpact > 0.08 && "border-negative/30 bg-negative/10",
                    (draftImpact === null || Math.abs(draftImpact) <= 0.08) && "border-border bg-elevated/50",
                  )}
                >
                  <div className="text-[11px] leading-tight">
                    <p className="text-muted-foreground">{t("Impacto en tu retiro", "Impact on your retirement")}</p>
                    <p className="font-medium">
                      {draftImpact !== null && draftImpact < -0.08
                        ? t("Te acerca a tu meta", "Brings your goal closer")
                        : draftImpact !== null && draftImpact > 0.08
                          ? t("Te aleja de tu meta", "Pushes your goal away")
                          : t("Neutral", "Neutral")}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {t("Coste", "Cost")}: {data.fmt(derived.cost)} · {t("Flujo", "Flow")}:{" "}
                      {derived.monthly >= 0 ? "+" : ""}
                      {data.fmt(derived.monthly)}/{t("mes", "mo")}
                      {derived.payout ? ` · ${t("Venta", "Exit")}: ${data.fmt(derived.payout)}` : ""}
                      {(derived.extras ?? []).map((x) => ` · ${t(x.es, x.en)}: ${data.fmt(Math.round(x.value))}`).join("")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "numeric text-lg font-semibold",
                      draftImpact !== null && draftImpact < -0.08
                        ? "text-positive"
                        : draftImpact !== null && draftImpact > 0.08
                          ? "text-negative"
                          : "text-muted-foreground",
                    )}
                  >
                    {formatImpact(draftImpact)}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {tpl && !draft?.id && (
              <Button variant="ghost" onClick={() => draft && setDraft({ ...draft, template: null })}>
                {t("Volver", "Back")}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t("Cancelar", "Cancel")}
            </Button>
            <Button onClick={() => void submit()} disabled={busy || !draft?.name || !tpl}>
              {t("Guardar", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageShell>
  );
}

function SortableGoalCard({
  g,
  idx,
  data,
  profile,
  baseMonths,
  onEdit,
  onRemove,
}: {
  g: LifeGoal;
  idx: number;
  data: ReturnType<typeof buildDataset>;
  profile: ReturnType<typeof useProfile>["profile"];
  baseMonths: number | null;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: g.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const impact = simGoal(g, profile, baseMonths, data);
  const pct = g.cost > 0 ? Math.min(100, (g.saved / g.cost) * 100) : 0;
  const good = impact !== null && impact < -0.08;
  const bad = impact !== null && impact > 0.08;
  const cardMeta = parseMeta(g.note);
  const cardTpl = cardMeta ? templateById(cardMeta.template) : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={cn("surface flex flex-col p-5", isDragging && "z-50 shadow-2xl")}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-2 -ml-1 cursor-grab rounded-md p-1 text-muted-foreground transition hover:bg-elevated hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={t("Arrastrar meta", "Drag goal")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-lg">{g.emoji}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{g.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="inline-block rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">
              {t(`Meta ${g.target_year}`, `Goal ${g.target_year}`)}
            </span>
            {cardTpl && (
              <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                {t(cardTpl.es, cardTpl.en)}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          <button
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-elevated hover:text-foreground"
            onClick={onEdit}
            aria-label={t("Editar meta", "Edit goal")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-elevated hover:text-negative"
            onClick={onRemove}
            aria-label={t("Eliminar meta", "Delete goal")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-xs">
        {cardTpl && cardMeta ? (
          <>
            {cardTpl.fields.map((f) => {
              const raw = cardMeta.values[f.key] ?? 0;
              return (
                <Line
                  key={f.key}
                  label={t(f.es, f.en)}
                  value={
                    f.kind === "money"
                      ? data.fmt(raw)
                      : f.kind === "percent"
                        ? `${raw}%`
                        : String(raw)
                  }
                />
              );
            })}
            {(cardTpl.derive(cardMeta.values).extras ?? []).map((x) => (
              <Line
                key={x.es}
                label={t(x.es, x.en)}
                value={x.money ? data.fmt(Math.round(x.value)) : String(Math.round(x.value))}
              />
            ))}
          </>
        ) : (
          <>
            <Line label={t("Coste total", "Total cost")} value={data.fmt(g.cost)} />
            <Line label={t("Fondo acumulado", "Accumulated fund")} value={`${data.fmt(g.saved)} (${pct.toFixed(0)}%)`} />
          </>
        )}
        <div className="mt-2 border-t border-border/60 pt-2">
          <Line
            label={t("Flujo neto / mes", "Net flow / month")}
            value={`${g.monthly >= 0 ? "+" : ""}${data.fmt(g.monthly)}`}
          />
        </div>
      </dl>

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
          good && "border-positive/30 bg-positive/10",
          bad && "border-negative/30 bg-negative/10",
          !good && !bad && "border-border bg-elevated/50",
        )}
      >
        <div className="text-[11px] leading-tight">
          <p className="text-muted-foreground">{t("Impacto en tu retiro", "Impact on your retirement")}</p>
          <p className={cn("font-medium", good ? "text-positive" : bad ? "text-negative" : "text-muted-foreground")}>
            {good ? t("Acelera tu retiro", "Speeds up retirement") : bad ? t("Retrasa tu retiro", "Delays retirement") : t("Neutral", "Neutral")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("numeric text-lg font-semibold", good ? "text-positive" : bad ? "text-negative" : "text-muted-foreground")}>
            {formatImpact(impact)}
          </span>
          {good ? <TrendingUp className="h-4 w-4 text-positive" /> : bad ? <TrendingDown className="h-4 w-4 text-negative" /> : null}
        </div>
      </div>
    </motion.div>
  );
}

function simGoal(
  g: LifeGoal,
  profile: ReturnType<typeof useProfile>["profile"],
  baseMonths: number | null,
  data: ReturnType<typeof buildDataset>,
) {
  return yearsDiff(baseMonths, monthsToTarget({
    start: Math.max(0,
      (profile.assets_cash ?? 0) +
      (profile.assets_bank ?? 0) +
      (profile.assets_retirement ?? 0) +
      (profile.assets_etf ?? 0) +
      (profile.assets_stocks ?? 0) +
      (profile.assets_crypto ?? 0) -
      (profile.liabilities ?? 0)
    ),
    target: data.plan.targetCapital,
    annualReturn: Math.max(7, profile.expected_return || 7),
    savings: data.savings,
    goals: [toSim(g)],
  }));
}

function HeroStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: React.ReactNode;
  tone?: "up" | "down";
}) {
  const badge =
    tone === "up"
      ? "bg-emerald-300/15 text-emerald-300"
      : tone === "down"
        ? "bg-amber-400/15 text-amber-400"
        : "bg-primary/15 text-primary";
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-elevated/60 px-4 py-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badge}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{label}</p>
        <p className={`numeric break-words text-base font-semibold leading-tight ${tone === "up" ? "text-emerald-300" : tone === "down" ? "text-amber-400" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="numeric font-medium">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function LifePlanner() {
  return (
    <PlanGate required="pro">
      <LifePlannerContent />
    </PlanGate>
  );
}
