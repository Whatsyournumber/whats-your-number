import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, FileSpreadsheet, FileText, Loader2, Sparkles, Trash2, TriangleAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { processStatement } from "@/lib/statements.functions";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.csv,.txt,application/pdf,text/csv";
const MAX_BYTES = 15 * 1024 * 1024;

type StatementRow = {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  summary: string | null;
  error_message: string | null;
  transactions_count: number | null;
  created_at: string;
};

type TxRow = {
  id: string;
  tx_date: string | null;
  merchant: string;
  amount: number;
  currency: string;
  category: string | null;
  subcategory: string | null;
  excluded: boolean;
};

const money = (v: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(v);

export function StatementImporter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const runProcess = useServerFn(processStatement);

  const statementsQuery = useQuery({
    queryKey: ["statements", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("statements")
        .select("id,file_name,file_type,status,summary,error_message,transactions_count,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as StatementRow[];
    },
  });

  const txQuery = useQuery({
    queryKey: ["imported_transactions", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imported_transactions")
        .select("id,tx_date,merchant,amount,currency,category,subcategory,excluded")
        .order("tx_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as TxRow[];
    },
  });

  // Refresca TODO lo que depende de los EEFF (dashboard, gastos, cash flow, patrimonio…)
  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: ["statements"] });
    void qc.invalidateQueries({ queryKey: ["imported_transactions"] });
    void qc.invalidateQueries({ queryKey: ["imported-transactions"] });
    void qc.invalidateQueries({ queryKey: ["onboarding-profile"] });
    void qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const processMutation = useMutation({
    mutationFn: (statementId: string) => runProcess({ data: { statementId } }),
    onSuccess: (result) => {
      toast.success(`${result.inserted} movimientos clasificados por IA · actualizando tus módulos`);
      refreshAll();
    },
    onError: (error: Error) => {
      toast.error(error.message || "No pudimos procesar el archivo");
      void qc.invalidateQueries({ queryKey: ["statements"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("statements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["statements"] });
      void qc.invalidateQueries({ queryKey: ["imported_transactions"] });
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const lower = file.name.toLowerCase();
        const ok = lower.endsWith(".pdf") || lower.endsWith(".csv") || lower.endsWith(".txt");
        if (!ok) {
          toast.error(`${file.name}: solo aceptamos PDF o CSV`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: máximo 15 MB`);
          continue;
        }

        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("statements").upload(path, file, {
          contentType: file.type || (lower.endsWith(".pdf") ? "application/pdf" : "text/csv"),
          upsert: false,
        });
        if (upErr) throw new Error(upErr.message);

        const { data: inserted, error: insErr } = await supabase
          .from("statements")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.type || (lower.endsWith(".pdf") ? "application/pdf" : "text/csv"),
            file_size: file.size,
            storage_path: path,
            status: "uploaded",
          })
          .select("id")
          .single();
        if (insErr) throw new Error(insErr.message);

        toast.success(`${file.name} subido · analizando con IA…`);
        void qc.invalidateQueries({ queryKey: ["statements"] });
        processMutation.mutate(inserted.id as string);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const statements = statementsQuery.data ?? [];
  const transactions = txQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Subir estados de cuenta"
        description="PDF de tarjetas o CSV bancarios — la IA extrae y clasifica cada movimiento"
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-elevated/40",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="mt-3 text-sm font-medium">Arrastra tus archivos aquí</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Extraemos fecha, comercio, descripción, monto y moneda · PDF o CSV · máx. 15 MB
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="gap-2 rounded-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <FileText className="h-3.5 w-3.5" /> Subir PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Subir CSV
            </Button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Archivos importados" description="Historial de estados de cuenta procesados">
          {statementsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : statements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has subido ningún estado de cuenta.</p>
          ) : (
            <div className="space-y-2">
              {statements.map((s) => (
                <div key={s.id} className="rounded-xl bg-elevated/60 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={s.status} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.file_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("es")} ·{" "}
                        {s.status === "processed"
                          ? `${s.transactions_count ?? 0} movimientos`
                          : s.status === "error"
                            ? "Error"
                            : "Procesando…"}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {s.status !== "processing" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full text-xs"
                          onClick={() => processMutation.mutate(s.id)}
                          disabled={processMutation.isPending}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs"
                        onClick={() => removeMutation.mutate(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {s.summary && <p className="mt-2 text-xs text-muted-foreground">{s.summary}</p>}
                  {s.error_message && <p className="mt-2 text-xs text-destructive">{s.error_message}</p>}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Movimientos extraídos" description="Clasificados automáticamente por la IA">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sube un archivo para ver tus movimientos aquí.</p>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.merchant}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.tx_date ?? "—"}
                      {t.subcategory ? ` · ${t.subcategory}` : t.category ? ` · ${t.category}` : ""}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p
                      className={cn(
                        "numeric text-sm font-semibold",
                        t.excluded && "text-muted-foreground line-through",
                      )}
                    >
                      {money(t.amount, t.currency)}
                    </p>
                    {t.excluded && <span className="text-[10px] text-primary">→ Patrimonio</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "processed") return <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />;
  if (status === "error") return <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />;
  if (status === "processing") return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />;
  return <Badge variant="secondary" className="rounded-full text-[10px]">Nuevo</Badge>;
}
