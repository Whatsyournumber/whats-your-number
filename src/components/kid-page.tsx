import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { KidShell } from "@/components/kid-shell";
import { useI18n } from "@/lib/mfn-i18n";
import { useActiveMember } from "@/hooks/use-mfn";
import type { Member } from "@/lib/mfn";

/** Envuelve una pantalla infantil: exige perfil activo de tipo niño. */
export function KidPage({ children }: { children: (member: Member) => ReactNode }) {
  const { t } = useI18n();
  const { member, isLoading, ready } = useActiveMember();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isLoading && (!member || member.role !== "child")) {
      router.navigate({ to: "/" });
    }
  }, [ready, isLoading, member, router]);

  if (!member || member.role !== "child") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">{t("Cargando tu mundo…", "Loading your world…")}</p>
      </div>
    );
  }

  return <KidShell member={member}>{children(member)}</KidShell>;
}

export function PageTitle({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        <span className="mr-2">{emoji}</span>
        {title}
      </h1>
      {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
