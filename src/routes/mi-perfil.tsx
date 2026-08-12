import { Block, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { SubscriptionManager } from "@/components/subscription-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertStoredFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useFxRates } from "@/hooks/use-fx-rates";
import { useT } from "@/hooks/use-language";
import { useProfile, type Profile } from "@/hooks/use-profile";
import {
  childrenOptions,
  cities,
  countries,
  currencies,
  goals,
  housingOptions,
  lifestyles,
  maritalOptions,
  plansChildrenOptions,
  travelOptions,
} from "@/lib/onboarding";
import { convertProfileCurrency } from "@/lib/fx";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mi-perfil")({
  head: () => ({
    meta: [
      { title: "Mis datos — WhatsYournumber" },
      { name: "description", content: "Edita tus ingresos, gastos, activos, deudas y objetivos: toda la app se recalcula al instante." },
      { property: "og:title", content: "Mis datos — WhatsYournumber" },
      { property: "og:description", content: "Tu perfil financiero editable en WhatsYournumber." },
    ],
  }),
  component: MiPerfil,
});

function MiPerfil() {
  const t = useT();
  const { profile, isLoading, save, saving } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState<Profile>(profile);
  const [dirty, setDirty] = useState(false);
  // Tasas del día: necesarias para reconvertir los importes al cambiar de moneda.
  useFxRates();

  const moneyFields: { key: keyof Profile; label: string; group: "income" | "assets" | "flow" }[] = [
    { key: "income_salary", label: t("Salario mensual", "Monthly salary"), group: "income" },
    { key: "income_bonus", label: t("Bonos / variables", "Bonuses / variable pay"), group: "income" },
    { key: "income_rent", label: t("Alquileres", "Rental income"), group: "income" },
    { key: "income_other", label: t("Otros ingresos", "Other income"), group: "income" },
    { key: "monthly_expenses", label: t("Gastos mensuales", "Monthly expenses"), group: "flow" },
    { key: "monthly_savings", label: t("Ahorro mensual", "Monthly savings"), group: "flow" },
    { key: "desired_retirement_income", label: t("Ingreso mensual deseado al retirarte", "Desired monthly income at retirement"), group: "flow" },
    { key: "assets_cash", label: t("Efectivo", "Cash"), group: "assets" },
    { key: "assets_bank", label: t("Cuentas bancarias", "Bank accounts"), group: "assets" },
    { key: "assets_retirement", label: t("Fondo de retiro", "Retirement fund"), group: "assets" },
    { key: "assets_etf", label: t("ETFs / fondos", "ETFs / funds"), group: "assets" },
    { key: "assets_stocks", label: t("Acciones", "Stocks"), group: "assets" },
    { key: "assets_crypto", label: t("Cripto", "Crypto"), group: "assets" },
    { key: "assets_property", label: t("Propiedades", "Properties"), group: "assets" },
    { key: "liabilities", label: t("Deudas totales", "Total liabilities"), group: "assets" },
  ];

  useEffect(() => {
    if (!dirty) setForm(profile);
  }, [profile, dirty]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  /** Cambia la moneda y reconvierte todos los importes con la tasa del día. */
  const changeCurrency = (next: string, extra?: Partial<Profile>) => {
    setDirty(true);
    setForm((f) => {
      const from = f.currency || "EUR";
      if (!next || next === from) return { ...f, ...(extra ?? {}) };
      convertStoredFixedExpenses(from, next);
      return { ...convertProfileCurrency(f, from, next), ...(extra ?? {}), currency: next };
    });
  };

  const preview = buildDataset(form);

  const onSave = async () => {
    const { completed: _c, ...rest } = form;
    try {
      await save({ ...rest, completed: true });
      setDirty(false);
      toast.success(t("Cambios guardados", "Changes saved"), {
        description: t("Recalculamos todos los números de tus pestañas.", "We recalculated every number across your tabs."),
      });
    } catch {
      toast.error(t("No pudimos guardar tus datos", "We couldn't save your data"));
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Perfil financiero", "Financial profile")}
        title={t("Mis datos", "My data")}
        subtitle={t(
          "Edita cualquier campo: patrimonio, dashboard, retiro y objetivos se recalculan con tus números.",
          "Edit any field: net worth, dashboard, retirement and goals recalculate with your numbers.",
        )}
      />

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label={t("Patrimonio neto", "Net worth")} value={preview.fmt(preview.netWorth)} />
          <Stat label={t("Ahorro mensual", "Monthly savings")} value={preview.fmt(preview.savings)} />
          <Stat label={t("Your Number", "Your Number")} value={preview.fmtCompact(preview.plan.targetCapital)} />
          <Stat label={t("Libertad", "Freedom")} value={`${preview.plan.freedomAge} ${t("años", "years")}`} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-full" onClick={() => navigate({ to: "/onboarding" })}>
            <RefreshCw className="h-4 w-4" />
            {t("Rehacer onboarding", "Redo onboarding")}
          </Button>
          <Button className="gap-2 rounded-full" onClick={() => void onSave()} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("Guardar cambios", "Save changes")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("Sobre ti", "About you")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("Nombre", "Name")}>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder={t("Tu nombre", "Your name")} />
            </Field>
            <Field label={t("Edad", "Age")}>
              <Input
                type="number"
                value={form.age ?? ""}
                onChange={(e) => set("age", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label={t("Edad de retiro", "Retirement age")}>
              <Input type="number" value={form.retire_age} onChange={(e) => set("retire_age", Number(e.target.value || 0))} />
            </Field>
            <Field label={t("Rentabilidad esperada (% anual)", "Expected return (% annual)")}>
              <Input
                type="number"
                step="0.5"
                value={form.expected_return}
                onChange={(e) => set("expected_return", Number(e.target.value || 0))}
              />
            </Field>
            <Field label={t("Tasa de retiro para tu número (% anual)", "Withdrawal rate for your number (% annual)")}>
              <Input
                type="number"
                step="0.5"
                value={form.withdrawal_rate || 7}
                onChange={(e) => set("withdrawal_rate", Number(e.target.value || 0))}

              />
            </Field>
            <Field label={t("País", "Country")}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.country}
                onChange={(e) => {
                  const c = countries.find((x) => x.name === e.target.value);
                  if (c) changeCurrency(c.currency, { country: e.target.value, country_code: c.code });
                  else set("country", e.target.value);
                }}
              >
                <option value="">{t("Selecciona…", "Select…")}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Moneda", "Currency")}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.currency || "EUR"}
                onChange={(e) => changeCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Ciudad objetivo", "Target city")}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              >
                <option value="">{t("Selecciona…", "Select…")}</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} · {c.country}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t("Ingresos y flujo", "Income & flow")} description={t("Importes mensuales", "Monthly amounts")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {moneyFields
              .filter((f) => f.group === "income" || f.group === "flow")
              .map((f) => (
                <Field key={String(f.key)} label={f.label}>
                  <Input
                    type="number"
                    value={(form[f.key] as number) || ""}
                    onChange={(e) => set(f.key, Number(e.target.value || 0) as Profile[typeof f.key])}
                    placeholder="0"
                  />
                </Field>
              ))}
          </div>
        </Panel>

        <Panel title={t("Patrimonio", "Net worth")} description={t("Activos y deudas actuales", "Current assets and debts")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {moneyFields
              .filter((f) => f.group === "assets")
              .map((f) => (
                <Field key={String(f.key)} label={f.label}>
                  <Input
                    type="number"
                    value={(form[f.key] as number) || ""}
                    onChange={(e) => set(f.key, Number(e.target.value || 0) as Profile[typeof f.key])}
                    placeholder="0"
                  />
                </Field>
              ))}
          </div>
        </Panel>

        <Panel title={t("Estilo de vida y objetivos", "Lifestyle & goals")}>
          <div className="space-y-5">
            <Chips label={t("Objetivo principal", "Main goal")} options={goals.map((g) => ({ value: g.value, label: `${g.emoji} ${g.label}` }))} value={form.goal} onSelect={(v) => set("goal", v)} />
            <Chips label={t("Estado civil", "Marital status")} options={maritalOptions.map((m) => ({ value: m, label: m }))} value={form.marital_status} onSelect={(v) => set("marital_status", v)} />
            <Chips label={t("Hijos", "Children")} options={childrenOptions.map((c) => ({ value: c, label: c }))} value={form.children} onSelect={(v) => set("children", v)} />
            <Chips label={t("¿Planeas tener hijos?", "Planning to have children?")} options={plansChildrenOptions.map((c) => ({ value: c, label: c }))} value={form.plans_children} onSelect={(v) => set("plans_children", v)} />
            <Chips label={t("Estilo de vida", "Lifestyle")} options={lifestyles.map((l) => ({ value: l.value, label: `${l.emoji} ${l.label}` }))} value={form.lifestyle} onSelect={(v) => set("lifestyle", v)} />
            <Chips label={t("Viajes al año", "Trips per year")} options={travelOptions.map((tr) => ({ value: tr.value, label: tr.label }))} value={form.travel_frequency} onSelect={(v) => set("travel_frequency", v)} />
            <Chips label={t("Vivienda", "Housing")} options={housingOptions.map((h) => ({ value: h.value, label: `${h.emoji} ${h.label}` }))} value={form.housing} onSelect={(v) => set("housing", v)} />
          </div>
        </Panel>
      </div>

      <SubscriptionManager />

      <div className="flex justify-end">
        <Button className="gap-2 rounded-full" onClick={() => void onSave()} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("Guardar cambios", "Save changes")}
        </Button>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="numeric mt-0.5 text-lg font-semibold">{value}</p>
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

function Chips({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              value === o.value
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-elevated/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
