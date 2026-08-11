import type { ReactNode } from "react";

import { PageHeader, PageShell } from "@/components/page";

/** Shared shell for the legal pages (terms, refunds, privacy). */
export function LegalPage({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="surface max-w-3xl space-y-8 p-6 sm:p-8">{children}</div>
    </PageShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
