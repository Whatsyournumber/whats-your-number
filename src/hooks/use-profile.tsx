import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { emptyLife, emptyOnboarding, type LifeData, type OnboardingData } from "@/lib/onboarding";

export type Profile = OnboardingData & LifeData & { completed: boolean };

const empty: Profile = { ...emptyOnboarding, ...emptyLife, completed: false };

function rowToProfile(row: Record<string, unknown> | null): Profile {
  const next: Profile = { ...empty, currency: "EUR" };
  if (!row) return next;
  for (const key of Object.keys(emptyOnboarding) as (keyof OnboardingData)[]) {
    const v = row[key];
    if (v === null || v === undefined) continue;
    (next as Record<string, unknown>)[key] = typeof v === "string" ? v : Number(v);
  }
  for (const key of Object.keys(emptyLife) as (keyof LifeData)[]) {
    const v = row[key];
    if (typeof v === "string") next[key] = v;
  }
  next.completed = Boolean(row["completed"]);
  return next;
}

/** Perfil financiero del usuario (respuestas del onboarding) con edición en vivo. */
export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["onboarding-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return rowToProfile(data as Record<string, unknown> | null);
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      if (!userId) throw new Error("Sin sesión");
      const { data: existing } = await supabase
        .from("onboarding_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      const { error } = existing
        ? await supabase.from("onboarding_profiles").update(patch).eq("id", existing.id)
        : await supabase.from("onboarding_profiles").insert({ user_id: userId, ...patch });
      if (error) throw error;
      return patch;
    },
    onSuccess: (patch) => {
      qc.setQueryData(["onboarding-profile", userId], (prev: Profile | undefined) => ({
        ...(prev ?? empty),
        ...patch,
      }));
      // Recalcula todas las pestañas con los datos nuevos
      void qc.invalidateQueries();
    },
  });

  return {
    profile: query.data ?? empty,
    isLoading: query.isLoading,
    save: mutation.mutateAsync,
    saving: mutation.isPending,
  };
}
