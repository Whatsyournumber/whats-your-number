import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Link2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { backlinkStats, prioritizedTargets, type BacklinkTarget } from "@/lib/backlink-targets";
import { runBacklinkVerification } from "@/lib/backlinks.functions";

type Filter = "todos" | "es" | "en" | "dofollow" | "auto";

const STATUSES = ["pendiente", "enviado", "publicado"] as const;

type Row = {
  status: string;
  link_url: string | null;
  verified: boolean;
  dofollow_ok: boolean;
  last_checked_at: string | null;
  check_error: string | null;
};

/** 25 destinos de backlinks de finanzas (ES/EN), priorizados y verificados. */
export function BacklinkPanel() {
  const [filter, setFilter] = useState<Filter>("todos");
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const submissions = useQuery({
    queryKey: ["backlink-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backlink_submissions")
        .select("target_id, status, link_url, verified, dofollow_ok, last_checked_at, check_error");
      if (error) throw error;
      return data ?? [];
    },
  });

  const byTarget = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of (submissions.data ?? []) as Record<string, unknown>[]) {
      map.set(String(row["target_id"]), {
        status: (row["status"] as string) ?? "pendiente",
        link_url: (row["link_url"] as string) ?? null,
        verified: Boolean(row["verified"]),
        dofollow_ok: Boolean(row["dofollow_ok"]),
        last_checked_at: (row["last_checked_at"] as string) ?? null,
        check_error: (row["check_error"] as string) ?? null,
      });
    }
    return map;
  }, [submissions.data]);

  const save = useMutation({
    mutationFn: async ({
      targetId,
      status,
      linkUrl,
    }: {
      targetId: string;
      status?: string;
      linkUrl?: string | null;
    }) => {
      const patch: Record<string, unknown> = {
        target_id: targetId,
        updated_at: new Date().toISOString(),
      };
      if (status) patch["status"] = status;
      if (linkUrl !== undefined) patch["link_url"] = linkUrl || null;
      const { error } = await supabase
        .from("backlink_submissions")
        .upsert(patch as never, { onConflict: "target_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backlink-submissions"] }),
  });

  const verify = useMutation({
    mutationFn: () => runBacklinkVerification(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backlink-submissions"] }),
  });

  const lang = filter === "es" ? "es" : filter === "en" ? "en" : "both";
  const rows = prioritizedTargets(lang).filter((target) => {
    if (filter === "es") return target.lang !== "en";
    if (filter === "en") return target.lang !== "es";
    if (filter === "dofollow") return target.dofollow;
    if (filter === "auto") return target.auto;
    return true;
  });

  const nextStatus = (current: string) =>
    STATUSES[(STATUSES.indexOf(current as (typeof STATUSES)[number]) + 1) % STATUSES.length]!;

  const done = rows.filter((target) => byTarget.get(target.id)?.verified).length;
  const lastCheck = [...byTarget.values()]
    .map((row) => row.last_checked_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: `Todos (${backlinkStats.total})` },
    { id: "dofollow", label: `Dofollow (${backlinkStats.dofollow})` },
    { id: "es", label: `Español (${backlinkStats.es})` },
    { id: "en", label: `Inglés (${backlinkStats.en})` },
    { id: "auto", label: "Automatizables" },
  ];

  return (
    <Panel className="p-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 text-left"
      >
        <Link2 className="h-5 w-5 text-primary" />
        <div className="mr-auto">
          <h3 className="font-semibold">Backlinks de finanzas · 25 sitios priorizados (ES + EN)</h3>
          <p className="text-sm text-muted-foreground">
            DA media {backlinkStats.avgDa} · {done} verificados publicados
            {lastCheck ? ` · última comprobación ${new Date(lastCheck).toLocaleString("es-ES")}` : ""}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
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
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto"
              disabled={verify.isPending}
              onClick={() => verify.mutate()}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${verify.isPending ? "animate-spin" : ""}`} />
              Verificar ahora
            </Button>
          </div>

          {verify.data && (
            <p className="mb-4 text-sm text-muted-foreground">
              {verify.data.checked} enlaces comprobados · {verify.data.published} publicados ·{" "}
              {verify.data.pending} sin encontrar.
            </p>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Sitio</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>DA</TableHead>
                  <TableHead>Enlace</TableHead>
                  <TableHead>Prob.</TableHead>
                  <TableHead>URL publicada</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((target: BacklinkTarget & { priority: { score: number; approval: number } }, index) => {
                  const row = byTarget.get(target.id);
                  const status = row?.status ?? "pendiente";
                  const draft = drafts[target.id] ?? row?.link_url ?? "";
                  return (
                    <TableRow key={target.id}>
                      <TableCell className="text-sm text-muted-foreground">{index + 1}</TableCell>
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
                        <p className="max-w-[22rem] text-xs text-muted-foreground">{target.how}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={target.priority.score >= 75 ? "default" : "outline"}>
                          {target.priority.score}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{target.type}</span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{target.da}</TableCell>
                      <TableCell>
                        <Badge variant={target.dofollow ? "default" : "outline"}>
                          {target.dofollow ? "dofollow" : "nofollow"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {Math.round(target.priority.approval * 100)} %
                      </TableCell>
                      <TableCell>
                        <Input
                          value={draft}
                          placeholder="https://…"
                          className="h-8 w-52 text-xs"
                          onChange={(event) =>
                            setDrafts((prev) => ({ ...prev, [target.id]: event.target.value }))
                          }
                          onBlur={() => {
                            if (draft !== (row?.link_url ?? "")) {
                              save.mutate({ targetId: target.id, linkUrl: draft, status: draft ? "enviado" : "pendiente" });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {row?.verified ? (
                          <span className="inline-flex items-center gap-1 text-sm text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                            {row.dofollow_ok ? "dofollow" : "nofollow"}
                          </span>
                        ) : row?.link_url ? (
                          <span
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                            title={row.check_error ?? ""}
                          >
                            <XCircle className="h-4 w-4" />
                            sin detectar
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
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
          </div>
        </div>
      )}
    </Panel>
  );
}
