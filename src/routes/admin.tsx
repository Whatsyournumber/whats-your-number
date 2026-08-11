import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Users, CreditCard, FileText, TrendingUp } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";

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
  phone: string | null;
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

function AdminPage() {
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const [search, setSearch] = useState("");

  const enabled = isSuperAdmin;

  const profiles = useQuery({
    queryKey: ["admin", "profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
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
        <PageHeader eyebrow="Admin" title="Acceso restringido" subtitle="Esta sección es solo para super administradores." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Super admin"
        title="Panel de administración"
        subtitle="Todos los registros, suscripciones, pagos y actividad de la plataforma."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Usuarios registrados" value={String(users.length)} icon={Users} accent index={0} />
        <KpiCard label="Onboarding completado" value={String(onb.filter((o) => o.completed).length)} icon={TrendingUp} index={1} />
        <KpiCard label="Suscripciones activas" value={String(activeSubs.length)} icon={CreditCard} index={2} />
        <KpiCard label="MRR estimado" value={`${mrr} US$`} icon={FileText} index={3} />
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="subs">Pagos y suscripciones</TabsTrigger>
          <TabsTrigger value="statements">Estados de cuenta</TabsTrigger>
          <TabsTrigger value="promos">Invitaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Panel title="Registros" description={`${filteredUsers.length} usuarios`}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="mb-4 max-w-sm"
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Alta</TableHead>
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
                        <TableCell className="text-muted-foreground">{u.phone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{o?.country ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={o?.completed ? "default" : "secondary"}>{o?.completed ? "Completo" : "Pendiente"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s ? "default" : "outline"}>{s ? s.product_id.replace("_plan", "") : "free"}</Badge>
                        </TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
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
          <Panel title="Suscripciones" description={`${subs.length} registros · MRR ${mrr} US$`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Entorno</TableHead>
                    <TableHead>Renueva</TableHead>
                    <TableHead>Cancela al final</TableHead>
                    <TableHead>Creada</TableHead>
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
                        <TableCell className="text-muted-foreground">{s.cancel_at_period_end ? "Sí" : "No"}</TableCell>
                        <TableCell className="numeric text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {subs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
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
          <Panel title="Estados de cuenta cargados" description={`${stmts.length} archivos`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Transacciones</TableHead>
                    <TableHead>Fecha</TableHead>
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
          <Panel title="Códigos de invitación" description="Comparte el código para dar acceso Pro gratis">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Estado</TableHead>
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
                        <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "activo" : "inactivo"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(promos.data?.codes ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Sin códigos</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>

          <Panel title="Canjes" description={`${promos.data?.redemptions.length ?? 0} canjes`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Acceso hasta</TableHead>
                    <TableHead>Fecha</TableHead>
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
                      </TableRow>
                    );
                  })}
                  {(promos.data?.redemptions ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Sin canjes</TableCell>
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
