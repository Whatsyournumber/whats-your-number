import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Buddy, Button, Card, Donut, Field, GrowthChart, inputClass } from "@/components/mfn-ui";
import { KidPage, PageTitle } from "@/components/kid-page";
import { useI18n } from "@/lib/mfn-i18n";
import { useAddExpense, useAddIncome, useMovements, useUpdateMember } from "@/hooks/use-mfn";
import { money, type Member, type Movement } from "@/lib/mfn";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { enUS as enLocale, es as esLocale } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/ninos/kid/dinero")({
  head: () => ({
    meta: [
      { title: "Mi Dinero | My First Number" },
      {
        name: "description",
        content:
          "Mira cómo llega tu dinero, cómo se reparte entre deseos, ahorro e inversión, y cómo crece mes a mes.",
      },
      { property: "og:title", content: "Mi Dinero | My First Number" },
      {
        property: "og:description",
        content: "Ingresos, gastos, reparto y crecimiento de tus ahorros explicado para niños.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <KidPage>{(member) => <MyMoney member={member} />}</KidPage>,
});

const PRESETS = [
  { days: 30, es: "30 días", en: "30 days" },
  { days: 90, es: "3 meses", en: "3 months" },
  { days: 365, es: "12 meses", en: "12 months" },
];

const INCOME_SOURCES = ["Mesada", "Regalo", "Tareas", "Negocio", "Otro"];
const EXPENSE_CATEGORIES = ["Ocio y diversión", "Comida y snacks", "Compras", "Otros"];

/** Suma de ingresos (importes positivos). */
function totals(movements: Movement[]) {
  let income = 0;
  let spent = 0;
  let future = 0;
  let wishes = 0;
  for (const m of movements) {
    const amount = Number(m.amount) || 0;
    if (amount < 0) {
      spent += -amount;
      continue;
    }
    income += amount;
    if (m.pocket === "gastar") wishes += amount;
    else future += amount;
  }
  return { income, spent, future, wishes };
}

/** Serie acumulada: ingresos vs gastos. */
function growthSeries(movements: Movement[]) {
  const months = new Map<string, { gastos: number; ingresos: number }>();
  for (const m of movements) {
    const k = m.occurred_at.slice(0, 7);
    const cur = months.get(k) ?? { gastos: 0, ingresos: 0 };
    const amount = Number(m.amount) || 0;
    if (amount < 0) cur.gastos += -amount;
    else cur.ingresos += amount;
    months.set(k, cur);
  }
  let gastos = 0;
  let ingresos = 0;
  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      gastos += v.gastos;
      ingresos += v.ingresos;
      return {
        label: k.slice(5) + "/" + k.slice(2, 4),
        ingresos: Math.round(ingresos),
        gastos: Math.round(gastos),
      };
    });
}


function group(movements: Movement[], sign: "in" | "out") {
  const map = new Map<string, number>();
  for (const m of movements) {
    const amount = Number(m.amount) || 0;
    if (sign === "in" ? amount <= 0 : amount >= 0) continue;
    const key = m.source || "Otros";
    map.set(key, (map.get(key) ?? 0) + Math.abs(amount));
  }
  const rows = [...map.entries()].map(([name, value]) => ({ name, value }));
  const total = rows.reduce((s, r) => s + r.value, 0);
  return { rows: rows.sort((a, b) => b.value - a.value), total };
}

function KpiCard({
  emoji,
  label,
  value,
  currency,
  hint,
  tone,
}: {
  emoji: string;
  label: string;
  value: number;
  currency: string;
  hint: string;
  tone: "primary" | "success" | "danger";
}) {
  const hintTone = {
    primary: "text-success",
    success: "text-success",
    danger: "text-destructive",
  }[tone];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl">
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold text-foreground">
            {money(value, currency)}
          </p>
          <p className={`mt-1 text-xs font-medium ${hintTone}`}>{hint}</p>
        </div>
      </div>
    </Card>
  );
}

