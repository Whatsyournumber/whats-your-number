import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { setPlan } from "@/lib/mfn-plan";

import {
  ACTIVE_PROFILE_KEY,
  type Holding,
  type Member,
  type Movement,
  type Task,
  type Wish,
  type FutureFund,
  splitAmount,
} from "@/lib/mfn";
import type { Subscription } from "@/lib/mfn-plan";

async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sesión no disponible");
  return data.user.id;
}

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });
}

export function useActiveProfile() {
  const [id, setId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setId(localStorage.getItem(ACTIVE_PROFILE_KEY));
    setReady(true);
  }, []);

  const select = useCallback((next: string | null) => {
    if (next) localStorage.setItem(ACTIVE_PROFILE_KEY, next);
    else localStorage.removeItem(ACTIVE_PROFILE_KEY);
    setId(next);
  }, []);

  return { id, ready, select };
}

/** Perfil activo resuelto con sus datos. */
export function useActiveMember() {
  const { id, ready, select } = useActiveProfile();
  const { data: members = [], isLoading } = useMembers();
  const member = members.find((m) => m.id === id) ?? null;
  return { member, members, ready, isLoading, select };
}

export function useFund(memberId?: string | null) {
  return useQuery({
    queryKey: ["fund", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("future_funds")
        .select("*")
        .eq("member_id", memberId!)
        .maybeSingle();
      if (error) throw error;
      return (data as FutureFund | null) ?? null;
    },
  });
}

