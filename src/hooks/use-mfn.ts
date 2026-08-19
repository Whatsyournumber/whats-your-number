import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
import { useSubscription as useWynSubscription } from "@/hooks/use-subscription";

/** Suscripción de WhatsYourNumber adaptada a la forma { data } que usa la zona infantil. */
export function useSubscription() {
  const { subscription, loading } = useWynSubscription();
  return { data: subscription ?? null, isLoading: loading };
}

async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sesión no disponible");
  return data.user.id;
}

export function useMembers() {
  return useQuery({
    queryKey: ["kid_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kid_members")
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
    queryKey: ["kid_fund", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kid_future_funds")
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
    queryKey: ["kid_tasks", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kid_tasks")
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
    queryKey: ["kid_wishes", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kid_wishes")
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
    queryKey: ["kid_movements", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kid_movements")
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
    queryKey: ["kid_holdings", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kid_holdings")
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
      const { error } = await supabase.from("kid_members").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kid_members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kid_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kid_members"] }),
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, avatar }: { name: string; avatar: string }) => {
      const user_id = await requireUser();
      const { data, error } = await supabase
        .from("kid_members")
        .insert({ user_id, name, avatar, role: "parent", theme: "parent", onboarded: true })
        .select("*")
        .single();
      if (error) throw error;
      return data as Member;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kid_members"] }),
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
        .from("kid_future_funds")
        .select("id")
        .eq("member_id", memberId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("kid_future_funds").update(patch).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kid_future_funds")
          .insert({ ...patch, user_id, member_id: memberId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_fund", vars.memberId] }),
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
      const { error } = await supabase.from("kid_tasks").insert({
        user_id,
        member_id: task.memberId,
        title: task.title,
        emoji: task.emoji,
        reward: task.reward,
        frequency: task.frequency,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_tasks", vars.memberId] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; memberId: string }) => {
      const { error } = await supabase.from("kid_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_tasks", vars.memberId] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from("kid_tasks")
        .update({ status: "completada", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_tasks", vars.memberId] }),
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
        const { error } = await supabase.from("kid_movements").insert(rows);
        if (error) throw error;
      }

      // El ahorro empuja el primer deseo activo.
      if (parts.ahorrar > 0) {
        const { data: wish } = await supabase
          .from("kid_wishes")
          .select("*")
          .eq("member_id", member.id)
          .eq("achieved", false)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (wish) {
          const saved = Number(wish.saved) + parts.ahorrar;
          await supabase
            .from("kid_wishes")
            .update({ saved, achieved: saved >= Number(wish.price) })
            .eq("id", wish.id);
        }
      }

      // El bolsillo de crecer alimenta el portfolio.
      if (parts.crecer > 0) {
        const { data: holding } = await supabase
          .from("kid_holdings")
          .select("*")
          .eq("member_id", member.id)
          .order("value", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (holding) {
          await supabase
            .from("kid_holdings")
            .update({ value: Number(holding.value) + parts.crecer })
            .eq("id", holding.id);
        } else {
          await supabase.from("kid_holdings").insert({
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
      qc.invalidateQueries({ queryKey: ["kid_movements", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["kid_wishes", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["kid_holdings", vars.member.id] });
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
        .from("kid_tasks")
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
      qc.invalidateQueries({ queryKey: ["kid_tasks", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["kid_members"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; memberId: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("kid_tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_tasks", vars.memberId] }),
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
        .from("kid_tasks")
        .update({ status: "aprobada", completed_at: now, approved_at: now })
        .eq("id", task.id);
      if (error) throw error;

      let wish: Wish | null = null;
      if (amount > 0) {
        const base = supabase.from("kid_wishes").select("*").eq("member_id", member.id);
        const { data } = wishId
          ? await base.eq("id", wishId).maybeSingle()
          : await base
              .eq("achieved", false)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
        wish = (data as Wish | null) ?? null;

        await supabase.from("kid_movements").insert({
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
            .from("kid_wishes")
            .update({ saved, achieved: saved >= Number(wish.price) })
            .eq("id", wish.id);
        }
      }

      await supabase
        .from("kid_members")
        .update({ xp: member.xp + 10, streak: member.streak + 1 })
        .eq("id", member.id);

      return { amount, wish };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["kid_tasks", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["kid_wishes", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["kid_movements", vars.member.id] });
      qc.invalidateQueries({ queryKey: ["kid_members"] });
    },
  });
}



export function useCreateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wish: {
      memberId: string;
      title: string;
      emoji: string;
      price: number;
      targetDate?: string | null;
    }) => {
      const user_id = await requireUser();
      const { error } = await supabase.from("kid_wishes").insert({
        user_id,
        member_id: wish.memberId,
        title: wish.title,
        emoji: wish.emoji,
        price: wish.price,
        target_date: wish.targetDate || null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_wishes", vars.memberId] }),
  });
}

export function useUpdateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; memberId: string; patch: Partial<Wish> }) => {
      const { error } = await supabase.from("kid_wishes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_wishes", vars.memberId] }),
  });
}

export function useUpdateHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; memberId: string; patch: Partial<Holding> }) => {
      const { error } = await supabase.from("kid_holdings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_holdings", vars.memberId] }),
  });
}

export function useDeleteWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; memberId: string }) => {
      const { error } = await supabase.from("kid_wishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_wishes", vars.memberId] }),
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
      const { error } = await supabase.from("kid_movements").insert({
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
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["kid_movements", vars.memberId] }),
  });
}