function BreakdownList({
  rows,
  total,
  currency,
  emptyLabel,
  totalLabel,
  tone,
}: {
  rows: { name: string; value: number }[];
  total: number;
  currency: string;
  emptyLabel: string;
  totalLabel: string;
  tone: "in" | "out";
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{r.name}</span>
            <span className="flex shrink-0 items-baseline gap-3">
              <span className="font-semibold text-foreground">{money(r.value, currency)}</span>
              <span className="w-9 text-right text-xs text-muted-foreground">
                {total > 0 ? Math.round((r.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
        <span className="text-foreground">{totalLabel}</span>
        <span className={tone === "in" ? "text-success" : "text-destructive"}>
          {money(total, currency)}
        </span>
      </div>
    </>
  );
}

function MyMoney({ member }: { member: Member }) {
  const { t } = useI18n();
  const { data: movements = [], isLoading } = useMovements(member.id);
  const updateMember = useUpdateMember();
  const addIncome = useAddIncome();
  const addExpense = useAddExpense();

  const [editing, setEditing] = useState(false);
  const [allowance, setAllowance] = useState(String(Number(member.allowance_amount) || ""));
  const [frequency, setFrequency] = useState(member.allowance_frequency);

  const [range, setRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [sheet, setSheet] = useState<null | "income" | "expense">(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const [kind, setKind] = useState<string>("Mesada");
  const [amount, setAmount] = useState("");

  const filtered = useMemo(() => {
    if (!range?.from) return movements;
    const from = format(range.from, "yyyy-MM-dd");
    const to = format(range.to ?? range.from, "yyyy-MM-dd");
    return movements.filter((m) => m.occurred_at >= from && m.occurred_at <= to);
  }, [movements, range]);

  const dateLocale = t("es", "en") === "es" ? esLocale : enLocale;
  const fromLabel = range?.from
    ? format(range.from, "d MMM yyyy", { locale: dateLocale })
    : t("Todo", "All");
  const toLabel = range?.from
    ? format(range.to ?? range.from, "d MMM yyyy", { locale: dateLocale })
    : t("Hoy", "Today");


  const sums = totals(filtered);
  const series = useMemo(() => growthSeries(filtered), [filtered]);
  const income = useMemo(() => group(filtered, "in"), [filtered]);
  const expenses = useMemo(() => group(filtered, "out"), [filtered]);

  const pctFuture = sums.income > 0 ? Math.round((sums.future / sums.income) * 100) : 0;
  const pctSpent = sums.income > 0 ? Math.round((sums.spent / sums.income) * 100) : 0;

  const split = [
    {
      name: t("Ahorrar e invertir", "Save & invest"),
      emoji: "🌱",
      value: sums.future,
      pct: member.split_save + member.split_grow,
      color: "var(--color-tree)",
    },
    {
      name: t("Para mis deseos", "For my wishes"),
      emoji: "🎁",
      value: Math.max(0, sums.wishes - sums.spent),
      pct: member.split_spend,
      color: "var(--color-chart-1)",
    },
    {
      name: t("Ya gastado", "Already spent"),
      emoji: "🎮",
      value: sums.spent,
      pct: pctSpent,
      color: "var(--color-chart-4)",
    },
  ];

  function openSheet(next: "income" | "expense") {
    setSheet(next);
    setLabel("");
    setNote("");
    setAmount("");
    setKind(next === "income" ? "Mesada" : "Otros");
  }

  async function submitSheet() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const name = label.trim() || kind;
    const finalLabel = note.trim() ? `${name} — ${note.trim()}` : name;
    if (sheet === "income") {
      await addIncome.mutateAsync({
        member,
        label: finalLabel,
        source: kind,
        amount: value,
      });
    } else {
      await addExpense.mutateAsync({
        memberId: member.id,
        label: finalLabel,
        category: kind,
        amount: value,
      });
    }
    setSheet(null);
  }


  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <PageTitle
          emoji="💰"
          title={t("Mi Dinero", "My Money")}
          subtitle={t(
            "Aquí puedes ver cómo llega tu dinero, cómo se reparte y cómo crece.",
            "Here you can see how your money arrives, how it splits and how it grows.",
          )}
        />
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="tap inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2">
                <CalendarIcon className="size-4 text-primary" />
              </span>
              <span className="flex items-center gap-3">
                <span className="block">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("Desde", "From")}
                  </span>
                  <span className="block text-sm font-semibold text-foreground">{fromLabel}</span>
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="block">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("Hasta", "To")}
                  </span>
                  <span className="block text-sm font-semibold text-foreground">{toLabel}</span>
                </span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-3xl p-0" align="end">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={range?.from ?? new Date()}
              selected={range}
              onSelect={(next: DateRange | undefined) => setRange(next)}
              locale={dateLocale}
              className={cn("pointer-events-auto p-3")}
            />

            <div className="flex flex-wrap gap-2 border-t border-border p-3">
              {PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setRange({ from: addDays(new Date(), -p.days), to: new Date() })}
                  className="rounded-xl bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {t(p.es, p.en)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRange(undefined)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-primary hover:underline"
              >
                {t("Todo", "All time")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>


      {/* mesada editable + acciones */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              🗓 {t("Mi mesada", "My allowance")}
            </p>
            {editing ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <Field label={t("Cantidad", "Amount")}>
                  <input
                    className={`${inputClass} w-32`}
                    type="number"
                    min={0}
                    step="0.5"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                  />
                </Field>
                <Field label={t("Cada", "Every")}>
                  <select
                    className={`${inputClass} w-40`}
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="diaria">{t("Día", "Day")}</option>
                    <option value="semanal">{t("Semana", "Week")}</option>
                    <option value="quincenal">{t("Quincena", "Two weeks")}</option>
                    <option value="mensual">{t("Mes", "Month")}</option>
                  </select>
                </Field>
                <Button
                  onClick={async () => {
                    await updateMember.mutateAsync({
                      id: member.id,
                      patch: {
                        allowance_amount: Number(allowance) || 0,
                        allowance_frequency: frequency,
                      },
                    });
                    setEditing(false);
                  }}
                >
                  {t("Guardar", "Save")}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  {t("Cancelar", "Cancel")}
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold text-foreground">
                  {money(Number(member.allowance_amount) || 0, member.currency)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {member.allowance_frequency}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="ml-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {t("Editar", "Edit")}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openSheet("income")}>
              ＋ {t("Agregar ingreso", "Add income")}
            </Button>
            <Button variant="ghost" onClick={() => openSheet("expense")}>
              － {t("Agregar gasto", "Add expense")}
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <KpiCard
          emoji="👛"
          label={t("Ingresos totales", "Total income")}
          value={sums.income}
          currency={member.currency}
          hint={t("Todo lo que has recibido", "Everything you have received")}
          tone="primary"
        />
        <KpiCard
          emoji="🐷"
          label={t("Ahorrado e invertido", "Saved & invested")}
          value={sums.future}
          currency={member.currency}
          hint={`${pctFuture}% ${t("de tus ingresos", "of your income")}`}
          tone="success"
        />
        <KpiCard
          emoji="🛍"
          label={t("Gastado", "Spent")}
          value={sums.spent}
          currency={member.currency}
          hint={`${pctSpent}% ${t("de tus ingresos", "of your income")}`}
          tone="danger"
        />
      </div>

      {/* reparto + crecimiento */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card title={t("Cómo se reparte mi dinero", "How my money splits")}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
            <div className="relative">
              <Donut data={split} currency={member.currency} height={260} />
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div className="w-[46%] leading-tight">
                  <p className="font-display text-3xl font-semibold text-foreground">{pctFuture}%</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t("Ahorrado e invertido", "Saved & invested")}
                  </p>
                </div>
              </div>

            </div>
            <ul className="space-y-2">
              {split.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2.5"
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {s.name} ({Math.round(s.pct)}%)
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {money(s.value, member.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 rounded-2xl bg-surface-2 px-4 py-3 text-xs text-muted-foreground">
            ✅{" "}
            {t(
              `Tu regla: ${member.split_spend}% deseos · ${member.split_save + member.split_grow}% ahorrar e invertir`,
              `Your rule: ${member.split_spend}% wishes · ${member.split_save + member.split_grow}% save & invest`,
            )}
          </p>
        </Card>

        <Card title={t("Cómo crece mi dinero", "How my money grows")}>
          {series.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t(
                "Cuando recibas tu primera mesada verás aquí la curva de tus ahorros 🌱",
                "When you get your first allowance you'll see your savings curve here 🌱",
              )}
            </p>
          ) : (
            <>
              <GrowthChart
                data={series}
                currency={member.currency}
                height={260}
                areas={[
                  { key: "ingresos", color: "var(--color-chart-1)" },
                  { key: "gastos", color: "var(--color-destructive)" },
                ]}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "Azul: ingresos acumulados. Rojo: gastos acumulados.",
                  "Blue: income so far. Red: spending so far.",
                )}
              </p>

            </>
          )}
        </Card>
      </div>

      {/* de dónde viene / en qué gasto / buddy */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title={t("¿De dónde viene mi dinero?", "Where does my money come from?")}>
          <BreakdownList
            rows={income.rows}
            total={income.total}
            currency={member.currency}
            emptyLabel={t("Todavía sin ingresos.", "No income yet.")}
            totalLabel={t("Total", "Total")}
            tone="in"
          />
        </Card>
        <Card title={t("¿En qué he gastado mi dinero?", "What have I spent it on?")}>
          <BreakdownList
            rows={expenses.rows}
            total={expenses.total}
            currency={member.currency}
            emptyLabel={t("Todavía sin gastos.", "No spending yet.")}
            totalLabel={t("Total", "Total")}
            tone="out"
          />
        </Card>
        <Buddy>
          {sums.income === 0
            ? t(
                "Registra tu primer ingreso y te enseño cómo repartirlo.",
                "Log your first income and I'll show you how to split it.",
              )
            : t(
                `¡Muy bien, ${member.name}! Has guardado el ${pctFuture}% de tus ingresos. Si mantienes el ritmo, tus sueños estarán cada vez más cerca.`,
                `Great job, ${member.name}! You saved ${pctFuture}% of your income. Keep it up and your dreams get closer.`,
              )}
        </Buddy>
      </div>

      <Card className="mt-4" title={t("Mis movimientos", "My movements")}>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("Cargando…", "Loading…")}</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t(
              "Cuando tus padres aprueben una tarea verás aquí tus monedas 🪙",
              "When your parents approve a task you'll see your coins here 🪙",
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.slice(0, 25).map((m) => {
              const value = Number(m.amount) || 0;
              const isExpense = value < 0;
              return (
                <li
                  key={m.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3"
                >
                  <span className="text-lg">
                    {isExpense ? "🛍" : m.pocket === "gastar" ? "🎁" : "🌱"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {m.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {m.occurred_at} · {m.source}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold ${isExpense ? "text-destructive" : "text-success"}`}
                  >
                    {isExpense ? "−" : "+"}
                    {money(Math.abs(value), member.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {sheet ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/30 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-card p-5 shadow-xl sm:max-w-md sm:rounded-3xl">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {sheet === "income"
                ? t("Agregar ingreso", "Add income")
                : t("Agregar gasto", "Add expense")}
            </h2>
            <div className="mt-4 space-y-3">
              <Field
                label={
                  sheet === "income"
                    ? t("Nombre del ingreso", "Income name")
                    : t("Nombre del gasto", "Expense name")
                }
              >
                <input
                  className={inputClass}
                  value={label}
                  placeholder={
                    sheet === "income"
                      ? t("Mesada de la semana", "Weekly allowance")
                      : t("Helado con amigos", "Ice cream with friends")
                  }
                  onChange={(e) => setLabel(e.target.value)}
                />
              </Field>
              <Field
                label={t("Nota (opcional)", "Note (optional)")}
                hint={t(
                  "Un detalle extra para recordarlo después.",
                  "An extra detail to remember it later.",
                )}
              >
                <input
                  className={inputClass}
                  value={note}
                  placeholder={
                    sheet === "income"
                      ? t("Me la dio la abuela", "Grandma gave it to me")
                      : t("En el parque con Ana", "At the park with Ana")
                  }
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>

              <Field
                label={sheet === "income" ? t("Origen", "Source") : t("Categoría", "Category")}
              >
                <select
                  className={inputClass}
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  {(sheet === "income" ? INCOME_SOURCES : EXPENSE_CATEGORIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={t("Cantidad", "Amount")}
                hint={
                  sheet === "income"
                    ? t(
                        "Se reparte automáticamente según tu regla.",
                        "It splits automatically with your rule.",
                      )
                    : t("Sale de tu dinero para deseos.", "It comes out of your wishes money.")
                }
              >
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                className="flex-1"
                onClick={submitSheet}
                disabled={addIncome.isPending || addExpense.isPending}
              >
                {t("Guardar", "Save")}
              </Button>
              <Button variant="ghost" onClick={() => setSheet(null)}>
                {t("Cancelar", "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
