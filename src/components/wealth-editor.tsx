import { Building2, Coins, CreditCard, Gift, LineChart, Plus, Trash2, Wallet } from "lucide-react";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-language";
import { newHolding, type Holding, type HoldingKind } from "@/hooks/use-holdings";

type Props = {
  value: Holding[];
  onChange: (next: Holding[]) => void;
  fmt: (n: number) => string;
};

const RETURN_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
const PROBABILITY_OPTIONS = [20, 40, 60, 80, 100];

export function WealthEditor({ value, onChange, fmt }: Props) {
  const t = useT();

  const patch = (id: string, p: Partial<Holding>) => onChange(value.map((h) => (h.id === id ? { ...h, ...p } : h)));
  const remove = (id: string) => onChange(value.filter((h) => h.id !== id));
  const add = (kind: HoldingKind, label: string) => onChange([...value, newHolding(kind, label, value.length)]);
  const list = (kind: HoldingKind) => value.filter((h) => h.kind === kind);

  /** Fila única (efectivo, banco, retiro…): se crea sola la primera vez que escribes. */
  const single = (kind: HoldingKind, label: string) => list(kind)[0] ?? null;
  const setSingle = (kind: HoldingKind, label: string, p: Partial<Holding>) => {
    const row = single(kind, label);
    if (row) patch(row.id, p);
    else onChange([...value, { ...newHolding(kind, label, value.length), ...p }]);
  };

  const liquidity: { kind: HoldingKind; label: string }[] = [
    { kind: "cash", label: t("Efectivo", "Cash") },
    { kind: "bank", label: t("Cuentas bancarias", "Bank accounts") },
    { kind: "money_market", label: t("Money market (opcional)", "Money market (optional)") },
  ];

  const investments = value.filter((h) => ["etf", "stock", "crypto", "other"].includes(h.kind));
  const retirement = single("retirement", t("Fondo de retiro", "Retirement fund"));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> {t("1. Liquidez", "1. Liquidity")}
          </span>
        }
      >
        <div className="space-y-3">
          {liquidity.map(({ kind, label }) => (
            <Row key={kind} label={label}>
              <Money
                value={single(kind, label)?.manual_value ?? 0}
                onChange={(n) => setSingle(kind, label, { manual_value: n, label })}
              />
            </Row>
          ))}
        </div>
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> {t("4. Propiedades", "4. Properties")}
          </span>
        }
      >
        <div className="space-y-3">
          {list("property").map((h) => (
            <Card key={h.id} title={h.label || t("Propiedad", "Property")} onRemove={() => remove(h.id)}>
              <Row label={t("Nombre", "Name")}>
                <Input value={h.label} onChange={(e) => patch(h.id, { label: e.target.value })} className="h-9" />
              </Row>
              <Row label={t("Valor actual", "Current value")}>
                <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
              </Row>
              <Row label={t("Hipoteca pendiente", "Outstanding mortgage")}>
                <Money value={h.linked_liability} onChange={(n) => patch(h.id, { linked_liability: n })} />
              </Row>
              <Row label={t("Renta mensual (opcional)", "Monthly rent (optional)")}>
                <Money value={h.monthly_income} onChange={(n) => patch(h.id, { monthly_income: n })} />
              </Row>
              <Row label={t("Plusvalía esperada anual", "Expected annual appreciation")}>
                <Pct value={h.expected_return} onChange={(n) => patch(h.id, { expected_return: n })} />
              </Row>
            </Card>
          ))}
          <AddButton onClick={() => add("property", t("Propiedad", "Property"))}>
            {t("Agregar otra propiedad", "Add another property")}
          </AddButton>
        </div>
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" /> {t("2. Inversiones", "2. Investments")}
          </span>
        }
        description={t(
          "Añade el ticker y las unidades para seguir el precio real de mercado.",
          "Add ticker and units to track the real market price.",
        )}
      >
        <div className="space-y-3">
          {investments.map((h) => (
            <Card key={h.id} title={h.label || t("Activo", "Asset")} onRemove={() => remove(h.id)}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label={t("Nombre", "Name")}>
                  <Input value={h.label} onChange={(e) => patch(h.id, { label: e.target.value })} className="h-9" />
                </Row>
                <Row label={t("Tipo", "Type")}>
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
                </Row>
                <Row label={t("Ticker (opcional)", "Ticker (optional)")}>
                  <Input
                    value={h.ticker ?? ""}
                    onChange={(e) => patch(h.id, { ticker: e.target.value.toUpperCase() || null })}
                    placeholder="VOO, AAPL, BTC-USD"
                    className="h-9"
                  />
                </Row>
                <Row label={t("Unidades (opcional)", "Units (optional)")}>
                  <Money value={h.quantity} onChange={(n) => patch(h.id, { quantity: n })} decimals />
                </Row>
                <Row label={t("Valor actual", "Current value")}>
                  <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
                </Row>
                <Row label={t("Costo invertido", "Invested cost")}>
                  <Money value={h.cost_basis} onChange={(n) => patch(h.id, { cost_basis: n })} />
                </Row>
                <Row label={t("Aporte mensual", "Monthly contribution")}>
                  <Money value={h.monthly_contribution} onChange={(n) => patch(h.id, { monthly_contribution: n })} />
                </Row>
                <Row label={t("Retorno esperado", "Expected return")}>
                  <Pct value={h.expected_return} onChange={(n) => patch(h.id, { expected_return: n })} />
                </Row>
              </div>
            </Card>
          ))}
          <AddButton onClick={() => add("etf", "")}>{t("Agregar otro activo", "Add another asset")}</AddButton>
        </div>
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" /> {t("5. Activos futuros", "5. Future assets")}
          </span>
        }
        description={t("Venta de empresa, herencia, bonos diferidos…", "Business sale, inheritance, deferred bonuses…")}
      >
        <div className="space-y-3">
          {list("future").map((h) => (
            <Card key={h.id} title={h.label || t("Activo futuro", "Future asset")} onRemove={() => remove(h.id)}>
              <Row label={t("Nombre", "Name")}>
                <Input value={h.label} onChange={(e) => patch(h.id, { label: e.target.value })} className="h-9" />
              </Row>
              <Row label={t("Monto estimado", "Estimated amount")}>
                <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
              </Row>
              <Row label={t("Año estimado", "Estimated year")}>
                <Input
                  type="number"
                  className="h-9"
                  value={h.target_year ?? ""}
                  onChange={(e) => patch(h.id, { target_year: e.target.value ? Number(e.target.value) : null })}
                />
              </Row>
              <Row label={t("Probabilidad", "Probability")}>
                <Select
                  value={String(h.probability)}
                  onChange={(v) => patch(h.id, { probability: Number(v) })}
                  options={PROBABILITY_OPTIONS.map((p) => ({ value: String(p), label: `${p}%` }))}
                />
              </Row>
              <p className="text-[11px] text-muted-foreground">
                {t("Valor ponderado", "Weighted value")}: {fmt(Math.round((h.manual_value * h.probability) / 100))}
              </p>
            </Card>
          ))}
          <AddButton onClick={() => add("future", "")}>
            {t("Agregar otro activo futuro", "Add another future asset")}
          </AddButton>
        </div>
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" /> {t("3. Fondo de retiro", "3. Retirement fund")}
          </span>
        }
      >
        <div className="space-y-3">
          <Row label={t("Valor actual", "Current value")}>
            <Money
              value={retirement?.manual_value ?? 0}
              onChange={(n) =>
                setSingle("retirement", t("Fondo de retiro", "Retirement fund"), {
                  manual_value: n,
                  label: t("Fondo de retiro", "Retirement fund"),
                })
              }
            />
          </Row>
          <Row label={t("Aporte mensual", "Monthly contribution")}>
            <Money
              value={retirement?.monthly_contribution ?? 0}
              onChange={(n) =>
                setSingle("retirement", t("Fondo de retiro", "Retirement fund"), {
                  monthly_contribution: n,
                  label: t("Fondo de retiro", "Retirement fund"),
                })
              }
            />
          </Row>
          <Row label={t("Retorno esperado anual", "Expected annual return")}>
            <Pct
              value={retirement?.expected_return ?? 7}
              onChange={(n) =>
                setSingle("retirement", t("Fondo de retiro", "Retirement fund"), {
                  expected_return: n,
                  label: t("Fondo de retiro", "Retirement fund"),
                })
              }
            />
          </Row>
        </div>
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> {t("6. Deudas", "6. Debts")}
          </span>
        }
        description={t("La hipoteca de tus propiedades ya se suma aparte.", "Property mortgages are already counted separately.")}
      >
        <div className="space-y-3">
          {list("debt").map((h) => (
            <div key={h.id} className="flex items-end gap-2">
              <div className="flex-1">
                <Row label={t("Nombre", "Name")}>
                  <Input value={h.label} onChange={(e) => patch(h.id, { label: e.target.value })} className="h-9" />
                </Row>
              </div>
              <div className="w-40">
                <Row label={t("Saldo", "Balance")}>
                  <Money value={h.manual_value} onChange={(n) => patch(h.id, { manual_value: n })} />
                </Row>
              </div>
              <button
                type="button"
                onClick={() => remove(h.id)}
                className="mb-1.5 text-muted-foreground transition hover:text-negative"
                aria-label={t("Eliminar", "Remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddButton onClick={() => add("debt", "")}>{t("Agregar deuda", "Add debt")}</AddButton>
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Card({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-elevated/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
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

function Money({
  value,
  onChange,
  decimals,
}: {
  value: number;
  onChange: (n: number) => void;
  decimals?: boolean;
}) {
  return (
    <Input
      type="number"
      className="h-9"
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