export function useTasks(memberId?: string | null) {
  return useQuery({
    queryKey: ["tasks", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("member_id", memberId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useWishes(memberId?: string | null) {
  return useQuery({
    queryKey: ["wishes", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select("*")
        .eq("member_id", memberId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Wish[];
    },
  });
}

export function useMovements(memberId?: string | null) {
  return useQuery({
    queryKey: ["movements", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movements")
        .select("*")
        .eq("member_id", memberId!)
        .order("occurred_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return (data ?? []) as Movement[];
    },
  });
}

export function useHoldings(memberId?: string | null) {
  return useQuery({
    queryKey: ["holdings", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .eq("member_id", memberId!)
        .order("value", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Holding[];
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Member> }) => {
      const { error } = await supabase.from("members").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

/** Suscripción compartida con WhatsYourNumber (solo lectura desde la app). */
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Subscription | null;
    },
  });
}

export function useSetPlan() {
  const qc = useQueryClient();
  const mutate = useServerFn(setPlan);
  return useMutation({
    mutationFn: (plan: "free" | "family" | "wealth") => mutate({ data: { plan } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}



export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, avatar }: { name: string; avatar: string }) => {
      const user_id = await requireUser();
      const { data, error } = await supabase
        .from("members")
        .insert({ user_id, name, avatar, role: "parent", theme: "parent", onboarded: true })
        .select("*")
        .single();
      if (error) throw error;
      return data as Member;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useSaveFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      patch,
    }: {
      memberId: string;
      patch: Partial<FutureFund>;
    }) => {
      const user_id = await requireUser();
      const { data: existing } = await supabase
        .from("future_funds")
        .select("id")
        .eq("member_id", memberId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("future_funds").update(patch).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("future_funds")
          .insert({ ...patch, user_id, member_id: memberId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["fund", vars.memberId] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      memberId: string;
      title: string;
      emoji: string;
      reward: number;
      frequency: string;
    }) => {
      const user_id = await requireUser();
      const { error } = await supabase.from("tasks").insert({
        user_id,
        member_id: task.memberId,
        title: task.title,
        emoji: task.emoji,
        reward: task.reward,
        frequency: task.frequency,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.memberId] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; memberId: string }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.memberId] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completada", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.memberId] }),
  });
}

/** Reparte dinero recibido entre los tres bolsillos según la regla del perfil. */
export function useAddIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      member,
      label,
      source,
      amount,
    }: {
      member: Member;
      label: string;
      source: string;
      amount: number;
    }) => {
      const user_id = await requireUser();
      const parts = splitAmount(amount, member);
      const occurred_at = new Date().toISOString().slice(0, 10);
      const rows = (["gastar", "ahorrar", "crecer"] as const)
        .filter((pocket) => parts[pocket] > 0)
        .map((pocket) => ({
          user_id,
          member_id: member.id,
          label,
          source,
          amount: parts[pocket],
          pocket,
          occurred_at,
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from("movements").insert(rows);
        if (error) throw error;
      }

      // El ahorro empuja el primer deseo activo.
      if (parts.ahorrar > 0) {
        const { data: wish } = await supabase
          .from("wishes")
          .select("*")
          .eq("member_id", member.id)
          .eq("achieved", false)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (wish) {
          const saved = Number(wish.saved) + parts.ahorrar;
          await supabase
            .from("wishes")
            .update({ saved, achieved: saved >= Number(wish.price) })
            .eq("id", wish.id);
        }
      }

      // El bolsillo de crecer alimenta el portfolio.
      if (parts.crecer > 0) {
        const { data: holding } = await supabase
          .from("holdings")
          .select("*")
          .eq("member_id", member.id)
          .order("value", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (holding) {
          await supabase
            .from("holdings")
            .update({ value: Number(holding.value) + parts.crecer })
            .eq("id", holding.id);
        } else {
          await supabase.from("holdings").insert({
            user_id,
            member_id: member.id,
            name: "S&P 500",
            emoji: "📈",
            value: parts.crecer,
            growth: 7.4,
          });
        }
      }
      return parts;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["movements", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["wishes", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["holdings", vars.member.id] });
    },
  });
}

export function useApproveTask() {
  const qc = useQueryClient();
  const addIncome = useAddIncome();
  const update = useUpdateMember();
  return useMutation({
    mutationFn: async ({ task, member }: { task: Task; member: Member }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "aprobada", approved_at: new Date().toISOString() })
        .eq("id", task.id);
      if (error) throw error;
      await addIncome.mutateAsync({
        member,
        label: task.title,
        source: "Tareas",
        amount: Number(task.reward),
      });
      await update.mutateAsync({
        id: member.id,
        patch: { xp: member.xp + 10, streak: member.streak + 1 },
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; memberId: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.memberId] }),
  });
}

/** Completa una tarea y suma el incentivo completo al sueño elegido (o al primero activo). */
export function useCompleteTaskForWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      task,
      member,
      wishId,
    }: {
      task: Task;
      member: Member;
      wishId?: string;
    }) => {
      const user_id = await requireUser();
      const amount = Number(task.reward) || 0;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("tasks")
        .update({ status: "aprobada", completed_at: now, approved_at: now })
        .eq("id", task.id);
      if (error) throw error;

      let wish: Wish | null = null;
      if (amount > 0) {
        const base = supabase.from("wishes").select("*").eq("member_id", member.id);
        const { data } = wishId
          ? await base.eq("id", wishId).maybeSingle()
          : await base
              .eq("achieved", false)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
        wish = (data as Wish | null) ?? null;

        await supabase.from("movements").insert({
          user_id,
          member_id: member.id,
          label: task.title,
          source: "Tareas",
          amount,
          pocket: "ahorrar",
          occurred_at: now.slice(0, 10),
        });

        if (wish) {
          const saved = Number(wish.saved) + amount;
          await supabase
            .from("wishes")
            .update({ saved, achieved: saved >= Number(wish.price) })
            .eq("id", wish.id);
        }
      }

      await supabase
        .from("members")
        .update({ xp: member.xp + 10, streak: member.streak + 1 })
        .eq("id", member.id);

      return { amount, wish };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["wishes", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["movements", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}



export function useCreateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wish: { memberId: string; title: string; emoji: string; price: number }) => {
      const user_id = await requireUser();
      const { error } = await supabase.from("wishes").insert({
        user_id,
        member_id: wish.memberId,
        title: wish.title,
        emoji: wish.emoji,
        price: wish.price,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["wishes", vars.memberId] }),
  });
}

export function useUpdateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; memberId: string; patch: Partial<Wish> }) => {
      const { error } = await supabase.from("wishes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["wishes", vars.memberId] }),
  });
}

export function useUpdateHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; memberId: string; patch: Partial<Holding> }) => {
      const { error } = await supabase.from("holdings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["holdings", vars.memberId] }),
  });
}

export function useDeleteWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; memberId: string }) => {
      const { error } = await supabase.from("wishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["wishes", vars.memberId] }),
  });
}


/** Registra un gasto (importe negativo en el bolsillo de gastar). */
export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      label,
      category,
      amount,
    }: {
      memberId: string;
      label: string;
      category: string;
      amount: number;
    }) => {
      const user_id = await requireUser();
      const { error } = await supabase.from("movements").insert({
        user_id,
        member_id: memberId,
        label,
        source: category,
        amount: -Math.abs(amount),
        pocket: "gastar",
        occurred_at: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["movements", vars.memberId] }),
  });
}
