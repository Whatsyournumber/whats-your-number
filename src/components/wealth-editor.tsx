import { useMemo } from "react";
import { Building2, Coins, CreditCard, Gift, Info, LineChart, Plus, Trash2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-language";
import { holdingValue, newHolding, type Holding, type HoldingKind } from "@/hooks/use-holdings";
import { cn } from "@/lib/utils";

type Props = {
  value: Holding[];
  onChange: (next: Holding[]) => void;
  fmt: (n: number) => string;
};

const RETURN_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
const PROBABILITY_OPTIONS = [20, 40, 60, 80, 100];
const YEAR_OPTIONS = Array.from({ length: 31 }, (_, i) => new Date().getFullYear() + i);

export function WealthEditor({ value, onChange, fmt }: Props) {
  const t = useT();

  const patch = (id: string, p: Partial<Holding>) => onChange(value.map((h) => (h.id === id ? { ...h, ...p } : h)));
  const remove = (id: string) => onChange(value.filter((h) => h.id !== id));
  const add = (kind: HoldingKind, label = "") => onChange([...value, newHolding(kind, label, value.length)]);
  const list = (kind: HoldingKind) => value.filter((h) => h.kind === kind);

  const single = (kind: HoldingKind) => list(kind)[0] ?? null;
  const setSingle = (kind: HoldingKind, label: string, p: Partial<Holding>) => {
    const row = single(kind);
    if (row) patch(row.id, p);
    else onChange([...value, { ...newHolding(kind, label, value.length), label, ...p }]);
  };

  const investments = value.filter((h) => ["etf", "stock", "crypto", "other"].includes(h.kind));
  const retirement = single("retirement");
  const properties = list("property");
  const futures = list("future");
  const debts = list("debt");

  const totals = useMemo(() => {
    const sum = (arr: Holding[]) => arr.reduce((s, h) => s + holdingValue(h), 0);
    return {
      liquidity: sum(value.filter((h) => ["cash", "bank", "money_market"].includes(h.kind))),
      invest: sum(investments),
      investCost: investments.reduce((s, h) => s + h.cost_basis, 0),
      retirement: retirement ? holdingValue(retirement) : 0,
      property: sum(properties),
      propertyDebt: properties.reduce((s, h) => s + h.linked_liability, 0),
      rent: properties.reduce((s, h) => s + h.monthly_income, 0),
      future: futures.reduce((s, h) => s + (h.manual_value * h.probability) / 100, 0),
      debt: sum(debts),
    };
  }, [value, investments, retirement, properties, futures, debts]);

  const liquidity: { kind: HoldingKind; label: string }[] = [
    { kind: "cash", label: t("Efectivo", "Cash") },
    { kind: "bank", label: t("Cuentas bancarias", "Bank accounts") },
    { kind: "money_market", label: t("Money market (opcional)", "Money market (optional)") },
  ];

  return (
    <div className="rounded-3xl border border-border/60 bg-elevated/40 p-4 md:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t("Tu patrimonio", "Your wealth")}</h2>
            <p className="text-xs text-muted-foreground">
              {t(
                "Ingresa tu información actual para construir tus proyecciones.",
                "Enter your current information to build your projections.",
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-3 py-2 text-[11px] leading-tight text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <span>
            {t("Cuanto más detalle, mejor", "The more detail, the better")}
            <br />
            {t("será tu portafolio y tu Number.", "your portfolio and Number will be.")}
          </span>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Section n={1} icon={Wallet} title={t("Liquidez", "Liquidity")} total={fmt(totals.liquidity)}>
            {liquidity.map(({ kind, label }) => (
              <Field key={kind} label={label}>
                <Money value={single(kind)?.manual_value ?? 0} onChange={(n) => setSingle(kind, label, { manual_value: n })} />
              </Field>
            ))}
          </Section>

          <Section
            n={2}
            icon={LineChart}
            title={t("Inversiones", "Investments")}
            total={fmt(totals.invest)}
            hint={t(
              "Añade ticker y unidades para seguir el precio real de mercado.",
              "Add ticker and units to track real market prices.",
            )}
          >
            {investments.map((h) => {
              const val = holdingValue(h);
              const gain = h.cost_basis > 0 ? val - h.cost_basis : 0;
              const gainPct = h.cost_basis > 0 ? (gain / h.cost_basis) * 100 : 0;
              return (
                <ItemCard
                  key={h.id}
                  title={h.label || t("Nuevo activo", "New asset")}
                  badge={h.ticker ?? undefined}
                  onRemove={() => remove(h.id)}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("Nombre", "Name")}>
                      <Text value={h.label} onChange={(v) => patch(h.id, { label: v })} placeholder="S&P 500 ETF" />
                    </Field>
                    <Field label={t("Tipo", "Type")}>
                      <Select
                        value={h.kind}
                        onChange={(v) => patch(h.id, { kind: v as HoldingKind })}
                        options={[
                          { value: "etf", label: t("ETF / fondo", "ETF / fund") },
                          { value: "stock", label: t("Acción", "Stock") },
                          { value: "crypto", label: t("Cripto", "Crypto") },
                          { value: "other", label: t("Otro", "Other") },
                        ]}
                      />
                    </Field>
                    <Field label={t("Ticker", "Ticker")}>
                      <Text
                        value={h.ticker ?? ""}
                        onChange={(v) => patch(h.id, { ticker: v.toUpperCase() || null })}
                        placeholder="VOO, AAPL, BTC-USD"
                      />
                    </Field>
                    <Field label={t("Unidades", "Units")}>
                      <Money value={h.quantity} onChange={(n) => patch(h.id, { quantity: n })} decimals plain />
                    </Field>
                    <Field label={t("Valor actual", "Current value")}>
                      <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
                    </Field>
                    <Field label={t("Costo invertido", "Cost basis")}>
                      <Money value={h.cost_basis} onChange={(n) => patch(h.id, { cost_basis: n })} />
                    </Field>
                    <Field label={t("Aporte mensual", "Monthly contribution")}>
                      <Money value={h.monthly_contribution} onChange={(n) => patch(h.id, { monthly_contribution: n })} />
                    </Field>
                    <Field label={t("Retorno esperado", "Expected return")}>
                      <Pct value={h.expected_return} onChange={(n) => patch(h.id, { expected_return: n })} />
                    </Field>
                    <Field label={t("Broker / cuenta", "Broker / account")} full>
                      <Text
                        value={h.note ?? ""}
                        onChange={(v) => patch(h.id, { note: v || null })}
                        placeholder={t("IBKR, Revolut, Binance…", "IBKR, Revolut, Binance…")}
                      />
                    </Field>
                  </div>
                  {h.cost_basis > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-[11px]">
                      <span className="text-muted-foreground">{t("Ganancia no realizada", "Unrealized gain")}</span>
                      <span className={cn("font-semibold", gain >= 0 ? "text-positive" : "text-negative")}>
                        {gain >= 0 ? "+" : ""}
                        {fmt(Math.round(gain))} ({gainPct >= 0 ? "+" : ""}
                        {gainPct.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </ItemCard>
              );
            })}
            <AddButton onClick={() => add("etf")}>{t("Agregar otro activo", "Add another asset")}</AddButton>
            {totals.investCost > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {t("Costo total invertido", "Total cost basis")}: {fmt(Math.round(totals.investCost))}
              </p>
            )}
          </Section>

          <Section n={3} icon={Coins} title={t("Fondo de retiro", "Retirement fund")} total={fmt(totals.retirement)}>
            <Field label={t("Valor actual", "Current value")}>
              <Money
                value={retirement?.manual_value ?? 0}
                onChange={(n) => setSingle("retirement", t("Fondo de retiro", "Retirement fund"), { manual_value: n })}
              />
            </Field>
            <Field label={t("Aporte mensual", "Monthly contribution")}>
              <Money
                value={retirement?.monthly_contribution ?? 0}
                onChange={(n) =>
                  setSingle("retirement", t("Fondo de retiro", "Retirement fund"), { monthly_contribution: n })
                }
              />
            </Field>
            <Field label={t("Retorno esperado anual", "Expected annual return")}>
              <Pct
                value={retirement?.expected_return ?? 7}
                onChange={(n) => setSingle("retirement", t("Fondo de retiro", "Retirement fund"), { expected_return: n })}
              />
            </Field>
          </Section>
        </div>

        <div className="space-y-4">
          <Section
            n={4}
            icon={Building2}
            title={t("Propiedades", "Properties")}
            total={fmt(totals.property)}
            hint={
              totals.rent > 0
                ? `${t("Renta mensual", "Monthly rent")}: ${fmt(totals.rent)} · ${t("Hipotecas", "Mortgages")}: ${fmt(totals.propertyDebt)}`
                : undefined
            }
          >
            {properties.map((h) => (
              <ItemCard
                key={h.id}
                title={h.label || t("Propiedad", "Property")}
                badge={h.manual_value ? fmt(h.manual_value - h.linked_liability) : undefined}
                onRemove={() => remove(h.id)}
              >
                <Field label={t("Nombre", "Name")}>
                  <Text value={h.label} onChange={(v) => patch(h.id, { label: v })} placeholder="Apartamento Panamá" />
                </Field>
                <Field label={t("Valor actual", "Current value")}>
                  <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
                </Field>
                <Field label={t("Hipoteca pendiente", "Outstanding mortgage")}>
                  <Money value={h.linked_liability} onChange={(n) => patch(h.id, { linked_liability: n })} />
                </Field>
                <Field label={t("Renta mensual (opcional)", "Monthly rent (optional)")}>
                  <Money value={h.monthly_income} onChange={(n) => patch(h.id, { monthly_income: n })} />
                </Field>
                <Field label={t("Plusvalía esperada anual", "Expected annual appreciation")}>
                  <Pct value={h.expected_return} onChange={(n) => patch(h.id, { expected_return: n })} />
                </Field>
              </ItemCard>
            ))}
            <AddButton onClick={() => add("property")}>{t("Agregar otra propiedad", "Add another property")}</AddButton>
          </Section>

          <Section
            n={5}
            icon={Gift}
            title={t("Activos futuros", "Future assets")}
            total={fmt(Math.round(totals.future))}
            hint={t("Venta de empresa, herencia, bonos diferidos…", "Business sale, inheritance, deferred bonuses…")}
          >
            {futures.map((h) => (
              <ItemCard
                key={h.id}
                title={h.label || t("Activo futuro", "Future asset")}
                badge={h.target_year ? String(h.target_year) : undefined}
                onRemove={() => remove(h.id)}
              >
                <Field label={t("Nombre", "Name")}>
                  <Text value={h.label} onChange={(v) => patch(h.id, { label: v })} placeholder={t("Venta de empresa", "Business sale")} />
                </Field>
                <Field label={t("Monto estimado", "Estimated amount")}>
                  <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
                </Field>
                <Field label={t("Año estimado", "Estimated year")}>
                  <Select
                    value={String(h.target_year ?? YEAR_OPTIONS[5])}
                    onChange={(v) => patch(h.id, { target_year: Number(v) })}
                    options={YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
                  />
                </Field>
                <Field label={t("Probabilidad", "Probability")}>
                  <Select
                    value={String(h.probability)}
                    onChange={(v) => patch(h.id, { probability: Number(v) })}
                    options={PROBABILITY_OPTIONS.map((p) => ({ value: String(p), label: `${p}%` }))}
                  />
                </Field>
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-[11px]">
                  <span className="text-muted-foreground">{t("Valor ponderado", "Weighted value")}</span>
                  <span className="font-semibold">{fmt(Math.round((h.manual_value * h.probability) / 100))}</span>
                </div>
              </ItemCard>
            ))}
            <AddButton onClick={() => add("future")}>{t("Agregar otro activo futuro", "Add another future asset")}</AddButton>
          </Section>

          <Section
            n={6}
            icon={CreditCard}
            title={t("Deudas", "Debts")}
            total={fmt(totals.debt)}
            hint={t("La hipoteca de tus propiedades ya se suma aparte.", "Property mortgages are counted separately.")}
          >
            {debts.map((h) => (
              <div key={h.id} className="flex items-center gap-2">
                <Text
                  value={h.label}
                  onChange={(v) => patch(h.id, { label: v })}
                  placeholder={t("Tarjeta de crédito", "Credit card")}
                  className="flex-1"
                />
                <div className="w-40">
                  <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
                </div>
                <button
                  type="button"
                  onClick={() => remove(h.id)}
                  className="text-muted-foreground transition hover:text-negative"
                  aria-label={t("Eliminar", "Remove")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <AddButton onClick={() => add("debt")}>{t("Agregar deuda", "Add debt")}</AddButton>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  n,
  icon: Icon,
  title,
  total,
  hint,
  children,
}: {
  n: number;
  icon: typeof Wallet;
  title: string;
  total?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/12 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              <span className="text-muted-foreground">{n}.</span> {title}
            </h3>
            {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
          </div>
        </div>
        {total && (
          <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-semibold tabular-nums">
            {total}
          </span>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", full && "sm:col-span-2")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="w-[52%] max-w-[220px] shrink-0">{children}</div>
    </div>
  );
}

function ItemCard({
  title,
  badge,
  onRemove,
  children,
}: {
  title: string;
  badge?: string | undefined;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5 rounded-xl border border-border/60 bg-background/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {badge && (
            <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{badge}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground transition hover:text-negative"
          aria-label="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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

function Text({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-lg bg-elevated/60 text-right text-sm", className)}
    />
  );
}

function Money({
  value,
  onChange,
  decimals,
  plain,
}: {
  value: number;
  onChange: (n: number) => void;
  decimals?: boolean;
  plain?: boolean;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      className={cn("h-9 rounded-lg bg-elevated/60 text-right text-sm tabular-nums", plain && "")}
      step={decimals ? "any" : "1"}
      value={value || ""}
      placeholder="0"
      onChange={(e) => onChange(Number(e.target.value || 0))}
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
      className="h-9 w-full rounded-lg border border-input bg-elevated/60 px-2 text-right text-sm"
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
