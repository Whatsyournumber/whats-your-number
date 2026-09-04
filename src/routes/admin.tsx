import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Users, CreditCard, FileText, TrendingUp, Trash2, Handshake, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import { useT } from "@/hooks/use-language";
import {
  adminCreatePromoCode,
  adminUpdatePromoCode,
  adminDeletePromoCode,
  adminDeletePromoRedemption,
  adminDeleteSubscription,
  adminDeleteUser,
} from "@/lib/admin.functions";
import { adminMarkCommissionsPaid, adminUpdateAffiliate } from "@/utils/affiliates.functions";
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Panel de administración — WhatsYournumber" },
      { name: "description", content: "Panel interno: usuarios registrados, suscripciones, pagos y estados de cuenta." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel de administración — WhatsYournumber" },
      { property: "og:description", content: "Métricas internas de usuarios, suscripciones y actividad." },
    ],
  }),
  component: AdminPage,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

type OnboardingRow = {
  user_id: string;
  completed: boolean;
  currency: string | null;
  country: string | null;
  monthly_expenses: number | null;
  desired_retirement_income: number | null;
  updated_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  environment: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
};

type StatementRow = {
  id: string;
  user_id: string;
  file_name: string;
  status: string;
  transactions_count: number;
  created_at: string;
};

const PRICES: Record<string, number> = { pro_plan: 7, patrimonio_plan: 19 };

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function DeleteAction({
  title,
  description,
  onConfirm,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={title}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancelar", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? t("Borrando…", "Deleting…") : t("Borrar", "Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdminPage() {
  const t = useT();
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "",
    product_id: "pro_plan",
    duration_days: "30",
    max_uses: "25",
    note: "",
  });
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoEditId, setPromoEditId] = useState<string | null>(null);
  const [promoActive, setPromoActive] = useState(true);

  const emptyPromoForm = { code: "", product_id: "pro_plan", duration_days: "30", max_uses: "25", note: "" };

  const openCreatePromo = () => {
    setPromoEditId(null);
    setPromoActive(true);
    setPromoForm(emptyPromoForm);
    setPromoDialogOpen(true);
  };

  const openEditPromo = (c: { id: string; code: string; product_id: string; duration_days: number; max_uses: number; note?: string | null; active: boolean }) => {
    setPromoEditId(c.id);
    setPromoActive(c.active);
    setPromoForm({
      code: c.code,
      product_id: c.product_id,
      duration_days: String(c.duration_days),
      max_uses: String(c.max_uses),
      note: c.note ?? "",
    });
    setPromoDialogOpen(true);
  };

  const runDelete = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      toast.success(okMsg);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("No se pudo borrar", "Could not delete"));
    }
  };

  const runCreatePromo = async () => {
    setPromoBusy(true);
    try {
      const payload = {
        code: promoForm.code,
        product_id: promoForm.product_id,
        duration_days: Number(promoForm.duration_days),
        max_uses: Number(promoForm.max_uses),
        note: promoForm.note,
      };
      if (promoEditId) {
        await adminUpdatePromoCode({ data: { ...payload, id: promoEditId, active: promoActive } });
        toast.success(t("Código actualizado", "Code updated"));
      } else {
        await adminCreatePromoCode({ data: payload });
        toast.success(t("Código creado", "Code created"));
      }
      setPromoForm(emptyPromoForm);
      setPromoEditId(null);
      setPromoDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("No se pudo guardar el código", "Could not save code"));
    } finally {
      setPromoBusy(false);
    }
  };

  const enabled = isSuperAdmin;

  const profiles = useQuery({
    queryKey: ["admin", "profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const onboarding = useQuery({
    queryKey: ["admin", "onboarding"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_profiles")
        .select("user_id,completed,currency,country,monthly_expenses,desired_retirement_income,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OnboardingRow[];
    },
  });

  const subscriptions = useQuery({
    queryKey: ["admin", "subscriptions"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,user_id,product_id,status,environment,current_period_end,cancel_at_period_end,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SubscriptionRow[];
    },
  });

  const statements = useQuery({
    queryKey: ["admin", "statements"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("statements")
        .select("id,user_id,file_name,status,transactions_count,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as StatementRow[];
    },
  });

  const promos = useQuery({
    queryKey: ["admin", "promos"],
    enabled,
    queryFn: async () => {
      const [codes, reds] = await Promise.all([
        supabase.from("promo_codes").select("id,code,product_id,duration_days,max_uses,used_count,active,expires_at,note").order("created_at", { ascending: false }),
        supabase.from("promo_redemptions").select("id,code,user_id,granted_until,created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      if (codes.error) throw codes.error;
      if (reds.error) throw reds.error;
      return { codes: codes.data ?? [], redemptions: reds.data ?? [] };
    },
  });

  const affiliates = useQuery({
    queryKey: ["admin", "affiliates"],
    enabled,
    queryFn: async () => {
      const [accounts, clicks, referrals, commissions] = await Promise.all([
        supabase.from("affiliates").select("id,user_id,code,display_name,payout_email,payout_notes,commission_rate,status,created_at").order("created_at", { ascending: false }),
        supabase.from("affiliate_clicks").select("id,affiliate_id"),
        supabase.from("affiliate_referrals").select("id,affiliate_id,user_id,status,created_at"),
        supabase.from("affiliate_commissions").select("id,affiliate_id,commission_amount,base_amount,status,created_at"),
      ]);
      if (accounts.error) throw accounts.error;
      return {
        accounts: accounts.data ?? [],
        clicks: clicks.data ?? [],
        referrals: referrals.data ?? [],
        commissions: commissions.data ?? [],
      };
    },
  });

  const aff = affiliates.data;
  const affRows = (aff?.accounts ?? []).map((a) => {
    const clicks = (aff?.clicks ?? []).filter((c) => c.affiliate_id === a.id).length;
    const refs = (aff?.referrals ?? []).filter((r) => r.affiliate_id === a.id);
    const comms = (aff?.commissions ?? []).filter((c) => c.affiliate_id === a.id);
    const pending = comms.filter((c) => c.status === "pending").reduce((x, c) => x + Number(c.commission_amount), 0);
    const paidOut = comms.filter((c) => c.status === "paid").reduce((x, c) => x + Number(c.commission_amount), 0);
    const revenue = comms.reduce((x, c) => x + Number(c.base_amount), 0);
    return { ...a, clicks, signups: refs.length, active: refs.filter((r) => r.status === "subscribed").length, pending, paidOut, revenue };
  });

  const users = profiles.data ?? [];
  const onb = onboarding.data ?? [];
  const subs = subscriptions.data ?? [];
  const stmts = statements.data ?? [];

  const onbByUser = useMemo(() => new Map(onb.map((o) => [o.user_id, o])), [onb]);
  const subByUser = useMemo(() => new Map(subs.map((s) => [s.user_id, s])), [subs]);

  const activeSubs = subs.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
  const mrr = activeSubs.reduce((acc, s) => acc + (PRICES[s.product_id] ?? 0), 0);

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${u.full_name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q);
  });

  if (rolesLoading) return null;

  if (!isSuperAdmin) {
    return (
      <PageShell>
        <PageHeader eyebrow="Admin" title={t("Acceso restringido", "Restricted access")} subtitle={t("Esta sección es solo para super administradores.", "This section is for super admins only.")} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Super admin"
        title={t("Panel de administración", "Admin panel")}
        subtitle={t("Todos los registros, suscripciones, pagos y actividad de la plataforma.", "All sign-ups, subscriptions, payments and platform activity.")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin-blog">{t("Back office del blog", "Blog back office")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("Usuarios registrados", "Registered users")} value={String(users.length)} icon={Users} accent index={0} />
        <KpiCard label={t("Onboarding completado", "Onboarding completed")} value={String(onb.filter((o) => o.completed).length)} icon={TrendingUp} index={1} />
        <KpiCard label={t("Suscripciones activas", "Active subscriptions")} value={String(activeSubs.length)} icon={CreditCard} index={2} />
        <KpiCard label={t("MRR estimado", "Estimated MRR")} value={`${mrr} US$`} icon={FileText} index={3} />
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">{t("Usuarios", "Users")}</TabsTrigger>
          <TabsTrigger value="subs">{t("Pagos y suscripciones", "Payments & subscriptions")}</TabsTrigger>
          <TabsTrigger value="statements">{t("Estados de cuenta", "Statements")}</TabsTrigger>
          <TabsTrigger value="promos">{t("Invitaciones", "Invites")}</TabsTrigger>
          <TabsTrigger value="affiliates">{t("Afiliados", "Affiliates")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Panel title={t("Registros", "Sign-ups")} description={`${filteredUsers.length} ${t("usuarios", "users")}`}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Buscar por nombre o email…", "Search by name or email…")}
              className="mb-4 max-w-sm"
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Nombre", "Name")}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>{t("País", "Country")}</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>{t("Alta", "Joined")}</TableHead>
                    <TableHead className="text-right">{t("Acciones", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const o = onbByUser.get(u.id);
                    const s = subByUser.get(u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{o?.country ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={o?.completed ? "default" : "secondary"}>{o?.completed ? t("Completo", "Complete") : t("Pendiente", "Pending")}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s ? "default" : "outline"}>{s ? s.product_id.replace("_plan", "") : "free"}</Badge>
                        </TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DeleteAction
                            title={t("Borrar usuario", "Delete user")}
                            description={t("Se eliminará la cuenta de {x} y todos sus datos (perfil, gastos, estados de cuenta, suscripciones). Esta acción no se puede deshacer.", "The account {x} and all its data (profile, expenses, statements, subscriptions) will be deleted. This cannot be undone.").replace("{x}", u.email ?? u.id)}
                            onConfirm={() =>
                              runDelete(() => adminDeleteUser({ data: { userId: u.id } }), t("Usuario eliminado", "User deleted"))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  )}

                </TableBody>
              </Table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="subs" className="mt-4">
          <Panel title={t("Suscripciones", "Subscriptions")} description={`${subs.length} ${t("registros", "records")} · MRR ${mrr} US$`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Usuario", "User")}</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>{t("Estado", "Status")}</TableHead>
                    <TableHead>{t("Entorno", "Environment")}</TableHead>
                    <TableHead>{t("Renueva", "Renews")}</TableHead>
                    <TableHead>{t("Cancela al final", "Cancels at period end")}</TableHead>
                    <TableHead>{t("Creada", "Created")}</TableHead>
                    <TableHead className="text-right">{t("Acciones", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((s) => {
                    const u = users.find((x) => x.id === s.user_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{u?.email ?? s.user_id.slice(0, 8)}</TableCell>
                        <TableCell>{s.product_id.replace("_plan", "")}</TableCell>
                        <TableCell>
                          <Badge variant={["active", "trialing"].includes(s.status) ? "default" : "secondary"}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.environment}</TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(s.current_period_end)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.cancel_at_period_end ? t("Sí", "Yes") : t("No", "No")}</TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DeleteAction
                            title={t("Borrar suscripción", "Delete subscription")}
                            description={t("Se eliminará este registro de suscripción y el usuario perderá el acceso asociado. No cancela el cobro en la pasarela de pago.", "This subscription record will be deleted and the user will lose the associated access. It does not cancel billing at the payment provider.")}
                            onConfirm={() =>
                              runDelete(() => adminDeleteSubscription({ data: { id: s.id } }), t("Suscripción eliminada", "Subscription deleted"))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {subs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Sin suscripciones todavía
                      </TableCell>
                    </TableRow>
                  )}

                </TableBody>
              </Table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="statements" className="mt-4">
          <Panel title={t("Estados de cuenta cargados", "Uploaded statements")} description={`${stmts.length} ${t("archivos", "files")}`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Usuario", "User")}</TableHead>
                    <TableHead>{t("Archivo", "File")}</TableHead>
                    <TableHead>{t("Estado", "Status")}</TableHead>
                    <TableHead>{t("Transacciones", "Transactions")}</TableHead>
                    <TableHead>{t("Fecha", "Date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stmts.map((s) => {
                    const u = users.find((x) => x.id === s.user_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{u?.email ?? s.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.file_name}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "processed" ? "default" : "secondary"}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="numeric">{s.transactions_count}</TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {stmts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sin archivos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="promos" className="mt-4 space-y-4">
          <Panel
            title={t("Códigos de invitación", "Invite codes")}
            description={t("Comparte el código para dar acceso Pro gratis", "Share the code to grant free Pro access")}
            actions={
              <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full" onClick={openCreatePromo}>
                    <Plus className="mr-1 h-4 w-4" />
                    {t("Crear código", "Create code")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{promoEditId ? t("Editar código", "Edit code") : t("Nuevo código de invitación", "New invite code")}</DialogTitle>
                    <DialogDescription>{t("Genera un código para dar acceso Pro gratis.", "Generate a code to grant free Pro access.")}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="promo-code">{t("Código", "Code")}</Label>
                      <Input
                        id="promo-code"
                        value={promoForm.code}
                        onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="EJ. PRO30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("Plan", "Plan")}</Label>
                      <Select value={promoForm.product_id} onValueChange={(v) => setPromoForm((f) => ({ ...f, product_id: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pro_plan">Pro</SelectItem>
                          <SelectItem value="family_plan">Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="promo-days">{t("Días", "Days")}</Label>
                        <Input
                          id="promo-days"
                          type="number"
                          min={1}
                          value={promoForm.duration_days}
                          onChange={(e) => setPromoForm((f) => ({ ...f, duration_days: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promo-uses">{t("Usos máx.", "Max uses")}</Label>
                        <Input
                          id="promo-uses"
                          type="number"
                          min={1}
                          value={promoForm.max_uses}
                          onChange={(e) => setPromoForm((f) => ({ ...f, max_uses: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-note">{t("Nota", "Note")}</Label>
                      <Input
                        id="promo-note"
                        value={promoForm.note}
                        onChange={(e) => setPromoForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder={t("Ej. Campaña YouTube", "E.g. YouTube campaign")}
                      />
                    </div>
                    {promoEditId && (
                      <div className="space-y-2">
                        <Label>{t("Estado", "Status")}</Label>
                        <Select value={promoActive ? "active" : "inactive"} onValueChange={(v) => setPromoActive(v === "active")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t("Activo", "Active")}</SelectItem>
                            <SelectItem value="inactive">{t("Inactivo", "Inactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPromoDialogOpen(false)} type="button">{t("Cancelar", "Cancel")}</Button>
                    <Button onClick={runCreatePromo} disabled={promoBusy || !promoForm.code.trim()} type="button">
                      {promoBusy ? t("Guardando…", "Saving…") : promoEditId ? t("Guardar cambios", "Save changes") : t("Crear código", "Create code")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Código", "Code")}</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>{t("Días", "Days")}</TableHead>
                    <TableHead>{t("Usos", "Uses")}</TableHead>
                    <TableHead>{t("Estado", "Status")}</TableHead>
                    <TableHead className="text-right">{t("Acciones", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(promos.data?.codes ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium tracking-wide">{c.code}</TableCell>
                      <TableCell className="text-muted-foreground">{c.product_id}</TableCell>
                      <TableCell className="numeric">{c.duration_days}</TableCell>
                      <TableCell className="numeric">{c.used_count} / {c.max_uses}</TableCell>
                      <TableCell>
                        <Badge variant={c.active ? "default" : "secondary"}>{c.active ? t("activo", "active") : t("inactivo", "inactive")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditPromo(c)}
                          aria-label={t("Editar código", "Edit code")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteAction
                          title={t("Borrar código", "Delete code")}
                          description={t("Se eliminará el código {x} y sus canjes registrados.", "Code {x} and its recorded redemptions will be deleted.").replace("{x}", c.code)}
                          onConfirm={() =>
                            runDelete(() => adminDeletePromoCode({ data: { id: c.id } }), t("Código eliminado", "Code deleted"))
                          }
                        />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(promos.data?.codes ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">{t("Sin códigos", "No codes")}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>

          <Panel title={t("Canjes", "Redemptions")} description={`${promos.data?.redemptions.length ?? 0} ${t("canjes", "redemptions")}`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Usuario", "User")}</TableHead>
                    <TableHead>{t("Código", "Code")}</TableHead>
                    <TableHead>{t("Correo", "Email")}</TableHead>
                    <TableHead>{t("País", "Country")}</TableHead>
                    <TableHead>{t("Acceso hasta", "Access until")}</TableHead>
                    <TableHead>{t("Fecha", "Date")}</TableHead>
                    <TableHead className="text-right">{t("Acciones", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(promos.data?.redemptions ?? []).map((r) => {
                    const u = users.find((x) => x.id === r.user_id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{u?.email ?? r.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-muted-foreground">{r.code}</TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(r.granted_until)}</TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DeleteAction
                            title={t("Borrar canje", "Delete redemption")}
                            description={t("Se eliminará este canje. El usuario podrá volver a usar el código si sigue activo.", "This redemption will be deleted. The user can redeem the code again if it is still active.")}
                            onConfirm={() =>
                              runDelete(() => adminDeletePromoRedemption({ data: { id: r.id } }), t("Canje eliminado", "Redemption deleted"))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(promos.data?.redemptions ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">{t("Sin canjes", "No redemptions")}</TableCell>
                    </TableRow>
                  )}

                </TableBody>
              </Table>
            </div>
          </Panel>
        </TabsContent>
        <TabsContent value="affiliates" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label={t("Afiliados", "Affiliates")} value={String(affRows.length)} icon={Handshake} accent index={0} />
            <KpiCard label={t("Clics totales", "Total clicks")} value={String(aff?.clicks.length ?? 0)} icon={TrendingUp} index={1} />
            <KpiCard label={t("Cuentas referidas activas", "Active referred accounts")} value={String(affRows.reduce((a, r) => a + r.active, 0))} icon={Users} index={2} />
            <KpiCard label={t("Comisión pendiente", "Pending commission")} value={`${affRows.reduce((a, r) => a + r.pending, 0).toFixed(2)} US$`} icon={CreditCard} index={3} />
          </div>

          <Panel title={t("Afiliados", "Affiliates")} description={t("Progreso por enlace: clics, registros, cuentas activas y comisiones.", "Progress per link: clicks, sign-ups, active accounts and commissions.")}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Afiliado", "Affiliate")}</TableHead>
                    <TableHead>{t("Código", "Code")}</TableHead>
                    <TableHead>{t("Correo", "Email")}</TableHead>
                    <TableHead>{t("País", "Country")}</TableHead>
                    <TableHead>{t("Clics", "Clicks")}</TableHead>
                    <TableHead>{t("Registros", "Sign-ups")}</TableHead>
                    <TableHead>{t("Activas", "Active")}</TableHead>
                    <TableHead>{t("Ingresos", "Revenue")}</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead className="text-right">{t("Acciones", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affRows.map((a) => {
                    const u = users.find((x) => x.id === a.user_id);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.display_name || u?.email || a.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="font-mono text-xs">{a.code}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.payout_email || u?.email || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(a.payout_notes ?? "").match(/País:\s*([^·]+)/)?.[1]?.trim() || "—"}
                        </TableCell>
                        <TableCell className="numeric">{a.clicks}</TableCell>
                        <TableCell className="numeric">{a.signups}</TableCell>
                        <TableCell className="numeric">{a.active}</TableCell>
                        <TableCell className="numeric">{a.revenue.toFixed(2)} US$</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            defaultValue={Number(a.commission_rate)}
                            className="h-8 w-20"
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (v === Number(a.commission_rate)) return;
                              void runDelete(() => adminUpdateAffiliate({ data: { id: a.id, commissionRate: v } }), t("Comisión actualizada", "Commission updated"));
                            }}
                          />
                        </TableCell>
                        <TableCell className="space-x-2 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={a.pending <= 0}
                            onClick={() => void runDelete(() => adminMarkCommissionsPaid({ data: { affiliateId: a.id } }), t("Comisiones marcadas como pagadas", "Commissions marked as paid"))}
                          >
                            {t("Marcar pagado", "Mark paid")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void runDelete(() => adminUpdateAffiliate({ data: { id: a.id, status: a.status === "active" ? "paused" : "active" } }), t("Estado actualizado", "Status updated"))}
                          >
                            {a.status === "active" ? t("Pausar", "Pause") : t("Activar", "Activate")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {affRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground">{t("Sin afiliados todavía", "No affiliates yet")}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
