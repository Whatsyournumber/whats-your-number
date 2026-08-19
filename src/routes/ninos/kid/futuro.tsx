import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KidPage } from "@/components/kid-page";
import { FamilyPlanner } from "@/components/family-planner";
import { useFund, useMovements, useSaveFund } from "@/hooks/use-mfn";

import { goalLabel, pocketTotals, type Member } from "@/lib/mfn";
import { useI18n } from "@/lib/mfn-i18n";

export const Route = createFileRoute("/ninos/kid/futuro")({
  head: () => ({
    meta: [
      { title: "Planificador familiar | My First Number" },
      {
        name: "description",
        content:
          "Tu Fondo del Futuro: mira cómo el interés compuesto convierte pequeños aportes en tu primer patrimonio.",
      },
      { property: "og:title", content: "Planificador familiar | My First Number" },
      {
        property: "og:description",
        content: "Simulador de largo plazo con portfolio infantil y aprendizaje financiero.",
      },
    ],
  }),
  component: () => <KidPage area="parent">{(member) => <MyFuture member={member} />}</KidPage>,
});

function MyFuture({ member }: { member: Member }) {
  const { lang } = useI18n();
  const { data: fund } = useFund(member.id);
  const { data: movements = [] } = useMovements(member.id);
  const saveFund = useSaveFund();

  const totals = pocketTotals(movements);
  // Empieza con todo lo que el niño tiene hoy (bolsillos + fondo) y crece con el interés
  const base =
    Math.max(totals.crecer + totals.ahorrar + totals.gastar, Number(fund?.current_balance ?? 0));

  const monthly = Number(fund?.monthly_contribution ?? 0);
  const targetAge = Number(fund?.target_age ?? 18);
  const rate = Number(fund?.expected_return ?? 10);

  // Lo que el padre ajusta aquí queda guardado y alimenta el resto (universidades, etc.).
  const handlePlanChange = useCallback(
    (plan: { base: number; monthly: number; targetAge: number; rate: number }) => {
      if (
        plan.base === Math.round(base) &&
        plan.monthly === Math.round(monthly) &&
        plan.targetAge === targetAge &&
        plan.rate === rate
      )
        return;
      saveFund.mutate({
        memberId: member.id,
        patch: {
          current_balance: plan.base,
          monthly_contribution: plan.monthly,
          target_age: plan.targetAge,
          expected_return: plan.rate,
        },
      });
    },
    [base, monthly, targetAge, rate, member.id, saveFund],
  );

  return (
    <FamilyPlanner
      childName={member.name}
      childAge={member.age}
      currency={member.currency}
      goal={fund?.goal ? goalLabel(fund.goal, lang) : undefined}
      defaultBase={base}
      defaultMonthly={monthly}
      defaultTargetAge={targetAge}
      defaultRate={rate}
      onPlanChange={handlePlanChange}
    />
  );
}

