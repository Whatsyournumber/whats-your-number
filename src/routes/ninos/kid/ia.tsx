import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";

import { Buddy, Card, Tile } from "@/components/mfn-ui";
import { KidPage, PageTitle } from "@/components/kid-page";
import { getBuddyTip } from "@/lib/kid-buddy.functions";
import { useAuth } from "@/hooks/use-auth";
import { useFund, useMovements, useTasks, useWishes } from "@/hooks/use-mfn";
import { useI18n } from "@/lib/mfn-i18n";
import {
  money,
  monthlySavingPace,
  pocketLabel,
  pocketTotals,
  POCKETS,
  projectFund,
  type Member,
} from "@/lib/mfn";

export const Route = createFileRoute("/ninos/kid/ia")({
  head: () => ({
    meta: [
      { title: "Asistente IA | My First Number" },
      {
        name: "description",
        content: "El asistente analiza los números del niño: ahorro, bolsillos, sueños y proyección del futuro.",
      },
      { property: "og:title", content: "Asistente IA | My First Number" },
      { property: "og:description", content: "Análisis con IA de los números del perfil infantil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <KidPage area="parent">{(member) => <KidAi member={member} />}</KidPage>,
});

function KidAi({ member }: { member: Member }) {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const { data: movements = [] } = useMovements(member.id);
  const { data: fund } = useFund(member.id);
  const { data: wishes = [] } = useWishes(member.id);
  const { data: tasks = [] } = useTasks(member.id);
  const [seed, setSeed] = useState(0);

  const totals = pocketTotals(movements);
  const today = totals.gastar + totals.ahorrar + totals.crecer;
  const targetAge = Number(fund?.target_age ?? 18);
  const monthly = Number(fund?.monthly_contribution ?? 0);
  const rate = Number(fund?.expected_return ?? 10);
  const base = Math.max(today, Number(fund?.current_balance ?? 0));
  const projection = projectFund(base, monthly, member.age, targetAge, rate);
  const pace = monthlySavingPace(movements);

  const nextDream = useMemo(() => {
    const open = wishes
      .filter((w) => Number(w.price) > 0)
      .sort((a, b) => Number(a.price) - Number(a.saved) - (Number(b.price) - Number(b.saved)));
    return open[0] ?? null;
  }, [wishes]);

  const buddyTipFn = useServerFn(getBuddyTip);
  const { data: tip, isFetching } = useQuery({
    queryKey: ["kid-ai", member.id, lang, seed, Math.round(today), Math.round(projection.future)],
    enabled: !!session,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    throwOnError: false,
    retry: false,
    queryFn: () =>
      buddyTipFn({
        data: {
          name: member.name,
          age: member.age,
          currency: member.currency,
          lang,
          today,
          future: projection.future,
          targetAge,
          monthly,
          pace,
          pockets: POCKETS.map((p) => ({ label: pocketLabel(p.key, lang), amount: totals[p.key] })),
          dream: nextDream
            ? { title: nextDream.title, saved: Number(nextDream.saved), price: Number(nextDream.price) }
            : null,
        },
      }).catch(() => null),
  });

  const doneTasks = tasks.filter((task) => task.status === "done" || !!task.approved_at).length;
  const dreamMissing = nextDream ? Math.max(0, Number(nextDream.price) - Number(nextDream.saved)) : 0;
  const dreamMonths = dreamMissing > 0 && pace > 0 ? Math.ceil(dreamMissing / pace) : 0;

  const analysis = [
    {
      emoji: "💰",
      title: t("Tu ritmo de ahorro", "Your saving pace"),
      text:
        pace > 0
          ? t(
              `Estás ahorrando ${money(pace, member.currency)} al mes. Si sigues así, en un año tendrás ${money(today + pace * 12, member.currency)}.`,
              `You're saving ${money(pace, member.currency)} a month. Keep it up and in a year you'll have ${money(today + pace * 12, member.currency)}.`,
            )
          : t(
              "Aún no hay movimientos suficientes para medir tu ritmo. Registra tu mesada y empieza.",
              "Not enough movements yet to measure your pace. Add your allowance and get started.",
            ),
    },
    {
      emoji: "🎯",
      title: t("Tu próximo sueño", "Your next dream"),
      text: nextDream
        ? dreamMonths > 0
          ? t(
              `Para "${nextDream.title}" te faltan ${money(dreamMissing, member.currency)}: unos ${dreamMonths} meses a tu ritmo. Ahorrando 50% más llegarías en ${Math.max(1, Math.ceil(dreamMonths / 1.5))}.`,
              `For "${nextDream.title}" you need ${money(dreamMissing, member.currency)} more: about ${dreamMonths} months at your pace. Saving 50% more you'd get there in ${Math.max(1, Math.ceil(dreamMonths / 1.5))}.`,
            )
          : t(`¡"${nextDream.title}" ya está cubierto!`, `"${nextDream.title}" is already covered!`)
        : t("Todavía no hay sueños creados. Añade uno para tener una meta.", "No dreams yet. Add one to set a goal."),
    },
    {
      emoji: "🌱",
      title: t("Tu número del futuro", "Your future number"),
      text: t(
        `A los ${targetAge} años podrías tener ${money(projection.future, member.currency)} con un ${rate}% anual.`,
        `By age ${targetAge} you could have ${money(projection.future, member.currency)} with a ${rate}% yearly return.`,
      ),
    },
    {
      emoji: "✅",
      title: t("Tus tareas", "Your tasks"),
      text: t(
        `Has completado ${doneTasks} de ${tasks.length} tareas. Cada tarea suma a tu número.`,
        `You've completed ${doneTasks} of ${tasks.length} tasks. Every task adds to your number.`,
      ),
    },
  ];

  return (
    <>
      <Link
        to="/ninos"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("Volver a perfiles", "Back to profiles")}
      </Link>
      <PageTitle
        emoji="🤖"
        title={t("Asistente IA", "AI Assistant")}
        subtitle={t(
          `Analiza los números de ${member.name} y explica cómo mejorarlos.`,
          `Analyzes ${member.name}'s numbers and explains how to improve them.`,
        )}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile emoji="🪙" label={t("Hoy", "Today")} value={today} currency={member.currency} />
        <Tile emoji="📈" label={t("Ritmo/mes", "Pace/mo")} value={pace} currency={member.currency} />
        <Tile emoji="🚀" label={t("Futuro", "Future")} value={projection.future} currency={member.currency} />
        <Tile
          emoji="🎁"
          label={t("Falta sueño", "Dream left")}
          value={dreamMissing}
          currency={member.currency}
        />
      </div>

      <Card
        title={t("Análisis con IA", "AI analysis")}
        hint={t("Con los datos reales del perfil", "Using the profile's real data")}
        action={
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {t("Otra idea", "New idea")}
          </button>
        }
      >
        {isFetching && !tip ? (
          <Buddy compact>{t("Pensando en tus números…", "Thinking about your numbers…")}</Buddy>
        ) : tip ? (
          <Buddy>
            <span className="block font-bold">{tip.headline}</span>
            <span className="mt-1 block">{tip.insight}</span>
            <span className="mt-1 block text-primary">{tip.tip}</span>
          </Buddy>
        ) : (
          <Buddy compact>
            {t(
              "Registra algún movimiento para que pueda analizar tus números.",
              "Add some movements so I can analyze your numbers.",
            )}
          </Buddy>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {analysis.map((item) => (
            <div key={item.title} className="rounded-3xl border border-border/60 bg-card/70 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="text-lg leading-none">{item.emoji}</span>
                {item.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
