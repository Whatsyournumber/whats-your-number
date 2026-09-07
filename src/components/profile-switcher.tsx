import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useMembers, useActiveProfile } from "@/hooks/use-mfn";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/lib/mfn";

export function ProfileSwitcher({
  onClose,
  onSelected,
}: {
  onClose: () => void;
  onSelected: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const { data: members = [], isLoading } = useMembers();
  const { select } = useActiveProfile();
  const { profile } = useProfile();

  const holderAvatar =
    (typeof window !== "undefined" ? window.localStorage.getItem("holder_avatar") : null) ?? "👨‍💼";
  const holderSubtitle =
    (typeof window !== "undefined" ? window.localStorage.getItem("holder_subtitle") : null) ?? "";

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

  function openMember(member: Member) {
    select(member.id);
    onSelected();
    if (member.role === "parent") void openAdult();
    else if (!member.onboarded) router.navigate({ to: "/ninos/onboarding" });
    else router.navigate({ to: "/ninos/kid/numero" });
  }

  function openHolder() {
    select(null);
    onSelected();
    void openAdult();
  }

  const parents = members.filter((m) => m.role === "parent");
  const kids = members.filter((m) => m.role === "child");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-1 pb-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 items-center gap-1 text-sm font-semibold text-foreground"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          <span>{t("Volver", "Back")}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          My First Number
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("¿Quién está aquí?", "Who's here?")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("Elige un perfil para continuar", "Pick a profile to continue")}
        </p>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("Cargando perfiles…", "Loading profiles…")}</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={openHolder}
              className="group flex flex-col items-center gap-2 outline-none"
            >
              <span className="grid aspect-square w-full place-items-center rounded-2xl bg-secondary text-4xl ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4">
                {holderAvatar}
              </span>
              <span className="min-w-0 text-center">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {profile.full_name?.trim() || t("Padre / Madre", "Parent")}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground/70">
                  {holderSubtitle.trim() || t("Titular", "Holder")}
                </span>
              </span>
            </button>

            {parents.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openMember(m)}
                className="group flex flex-col items-center gap-2 outline-none"
              >
                <span className="grid aspect-square w-full place-items-center rounded-2xl bg-secondary text-4xl ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4">
                  {m.avatar}
                </span>
                <span className="min-w-0 text-center">
                  <span className="block truncate text-xs font-semibold text-foreground">{m.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground/70">
                    {m.subtitle || t("Adulto", "Adult")}
                  </span>
                </span>
              </button>
            ))}

            {kids.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openMember(m)}
                className="group flex flex-col items-center gap-2 outline-none"
              >
                <span className="grid aspect-square w-full place-items-center rounded-2xl bg-secondary text-4xl ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4">
                  {m.avatar}
                </span>
                <span className="min-w-0 text-center">
                  <span className="block truncate text-xs font-semibold text-foreground">{m.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground/70">
                    {t("Niño", "Kid")}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
