import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import { Lock, Plus, Settings, Trash2, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button, inputClass } from "@/components/mfn-ui";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveProfile, useCreateParent, useMembers, useSubscription } from "@/hooks/use-mfn";
import { THEME_ATTR, type Member } from "@/lib/mfn";
import { FAMILY_TOTAL_SEATS, activePlan, kidLimit, planLabel } from "@/lib/mfn-plan";
import { useRegionalPricing } from "@/hooks/use-regional-pricing";
import { EXTRA_SEAT_PRICE, formatMoney } from "@/lib/pricing-tiers";
import { useI18n, LangToggle } from "@/lib/mfn-i18n";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useProfile } from "@/hooks/use-profile";

const ADULT_AVATARS = ["👨‍💼", "👩‍💼", "🧔‍♂️", "👩‍🦰", "👨‍🦱", "👩‍🦱", "🧑‍🎓", "👨‍🍳", "👩‍⚕️", "👨‍🚀", "🦸‍♀️", "🦸‍♂️", "👵", "👴"];
const KID_AVATARS = ["🦊", "🐼", "🐯", "🐨", "🦁", "🐙", "🐧", "🐸", "🐲", "🦖", "🦄", "🐰", "🐱", "🦢", "🦋", "🐞", "🐝", "🦩", "🐬", "🦜", "🚀", "⚽", "🎨", "🎸"];

