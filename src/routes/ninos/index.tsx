import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Lock, Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/mfn-ui";
import { useActiveProfile, useMembers, useSubscription } from "@/hooks/use-mfn";
import { THEME_ATTR, type Member } from "@/lib/mfn";
import { activePlan, kidLimit, planLabel } from "@/lib/mfn-plan";
import { useI18n, LangToggle } from "@/lib/mfn-i18n";

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
  const [manage, setManage] = useState(false);

  const plan = activePlan(subscription);
  const maxKids = kidLimit(subscription);


  useEffect(() => {
    document.documentElement.removeAttribute(THEME_ATTR);
  }, []);

  const parents = members.filter((m) => m.role === "parent");
  const kids = members.filter((m) => m.role === "child");

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
    if (member.role === "parent") router.navigate({ to: "/ninos/padres" });
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
                onClick={() => void openAdult()}
                className="group flex flex-col items-center gap-3 outline-none"
              >
                <span className="grid aspect-square w-full place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4">
                  <LineChart className="h-10 w-10 sm:h-12 sm:w-12" />
                </span>
                <span className="min-w-0 text-center">
                  <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                    {t("Mis finanzas", "My finances")}
                  </span>
                </span>
              </button>

              {[...parents, ...kids].map((m) => (
                <button
                  key={m.id}
                  onClick={() => open(m)}
                  className="group flex flex-col items-center gap-3 outline-none"
                >
                  <span className="grid aspect-square w-full place-items-center rounded-2xl bg-secondary text-5xl ring-0 ring-primary/60 transition-all duration-200 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4 sm:text-6xl">
                    {m.avatar}
                  </span>
                  <span className="min-w-0 text-center">
                    <span className="block truncate text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                      {m.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/70">
                      {m.role === "parent"
                        ? t("Padre / Madre", "Parent")
                        : m.age < 1
                          ? `${Math.round(m.age * 12)} ${t("meses", "months")}`
                          : `${Math.round(m.age)} ${t("años", "years")}`}
                    </span>
                  </span>
                </button>
              ))}

              {kids.length < maxKids ? (
                <button
                  onClick={() => router.navigate({ to: "/ninos/onboarding" })}
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
                <div className="flex flex-col items-center gap-3">
                  <span className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                    <Lock className="h-8 w-8" />
                  </span>
                  <span className="text-center text-[11px] text-muted-foreground">
                    {t(
                      `Tu plan incluye ${maxKids} ${maxKids === 1 ? "perfil" : "perfiles"} de niño`,
                      `Your plan includes ${maxKids} child ${maxKids === 1 ? "profile" : "profiles"}`,
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => setManage((v) => !v)}>
                <Settings className="h-4 w-4" /> {t("Gestionar perfiles", "Manage profiles")}
              </Button>
              <Button
                variant="soft"
                onClick={async () => {
                  select(null);
                  await supabase.auth.signOut();
                  router.navigate({ to: "/auth", search: { mode: "login" } });
                }}
              >
                {t("Salir", "Sign out")}
              </Button>
            </div>


            {manage ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {t(
                  "Entra como padre/madre para editar mesada, tareas y el Fondo del Futuro de cada hijo.",
                  "Sign in as a parent to edit allowance, tasks and each child's Future Fund.",
                )}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
