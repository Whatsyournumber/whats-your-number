import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Buddy, Card } from "@/components/mfn-ui";
import { KidPage, PageTitle } from "@/components/kid-page";
import {
  useDeleteWish,
  useFund,
  useHoldings,
  useSaveFund,
  useUpdateHolding,
  useUpdateMember,
  useUpdateWish,
  useWishes,
} from "@/hooks/use-mfn";
import { money, type Member } from "@/lib/mfn";
import { useI18n } from "@/lib/mfn-i18n";
import { CURRENCIES, currencyLabel } from "@/lib/mfn-currencies";

export const Route = createFileRoute("/ninos/kid/datos")({
  head: () => ({
    meta: [
      { title: "Mis Datos | My First Number" },
      {
        name: "description",
        content:
          "Edita tu perfil, tu mesada, el reparto de bolsillos, tu Fondo del Futuro y tus deseos.",
      },
      { property: "og:title", content: "Mis Datos | My First Number" },
      {
        property: "og:description",
        content: "Toda la información editable de tu perfil en un solo sitio.",
      },
    ],
  }),
  component: () => <KidPage>{(member) => <MyData member={member} />}</KidPage>,
});

const AVATARS = ["👦", "👧", "🦄", "🦊", "🐼", "🚀", "🐨", "🐯"];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary";

function SaveButton({ children, disabled }: { children?: React.ReactNode; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {children ?? t("Guardar", "Save")}
    </button>
  );
}

