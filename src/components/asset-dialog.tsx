import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-language";
import { defaultReturn, newHolding, useHoldings, type Holding, type HoldingKind } from "@/hooks/use-holdings";
import { useQuotes, useSymbolSearch } from "@/hooks/use-market";

type Draft = {
  kind: HoldingKind;
  label: string;
  ticker: string;
  quantity: string;
  cost_basis: string;
  manual_value: string;
  monthly_contribution: string;
  expected_return: string;
  linked_liability: string;
  purchased_at: string;
};

function draftFrom(h: Holding): Draft {
  return {
    kind: h.kind,
    label: h.label ?? "",
    ticker: h.ticker ?? "",
    quantity: h.quantity ? String(h.quantity) : "",
    cost_basis: h.cost_basis ? String(h.cost_basis) : "",
    manual_value: h.manual_value ? String(h.manual_value) : "",
    monthly_contribution: h.monthly_contribution ? String(h.monthly_contribution) : "",
    expected_return: h.expected_return ? String(h.expected_return) : "",
    linked_liability: h.linked_liability ? String(h.linked_liability) : "",
    purchased_at: (h.purchased_at ?? "").slice(0, 10),
  };
}

const numOr = (v: string, fallbackValue = 0) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallbackValue;
};

/** Ventana para añadir (o editar) un activo, igual que en Portafolio. */
export function AssetDialog({
  open,
  onOpenChange,
  holdingId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdingId?: string | null;
}) {
  const t = useT();
  const { holdings, saveAll, saving } = useHoldings();
  const editingHolding = holdingId ? (holdings.find((h) => h.id === holdingId) ?? null) : null;
  const isNew = !editingHolding;
  const [draft, setDraft] = useState<Draft | null>(editingHolding ? draftFrom(editingHolding) : null);
  const [tickerOpen, setTickerOpen] = useState(false);
  const [tickerQuery, setTickerQuery] = useState("");
  const tickerSearch = useSymbolSearch(tickerOpen ? tickerQuery : "");
  const tickerHits = (tickerSearch.data?.hits ?? []).slice(0, 6);
  const draftTicker = (draft?.ticker ?? "").trim().toUpperCase();
  const draftQuoteQuery = useQuotes(draftTicker.length >= 1 ? [draftTicker] : []);
  const draftQuote = (draftQuoteQuery.data?.quotes ?? []).find((q) => q.symbol.toUpperCase() === draftTicker);

  const close = () => {
    setDraft(editingHolding ? draftFrom(editingHolding) : null);
    onOpenChange(false);
  };

  const selectNewKind = (kind: HoldingKind) =>
    setDraft({
      kind,
      label: "",
      ticker: "",
      quantity: "",
      cost_basis: "",
      manual_value: "",
      monthly_contribution: "",
      expected_return: String(defaultReturn(kind)),
      linked_liability: "",
      purchased_at: new Date().toISOString().slice(0, 10),
    });

  const save = async () => {
    if (!draft) return;
    const base = editingHolding ?? newHolding(draft.kind, "", holdings.length);
    const updated: Holding = {
      ...base,
      kind: draft.kind,
      label: draft.label.trim() || draft.ticker.trim().toUpperCase() || base.label || t("Posición", "Position"),
      ticker: draft.ticker.trim().toUpperCase() || null,
      quantity: numOr(draft.quantity),
      cost_basis: numOr(draft.cost_basis),
      manual_value: numOr(draft.manual_value),
      monthly_contribution: numOr(draft.monthly_contribution),
      expected_return: numOr(draft.expected_return, base.expected_return),
      linked_liability: numOr(draft.linked_liability),
      purchased_at: draft.purchased_at || base.purchased_at || null,
    };
    try {
      await saveAll(editingHolding ? holdings.map((h) => (h.id === updated.id ? updated : h)) : [...holdings, updated]);
      toast.success(editingHolding ? t("Activo actualizado", "Asset updated") : t("Activo añadido", "Asset added"));
      close();
    } catch {
      toast.error(t("No pudimos guardar. Inténtalo de nuevo.", "We couldn't save. Please try again."));
    }
  };

  const kinds: Array<[HoldingKind, string, string]> = [
    ["etf", t("ETF", "ETF"), t("Fondos cotizados", "Exchange-traded funds")],
    ["stock", t("Acción", "Stock"), t("Empresas individuales", "Individual companies")],
    ["crypto", t("Cripto", "Crypto"), t("Activos digitales", "Digital assets")],
    ["cash", t("Efectivo", "Cash"), t("Cuentas y efectivo", "Accounts and cash")],
    ["property", t("Propiedad", "Property"), t("Bienes raíces", "Real estate")],
    ["bond", t("Renta fija", "Fixed income"), t("Bonos e instrumentos", "Bonds and instruments")],
    ["structured", t("Nota estructurada", "Structured note"), t("Productos estructurados", "Structured products")],
    ["retirement", t("Fondo de retiro", "Retirement fund"), t("Planes de pensiones", "Pension plans")],
    ["other", t("Otros", "Other"), t("Cualquier otro activo", "Any other asset")],
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingHolding ? t(`Editar ${editingHolding.label}`, `Edit ${editingHolding.label}`) : t("Nuevo activo", "New asset")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("Datos del activo", "Asset details")}</DialogDescription>
        </DialogHeader>

        {!draft ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {kinds.map(([kind, label, description]) => (
              <Button
                key={kind}
                type="button"
                variant="outline"
                onClick={() => selectNewKind(kind)}
                className="h-auto justify-start rounded-lg border-border/60 px-4 py-3 text-left hover:border-primary/50 hover:bg-primary/10"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{description}</span>
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {isNew ? (
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDraft(null)}
                  aria-label={t("Volver a tipos de activo", "Back to asset types")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-semibold">{kinds.find(([kind]) => kind === draft.kind)?.[1]}</p>
                  <p className="text-xs text-muted-foreground">{kinds.find(([kind]) => kind === draft.kind)?.[2]}</p>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("Nombre", "Name")}</Label>
                <Input className="h-9" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              {(!isNew || ["etf", "stock", "crypto", "bond"].includes(draft.kind)) && (
                <>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("Ticker", "Ticker")}</Label>
                    <div className="relative">
                      <Input
                        className="h-9 uppercase"
                        value={tickerOpen ? tickerQuery : draft.ticker}
                        placeholder={draft.kind === "crypto" ? "BTC-USD" : draft.kind === "bond" ? t("Opcional", "Optional") : "VOO"}
                        onFocus={() => {
                          setTickerQuery(draft.ticker);
                          setTickerOpen(true);
                        }}
                        onBlur={(e) => {
                          const v = e.target.value.trim().toUpperCase();
                          if (draft.kind === "crypto" && v && !v.includes("-")) setDraft({ ...draft, ticker: `${v}-USD` });
                          window.setTimeout(() => setTickerOpen(false), 150);
                        }}
                        onChange={(e) => {
                          setTickerQuery(e.target.value);
                          setTickerOpen(true);
                          setDraft({ ...draft, ticker: e.target.value.toUpperCase() });
                        }}
                      />
                      {tickerOpen && tickerQuery.trim().length >= 1 ? (
                        <div className="absolute left-0 top-10 z-50 w-[min(18rem,80vw)] overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
                          {tickerSearch.isFetching && tickerHits.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground">{t("Buscando…", "Searching…")}</p>
                          ) : null}
                          {tickerHits.map((h) => (
                            <button
                              key={h.symbol}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setDraft({ ...draft, ticker: h.symbol.toUpperCase(), label: draft.label || h.name || h.symbol });
                                setTickerOpen(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-elevated/70"
                            >
                              <span className="text-xs font-semibold text-foreground">{h.symbol}</span>
                              <span className="truncate text-[11px] text-muted-foreground">{h.name}</span>
                            </button>
                          ))}
                          {!tickerSearch.isFetching && tickerHits.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground">{t("Sin resultados", "No results")}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {draftTicker ? (
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {draftQuote ? (
                          <>
                            {draftTicker} ·{" "}
                            <span className="font-semibold text-foreground">
                              {draftQuote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>{" "}
                            <span className={(draftQuote.changePct ?? 0) >= 0 ? "text-positive" : "text-destructive"}>
                              {(draftQuote.changePct ?? 0) >= 0 ? "+" : ""}
                              {(draftQuote.changePct ?? 0).toFixed(2)}%
                            </span>
                          </>
                        ) : (
                          t("Buscando precio de mercado…", "Fetching market price…")
                        )}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("Unidades", "Units")}</Label>
                    <Input className="h-9" inputMode="decimal" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
                  </div>
                </>
              )}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  {draft.kind === "cash"
                    ? t("Saldo actual", "Current balance")
                    : draft.kind === "property"
                      ? t("Precio de compra", "Purchase price")
                      : t("Monto invertido", "Amount invested")}
                </Label>
                <Input className="h-9" inputMode="decimal" value={draft.cost_basis} onChange={(e) => setDraft({ ...draft, cost_basis: e.target.value })} />
              </div>
              {(!isNew || draft.kind !== "cash") && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("Valor actual", "Current value")}</Label>
                  <Input className="h-9" inputMode="decimal" value={draft.manual_value} onChange={(e) => setDraft({ ...draft, manual_value: e.target.value })} />
                </div>
              )}
              {draft.kind === "property" && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("Deuda pendiente", "Outstanding debt")}</Label>
                  <Input className="h-9" inputMode="decimal" value={draft.linked_liability} onChange={(e) => setDraft({ ...draft, linked_liability: e.target.value })} />
                </div>
              )}
              {draft.kind !== "cash" && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("Aporte mensual", "Monthly contribution")}</Label>
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    value={draft.monthly_contribution}
                    onChange={(e) => setDraft({ ...draft, monthly_contribution: e.target.value })}
                  />
                </div>
              )}
              {(!isNew || draft.kind !== "cash") && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("Retorno esperado %", "Expected return %")}</Label>
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    value={draft.expected_return}
                    onChange={(e) => setDraft({ ...draft, expected_return: e.target.value })}
                  />
                </div>
              )}
              {(!isNew || draft.kind !== "cash") && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("Fecha de compra", "Purchase date")}</Label>
                  <Input className="h-9" type="date" value={draft.purchased_at} onChange={(e) => setDraft({ ...draft, purchased_at: e.target.value })} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                {["etf", "stock", "crypto", "bond"].includes(draft.kind)
                  ? t(
                      "Si dejas el valor actual en cero, usamos el precio de mercado por tus unidades.",
                      "If you leave the current value at zero, we use the market price times your units.",
                    )
                  : ""}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={close}>
                  {t("Cancelar", "Cancel")}
                </Button>
                <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
                  {saving ? t("Guardando", "Saving") : t("Guardar", "Save")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
