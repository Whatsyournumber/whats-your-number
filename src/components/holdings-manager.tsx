import { Check, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, useT } from "@/hooks/use-language";
import { HOLDING_KINDS, type Holding, type HoldingKind, type PricedHolding, useHoldings } from "@/hooks/use-holdings";
import { cn } from "@/lib/utils";

type Draft = {
  kind: HoldingKind;
  label: string;
  ticker: string;
  quantity: string;
  cost_basis: string;
  manual_value: string;
  monthly_contribution: string;
};

const emptyDraft = (kind: HoldingKind): Draft => ({
  kind,
  label: "",
  ticker: "",
  quantity: "",
  cost_basis: "",
  manual_value: "",
  monthly_contribution: "",
});

const num = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Tabla editable de posiciones: activos con ticker se valoran en vivo y el
 * resto con valor manual. Al guardar sincroniza los totales con el perfil.
 */
export function HoldingsManager({
  kinds,
  title,
  description,
}: {
  kinds: HoldingKind[];
  title: string;
  description?: string;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const {
    holdings,
    currency,
    isLoading,
    add,
    update,
    remove,
    saving,
    syncProfile,
    refreshPrices,
    isPricing,
    pricesUpdatedAt,
  } = useHoldings();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);

  const list = holdings.filter((h) => kinds.includes(h.kind));
  const fmt = (n: number) =>
    n.toLocaleString(lang === "es" ? "es-ES" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 });
  const kindLabel = (k: HoldingKind) => {
    const found = HOLDING_KINDS.find((x) => x.kind === k)!;
    return lang === "es" ? found.es : found.en;
  };

  const afterWrite = async () => {
    await syncProfile();
    toast.success(t("Posiciones actualizadas", "Positions updated"), {
      description: t("Sincronizamos tu patrimonio en todas las pestañas.", "We synced your net worth across every tab."),
    });
  };

  const draftToPatch = (d: Draft): Partial<Holding> => ({
    kind: d.kind,
    label: d.label.trim() || kindLabel(d.kind),
    ticker: d.ticker.trim().toUpperCase(),
    quantity: num(d.quantity),
    cost_basis: num(d.cost_basis),
    manual_value: num(d.manual_value),
    monthly_contribution: num(d.monthly_contribution),
  });

  const submitNew = async () => {
    if (!draft) return;
    await add(draftToPatch(draft));
    setDraft(null);
    await afterWrite();
  };

  const submitEdit = async () => {
    if (!editing || !editDraft) return;
    await update({ id: editing, patch: draftToPatch(editDraft) });
    setEditing(null);
    setEditDraft(null);
    await afterWrite();
  };

  const startEdit = (h: PricedHolding) => {
    setEditing(h.id);
    setEditDraft({
      kind: h.kind,
      label: h.label,
      ticker: h.ticker,
      quantity: h.quantity ? String(h.quantity) : "",
      cost_basis: h.cost_basis ? String(h.cost_basis) : "",
      manual_value: h.manual_value ? String(h.manual_value) : "",
      monthly_contribution: h.monthly_contribution ? String(h.monthly_contribution) : "",
    });
  };

  const total = list.reduce((s, h) => s + h.value, 0);
  const totalCost = list.reduce((s, h) => s + h.cost, 0);

  const form = (d: Draft, setD: (next: Draft) => void, onSubmit: () => void, onCancel: () => void) => (
    <div className="grid gap-3 rounded-xl border border-border/60 bg-elevated/60 p-4 md:grid-cols-6">
      <div className="md:col-span-2">
        <Label className="text-[11px] text-muted-foreground">{t("Tipo", "Type")}</Label>
        <Select value={d.kind} onValueChange={(v) => setD({ ...d, kind: v as HoldingKind })}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOLDING_KINDS.filter((k) => kinds.includes(k.kind)).map((k) => (
              <SelectItem key={k.kind} value={k.kind}>
                {lang === "es" ? k.es : k.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label className="text-[11px] text-muted-foreground">{t("Nombre", "Name")}</Label>
        <Input className="h-9" value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} placeholder={kindLabel(d.kind)} />
      </div>
      <div>
        <Label className="text-[11px] text-muted-foreground">{t("Ticker", "Ticker")}</Label>
        <Input className="h-9" value={d.ticker} onChange={(e) => setD({ ...d, ticker: e.target.value })} placeholder="VOO" />
      </div>
      <div>
        <Label className="text-[11px] text-muted-foreground">{t("Cantidad", "Quantity")}</Label>
        <Input className="h-9" inputMode="decimal" value={d.quantity} onChange={(e) => setD({ ...d, quantity: e.target.value })} placeholder="0" />
      </div>
      <div className="md:col-span-2">
        <Label className="text-[11px] text-muted-foreground">
          {t("Valor actual (si no hay ticker)", "Current value (if no ticker)")}
        </Label>
        <Input className="h-9" inputMode="decimal" value={d.manual_value} onChange={(e) => setD({ ...d, manual_value: e.target.value })} placeholder="0" />
      </div>
      <div className="md:col-span-2">
        <Label className="text-[11px] text-muted-foreground">{t("Coste invertido", "Invested cost")}</Label>
        <Input className="h-9" inputMode="decimal" value={d.cost_basis} onChange={(e) => setD({ ...d, cost_basis: e.target.value })} placeholder="0" />
      </div>
      <div className="md:col-span-2">
        <Label className="text-[11px] text-muted-foreground">{t("Aporte mensual", "Monthly contribution")}</Label>
        <Input
          className="h-9"
          inputMode="decimal"
          value={d.monthly_contribution}
          onChange={(e) => setD({ ...d, monthly_contribution: e.target.value })}
          placeholder="0"
        />
      </div>
      <div className="flex items-end gap-2 md:col-span-6">
        <Button size="sm" className="rounded-full" onClick={onSubmit} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
          {t("Guardar", "Save")}
        </Button>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={onCancel}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          {t("Cancelar", "Cancel")}
        </Button>
      </div>
    </div>
  );

  return (
    <Panel
      title={title}
      {...(description ? { description } : {})}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshPrices()}
            className="rounded-lg border border-border/60 p-1.5 text-muted-foreground transition hover:text-foreground"
            aria-label={t("Actualizar precios", "Refresh prices")}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPricing && "animate-spin")} />
          </button>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setDraft(emptyDraft(kinds[0]!))}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("Añadir", "Add")}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {draft && form(draft, setDraft, submitNew, () => setDraft(null))}

          {list.length === 0 && !draft && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("Aún no registras posiciones aquí. Añade la primera para empezar el tracking.", "No positions here yet. Add your first one to start tracking.")}
            </p>
          )}

          {list.map((h) =>
            editing === h.id && editDraft ? (
              <div key={h.id}>{form(editDraft, setEditDraft, submitEdit, () => setEditing(null))}</div>
            ) : (
              <div key={h.id} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-elevated/60 p-3 md:grid-cols-7">
                <div className="col-span-2">
                  <p className="text-sm font-medium">{h.label || kindLabel(h.kind)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {kindLabel(h.kind)}
                    {h.ticker ? ` · ${h.ticker}` : ""}
                    {h.quantity > 0 && h.ticker ? ` · ${h.quantity}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
                  <p className="numeric text-sm font-semibold">{fmt(h.value)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("Coste", "Cost")}</p>
                  <p className="numeric text-sm">{h.cost > 0 ? fmt(h.cost) : "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("Ganancia", "Gain")}</p>
                  <p className={cn("numeric text-sm", h.gain >= 0 ? "text-positive" : "text-negative")}>
                    {h.cost > 0 ? fmt(h.gain) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("Rentab.", "Return")}</p>
                  <p className={cn("numeric text-sm font-semibold", h.ret >= 0 ? "text-positive" : "text-negative")}>
                    {h.cost > 0 ? `${h.ret > 0 ? "+" : ""}${h.ret.toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div className="flex justify-end gap-1">
                  {h.livePrice !== null && (
                    <span
                      className={cn(
                        "numeric mr-1 self-center text-[11px]",
                        (h.liveChangePct ?? 0) >= 0 ? "text-positive" : "text-negative",
                      )}
                    >
                      {(h.liveChangePct ?? 0) > 0 ? "+" : ""}
                      {(h.liveChangePct ?? 0).toFixed(2)}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:text-foreground"
                    aria-label={t("Editar", "Edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await remove(h.id);
                      await afterWrite();
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:text-negative"
                    aria-label={t("Eliminar", "Delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )}

          {list.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-sm">
              <span className="text-muted-foreground">{t("Total", "Total")}</span>
              <span className="numeric font-semibold">{fmt(total)}</span>
              {totalCost > 0 && (
                <span className={cn("numeric text-xs", total - totalCost >= 0 ? "text-positive" : "text-negative")}>
                  {total - totalCost >= 0 ? "+" : ""}
                  {fmt(total - totalCost)} ({(((total - totalCost) / totalCost) * 100).toFixed(1)}%)
                </span>
              )}
              {pricesUpdatedAt && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {t("Precios", "Prices")} {new Date(pricesUpdatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