function MyData({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { data: fund } = useFund(member.id);
  const { data: wishes = [] } = useWishes(member.id);
  const { data: holdings = [] } = useHoldings(member.id);
  const updateMember = useUpdateMember();
  const saveFund = useSaveFund();
  const updateWish = useUpdateWish();
  const deleteWish = useDeleteWish();
  const updateHolding = useUpdateHolding();

  const [profile, setProfile] = useState({
    name: member.name,
    avatar: member.avatar,
    age: member.age,
    currency: member.currency,
    allowance_amount: Number(member.allowance_amount),
    allowance_frequency: member.allowance_frequency,
    split_spend: member.split_spend,
    split_save: member.split_save,
    split_grow: member.split_grow,
  });

  const [fundForm, setFundForm] = useState({
    current_balance: 0,
    monthly_contribution: 0,
    target_age: 18,
    expected_return: 7,
    goal: "🎓 Universidad",
  });

  useEffect(() => {
    if (!fund) return;
    setFundForm({
      current_balance: Number(fund.current_balance),
      monthly_contribution: Number(fund.monthly_contribution),
      target_age: Number(fund.target_age),
      expected_return: Number(fund.expected_return),
      goal: fund.goal,
    });
  }, [fund]);

  const splitTotal = profile.split_spend + profile.split_save + profile.split_grow;

  return (
    <>
      <PageTitle
        emoji="⚙️"
        title={t("Mis Datos", "My Data")}
        subtitle={t(
          "Aquí puedes cambiar toda tu información: perfil, mesada, bolsillos, fondo y deseos.",
          "Here you can change all your info: profile, allowance, pockets, fund and wishes.",
        )}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("Mi perfil", "My profile")}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateMember.mutate(
                {
                  id: member.id,
                  patch: {
                    name: profile.name.trim() || member.name,
                    avatar: profile.avatar,
                    age: profile.age,
                    currency: profile.currency,
                  },
                },
                { onSuccess: () => toast.success(t("Perfil actualizado", "Profile updated")) },
              );
            }}
          >
            <label className="block">
              <Label>{t("Nombre", "Name")}</Label>
              <input
                className={inputClass}
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </label>
            <div>
              <Label>{t("Avatar", "Avatar")}</Label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, avatar: a }))}
                    className={`grid h-11 w-11 place-items-center rounded-2xl text-xl transition-colors ${
                      profile.avatar === a ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <Label>{t("Años", "Years")}</Label>
                <input
                  type="number"
                  min={0}
                  max={17}
                  className={inputClass}
                  placeholder="0"
                  value={Math.floor(profile.age) || ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      age: Math.round((Number(e.target.value) + (p.age % 1)) * 100) / 100,
                    }))
                  }
                />
              </label>
              <label className="block">
                <Label>{t("Meses", "Months")}</Label>
                <select
                  className={inputClass}
                  value={Math.round((profile.age % 1) * 12)}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      age: Math.round((Math.floor(p.age) + Number(e.target.value) / 12) * 100) / 100,
                    }))
                  }
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <Label>{t("Moneda", "Currency")}</Label>
                <select
                  className={inputClass}
                  value={profile.currency}
                  onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {currencyLabel(c.code, lang)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <SaveButton disabled={updateMember.isPending} />
          </form>
        </Card>

        <Card title={t("Mi mesada y bolsillos", "My allowance and pockets")} hint={t(`Reparto actual: ${splitTotal}%`, `Current split: ${splitTotal}%`)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (splitTotal !== 100) {
                toast.error(t("El reparto debe sumar 100%", "The split must add up to 100%"));
                return;
              }
              updateMember.mutate(
                {
                  id: member.id,
                  patch: {
                    allowance_amount: profile.allowance_amount,
                    allowance_frequency: profile.allowance_frequency,
                    split_spend: profile.split_spend,
                    split_save: profile.split_save,
                    split_grow: profile.split_grow,
                  },
                },
                { onSuccess: () => toast.success(t("Mesada actualizada", "Allowance updated")) },
              );
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <Label>{t("Mesada", "Allowance")}</Label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  className={inputClass}
                  placeholder="0"
                  value={profile.allowance_amount || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, allowance_amount: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="block">
                <Label>{t("Frecuencia", "Frequency")}</Label>
                <select
                  className={inputClass}
                  value={profile.allowance_frequency}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, allowance_frequency: e.target.value }))
                  }
                >
                  {[
                    ["semanal", t("semanal", "weekly")],
                    ["quincenal", t("quincenal", "biweekly")],
                    ["mensual", t("mensual", "monthly")],
                  ].map(([f, l]) => (
                    <option key={f} value={f}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["split_spend", "🛍️ Gastar"],
                  ["split_save", "🏦 Ahorrar"],
                  ["split_grow", "🌱 Crecer"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <Label>{label}</Label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClass}
                    placeholder="0"
                    value={profile[key] || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, [key]: Number(e.target.value) }))}
                  />
                </label>
              ))}
            </div>
            <SaveButton disabled={updateMember.isPending} />
          </form>
        </Card>

        <Card title={t("Mi Fondo del Futuro", "My Future Fund")}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveFund.mutate(
                { memberId: member.id, patch: fundForm },
                { onSuccess: () => toast.success(t("Fondo actualizado", "Fund updated")) },
              );
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <Label>{t("Saldo actual", "Current balance")}</Label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className={inputClass}
                  placeholder="0"
                  value={fundForm.current_balance || ""}
                  onChange={(e) =>
                    setFundForm((f) => ({ ...f, current_balance: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="block">
                <Label>{t("Aporte mensual", "Monthly contribution")}</Label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className={inputClass}
                  placeholder="0"
                  value={fundForm.monthly_contribution || ""}
                  onChange={(e) =>
                    setFundForm((f) => ({ ...f, monthly_contribution: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="block">
                <Label>{t("Edad objetivo", "Target age")}</Label>
                <input
                  type="number"
                  min={10}
                  max={40}
                  className={inputClass}
                  placeholder="0"
                  value={fundForm.target_age || ""}
                  onChange={(e) =>
                    setFundForm((f) => ({ ...f, target_age: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="block">
                <Label>{t("Retorno estimado (%)", "Expected return (%)")}</Label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  step="0.5"
                  className={inputClass}
                  placeholder="0"
                  value={fundForm.expected_return || ""}
                  onChange={(e) =>
                    setFundForm((f) => ({ ...f, expected_return: Number(e.target.value) }))
                  }
                />
              </label>
            </div>
            <label className="block">
              <Label>{t("Objetivo", "Goal")}</Label>
              <input
                className={inputClass}
                value={fundForm.goal}
                onChange={(e) => setFundForm((f) => ({ ...f, goal: e.target.value }))}
              />
            </label>
            <SaveButton disabled={saveFund.isPending} />
          </form>
        </Card>

        <Card title={t("Mis deseos", "My wishes")} hint={t("Cambia el precio o lo que ya llevas ahorrado", "Change the price or what you have saved so far")}>
          {wishes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("Aún no tienes deseos.", "You have no wishes yet.")}</p>
          ) : (
            <ul className="space-y-4">
              {wishes.map((w) => (
                <li key={w.id} className="rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{w.emoji}</span>
                    <input
                      className={`${inputClass} py-2`}
                      defaultValue={w.title}
                      onBlur={(e) =>
                        e.target.value.trim() &&
                        e.target.value !== w.title &&
                        updateWish.mutate({
                          id: w.id,
                          memberId: member.id,
                          patch: { title: e.target.value.trim() },
                        })
                      }
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                    <label className="block">
                      <Label>{t("Precio", "Price")}</Label>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        className={`${inputClass} py-2`}
                        placeholder="0"
                        defaultValue={Number(w.price) || ""}
                        onBlur={(e) =>
                          updateWish.mutate({
                            id: w.id,
                            memberId: member.id,
                            patch: { price: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <Label>{t("Ahorrado", "Saved")}</Label>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        className={`${inputClass} py-2`}
                        placeholder="0"
                        defaultValue={Number(w.saved) || ""}
                        onBlur={(e) =>
                          updateWish.mutate({
                            id: w.id,
                            memberId: member.id,
                            patch: {
                              saved: Number(e.target.value),
                              achieved: Number(e.target.value) >= Number(w.price),
                            },
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        deleteWish.mutate({ id: w.id, memberId: member.id });
                        toast.success(t("Deseo eliminado", "Wish deleted"));
                      }}
                      className="rounded-2xl bg-secondary px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {t("Borrar", "Delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2" title={t("Mi portfolio", "My portfolio")} hint={t("Ajusta el valor de cada inversión", "Adjust the value of each investment")}>
          {holdings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("Tu bolsillo de crecer aún está vacío.", "Your Grow pocket is still empty.")}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {holdings.map((h) => (
                <li
                  key={h.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_7rem] items-center gap-3 rounded-2xl bg-muted/50 p-3"
                >
                  <span className="text-lg">{h.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {money(Number(h.value), member.currency)} · +{Number(h.growth)}% {t("anual", "annual")}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    className={`${inputClass} py-2`}
                    placeholder="0"
                    defaultValue={Number(h.value) || ""}
                    onBlur={(e) =>
                      updateHolding.mutate({
                        id: h.id,
                        memberId: member.id,
                        patch: { value: Number(e.target.value) },
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Buddy>
          {t(
            "Cambia lo que quieras: tu número del futuro se recalcula solo con cada dato nuevo.",
            "Change whatever you want: your future number recalculates automatically with every new piece of data.",
          )}
        </Buddy>
      </div>
    </>
  );
}
