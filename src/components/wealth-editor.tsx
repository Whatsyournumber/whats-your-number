import { useState } from "react";
import { Building2, Check, Coins, CreditCard, Gift, LineChart, Pencil, Plus, Trash2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-language";
import { holdingValue, newHolding, type Holding, type HoldingKind } from "@/hooks/use-holdings";
import { cn } from "@/lib/utils";

type Props = {
  value: Holding[];
  onChange: (next: Holding[]) => void;
  fmt: (n: number) => string;
  retireAge: number;
  onRetireAge: (n: number) => void;
};

const RETURN_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
const PROBABILITY_OPTIONS = [20, 40, 60, 80, 100];
const RETIRE_AGES = [45, 50, 55, 60, 62, 65, 67, 70];

export function WealthEditor({ value, onChange, fmt, retireAge, onRetireAge }: Props) {
  const t = useT();

  const patch = (id: string, p: Partial<Holding>) => onChange(value.map((h) => (h.id === id ? { ...h, ...p } : h)));
  const remove = (id: string) => onChange(value.filter((h) => h.id !== id));
  const add = (kind: HoldingKind, label: string) => onChange([...value, newHolding(kind, label, value.length)]);
  const list = (kind: HoldingKind) => value.filter((h) => h.kind === kind);

  /** Fila única (efectivo, banco, retiro…): se crea sola la primera vez que escribes. */
  const single = (kind: HoldingKind) => list(kind)[0] ?? null;
  const setSingle = (kind: HoldingKind, label: string, p: Partial<Holding>) => {
    const row = single(kind);
    if (row) patch(row.id, p);
    else onChange([...value, { ...newHolding(kind, label, value.length), ...p, label }]);
  };

  const liquidity: { kind: HoldingKind; label: string }[] = [
    { kind: "cash", label: t("Efectivo", "Cash") },
    { kind: "bank", label: t("Cuentas bancarias", "Bank accounts") },
    { kind: "money_market", label: t("Money market (opcional)", "Money market (optional)") },
  ];

  const investments = value.filter((h) => ["etf", "stock", "crypto", "other"].includes(h.kind));
  const retirement = single("retirement");

  const sum = (list_: Holding[]) => list_.reduce((s, h) => s + holdingValue(h), 0);
  const liquidTotal = sum(value.filter((h) => ["cash", "bank", "money_market"].includes(h.kind)));
  const investTotal = sum(investments);
  const retireTotal = retirement?.manual_value ?? 0;
  const propertyTotal = sum(list("property"));
  const propertyDebt = list("property").reduce((s, h) => s + h.linked_liability, 0);
  const futureTotal = list("future").reduce((s, h) => s + (h.manual_value * h.probability) / 100, 0);
  const debtTotal = sum(list("debt")) + propertyDebt;
  const assetsTotal = liquidTotal + investTotal + retireTotal + propertyTotal;
  const monthlyIn = investments.reduce((s, h) => s + h.monthly_contribution, 0) + (retirement?.monthly_contribution ?? 0);
  const rentIncome = list("property").reduce((s, h) => s + h.monthly_income, 0);

  return (
    <div className="surface overflow-hidden p-4 sm:p-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("Tu Patrimonio", "Your Net Worth")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("Ingresa tu información actual para construir tus proyecciones.", "Enter your current information to build your projections.")}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen vivo */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label={t("Activos", "Assets")} value={fmt(assetsTotal)} />
        <Summary label={t("Deudas", "Debts")} value={fmt(debtTotal)} negative />
        <Summary label={t("Patrimonio neto", "Net worth")} value={fmt(assetsTotal - debtTotal)} accent />
        <Summary
          label={t("Aportes / mes", "Contributions / mo")}
          value={fmt(monthlyIn)}
          hint={rentIncome > 0 ? `${t("Renta", "Rent")} ${fmt(rentIncome)}` : undefined}
        />
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
        <Section icon={<Wallet className="h-4 w-4" />} tone="emerald" title={t("Liquidez", "Liquidity")} total={fmt(liquidTotal)}>
          {liquidity.map(({ kind, label }) => (
            <InlineRow key={kind} label={label}>
              <Money value={single(kind)?.manual_value ?? 0} onChange={(n) => setSingle(kind, label, { manual_value: n })} />
            </InlineRow>
          ))}
        </Section>

        <Section icon={<Building2 className="h-4 w-4" />} tone="indigo" title={t("Propiedades", "Properties")} total={fmt(propertyTotal)}>
          {list("property").map((h) => (
            <CollapsibleCard
              key={h.id}
              title={h.label || t("Propiedad", "Property")}
              filled={Boolean(h.label.trim()) || h.manual_value > 0}
              summary={[
                h.manual_value > 0 ? fmt(h.manual_value) : null,
                h.linked_liability > 0 ? `${t("Hipoteca", "Mortgage")} ${fmt(h.linked_liability)}` : null,
                h.monthly_income > 0 ? `${t("Renta", "Rent")} ${fmt(h.monthly_income)}/${t("mes", "mo")}` : null,
              ]}
              onRemove={() => remove(h.id)}
            >
              <InlineRow label={t("Nombre", "Name")}>
                <Input value={h.label} onChange={(e) => patch(h.id, { label: e.target.value })} className="h-9" />
              </InlineRow>
              <InlineRow label={t("Valor actual", "Current value")}>
                <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
              </InlineRow>
              <InlineRow label={t("Hipoteca pendiente", "Outstanding mortgage")}>
                <Money value={h.linked_liability} onChange={(n) => patch(h.id, { linked_liability: n })} />
              </InlineRow>
              <InlineRow label={t("Renta mensual (opcional)", "Monthly rent (optional)")}>
                <Money value={h.monthly_income} onChange={(n) => patch(h.id, { monthly_income: n })} />
              </InlineRow>
              <InlineRow label={t("Plusvalía esperada anual", "Expected annual appreciation")}>
                <Pct value={h.expected_return} onChange={(n) => patch(h.id, { expected_return: n })} />
              </InlineRow>
              <p className="text-[11px] text-muted-foreground">
                {t("Equity neto", "Net equity")}: {fmt(Math.max(0, h.manual_value - h.linked_liability))}
              </p>
            </CollapsibleCard>
          ))}
          <AddButton onClick={() => add("property", t("Propiedad", "Property"))}>
            {t("Agregar otra propiedad", "Add another property")}
          </AddButton>
        </Section>

        <Section icon={<LineChart className="h-4 w-4" />} tone="sky" title={t("Inversiones", "Investments")} total={fmt(investTotal)}>
          {investments.map((h) => (
            <InvestmentCard
              key={h.id}
              holding={h}
              fmt={fmt}
              onPatch={(p) => patch(h.id, p)}
              onRemove={() => remove(h.id)}
            />
          ))}
          <AddButton onClick={() => add("etf", "")}>{t("Agregar otro activo", "Add another asset")}</AddButton>
        </Section>

        <Section icon={<Gift className="h-4 w-4" />} tone="violet" title={t("Activos futuros", "Future assets")} total={fmt(Math.round(futureTotal))}>
          {list("future").map((h) => (
            <CollapsibleCard
              key={h.id}
              title={h.label || t("Activo futuro", "Future asset")}
              filled={Boolean(h.label.trim()) || h.manual_value > 0}
              summary={[
                h.manual_value > 0 ? fmt(h.manual_value) : null,
                h.target_year ? String(h.target_year) : null,
                `${h.probability}%`,
              ]}
              onRemove={() => remove(h.id)}
            >
              <InlineRow label={t("Nombre", "Name")}>
                <Input value={h.label} onChange={(e) => patch(h.id, { label: e.target.value })} className="h-9" />
              </InlineRow>
              <InlineRow label={t("Monto estimado", "Estimated amount")}>
                <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
              </InlineRow>
              <InlineRow label={t("Año estimado", "Estimated year")}>
                <Input
                  type="number"
                  className="h-9"
                  value={h.target_year ?? ""}
                  onChange={(e) => patch(h.id, { target_year: e.target.value ? Number(e.target.value) : null })}
                />
              </InlineRow>
              <InlineRow label={t("Probabilidad", "Probability")}>
                <Select
                  value={String(h.probability)}
                  onChange={(v) => patch(h.id, { probability: Number(v) })}
                  options={PROBABILITY_OPTIONS.map((p) => ({ value: String(p), label: `${p}%` }))}
                />
              </InlineRow>
              <p className="text-[11px] text-muted-foreground">
                {t("Valor ponderado", "Weighted value")}: {fmt(Math.round((h.manual_value * h.probability) / 100))}
              </p>
            </CollapsibleCard>
          ))}
          <AddButton onClick={() => add("future", "")}>{t("Agregar otro activo futuro", "Add another future asset")}</AddButton>
        </Section>

        <Section icon={<Coins className="h-4 w-4" />} tone="amber" title={t("Fondo de retiro", "Retirement fund")} total={fmt(retireTotal)}>
          <InlineRow label={t("Valor actual", "Current value")}>
            <Money
              value={retirement?.manual_value ?? 0}
              onChange={(n) => setSingle("retirement", t("Fondo de retiro", "Retirement fund"), { manual_value: n })}
            />
          </InlineRow>
          <InlineRow label={t("Aporte mensual", "Monthly contribution")}>
            <Money
              value={retirement?.monthly_contribution ?? 0}
              onChange={(n) => setSingle("retirement", t("Fondo de retiro", "Retirement fund"), { monthly_contribution: n })}
            />
          </InlineRow>
          <InlineRow label={t("Retorno esperado anual", "Expected annual return")}>
            <Pct
              value={retirement?.expected_return ?? 7}
              onChange={(n) => setSingle("retirement", t("Fondo de retiro", "Retirement fund"), { expected_return: n })}
            />
          </InlineRow>
          <InlineRow label={t("Edad de retiro deseada", "Desired retirement age")}>
            <Select
              value={String(retireAge || 65)}
              onChange={(v) => onRetireAge(Number(v))}
              options={RETIRE_AGES.map((a) => ({ value: String(a), label: `${a} ${t("años", "years")}` }))}
            />
          </InlineRow>
        </Section>

        <Section icon={<CreditCard className="h-4 w-4" />} tone="rose" title={t("Deudas", "Debts")} total={fmt(debtTotal)}>
          {list("debt").map((h) => (
            <div key={h.id} className="grid grid-cols-[1.3fr_1fr_24px] items-center gap-2">
              <Input
                value={h.label}
                onChange={(e) => patch(h.id, { label: e.target.value })}
                placeholder={t("Tarjetas, préstamos…", "Cards, loans…")}
                className="h-9"
              />
              <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
              <button
                type="button"
                onClick={() => remove(h.id)}
                className="justify-self-end text-muted-foreground transition hover:text-negative"
                aria-label={t("Eliminar", "Remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {propertyDebt > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {t("Hipotecas de propiedades", "Property mortgages")}: {fmt(propertyDebt)}
            </p>
          )}
          <AddButton onClick={() => add("debt", "")}>{t("Agregar deuda", "Add debt")}</AddButton>
        </Section>
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  sky: "bg-sky-500/15 text-sky-400",
  amber: "bg-amber-500/15 text-amber-400",
  indigo: "bg-indigo-500/15 text-indigo-400",
  violet: "bg-violet-500/15 text-violet-400",
  rose: "bg-rose-500/15 text-rose-400",
};

function Section({
  icon,
  tone,
  title,
  total,
  children,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES | string;
  title: string;
  total: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-elevated/40 p-3 sm:p-4">
      <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", TONES[tone] ?? TONES["sky"])}>{icon}</span>
        <h3 className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <span className="numeric shrink-0 text-sm font-medium">{total}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}


function Summary({ label, value, hint, accent, negative }: { label: string; value: string; hint?: string | undefined; accent?: boolean; negative?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-elevated/50 p-3", accent && "border-primary/40 bg-primary/10")}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("numeric mt-0.5 text-base font-semibold", negative && "text-negative")}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function InlineRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
      <Label className="min-w-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:normal-case sm:tracking-normal sm:text-xs">
        {label}
      </Label>
      <div className="w-full sm:w-[46%] sm:min-w-[130px] sm:justify-self-end">{children}</div>
    </div>
  );
}

function Card({
  title,
  onRemove,
  onCollapse,
  children,
}: {
  title: string;
  onRemove: () => void;
  onCollapse?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5 rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          {onCollapse ? (
            <button type="button" onClick={onCollapse} className="text-muted-foreground transition hover:text-primary" aria-label="Done">
              <Check className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground transition hover:text-negative"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="w-full gap-2 rounded-xl border-dashed">
      <Plus className="h-3.5 w-3.5" />
      {children}
    </Button>
  );
}

function Money({
  value,
  onChange,
  decimals,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  decimals?: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      type="number"
      className="h-9"
      step={decimals ? "any" : "1"}
      value={value || ""}
      placeholder={placeholder ?? "0"}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value || 0)))}
    />
  );
}

function Pct({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Select
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={RETURN_OPTIONS.map((r) => ({ value: String(r), label: `${r}%` }))}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.some((o) => o.value === value) ? null : <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function CollapsibleCard({
  title,
  summary,
  filled,
  onRemove,
  children,
}: {
  title: string;
  summary: (string | null)[];
  filled: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!filled);
  if (!open) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <button type="button" onClick={() => setOpen(true)} className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-[11px] text-muted-foreground">{summary.filter(Boolean).join(" · ")}</p>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <Card title={title} onRemove={onRemove} onCollapse={() => setOpen(false)}>
      {children}
    </Card>
  );
}

function InvestmentCard({
  holding: h,
  fmt,
  onPatch,
  onRemove,
}: {
  holding: Holding;
  fmt: (n: number) => string;
  onPatch: (p: Partial<Holding>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const filled = Boolean(h.label.trim()) || h.manual_value > 0 || h.monthly_contribution > 0;
  const [open, setOpen] = useState(!filled);

  const kindLabel: Record<string, string> = {
    etf: t("ETF / fondo", "ETF / fund"),
    stock: t("Acción", "Stock"),
    crypto: t("Cripto", "Crypto"),
    other: t("Otro", "Other"),
  };

  if (!open) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <button type="button" onClick={() => setOpen(true)} className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{h.label || t("Activo", "Asset")}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {[
                kindLabel[h.kind],
                h.manual_value > 0 ? fmt(h.manual_value) : null,
                h.monthly_contribution > 0 ? `+${fmt(h.monthly_contribution)}/${t("mes", "mo")}` : null,
                h.expected_return ? `${h.expected_return}%` : null,
                h.ticker || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      title={h.label || t("Activo", "Asset")}
      onRemove={onRemove}
      onCollapse={() => setOpen(false)}
    >
      <InlineRow label={t("Nombre", "Name")}>
        <Input value={h.label} onChange={(e) => onPatch({ label: e.target.value })} placeholder={t("Nombre", "Name")} className="h-9" />
      </InlineRow>
      <InlineRow label={t("Tipo", "Type")}>
        <Select
          value={h.kind}
          onChange={(v) => onPatch({ kind: v as HoldingKind })}
          options={[
            { value: "etf", label: kindLabel["etf"] ?? "ETF" },
            { value: "stock", label: kindLabel["stock"] ?? "Stock" },
            { value: "crypto", label: kindLabel["crypto"] ?? "Crypto" },
            { value: "other", label: kindLabel["other"] ?? "Other" },
          ]}
        />
      </InlineRow>
      <InlineRow label={t("Valor actual", "Current value")}>
        <Money value={h.manual_value} onChange={(n) => onPatch({ manual_value: n })} />
      </InlineRow>
      <InlineRow label={t("Aporte mensual", "Monthly contribution")}>
        <Money value={h.monthly_contribution} onChange={(n) => onPatch({ monthly_contribution: n })} />
      </InlineRow>
      <InlineRow label={t("Retorno esperado anual", "Expected annual return")}>
        <Pct value={h.expected_return} onChange={(n) => onPatch({ expected_return: n })} />
      </InlineRow>
      <InlineRow label={t("Ticker (opcional)", "Ticker (optional)")}>
        <Input value={h.ticker ?? ""} onChange={(e) => onPatch({ ticker: e.target.value.toUpperCase() || null })} className="h-9" />
      </InlineRow>
      <InlineRow label={t("Unidades", "Units")}>
        <Money value={h.quantity} onChange={(n) => onPatch({ quantity: n })} decimals />
      </InlineRow>
      <InlineRow label={t("Costo invertido", "Invested cost")}>
        <Money value={h.cost_basis} onChange={(n) => onPatch({ cost_basis: n })} />
      </InlineRow>
    </Card>
  );
}
