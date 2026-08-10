import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type LifeGoalKind = "purchase" | "boost" | "invest";

export type LifeGoal = {
  id: string;
  name: string;
  emoji: string;
  kind: LifeGoalKind;
  target_year: number;
  cost: number;
  monthly: number;
  saved: number;
  note: string | null;
  position: number;
};

type Row = {
  id: string;
  name: string;
  emoji: string | null;
  kind: string | null;
  target_year: number | null;
  cost: number | string | null;
  monthly: number | string | null;
  saved: number | string | null;
  note: string | null;
  position: number | null;
};

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v));

function toGoal(r: Row): LifeGoal {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji ?? "🎯",
    kind: (r.kind as LifeGoalKind) ?? "purchase",
    target_year: r.target_year ?? new Date().getFullYear() + 2,
    cost: num(r.cost),
    monthly: num(r.monthly),
    saved: num(r.saved),
    note: r.note,
    position: r.position ?? 0,
  };
}

/** Metas de vida del usuario (Life Planner) con CRUD en vivo. */
export function useLifeGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const key = ["life-goals", userId];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_goals")
        .select("*")
        .eq("user_id", userId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown as Row[]).map(toGoal);
    },
  });

  const create = useMutation({
    mutationFn: async (goal: Partial<LifeGoal>) => {
      if (!userId) throw new Error("Sin sesión");
      const { error } = await supabase.from("life_goals").insert({
        user_id: userId,
        name: goal.name ?? "Nueva meta",
        emoji: goal.emoji ?? "🎯",
        kind: goal.kind ?? "purchase",
        target_year: goal.target_year ?? new Date().getFullYear() + 2,
        cost: goal.cost ?? 0,
        monthly: goal.monthly ?? 0,
        saved: goal.saved ?? 0,
        note: goal.note ?? null,
        position: goal.position ?? (query.data?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Meta creada");
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LifeGoal> }) => {
      const { error } = await supabase.from("life_goals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Cambios guardados");
    },
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        position: index,
      }));
      const { error } = await supabase.from("life_goals").upsert(updates, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("life_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Meta eliminada");
    },
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    busy: create.isPending || update.isPending || remove.isPending,
  };
}
