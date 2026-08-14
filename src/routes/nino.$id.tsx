import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Loader2, Pencil, PiggyBank, Sparkles, Target, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nino/$id")({
  head: () => ({
    meta: [
      { title: "Perfil de tu hijo — My First Number" },
      {
        name: "description",
        content: "El primer número de tu hijo: ahorro, interés compuesto y metas explicadas de forma simple.",
      },
      { property: "og:title", content: "Perfil de tu hijo — My First Number" },
      {
        property: "og:description",
        content: "Sigue el crecimiento del dinero de tus hijos con interés compuesto y metas claras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidProfilePage,
});

type KidProfile = {
  id: string;
  name: string;
  avatar: string;
  birth_year: number | null;
  currency: string;
  starting_capital: number;
  monthly_contribution: number;
  expected_return: number;
  goal: string | null;
  goal_amount: number;
  onboarding_completed: boolean;
};

const AVATARS = ["🧒", "👦", "👧", "🦊", "🐯", "🚀", "⚽", "🎨"];

function projection(kid: KidProfile) {
  const year = new Date().getFullYear();
  const age = kid.birth_year ? year - kid.birth_year : 8;
  const years = Math.max(1, 18 - age);
  const r = kid.expected_return / 100;
  const rows: { year: number; age: number; value: number; aportado: number }[] = [];
  let value = kid.starting_capital;
  let aportado = kid.starting_capital;
  for (let i = 0; i <= years; i += 1) {
    rows.push({ year: year + i, age: age + i, value: Math.round(value), aportado: Math.round(aportado) });
    value = value * (1 + r) + kid.monthly_contribution * 12;
    aportado += kid.monthly_contribution * 12;
  }
  return rows;
}

function money(v: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}

function KidProfilePage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  const [kid, setKid] = useState<KidProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("kid_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (!data) {
        navigate({ to: "/elegir" });
        return;
      }
      setKid(data as KidProfile);
      setEditing(!data.onboarding_completed);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user, id, navigate]);

  if (loading || !kid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background px-5 py-10">
      <div className="wealth-gradient pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            to="/elegir"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("Perfiles", "Profiles")}
          </Link>
          <Link to="/" aria-label="My First Number">
            <BrandMark className="h-8 w-8" />
          </Link>
        </div>

        {editing ? (
          <KidOnboarding kid={kid} onDone={(next) => { setKid(next); setEditing(false); }} t={t} />
        ) : (
          <KidDashboard kid={kid} onEdit={() => setEditing(true)} t={t} />
        )}
      </div>
    </div>
  );
}

type Translate = ReturnType<typeof useT>;

function KidDashboard({ kid, onEdit, t }: { kid: KidProfile; onEdit: () => void; t: Translate }) {
  const rows = useMemo(() => projection(kid), [kid]);
  const final = rows[rows.length - 1]!;
  const interes = final.value - final.aportado;
  const goalPct = kid.goal_amount > 0 ? Math.min(100, Math.round((final.value / kid.goal_amount) * 100)) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl ring-2 ring-primary/30">
          {kid.avatar}
        </span>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{kid.name}</h1>
          <p className="text-sm text-muted-foreground">
            {kid.birth_year
              ? t(`${new Date().getFullYear() - kid.birth_year} años`, `${new Date().getFullYear() - kid.birth_year} years old`)
              : t("Su primer número", "Their first number")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
          <Pencil className="h-3.5 w-3.5" /> {t("Editar", "Edit")}
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Kpi
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          label={t("Su número a los 18", "Their number at 18")}
          value={money(final.value, kid.currency)}
        />
        <Kpi
          icon={<PiggyBank className="h-4 w-4 text-primary" />}
          label={t("Total aportado", "Total contributed")}
          value={money(final.aportado, kid.currency)}
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label={t("Regalo del interés compuesto", "Compound interest gift")}
          value={money(interes, kid.currency)}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-elevated/60 p-5">
        <p className="mb-4 text-sm font-medium">
          {t("Cómo crece su dinero", "How their money grows")}
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="kidGrow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="age" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={54}
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--elevated))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number | string) => money(Number(v), kid.currency)}
                labelFormatter={(l: number | string) => t(`${l} años`, `Age ${l}`)}
              />
              <Area type="monotone" dataKey="aportado" stroke="hsl(var(--muted-foreground))" fill="none" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#kidGrow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {kid.goal && kid.goal_amount > 0 && (
        <div className="mt-6 rounded-3xl border border-border bg-elevated/60 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-primary" /> {kid.goal}
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary" style={{ width: `${goalPct ?? 0}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              `${goalPct}% de ${money(kid.goal_amount, kid.currency)} con su plan actual`,
              `${goalPct}% of ${money(kid.goal_amount, kid.currency)} with the current plan`,
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-elevated/60 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function KidOnboarding({
  kid,
  onDone,
  t,
}: {
  kid: KidProfile;
  onDone: (next: KidProfile) => void;
  t: Translate;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(kid);
  const [saving, setSaving] = useState(false);

  const steps = [
    t("¿Quién es?", "Who is it?"),
    t("¿Cuánto empieza?", "Starting point"),
    t("Su sueño", "Their dream"),
  ];

  async function save() {
    setSaving(true);
    const { data, error } = await supabase
      .from("kid_profiles")
      .update({
        name: form.name,
        avatar: form.avatar,
        birth_year: form.birth_year,
        currency: form.currency,
        starting_capital: form.starting_capital,
        monthly_contribution: form.monthly_contribution,
        expected_return: form.expected_return,
        goal: form.goal,
        goal_amount: form.goal_amount,
        onboarding_completed: true,
      })
      .eq("id", kid.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (error || !data) {
      toast.error(t("No pudimos guardar", "Couldn't save"));
      return;
    }
    toast.success(t("¡Listo! Su número está en marcha", "Done! Their number is live"));
    onDone(data as KidProfile);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg rounded-3xl border border-border bg-elevated/60 p-6 sm:p-8"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {t("Paso", "Step")} {step + 1}/3
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold">{steps[step]}</h2>

      <div className="mt-6 space-y-5">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label>{t("Nombre", "Name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("Avatar", "Avatar")}</Label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setForm({ ...form, avatar: a })}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl transition-colors ${
                      form.avatar === a ? "border-primary bg-primary/10" : "border-border bg-background"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("Año de nacimiento", "Birth year")}</Label>
              <Input
                type="number"
                value={form.birth_year ?? ""}
                onChange={(e) => setForm({ ...form, birth_year: e.target.value ? Number(e.target.value) : null })}
                placeholder="2016"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>{t("Capital inicial", "Starting capital")}</Label>
              <Input
                type="number"
                value={form.starting_capital}
                onChange={(e) => setForm({ ...form, starting_capital: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Aporte mensual", "Monthly contribution")}</Label>
              <Input
                type="number"
                value={form.monthly_contribution}
                onChange={(e) => setForm({ ...form, monthly_contribution: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Moneda", "Currency")}</Label>
              <div className="flex gap-2">
                {["EUR", "USD", "GBP"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, currency: c })}
                    className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                      form.currency === c ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>{t("¿Para qué ahorra?", "What are they saving for?")}</Label>
              <Input
                value={form.goal ?? ""}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                placeholder={t("Una bici, la universidad...", "A bike, university...")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Coste de la meta", "Goal amount")}</Label>
              <Input
                type="number"
                value={form.goal_amount}
                onChange={(e) => setForm({ ...form, goal_amount: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {t("Atrás", "Back")}
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
            {t("Siguiente", "Next")} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => void save()} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t("Ver su número", "See their number")}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
