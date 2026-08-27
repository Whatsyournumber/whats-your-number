import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Link2 } from "lucide-react";

import { Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { backlinkStats, backlinkTargets, type BacklinkTarget } from "@/lib/backlink-targets";

type Filter = "todos" | "es" | "en" | "dofollow" | "auto";

const STATUSES = ["pendiente", "enviado", "publicado"] as const;

/** 25 destinos de backlinks de finanzas (ES/EN) con seguimiento del estado. */
export function BacklinkPanel() {
  const [filter, setFilter] = useState<Filter>("todos");
  const queryClient = useQueryClient();

  const submissions = useQuery({
    queryKey: ["backlink-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backlink_submissions")
        .select("target_id, status, link_url");
      if (error) throw error;
      return data ?? [];
    },
  });

  const byTarget = useMemo(() => {
    const map = new Map<string, { status: string; link_url: string | null }>();
    for (const row of submissions.data ?? []) {
      map.set(row.target_id as string, {
        status: (row.status as string) ?? "pendiente",
        link_url: (row.link_url as string) ?? null,
      });
    }
    return map;
  }, [submissions.data]);

  const save = useMutation({
    mutationFn: async ({ targetId, status }: { targetId: string; status: string }) => {
      const { error } = await supabase
        .from("backlink_submissions")
        .upsert(
          { target_id: targetId, status, updated_at: new Date().toISOString() },
          { onConflict: "target_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backlink-submissions"] }),
  });

  const rows = backlinkTargets.filter((target) => {
    if (filter === "es") return target.lang !== "en";
    if (filter === "en") return target.lang !== "es";
    if (filter === "dofollow") return target.dofollow;
    if (filter === "auto") return target.auto;
    return true;
  });

  const nextStatus = (current: string) =>
    STATUSES[(STATUSES.indexOf(current as (typeof STATUSES)[number]) + 1) % STATUSES.length];

  const done = backlinkTargets.filter(
    (target) => byTarget.get(target.id)?.status === "publicado",
  ).length;

  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: `Todos (${backlinkStats.total})` },
    { id: "dofollow", label: `Dofollow (${backlinkStats.dofollow})` },
    { id: "es", label: `Español (${backlinkStats.es})` },
    { id: "en", label: `Inglés (${backlinkStats.en})` },
    { id: "auto", label: "Automatizables" },
  ];

  return (
    <Panel className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link2 className="h-5 w-5 text-primary" />
        <div className="mr-auto">
          <h3 className="font-semibold">Backlinks de finanzas · 25 sitios (ES + EN)</h3>
          <p className="text-sm text-muted-foreground">
            DA media {backlinkStats.avgDa} · spam bajo · {done}/{backlinkStats.total} publicados.
            Enlaces editoriales reales, sin granjas de enlaces.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sitio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>DA</TableHead>
            <TableHead>Enlace</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead>Cómo conseguirlo</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((target: BacklinkTarget) => {
            const status = byTarget.get(target.id)?.status ?? "pendiente";
            return (
              <TableRow key={target.id}>
                <TableCell>
                  <a
                    href={target.submitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {target.name}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{target.type}</TableCell>
                <TableCell className="font-mono text-sm">{target.da}</TableCell>
                <TableCell>
                  <Badge variant={target.dofollow ? "default" : "outline"}>
                    {target.dofollow ? "dofollow" : "nofollow"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {target.lang === "both" ? "ES/EN" : target.lang.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[26rem] text-sm text-muted-foreground">
                  {target.how}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={status === "publicado" ? "default" : "outline"}
                    disabled={save.isPending}
                    onClick={() => save.mutate({ targetId: target.id, status: nextStatus(status) })}
                  >
                    {status}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}