function AvatarPicker({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string;
  onPick: (a: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {options.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onPick(a)}
          className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition ${
            value === a ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary hover:bg-primary/10"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}



export const Route = createFileRoute("/ninos/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My First Number — Elige tu perfil" },
      {
        name: "description",
        content:
          "Elige tu perfil familiar en My First Number y sigue construyendo el patrimonio futuro de tus hijos mientras aprenden educación financiera.",
      },
      { property: "og:title", content: "My First Number — Elige tu perfil" },
      {
        property: "og:description",
        content: "Perfiles de padres e hijos: fondo del futuro, tareas, deseos y bolsillos.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  component: ProfileSelector,
});

function ProfileSelector() {
  const router = useRouter();
  const { data: members = [], isLoading } = useMembers();
  const { data: subscription } = useSubscription();
  const { select } = useActiveProfile();
  const { t, lang } = useI18n();
  const { profile, save: saveProfile } = useProfile();
  const [manage, setManage] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showFlexChoice, setShowFlexChoice] = useState(false);
  const [showAddAdult, setShowAddAdult] = useState(false);
  const [adultName, setAdultName] = useState("");
  const [adultAvatar, setAdultAvatar] = useState(ADULT_AVATARS[0]!);
  const [showAddKid, setShowAddKid] = useState(false);
  const [kidName, setKidName] = useState("");
  const [kidAge, setKidAge] = useState("8");
  const [kidTheme, setKidTheme] = useState<"boy" | "girl">("boy");
  const [kidAvatar, setKidAvatar] = useState(KID_AVATARS[0]!);
  const [holderAvatar, setHolderAvatar] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("holder_avatar") ?? "") : "",
  );
  const [holderSubtitle, setHolderSubtitle] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("holder_subtitle") ?? "") : "",
  );
  const createParent = useCreateParent();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const queryClient = useQueryClient();

  function saveHolderAvatar(a: string) {
    setHolderAvatar(a);
    localStorage.setItem("holder_avatar", a);
    setPickerFor(null);
  }

  async function addKid() {
    const name = kidName.trim();
    const age = Math.min(17, Math.max(0, Number(kidAge) || 0));
    if (!name) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth.user?.id;
      if (!user_id) throw new Error(t("Sesión no disponible", "Session not available"));
      // Guardamos el perfil al instante: nombre + emoji aparecen ya en la sección de perfiles.
      const { data: member, error } = await supabase
        .from("kid_members")
        .insert({ user_id, name, role: "child", theme: kidTheme, avatar: kidAvatar, age, onboarded: false })
        .select("*")
        .single();
      if (error) throw error;
      // Borrador para que, al abrir su perfil, el onboarding retome sin repetir nombre ni emoji.
      window.localStorage.setItem(
        "mfn-kid-onboarding-draft",
        JSON.stringify({ step: 1, name, age, theme: kidTheme, avatar: kidAvatar, memberId: member.id }),
      );
      await queryClient.refetchQueries({ queryKey: ["kid_members"] });
      toast.success(t(`Perfil de ${name} creado`, `${name}'s profile created`));
      setShowAddKid(false);
      setKidName("");
      setKidAge("8");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("No se pudo crear el perfil", "Could not create profile"));
    }
  }

  async function addAdult() {
    const name = adultName.trim();
    if (!name) return;
    try {
      await createParent.mutateAsync({ name, avatar: adultAvatar });
      toast.success(t(`Perfil de ${name} creado`, `${name}'s profile created`));
      setShowAddAdult(false);
      setAdultName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("No se pudo crear el perfil", "Could not create profile"));
    }
  }

  async function unlockExtraProfile() {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    await openCheckout({
      priceId: "extra_kid_monthly",
      quantity: 1,
      ...(user?.email ? { customerEmail: user.email } : {}),
      customData: { userId: user?.id ?? "", type: "extra_kid_profile" },
      successUrl: `${window.location.origin}/ninos`,
    });
  }

  async function saveAvatar(m: Member, avatar: string) {
    if (avatar === m.avatar) return;
    queryClient.setQueryData<Member[]>(["kid_members"], (prev) =>
      prev?.map((x) => (x.id === m.id ? { ...x, avatar } : x)),
    );
    const { error } = await supabase.from("kid_members").update({ avatar }).eq("id", m.id);
    if (error) toast.error(error.message);
    await queryClient.refetchQueries({ queryKey: ["kid_members"] });
  }

  async function saveRole(m: Member, kind: "parent" | "boy" | "girl") {
    const role = kind === "parent" ? "parent" : "child";
    if (role === m.role && (role === "parent" || m.theme === kind)) return;
    if (role === "parent" && m.role !== "parent" && adultCount >= MAX_ADULTS) {
      toast.error(t("Solo se permiten 2 adultos por plan", "Only 2 adults are allowed per plan"));
      return;
    }
    const patch =
      role === "parent"
        ? { role, theme: "parent", avatar: ADULT_AVATARS[0]!, onboarded: true, subtitle: null }
        : m.role === "child"
          ? { theme: kind }
          : { role, theme: kind, avatar: KID_AVATARS[0]!, age: m.age > 0 ? m.age : 8, onboarded: true, subtitle: null };
    try {
      const { error } = await supabase.from("kid_members").update(patch).eq("id", m.id);
      if (error) throw error;
      await queryClient.refetchQueries({ queryKey: ["kid_members"] });
      toast.success(
        role === "parent"
          ? t(`${m.name} ahora es un perfil de adulto`, `${m.name} is now an adult profile`)
          : kind === "girl"
            ? t(`${m.name} ahora es un perfil de niña`, `${m.name} is now a girl profile`)
            : t(`${m.name} ahora es un perfil de niño`, `${m.name} is now a boy profile`),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("No se pudo cambiar el tipo", "Could not change type"));
    }
  }

  async function saveField(m: Member, field: "name" | "subtitle", raw: string) {
    const value = raw.trim();
    const current = field === "name" ? m.name : (m.subtitle ?? "");
    if (value === current) return;
    if (field === "name" && !value) return;
    try {
      const { error } = await supabase
        .from("kid_members")
        .update(field === "name" ? { name: value } : { subtitle: value || null })
        .eq("id", m.id);
      if (error) throw error;
      await queryClient.refetchQueries({ queryKey: ["kid_members"] });
      toast.success(t("Perfil actualizado", "Profile updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("No se pudo guardar", "Could not save"));
    }
  }



  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const childTables = [
        "kid_movements",
        "kid_tasks",
        "kid_wishes",
        "kid_holdings",
        "kid_future_funds",
      ] as const;
      for (const table of childTables) {
        await supabase.from(table).delete().eq("member_id", pendingDelete.id);
      }
      const { error } = await supabase.from("kid_members").delete().eq("id", pendingDelete.id);
      if (error) throw error;
      select(null);
      await queryClient.refetchQueries({ queryKey: ["kid_members"] });
      toast.success(t(`Perfil de ${pendingDelete.name} eliminado`, `${pendingDelete.name}\u2019s profile deleted`));
      setPendingDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("No se pudo borrar el perfil", "Could not delete profile"));
    } finally {
      setDeleting(false);
    }
  }

  const plan = activePlan(subscription);
  const { tier: pricingTier, currency: pricingCurrency } = useRegionalPricing();
  const extraSeatPrice = formatMoney(EXTRA_SEAT_PRICE[pricingTier], pricingCurrency);


  useEffect(() => {
    document.documentElement.removeAttribute(THEME_ATTR);
  }, []);

  const parents = members.filter((m) => m.role === "parent");
  const kids = members.filter((m) => m.role === "child");
  // El titular de la cuenta es siempre el primer adulto; los demás adultos son filas "parent".
  const adultCount = 1 + parents.length;
  const maxKids = kidLimit(subscription, adultCount);
  const usedSeats = adultCount + kids.length;
  // Plan Familiar: 3 perfiles gratis (titular incluido) -> 1º hijo/a, 2º adulto o niño, el siguiente es de pago.
  const freeSlotsLeft = Math.max(0, FAMILY_TOTAL_SEATS - usedSeats);
  const showKidSlot = plan === "family" && kids.length === 0 && freeSlotsLeft > 0;
  const showFlexSlot =
    plan === "family" &&
    parents.length === 0 &&
    ((kids.length === 0 && freeSlotsLeft > 1) || (kids.length > 0 && freeSlotsLeft > 0));
  

  async function openAdult() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      router.navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    const { data: row } = await supabase
      .from("onboarding_profiles")
      .select("completed")
      .eq("user_id", uid)
      .maybeSingle();
    router.navigate({ to: row?.completed ? "/dashboard" : "/onboarding" });
  }

  function open(member: Member) {
    select(member.id);
    if (member.role === "parent") void openAdult();
    else if (!member.onboarded) router.navigate({ to: "/ninos/onboarding" });
    else router.navigate({ to: "/ninos/kid/numero" });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              My First Number
            </p>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
              {t("Plan", "Plan")} {planLabel(plan, lang === "en" ? "en" : "es")}
            </span>
          </div>
          <LangToggle />
        </div>

        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t("¿Quién está aquí?", "Who's here?")}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {t(
            "Cada perfil tiene su propio mundo: los padres planifican el futuro, los niños aprenden practicando.",
            "Every profile has its own world: parents plan the future, kids learn by doing.",
          )}
        </p>

        {isLoading ? (
          <p className="mt-12 text-sm text-muted-foreground">{t("Cargando perfiles…", "Loading profiles…")}</p>
        ) : (
          <>
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
              <button
                onClick={() => {
                  if (manage) return;
                  void openAdult();
                }}
                className="group flex flex-col items-center gap-3 outline-none"
              >
                <span
                  role={manage ? "button" : undefined}
                  onClick={
                    manage
                      ? (e) => {
                          e.stopPropagation();
                          setPickerFor(pickerFor === "holder" ? null : "holder");
                        }
                      : undefined
                  }
                  className={`grid aspect-square w-full place-items-center rounded-2xl bg-secondary ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4 ${manage ? "cursor-pointer ring-2 ring-primary/40" : ""}`}
                >
                  <span className="text-5xl sm:text-6xl">{holderAvatar || ADULT_AVATARS[0]}</span>
                </span>
                {manage && pickerFor === "holder" ? (
                  <span
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <AvatarPicker options={ADULT_AVATARS} value={holderAvatar} onPick={saveHolderAvatar} />
                  </span>
                ) : null}
                {manage ? (
                  <span
                    className="w-full space-y-1"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <input
                      defaultValue={profile.full_name}
                      aria-label={t("Nombre", "Name")}
                      placeholder={t("Tu nombre", "Your name")}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== profile.full_name) void saveProfile({ full_name: v });
                      }}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-center text-sm font-semibold text-foreground outline-none focus:border-primary"
                    />
                    <input
                      defaultValue={holderSubtitle}
                      aria-label={t("Subtítulo", "Subtitle")}
                      placeholder={t("Padre / Madre", "Parent")}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== holderSubtitle) {
                          setHolderSubtitle(v);
                          localStorage.setItem("holder_subtitle", v);
                        }
                      }}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-center text-xs text-muted-foreground outline-none focus:border-primary"
                    />
                  </span>
                ) : (
                  <span className="min-w-0 text-center">
                    <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                      {profile.full_name?.trim() || t("Padre / Madre", "Parent")}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/70">
                      {holderSubtitle.trim() || t("Padre / Madre", "Parent")}
                    </span>
                  </span>
                )}

              </button>

              {[...parents, ...kids].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (manage) return;
                    open(m);
                  }}
                  className="group relative flex flex-col items-center gap-3 outline-none"
                >
                  <span
                    role={manage ? "button" : undefined}
                    onClick={
                      manage
                        ? (e) => {
                            e.stopPropagation();
                            setPickerFor(pickerFor === m.id ? null : m.id);
                          }
                        : undefined
                    }
                    className={`relative grid aspect-square w-full place-items-center rounded-2xl bg-secondary text-5xl ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4 sm:text-6xl ${manage ? "cursor-pointer ring-2 ring-primary/40" : ""}`}
                  >
                    {m.avatar}
                  </span>
                  {manage && pickerFor === m.id ? (
                    <span
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <AvatarPicker
                        options={m.role === "parent" ? ADULT_AVATARS : KID_AVATARS}
                        value={m.avatar}
                        onPick={(a) => {
                          void saveAvatar(m, a);
                          setPickerFor(null);
                        }}
                      />
                    </span>
                  ) : null}
                  {manage && m.role === "child" ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t("Borrar perfil", "Delete profile")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(m);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingDelete(m);
                        }
                      }}
                      className="absolute -right-1.5 -top-1.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-destructive/90 text-destructive-foreground shadow-md ring-2 ring-background opacity-0 transition-all duration-200 hover:scale-105 hover:bg-destructive group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                  ) : null}
                  {manage ? (
                    <span
                      className="w-full space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <span className="flex justify-center gap-1 rounded-full bg-secondary p-0.5 text-[10px] font-semibold">
                        {(["parent", "child"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => void saveRole(m, r)}
                            className={`flex-1 rounded-full px-2 py-1 transition ${
                              m.role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {r === "parent" ? t("Adulto", "Adult") : t("Niño/a", "Child")}
                          </button>
                        ))}
                      </span>
                      <input
                        defaultValue={m.name}
                        aria-label={t("Nombre", "Name")}
                        onBlur={(e) => void saveField(m, "name", e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1 text-center text-sm font-semibold text-foreground outline-none focus:border-primary"
                      />
                      <input
                        defaultValue={m.subtitle ?? ""}
                        aria-label={t("Subtítulo", "Subtitle")}
                        placeholder={
                          m.role === "parent"
                            ? t("Padre / Madre", "Parent")
                            : `${Math.round(m.age)} ${t("años", "years")}`
                        }
                        onBlur={(e) => void saveField(m, "subtitle", e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1 text-center text-[11px] text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                      />
                    </span>
                  ) : (
                    <span className="min-w-0 text-center">
                      <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                        {m.name}
                      </span>
                      <span className="block text-[11px] text-muted-foreground/70">
                        {m.subtitle
                          ? m.subtitle
                          : m.role === "parent"
                            ? t("Padre / Madre", "Parent")
                            : m.age < 1
                              ? `${Math.round(m.age * 12)} ${t("meses", "months")}`
                              : `${Math.round(m.age)} ${t("años", "years")}`}
                      </span>
                    </span>
                  )}

                </button>
              ))}

              {plan === "family" ? (
                <>
                  {showKidSlot ? (
                    <button
                      onClick={() => setShowAddKid(true)}
                      className="group flex flex-col items-center gap-3 outline-none"
                    >
                      <span className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:border-primary group-hover:text-primary">
                        <Plus className="h-10 w-10" />
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                        {t("Añadir hijo/a", "Add a child")}
                      </span>
                    </button>
                  ) : null}

                  {showFlexSlot ? (
                    <button
                      onClick={() => setShowFlexChoice(true)}
                      className="group flex flex-col items-center gap-3 outline-none"
                    >
                      <span className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:border-primary group-hover:text-primary">
                        <UserPlus className="h-9 w-9" />
                      </span>
                      <span className="min-w-0 text-center">
                        <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                          {t("Añadir perfil", "Add a profile")}
                        </span>
                        <span className="block text-[11px] text-muted-foreground/70">
                          {t("Adulto o niño/a", "Adult or child")}
                        </span>
                      </span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => setShowUnlock(true)}
                    className="group flex flex-col items-center gap-3 outline-none"
                  >
                    <span className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:border-primary group-hover:text-primary">
                      <Lock className="h-9 w-9" />
                    </span>
                    <span className="min-w-0 text-center">
                      <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                        {t("Perfil extra", "Extra profile")}
                      </span>
                      <span className="block text-[11px] text-muted-foreground/70">
                        {t("Desbloquear", "Unlock")}
                      </span>
                    </span>
                  </button>
                </>
              ) : kids.length < maxKids ? (
                <button
                  onClick={() => setShowAddKid(true)}
                  className="group flex flex-col items-center gap-3 outline-none"
                >
                  <span className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:border-primary group-hover:text-primary">
                    <Plus className="h-10 w-10" />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                    {t("Añadir hijo/a", "Add a child")}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setShowUnlock(true)}
                  className="group flex flex-col items-center gap-3 outline-none"
                >
                  <span className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:border-primary group-hover:text-primary">
                    <Lock className="h-9 w-9" />
                  </span>
                  <span className="min-w-0 text-center">
                    <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                      {t("Perfil extra", "Extra profile")}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/70">
                      {t("Desbloquear", "Unlock")}
                    </span>

                  </span>
                </button>
              )}
            </div>

            {plan === "family" ? (
              <p className="mt-6 text-xs text-muted-foreground">
                {t(
                  `Perfiles usados: ${usedSeats} de ${FAMILY_TOTAL_SEATS} (adultos e hijos).`,
                  `Profiles used: ${usedSeats} of ${FAMILY_TOTAL_SEATS} (adults and kids).`,
                )}
              </p>
            ) : null}

            {showFlexChoice ? (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-5 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
              >
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-2xl">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {t("¿Qué perfil quieres añadir?", "Which profile do you want to add?")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      "Este perfil está incluido en tu plan Familiar.",
                      "This profile is included in your Family plan.",
                    )}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowFlexChoice(false);
                        setShowAddAdult(true);
                      }}
                      className="group flex flex-col items-center gap-2 rounded-2xl border border-border p-4 transition hover:border-primary"
                    >
                      <UserPlus className="h-7 w-7 text-muted-foreground transition group-hover:text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {t("Adulto", "Adult")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("Pareja o tutor", "Partner or guardian")}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setShowFlexChoice(false);
                        setShowAddKid(true);
                      }}
                      className="group flex flex-col items-center gap-2 rounded-2xl border border-border p-4 transition hover:border-primary"
                    >
                      <Plus className="h-7 w-7 text-muted-foreground transition group-hover:text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {t("Niño/a", "Child")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("Aprende practicando", "Learns by doing")}
                      </span>
                    </button>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button variant="ghost" onClick={() => setShowFlexChoice(false)}>
                      {t("Cancelar", "Cancel")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {showAddAdult ? (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-5 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
              >
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-2xl">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {t("Añadir otro adulto", "Add another adult")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      "Tu pareja o tutor tendrá su propio acceso al panel de padres.",
                      "Your partner or guardian gets their own access to the parent dashboard.",
                    )}
                  </p>
                  <input
                    className={`${inputClass} mt-4`}
                    value={adultName}
                    onChange={(e) => setAdultName(e.target.value)}
                    placeholder={t("Nombre", "Name")}
                    aria-label={t("Nombre", "Name")}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ADULT_AVATARS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAdultAvatar(a)}
                        className={`grid h-11 w-11 place-items-center rounded-2xl text-2xl ${
                          adultAvatar === a ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowAddAdult(false)}>
                      {t("Cancelar", "Cancel")}
                    </Button>
                    <Button onClick={() => void addAdult()} disabled={createParent.isPending || !adultName.trim()}>
                      {createParent.isPending ? t("Creando…", "Creating…") : t("Crear perfil", "Create profile")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {showAddKid ? (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-5 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
              >
                <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-6 text-left shadow-2xl">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {t("Añadir hijo/a", "Add a child")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      "Elige su nombre y su emoji. Después configuramos su mesada, bolsillos y Fondo del Futuro.",
                      "Pick their name and emoji. Next we'll set up allowance, pockets and the Future Fund.",
                    )}
                  </p>
                  <input
                    className={`${inputClass} mt-4`}
                    value={kidName}
                    onChange={(e) => setKidName(e.target.value)}
                    placeholder={t("Nombre", "Name")}
                    aria-label={t("Nombre", "Name")}
                  />
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={17}
                      className={`${inputClass} flex-1`}
                      value={kidAge}
                      onChange={(e) => setKidAge(e.target.value)}
                      placeholder={t("Edad", "Age")}
                      aria-label={t("Edad", "Age")}
                    />
                    <span className="flex flex-1 justify-center gap-1 self-center rounded-full bg-secondary p-0.5 text-[11px] font-semibold">
                      {(["boy", "girl"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setKidTheme(g);
                            setKidAvatar(KID_AVATARS[g === "boy" ? 0 : 10]!);
                          }}
                          className={`flex-1 rounded-full px-2 py-1.5 transition ${
                            kidTheme === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {g === "boy" ? t("Niño", "Boy") : t("Niña", "Girl")}
                        </button>
                      ))}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(kidTheme === "boy" ? KID_AVATARS.slice(0, 10) : KID_AVATARS.slice(10, 20)).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setKidAvatar(a)}
                        className={`grid h-11 w-11 place-items-center rounded-2xl text-2xl ${
                          kidAvatar === a ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowAddKid(false)}>
                      {t("Cancelar", "Cancel")}
                    </Button>
                    <Button onClick={addKid} disabled={!kidName.trim()}>
                      {t("Continuar", "Continue")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-14 flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setPickerFor(null);
                  setManage((v) => !v);
                }}
              >
                <Settings className="h-4 w-4" />{" "}
                {manage ? t("Listo", "Done") : t("Editar perfiles", "Edit profiles")}
              </Button>
              <Button
                variant="soft"
                onClick={async () => {
                  select(null);
                  await supabase.auth.signOut();
                  router.navigate({ to: "/" });
                }}
              >
                {t("Salir", "Sign out")}
              </Button>
            </div>


            {manage ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {t(
                  "Edita el nombre y el subtítulo directamente. La equis borra el perfil.",
                  "Edit the name and subtitle directly. The cross deletes the profile.",
                )}
              </p>
            ) : null}






            {pendingDelete ? (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-5 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
              >
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {t("¿Seguro que quieres borrarlo?", "Are you sure you want to delete it?")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      `Se borrará el perfil de ${pendingDelete.name} con sus bolsillos, tareas, deseos y Fondo del Futuro. Esta acción no se puede deshacer.`,
                      `${pendingDelete.name}'s profile will be deleted along with pockets, tasks, wishes and Future Fund. This can't be undone.`,
                    )}
                  </p>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setPendingDelete(null)}>
                      {t("Cancelar", "Cancel")}
                    </Button>
                    <button
                      onClick={() => void confirmDelete()}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? t("Borrando…", "Deleting…") : t("Sí, borrar", "Yes, delete")}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showUnlock ? (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-5 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
              >
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-2xl">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Lock className="h-6 w-6" />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
                    {t("Desbloquea un perfil extra", "Unlock an extra profile")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      `Tu plan Familiar incluye 3 perfiles en total (adultos e hijos). Añade uno más por ${extraSeatPrice}/mes, cancela cuando quieras.`,
                      `Your Family plan includes 3 profiles in total (adults and kids). Add one more for ${extraSeatPrice}/mo, cancel anytime.`,
                    )}
                  </p>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowUnlock(false)}>
                      {t("Ahora no", "Not now")}
                    </Button>
                    <button
                      onClick={() => void unlockExtraProfile()}
                      disabled={checkoutLoading}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      {checkoutLoading
                        ? t("Abriendo…", "Opening…")
                        : t(`Pagar ${extraSeatPrice}/mes`, `Pay ${extraSeatPrice}/mo`)}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

          </>
        )}
      </div>
    </div>
  );
}
