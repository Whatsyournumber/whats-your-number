import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, type Profile } from "@/hooks/use-profile";
import {
  childrenOptions,
  cities,
  countries,
  goals,
  housingOptions,
  lifestyles,
  maritalOptions,
  plansChildrenOptions,
  travelOptions,
} from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mi-perfil")({
  head: () => ({
    meta: [
      { title: "Mis datos — Your north" },
      { name: "description", content: "Edita tus ingresos, gastos, activos, deudas y objetivos: toda la app se recalcula al instante." },
      { property: "og:title", content: "Mis datos — Your north" },
      { property: "og:description", content: "Tu perfil financiero editable en Your north." },
    ],
  }),
  component: MiPerfil,
});

const moneyFields: { key: keyof Profile; label: string; group: "income" | "assets" | "flow" }[] = [
  { key: "income_salary", label: "Salario mensual", group: "income" },
  { key: "income_bonus", label: "Bonos / variables", group: "income" },
  { key: "income_rent", label: "Alquileres", group: "income" },
  { key: "income_other", label: "Otros ingresos", group: "income" },
  { key: "monthly_expenses", label: "Gastos mensuales", group: "flow" },
  { key: "monthly_savings", label: "Ahorro mensual", group: "flow" },
  { key: "desired_retirement_income", label: "Ingreso mensual deseado al retirarte", group: "flow" },
  { key: "assets_cash", label: "Efectivo", group: "assets" },
  { key: "assets_bank", label: "Cuentas bancarias", group: "assets" },
  { key: "assets_retirement", label: "Fondo de retiro", group: "assets" },
  { key: "assets_etf", label: "ETFs / fondos", group: "assets" },
  { key: "assets_stocks", label: "Acciones", group: "assets" },
  { key: "assets_crypto", label: "Cripto", group: "assets" },
  { key: "assets_property", label: "Propiedades", group: "assets" },
  { key: "liabilities", label: "Deudas totales", group: "assets" },
];

function MiPerfil() {
  const { profile, isLoading, save, saving } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState<Profile>(profile);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setForm(profile);
  }, [profile, dirty]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const preview = buildDataset(form);

  const onSave = async () => {
    const { completed: _c, ...rest } = form;
    try {
      await save({ ...rest, completed: true });
      setDirty(false);
      toast.success("Datos actualizados — recalculamos toda tu app");
    } catch {
      toast.error("No pudimos guardar tus datos");
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
        eyebrow="Perfil financiero"
        title="Mis datos"
        subtitle="Edita cualquier campo: patrimonio, dashboard, retiro y objetivos se recalculan con tus números."
      />

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Patrimonio neto" value={preview.fmt(preview.netWorth)} />
          <Stat label="Ahorro mensual" value={preview.fmt(preview.savings)} />
          <Stat label="Your Number" value={preview.fmtCompact(preview.plan.targetCapital)} />
          <Stat label="Libertad" value={`${preview.plan.freedomAge} años`} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-full" onClick={() => navigate({ to: "/onboarding" })}>
            <RefreshCw className="h-4 w-4" />
            Rehacer onboarding
          </Button>
          <Button className="gap-2 rounded-full" onClick={() => void onSave()} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sobre ti">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Tu nombre" />
            </Field>
            <Field label="Edad">
              <Input
                type="number"
                value={form.age ?? ""}
                onChange={(e) => set("age", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label="Edad de retiro">
              <Input type="number" value={form.retire_age} onChange={(e) => set("retire_age", Number(e.target.value || 0))} />
            </Field>
            <Field label="Rentabilidad esperada (% anual)">
              <Input
                type="number"
                step="0.5"
                value={form.expected_return}
                onChange={(e) => set("expected_return", Number(e.target.value || 0))}
              />
            </Field>
            <Field label="País">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.country}
                onChange={(e) => {
                  const c = countries.find((x) => x.name === e.target.value);
                  set("country", e.target.value);
                  if (c) {
                    set("country_code", c.code);
                    set("currency", c.currency);
                  }
                }}
              >
                <option value="">Selecciona…</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Moneda">
              <Input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Ciudad objetivo">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              >
                <option value="">Selecciona…</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} · {c.country}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Ingresos y flujo" description="Importes mensuales">
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

        <Panel title="Patrimonio" description="Activos y deudas actuales">
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

        <Panel title="Estilo de vida y objetivos">
          <div className="space-y-5">
            <Chips label="Objetivo principal" options={goals.map((g) => ({ value: g.value, label: `${g.emoji} ${g.label}` }))} value={form.goal} onSelect={(v) => set("goal", v)} />
            <Chips label="Estado civil" options={maritalOptions.map((m) => ({ value: m, label: m }))} value={form.marital_status} onSelect={(v) => set("marital_status", v)} />
            <Chips label="Hijos" options={childrenOptions.map((c) => ({ value: c, label: c }))} value={form.children} onSelect={(v) => set("children", v)} />
            <Chips label="¿Planeas tener hijos?" options={plansChildrenOptions.map((c) => ({ value: c, label: c }))} value={form.plans_children} onSelect={(v) => set("plans_children", v)} />
            <Chips label="Estilo de vida" options={lifestyles.map((l) => ({ value: l.value, label: `${l.emoji} ${l.label}` }))} value={form.lifestyle} onSelect={(v) => set("lifestyle", v)} />
            <Chips label="Viajes al año" options={travelOptions.map((t) => ({ value: t.value, label: t.label }))} value={form.travel_frequency} onSelect={(v) => set("travel_frequency", v)} />
            <Chips label="Vivienda" options={housingOptions.map((h) => ({ value: h.value, label: `${h.emoji} ${h.label}` }))} value={form.housing} onSelect={(v) => set("housing", v)} />
          </div>
        </Panel>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2 rounded-full" onClick={() => void onSave()} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
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
