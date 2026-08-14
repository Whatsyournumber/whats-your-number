import { createFileRoute } from "@tanstack/react-router";
import { KidPage } from "@/components/kid-page";
import { FamilyPlanner } from "@/components/family-planner";
import { useFund, useMovements } from "@/hooks/use-mfn";
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
  component: () => <KidPage>{(member) => <MyFuture member={member} />}</KidPage>,
});

function MyFuture({ member }: { member: Member }) {
  const { lang } = useI18n();
  const { data: fund } = useFund(member.id);
  const { data: movements = [] } = useMovements(member.id);

  const totals = pocketTotals(movements);
  const base = Number(fund?.current_balance ?? 0) + totals.crecer;
  const monthly = Number(fund?.monthly_contribution ?? 0);
  const targetAge = Number(fund?.target_age ?? 18);
  const rate = Number(fund?.expected_return ?? 7);

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
    />
  );
}
