import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Lock, Sparkles, Trash2, TriangleAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useT } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { processStatement } from "@/lib/statements.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.csv,.txt,.png,.jpg,.jpeg,.webp,.heic,application/pdf,text/csv,image/*";
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

type JobStage = "reading" | "uploading" | "extracting" | "analyzing" | "done" | "error";

type Job = {
  id: string;
  name: string;
  stage: JobStage;
  message?: string;
};

const STAGE_ORDER: JobStage[] = ["reading", "uploading", "extracting", "analyzing"];
const STAGE_PROGRESS: Record<JobStage, number> = {
  reading: 12,
  uploading: 40,
  extracting: 65,
  analyzing: 88,
  done: 100,
  error: 100,
};

export function StatementImporter() {
  const t = useT();
  const { user, signOut } = useAuth();
  const { isFree } = useSubscription();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const runProcess = useServerFn(processStatement);

  const setJob = (id: string, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));


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
    mutationFn: (statementId: string) => runProcess({ data: { statementId, environment: getPaddleEnvironment() } }),
    onSuccess: (result) => {
      toast.success(
        t(
          `${result.inserted} movimientos clasificados por IA · actualizando tus módulos`,
          `${result.inserted} transactions classified by AI · updating your modules`,
        ),
      );
      refreshAll();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("No pudimos procesar el archivo", "We couldn't process the file"));
      void qc.invalidateQueries({ queryKey: ["statements"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("statements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Archivo y sus movimientos eliminados", "File and its transactions deleted"));
      refreshAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeTxMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("imported_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Movimiento eliminado", "Transaction deleted"));
      refreshAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      // La sesión puede seguir en el navegador aunque la cuenta ya no exista
      // (p. ej. borrada desde el panel de administración). En ese caso el insert
      // rompe la clave foránea de statements, así que lo validamos antes.
      const { data: current, error: authErr } = await supabase.auth.getUser();
      if (authErr || !current?.user) {
        await signOut();
        toast.error(t("Tu sesión ya no es válida. Vuelve a iniciar sesión.", "Your session is no longer valid. Please sign in again."));
        return;
      }

      // Subimos y lanzamos el análisis de todos los archivos en paralelo.
      await Promise.all(
        Array.from(files).map(async (file) => {
          const lower = file.name.toLowerCase();
          const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|heic|heif)$/.test(lower);
          const ok = lower.endsWith(".pdf") || lower.endsWith(".csv") || lower.endsWith(".txt") || isImage;
          if (!ok) {
            toast.error(t(`${file.name}: solo aceptamos PDF, CSV o imágenes`, `${file.name}: we only accept PDF, CSV or images`));
            return;
          }
          if (file.size > MAX_BYTES) {
            toast.error(t(`${file.name}: máximo 15 MB`, `${file.name}: maximum 15 MB`));
            return;
          }

          const fallbackType = lower.endsWith(".pdf") ? "application/pdf" : isImage ? "image/jpeg" : "text/csv";
          const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
          const { error: upErr } = await supabase.storage.from("statements").upload(path, file, {
            contentType: file.type || fallbackType,
            upsert: false,
          });
          if (upErr) throw new Error(upErr.message);

          const { data: inserted, error: insErr } = await supabase
            .from("statements")
            .insert({
              user_id: user.id,
              file_name: file.name,
              file_type: file.type || fallbackType,
              file_size: file.size,
              storage_path: path,
              status: "uploaded",
            })
            .select("id")
            .single();
          if (insErr) throw new Error(insErr.message);

          toast.success(t(`${file.name} subido · analizando con IA…`, `${file.name} uploaded · analyzing with AI…`));
          void qc.invalidateQueries({ queryKey: ["statements"] });
          processMutation.mutate(inserted.id as string);
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("statements_user_id_fkey") || message.includes("foreign key")) {
        await signOut();
        toast.error(t("Tu sesión ya no es válida. Vuelve a iniciar sesión.", "Your session is no longer valid. Please sign in again."));
      } else {
        toast.error(message || t("Error al subir el archivo", "Error uploading the file"));
      }

    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const statements = statementsQuery.data ?? [];
  const transactions = txQuery.data ?? [];

  const now = new Date();
  const statementsThisMonth = statements.filter((s) => {
    const d = new Date(s.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const freeLimitReached = isFree && statementsThisMonth >= 5;

  return (
    <div className="space-y-4">
      <Panel
        title={t("Cargar EEFF", "Upload statements")}
        description={t(
          "PDF de tarjetas, CSV bancarios o capturas de pantalla — la IA extrae y clasifica cada movimiento",
          "Card PDFs, bank CSVs or screenshots — AI extracts and classifies each transaction",
        )}
      >
        <div className="relative">
          <div
            onDragOver={(e) => {
              if (freeLimitReached) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              if (freeLimitReached) return;
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border bg-elevated/40",
              freeLimitReached && "opacity-30 blur-[1px]",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
              disabled={freeLimitReached}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <p className="mt-3 text-sm font-medium">{t("Arrastra tus archivos aquí", "Drag your files here")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "Extraemos fecha, comercio, descripción, monto y moneda · PDF, CSV o captura (PNG/JPG) · máx. 15 MB",
                "We extract date, merchant, description, amount and currency · PDF, CSV or screenshot (PNG/JPG) · max. 15 MB",
              )}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button size="sm" className="gap-2 rounded-full" onClick={() => inputRef.current?.click()} disabled={uploading || freeLimitReached}>
                <FileText className="h-3.5 w-3.5" /> {t("Subir PDF", "Upload PDF")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || freeLimitReached}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> {t("Subir CSV", "Upload CSV")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || freeLimitReached}
              >
                <ImageIcon className="h-3.5 w-3.5" /> {t("Subir captura", "Upload screenshot")}
              </Button>
            </div>
          </div>
          {freeLimitReached && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background/95 p-6 text-center backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">{t("Límite alcanzado", "Limit reached")}</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {t(
                  "Has usado 5 importaciones este mes. Subir a Pro para importar sin límite.",
                  "You've used 5 imports this month. Upgrade to Pro for unlimited imports.",
                )}
              </p>
              <Button asChild size="sm" className="mt-1 rounded-full">
                <Link to="/precios">{t("Ver planes", "See plans")}</Link>
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("Archivos importados", "Imported files")} description={t("Historial de estados de cuenta procesados", "History of processed statements")}>
          {statementsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("Cargando…", "Loading…")}</p>
          ) : statements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Aún no has subido ningún estado de cuenta.", "You haven't uploaded any statements yet.")}</p>
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
                          ? t(`${s.transactions_count ?? 0} movimientos`, `${s.transactions_count ?? 0} transactions`)
                          : s.status === "error"
                            ? t("Error", "Error")
                            : t("Procesando…", "Processing…")}
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

        <Panel title={t("Movimientos extraídos", "Extracted transactions")} description={t("Clasificados automáticamente por la IA", "Automatically classified by AI")}>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Sube un archivo para ver tus movimientos aquí.", "Upload a file to see your transactions here.")}</p>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tx.merchant}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tx.tx_date ?? "—"}
                      {tx.subcategory ? ` · ${tx.subcategory}` : tx.category ? ` · ${tx.category}` : ""}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p
                      className={cn(
                        "numeric text-sm font-semibold",
                        tx.excluded && "text-muted-foreground line-through",
                      )}
                    >
                      {money(tx.amount, tx.currency)}
                    </p>
                    {tx.excluded && <span className="text-[10px] text-primary">→ {t("Patrimonio", "Net worth")}</span>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t("Eliminar movimiento", "Delete transaction")}
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => removeTxMutation.mutate(tx.id)}
                    disabled={removeTxMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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
  const t = useT();
  if (status === "processed") return <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />;
  if (status === "error") return <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />;
  if (status === "processing") return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />;
  return <Badge variant="secondary" className="rounded-full text-[10px]">{t("Nuevo", "New")}</Badge>;
}
