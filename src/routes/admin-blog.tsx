import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
  Globe2,
  CalendarDays,
  ListChecks,
  RefreshCw,
  MousePointerClick,
  Rocket,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import { blogPosts } from "@/lib/blog-posts";
import { auditAllPosts, MIN_WORDS, type PostAudit } from "@/lib/blog-audit";
import {
  getBlogSearchConsole,
  getBlogTraffic,
  getKeywordRankings,
  getLlmInsights,
  getSerpRankings,
} from "@/lib/blog-analytics.functions";
import type { SerpRank, SerpRegion } from "@/lib/keyword-serp.server";
import { lovableAnalytics } from "@/lib/lovable-analytics-snapshot";
import { getGa4Traffic } from "@/lib/ga4.functions";
import { runIndexingDistribution, syncNewPostsDistribution } from "@/lib/indexing.functions";
import { BacklinkPanel } from "@/components/backlink-panel";


import type { GscRow, GscSummary, KeywordRank, KeywordRankings } from "@/lib/blog-analytics.server";
import {
  allTargetKeywords,
  homeKeywords,
  kidsKeywords,
  postKeywords,
  type KeywordGroup,
} from "@/lib/blog-keywords";

export const Route = createFileRoute("/admin-blog")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Back office del blog — WhatsYournumber" },
      {
        name: "description",
        content: "Panel interno del blog: keywords de Search Console, tráfico por artículo, países y checklist SEO.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Back office del blog — WhatsYournumber" },
      { property: "og:description", content: "Keywords, tráfico, países y checklist SEO de cada artículo." },
    ],
  }),
  component: BlogBackOffice,
});

const REGION = new Intl.DisplayNames(["es"], { type: "region" });

/** Etiqueta del país desde el que se mide el SERP alternativo. */
const SERP_REGION_LABEL: Record<SerpRegion, string> = {
  es: "España",
  mx: "México",
  us: "EE. UU.",
  gb: "Reino Unido",
};

function countryName(code: string) {
  if (!code || code === "??") return "Desconocido";
  const upper = code.length === 3 ? code.slice(0, 2).toUpperCase() : code.toUpperCase();
  try {
    return REGION.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)} %`;
}

function BlogBackOffice() {
  const { isAdmin, loading } = useRoles();
  const [days, setDays] = useState(28);

  const traffic = useQuery({
    queryKey: ["blog-traffic", days],
    enabled: isAdmin,
    queryFn: () => getBlogTraffic({ data: { days } }),
  });

  const gsc = useQuery({
    queryKey: ["blog-gsc", days],
    enabled: isAdmin,
    retry: false,
    queryFn: () => getBlogSearchConsole({ data: { days } }),
  });

  const postDates = useMemo(
    () => new Map(blogPosts.map((post) => [post.slug, post.date.es] as const)),
    [],
  );

  const siteGroups = useMemo<KeywordGroup[]>(() => [homeKeywords, kidsKeywords], []);

  const postGroups = useMemo<KeywordGroup[]>(
    () =>
      blogPosts
        .filter((post) => postKeywords[post.slug])
        .map((post) => ({
          id: post.slug,
          label: { es: post.title.es, en: post.title.en },
          path: `/blog/${post.slug}`,
          date: post.date.es,
          keywords: postKeywords[post.slug]!,
        })),
    [],
  );

  const targetList = useMemo(() => allTargetKeywords(), []);

  const ranks = useQuery({
    queryKey: ["blog-keyword-ranks", days],
    enabled: isAdmin,
    retry: false,
    queryFn: () => getKeywordRankings({ data: { keywords: targetList, days } }),
  });

  const rankMap = useMemo(() => {
    const map = new Map<string, KeywordRank>();
    if (ranks.data && ranks.data.status === "ok") {
      for (const rank of ranks.data.ranks) map.set(rank.keyword.toLowerCase(), rank);
    }
    return map;
  }, [ranks.data]);

  const audits = useMemo(() => auditAllPosts("es"), []);
  const totalWords = audits.reduce((sum, a) => sum + a.words, 0);
  const readyPosts = audits.filter((a) => a.score === 100).length;


  if (loading) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Cargando…</p>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <Panel className="p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-muted-foreground">Esta sección es solo para administradores.</p>
        </Panel>
      </PageShell>
    );
  }

  const gscData = gsc.data;
  const gscOk =
    gscData && gscData.status === "ok" ? (gscData as Extract<GscSummary, { status: "ok" }>) : null;

  return (
    <PageShell>
      <PageHeader
        title="Back office del blog"
        subtitle="Keywords, tráfico por artículo, países y checklist SEO/GEO en un solo sitio."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {[7, 28, 90].map((d) => (
          <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
            {d} días
          </Button>
        ))}
        <Button size="sm" variant="ghost" asChild className="ml-auto">
          <Link to="/admin">← Panel general</Link>
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Visitas al blog" value={(traffic.data?.totalViews ?? 0).toLocaleString("es-ES")} icon={Eye} />
        <KpiCard
          label="Lectores únicos"
          value={(traffic.data?.uniqueSessions ?? 0).toLocaleString("es-ES")}
          icon={Globe2}
        />
        <KpiCard
          label="Clics desde Google"
          value={gscOk ? gscOk.totals.clicks.toLocaleString("es-ES") : "—"}
          icon={MousePointerClick}
        />
        <KpiCard label="Artículos 100% checklist" value={`${readyPosts}/${audits.length}`} icon={ListChecks} />
      </div>

      <Tabs defaultValue="kws-home">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="kws-home">Kws Home</TabsTrigger>
          <TabsTrigger value="kws-blog">Kws Blog</TabsTrigger>
          <TabsTrigger value="trafico">Tráfico por artículo</TabsTrigger>
          <TabsTrigger value="llm">IA & LLM</TabsTrigger>
          <TabsTrigger value="checklist">Checklist SEO</TabsTrigger>
          <TabsTrigger value="difusion">Difusión</TabsTrigger>
          <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
        </TabsList>

        {/* ------------------------------ Kws Home ------------------------------ */}
        <TabsContent value="kws-home" className="space-y-6">
          <RanksStatus ranks={ranks} />
          {siteGroups.map((group) => (
            <KeywordGroupPanel key={group.id} group={group} rankMap={rankMap} />
          ))}
        </TabsContent>

        {/* ------------------------------ Difusión ------------------------------ */}
        <TabsContent value="difusion" className="space-y-6">
          <DistributionPanel />
        </TabsContent>


        {/* ------------------------------ Kws Blog ------------------------------ */}
        <TabsContent value="kws-blog" className="space-y-6">
          <RanksStatus ranks={ranks} />
          {postGroups.map((group) => (
            <KeywordGroupPanel key={group.id} group={group} rankMap={rankMap} date={group.date} />
          ))}

          {gsc.isLoading && <Panel className="p-6 text-muted-foreground">Consultando Search Console…</Panel>}


          {gsc.isError && (
            <Panel className="p-6">
              <p className="mb-1 font-medium">No se pudo leer Search Console</p>
              <p className="text-sm text-muted-foreground">{(gsc.error as Error).message}</p>
            </Panel>
          )}

          {gscData?.status === "not_connected" && (
            <Panel className="p-6">
              <p className="font-medium">Search Console no está conectado</p>
              <p className="text-sm text-muted-foreground">
                Conecta la cuenta de Google desde los conectores del proyecto para ver keywords, clics e impresiones.
              </p>
            </Panel>
          )}

          {gscData?.status === "no_property" && (
            <Panel className="p-6">
              <p className="font-medium">Aún no hay una propiedad verificada para whatsyour-number.com</p>
              <p className="text-sm text-muted-foreground">
                Verifica el dominio en Search Console y en cuanto Google empiece a registrar datos aparecerán aquí las
                keywords de cada artículo.
              </p>
              {gscData.sites.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Propiedades disponibles en la cuenta: {gscData.sites.join(", ")}
                </p>
              )}
            </Panel>
          )}

          {gscData?.status === "selection_required" && (
            <Panel className="p-6">
              <p className="font-medium">Hay varias propiedades que cubren el dominio</p>
              <p className="text-sm text-muted-foreground">Elige cuál usar: {gscData.candidates.join(", ")}</p>
            </Panel>
          )}

          {gscOk && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <KpiCard label="Clics" value={gscOk.totals.clicks.toLocaleString("es-ES")} icon={MousePointerClick} />
                <KpiCard label="Impresiones" value={gscOk.totals.impressions.toLocaleString("es-ES")} icon={Eye} />
                <KpiCard label="CTR" value={pct(gscOk.totals.ctr)} icon={BarChart3} />
                <KpiCard label="Posición media" value={gscOk.totals.position.toFixed(1)} icon={Search} />
              </div>

              <Panel className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Keywords que traen tráfico al blog</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead className="text-right">Clics</TableHead>
                      <TableHead className="text-right">Impresiones</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Posición</TableHead>
            <TableHead className="text-right">Pos. alternativa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gscOk.queries.slice(0, 50).map((row: GscRow) => (
                      <TableRow key={row.keys[0]}>
                        <TableCell className="font-medium">{row.keys[0]}</TableCell>
                        <TableCell className="text-right">{row.clicks}</TableCell>
                        <TableCell className="text-right">{row.impressions}</TableCell>
                        <TableCell className="text-right">{pct(row.ctr)}</TableCell>
                        <TableCell className="text-right">{row.position.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                    {gscOk.queries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Google todavía no reporta consultas para el blog en este periodo.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Panel>

              <Panel className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Páginas del blog en Google</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Clics</TableHead>
                      <TableHead className="text-right">Impresiones</TableHead>
                      <TableHead className="text-right">Posición</TableHead>
            <TableHead className="text-right">Pos. alternativa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gscOk.pages.slice(0, 30).map((row: GscRow) => (
                      <TableRow key={row.keys[0]}>
                        <TableCell className="max-w-[380px] truncate">{row.keys[0]}</TableCell>
                        <TableCell className="text-right">{row.clicks}</TableCell>
                        <TableCell className="text-right">{row.impressions}</TableCell>
                        <TableCell className="text-right">{row.position.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Panel>
            </>
          )}
        </TabsContent>

        {/* ---------------------------- Tráfico interno --------------------------- */}
        <TabsContent value="trafico" className="space-y-6">
          <Panel className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Tráfico global del sitio (analítica de Lovable)</h2>
              <Badge variant="outline">
                {lovableAnalytics.period.start} → {lovableAnalytics.period.end}
              </Badge>
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Visitantes" value={lovableAnalytics.totals.visitors.toLocaleString("es-ES")} icon={Globe2} />
              <KpiCard label="Páginas vistas" value={lovableAnalytics.totals.pageviews.toLocaleString("es-ES")} icon={Eye} />
              <KpiCard label="Páginas / visita" value={lovableAnalytics.totals.pageviewsPerVisit.toFixed(2)} icon={BarChart3} />
              <KpiCard label="Rebote" value={`${lovableAnalytics.totals.bounceRate} %`} icon={MousePointerClick} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lovableAnalytics.byDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RTooltip />
                  <Bar dataKey="pageviews" name="Páginas vistas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visitors" name="Visitantes" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Páginas más vistas</h3>
              <ul className="space-y-2 text-sm">
                {lovableAnalytics.pages.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fuentes</h3>
              <ul className="space-y-2 text-sm">
                {lovableAnalytics.sources.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Países y dispositivos</h3>
              <ul className="space-y-2 text-sm">
                {lovableAnalytics.countries.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3">
                    <span>{countryName(row.label)}</span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                {lovableAnalytics.devices.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <span className="capitalize">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-6">

            <h2 className="mb-4 text-lg font-semibold">Visitas al blog por día (analítica propia)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traffic.data?.byDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RTooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Artículos más leídos</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Únicos</TableHead>
                  <TableHead className="text-right">ES / EN</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(traffic.data?.byPost ?? []).map((row) => {
                  const post = blogPosts.find((p) => p.slug === row.slug);
                  return (
                    <TableRow key={row.slug}>
                      <TableCell className="max-w-[420px] truncate font-medium">
                        {post?.title.es ?? row.slug}
                      </TableCell>
                      <TableCell className="text-right">{row.views}</TableCell>
                      <TableCell className="text-right">{row.sessions}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.es} / {row.en}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/blog/$slug" params={{ slug: row.slug }} target="_blank">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(traffic.data?.byPost.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Todavía no hay visitas registradas en este periodo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-6">
              <h2 className="mb-4 text-lg font-semibold">De dónde llegan</h2>
              <ul className="space-y-2 text-sm">
                {(traffic.data?.byReferrer ?? []).map((row) => (
                  <li key={row.source} className="flex items-center justify-between">
                    <span>{row.source}</span>
                    <span className="font-medium">{row.views}</span>
                  </li>
                ))}
                {(traffic.data?.byReferrer.length ?? 0) === 0 && (
                  <li className="text-muted-foreground">Sin datos todavía.</li>
                )}
              </ul>
            </Panel>
            <Panel className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Dispositivos</h2>
              <ul className="space-y-2 text-sm">
                {(traffic.data?.byDevice ?? []).map((row) => (
                  <li key={row.device} className="flex items-center justify-between">
                    <span className="capitalize">{row.device}</span>
                    <span className="font-medium">{row.views}</span>
                  </li>
                ))}
                {(traffic.data?.byDevice.length ?? 0) === 0 && (
                  <li className="text-muted-foreground">Sin datos todavía.</li>
                )}
              </ul>
            </Panel>
          </div>
        </TabsContent>

        {/* ---------------------------- IA & LLM deep ---------------------------- */}
        <TabsContent value="llm" className="space-y-6">
          <LlmPanel days={days} enabled={isAdmin} countryLabel={countryName} />
        </TabsContent>


        {/* ------------------------------ Checklist ------------------------------ */}
        <TabsContent value="checklist" className="space-y-6">
          <Panel className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Checklist SEO / GEO por artículo</h2>
              <span className="text-sm text-muted-foreground">
                {totalWords.toLocaleString("es-ES")} palabras en total · objetivo {MIN_WORDS.toLocaleString("es-ES")} por
                artículo
              </span>
            </div>
            <div className="space-y-4">
              {audits.map((audit) => (
                <AuditCard key={audit.slug} audit={audit} date={postDates.get(audit.slug)} />
              ))}
            </div>
          </Panel>
        </TabsContent>

        {/* ----------------------------- Conexiones ------------------------------ */}
        <TabsContent value="conexiones" className="space-y-4">
          <Panel className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Fuentes de datos</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-medium">Analítica propia del blog</p>
                  <p className="text-muted-foreground">
                    Cada visita a un artículo se registra en el backend (artículo, idioma, país, referente y
                    dispositivo). Sin cookies ni datos personales.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {gscData?.status === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                )}
                <div>
                  <p className="font-medium">Google Search Console</p>
                  <p className="text-muted-foreground">
                    {gscData?.status === "ok"
                      ? `Conectado a ${gscData.siteUrl}. Datos del ${gscData.range.start} al ${gscData.range.end}.`
                      : "Cuenta conectada. Falta verificar la propiedad del dominio para que Google devuelva datos."}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Google Analytics 4</p>
                  <p className="text-muted-foreground">
                    Pendiente de conectar. Cuando autorices la cuenta, añado sesiones y tiempo de lectura junto al resto
                    de métricas.
                  </p>
                </div>
              </li>
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function AuditCard({ audit, date }: { audit: PostAudit; date?: string | undefined }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{audit.title}</p>
            <p className="text-xs text-muted-foreground">
              {date ? `Publicado el ${date} · ` : ""}
              {audit.words.toLocaleString("es-ES")} palabras · {audit.images} imágenes
            </p>
          </div>
          <Badge variant={audit.score === 100 ? "default" : "secondary"}>{audit.score}%</Badge>
        </div>
        <Progress value={audit.score} className="mt-3 h-1.5" />
      </button>
      {open && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {audit.checks.map((check) => (
            <li key={check.key} className="flex items-center gap-2 text-sm">
              {check.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className={check.ok ? "" : "text-destructive"}>{check.label.es}</span>
              <span className="ml-auto text-xs text-muted-foreground">{check.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RankCells({ rank }: { rank: KeywordRank | undefined }) {
  if (!rank || (rank.position === null && rank.impressions === 0)) {
    return (
      <>
        <TableCell className="text-right text-muted-foreground">—</TableCell>
        <TableCell className="text-right text-muted-foreground">—</TableCell>
        <TableCell className="text-right text-muted-foreground">Sin datos</TableCell>
      </>
    );
  }
  return (
    <>
      <TableCell className="text-right">{rank.clicks}</TableCell>
      <TableCell className="text-right">{rank.impressions}</TableCell>
      <TableCell className="text-right font-medium">
        {rank.position === null ? "—" : rank.position.toFixed(1)}
      </TableCell>
    </>
  );
}

function KeywordGroupPanel({
  group,
  rankMap,
  date,
}: {
  group: KeywordGroup;
  rankMap: Map<string, KeywordRank>;
  date?: string | undefined;
}) {
  const keywords = useMemo(
    () =>
      group.keywords.flatMap((kw) => [
        { keyword: kw.es, region: "es" as SerpRegion },
        { keyword: kw.en, region: "us" as SerpRegion },
      ]),
    [group],
  );
  const [serp, setSerp] = useState<{ ranks: SerpRank[]; checkedAt: string } | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [serpError, setSerpError] = useState<string | null>(null);

  const serpMap = useMemo(() => {
    const map = new Map<string, SerpRank>();
    serp?.ranks.forEach((rank) => map.set(`${rank.region}|${rank.keyword.toLowerCase()}`, rank));
    return map;
  }, [serp]);

  const measure = async () => {
    setMeasuring(true);
    setSerpError(null);
    try {
      const result = await getSerpRankings({ data: { keywords } });
      setSerp({ ranks: result.ranks, checkedAt: result.checkedAt });
    } catch (error) {
      setSerpError(error instanceof Error ? error.message : "Error midiendo posiciones");
    } finally {
      setMeasuring(false);
    }
  };

  return (
    <Panel className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{group.label.es}</h2>
          {date && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Publicado el {date}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{group.path}</Badge>
          <Button size="sm" variant="outline" onClick={measure} disabled={measuring}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${measuring ? "animate-spin" : ""}`} />
            {measuring ? "Midiendo…" : "Medir sin Search Console"}
          </Button>
        </div>
      </div>
      {serp && (
        <p className="mb-3 text-xs text-muted-foreground">
          Fuente alternativa: SERP público (índice Bing/DuckDuckGo) · medido el{" "}
          {new Date(serp.checkedAt).toLocaleString("es-ES")}
        </p>
      )}
      {serpError && <p className="mb-3 text-xs text-destructive">{serpError}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword objetivo</TableHead>
            <TableHead className="w-20">Idioma</TableHead>
            <TableHead className="w-28">País</TableHead>
            <TableHead className="text-right">Clics</TableHead>
            <TableHead className="text-right">Impresiones</TableHead>
            <TableHead className="text-right">Posición</TableHead>
            <TableHead className="text-right">Pos. alternativa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.keywords.flatMap((kw) =>
            (["es", "en"] as const).map((lang) => (
              <TableRow key={`${group.id}-${lang}-${kw[lang]}`}>
                <TableCell className="font-medium">{kw[lang]}</TableCell>
                <TableCell className="uppercase text-xs text-muted-foreground">{lang}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {SERP_REGION_LABEL[lang === "es" ? "es" : "us"]}
                </TableCell>
                <RankCells rank={rankMap.get(kw[lang].toLowerCase())} />
                <SerpCell
                  rank={serpMap.get(`${lang === "es" ? "es" : "us"}|${kw[lang].toLowerCase()}`)}
                  measuring={measuring}
                />
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </Panel>
  );
}

function SerpCell({ rank, measuring }: { rank: SerpRank | undefined; measuring: boolean }) {
  if (measuring && !rank) {
    return <TableCell className="text-right text-xs text-muted-foreground">Midiendo…</TableCell>;
  }
  if (!rank) return <TableCell className="text-right text-muted-foreground">—</TableCell>;
  if (rank.error) {
    return <TableCell className="text-right text-xs text-muted-foreground">Sin respuesta</TableCell>;
  }
  if (rank.position === null) {
    return <TableCell className="text-right text-xs text-muted-foreground">&gt; top 30</TableCell>;
  }
  return <TableCell className="text-right font-medium text-emerald-500">#{rank.position}</TableCell>;
}

function RanksStatus({
  ranks,
}: {
  ranks: { isLoading: boolean; isError: boolean; error: unknown; data: KeywordRankings | undefined };
}) {
  if (ranks.isLoading) return <Panel className="p-6 text-muted-foreground">Consultando posiciones…</Panel>;
  if (ranks.isError) {
    return (
      <Panel className="p-6">
        <p className="mb-1 font-medium">No se pudieron leer las posiciones</p>
        <p className="text-sm text-muted-foreground">{(ranks.error as Error).message}</p>
      </Panel>
    );
  }
  if (ranks.data && ranks.data.status !== "ok") {
    return (
      <Panel className="p-6">
        <p className="font-medium">Search Console todavía no devuelve posiciones</p>
        <p className="text-sm text-muted-foreground">
          Las keywords objetivo ya están definidas y se trackean en cuanto la propiedad de whatsyour-number.com esté
          verificada y Google registre datos.
        </p>
      </Panel>
    );
  }
  return null;
}

/* ------------------------------- Difusión --------------------------------- */

/** Indexación acelerada (IndexNow, Google, agregadores) y difusión del feed ES/EN. */
function DistributionPanel() {
  // Al abrir el tab se difunden automáticamente los artículos que aún no se han enviado.
  const auto = useQuery({
    queryKey: ["distribution-sync"],
    queryFn: () => syncNewPostsDistribution(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const run = useMutation({ mutationFn: () => runIndexingDistribution({ data: { force: true } }) });

  const data = run.data ?? auto.data;
  const links = data?.links ?? [];
  const report = data?.report ?? null;
  const newSlugs = data?.newSlugs ?? [];

  const channels = [
    {
      name: "IndexNow",
      what: "Bing, Yandex, Seznam y Naver reciben las URLs nuevas y suelen indexarlas en minutos.",
    },
    {
      name: "Google Search Console",
      what: "Reenvía el sitemap a la propiedad verificada para acelerar el rastreo.",
    },
    {
      name: "Ping-o-Matic · Twingly · BlogFlux",
      what: "Avisan a directorios y agregadores de blogs (ES y EN) de que hay contenido nuevo.",
    },
    {
      name: "WebSub / RSS hub",
      what: "Distribuye el feed en español e inglés a lectores y agregadores al instante.",
    },
  ];

  return (
    <>
      <Panel className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Rocket className="h-5 w-5 text-primary" />
          <div className="mr-auto">
            <h3 className="font-semibold">Indexación acelerada y difusión off-site</h3>
            <p className="text-sm text-muted-foreground">
              Automático: cada artículo nuevo se difunde solo. Nada de granjas de enlaces.
            </p>
          </div>
          <Button onClick={() => run.mutate()} disabled={run.isPending || auto.isFetching}>
            {run.isPending ? "Difundiendo…" : "Reenviar todo"}
          </Button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {auto.isFetching && !run.isPending
            ? "Comprobando artículos nuevos…"
            : newSlugs.length
              ? `${newSlugs.length} artículo(s) difundido(s) ahora: ${newSlugs.join(", ")}`
              : "Todos los artículos publicados ya están difundidos."}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <div key={channel.name} className="rounded-lg border border-border/60 p-4">
              <p className="text-sm font-medium">{channel.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{channel.what}</p>
            </div>
          ))}
        </div>
      </Panel>

      {(run.isError || auto.isError) && (
        <Panel className="p-6 text-sm text-destructive">
          {(run.error ?? auto.error) instanceof Error
            ? (run.error ?? auto.error as Error).message
            : "No se pudo ejecutar la difusión."}
        </Panel>
      )}

      <BacklinkPanel />

      {links.length > 0 && (
        <Panel className="p-6">
          <h3 className="mb-4 font-semibold">Enlaces difundidos ({links.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Idioma</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={`${link.slug}-${link.lang}`}>
                  <TableCell className="font-medium">{link.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{link.lang.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {link.url.replace("https://", "")}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </TableCell>
                  <TableCell>
                    {link.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(link.distributedAt).toLocaleDateString("es-ES")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {report && (
        <Panel className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {report.urls} URLs enviadas · {new Date(report.ranAt).toLocaleString("es-ES")}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.results.map((result) => (
                <TableRow key={result.channel}>
                  <TableCell className="font-medium">{result.channel}</TableCell>
                  <TableCell>
                    {result.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{result.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </>
  );
}


/* ---------------------------- IA & LLM deep ------------------------------- */

/**
 * Análisis profundo del tráfico que llega desde asistentes de IA (ChatGPT,
 * Perplexity, Gemini, Copilot, Claude…): dónde se están leyendo y citando
 * nuestros contenidos en las respuestas generadas.
 */
function LlmPanel({
  days,
  enabled,
  countryLabel,
}: {
  days: number;
  enabled: boolean;
  countryLabel: (code: string) => string;
}) {
  const llm = useQuery({
    queryKey: ["llm-insights", days],
    enabled,
    queryFn: () => getLlmInsights({ data: { days } }),
  });

  const data = llm.data;
  const top = data?.bySource[0];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Visitas desde IA" value={(data?.aiViews ?? 0).toLocaleString("es-ES")} icon={Sparkles} />
        <KpiCard label="% del tráfico" value={data ? pct(data.aiShare) : "—"} icon={BarChart3} />
        <KpiCard label="Asistente líder" value={top?.label ?? "—"} icon={Rocket} />
        <KpiCard label="Artículos citados" value={String(data?.byPost.length ?? 0)} icon={ListChecks} />
      </div>

      {llm.isLoading && <Panel className="p-6 text-muted-foreground">Analizando tráfico de IA…</Panel>}
      {llm.isError && (
        <Panel className="p-6">
          <p className="mb-1 font-medium">No se pudo cargar el análisis de IA</p>
          <p className="text-sm text-muted-foreground">{(llm.error as Error).message}</p>
        </Panel>
      )}

      <Panel className="p-6">
        <h2 className="mb-1 text-lg font-semibold">Dónde se están leyendo nuestros prompts</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Visitas que llegan directamente desde una respuesta generada por un asistente de IA en los últimos {days} días.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asistente / motor de respuesta</TableHead>
              <TableHead className="text-right">Visitas</TableHead>
              <TableHead className="text-right">Lectores únicos</TableHead>
              <TableHead className="text-right">% del tráfico IA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.bySource ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right">{row.views}</TableCell>
                <TableCell className="text-right">{row.sessions}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {data && data.aiViews ? `${((row.views / data.aiViews) * 100).toFixed(1)} %` : "—"}
                </TableCell>
              </TableRow>
            ))}
            {(data?.bySource.length ?? 0) === 0 && !llm.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Todavía no hay visitas identificadas desde asistentes de IA.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      <Panel className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Artículos que la IA está citando más</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead>Idioma</TableHead>
              <TableHead>Asistentes</TableHead>
              <TableHead className="text-right">Visitas IA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.byPost ?? []).map((row) => (
              <TableRow key={row.slug}>
                <TableCell className="font-medium">{row.slug}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.lang.toUpperCase()}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.sources.join(" · ")}</TableCell>
                <TableCell className="text-right">{row.views}</TableCell>
              </TableRow>
            ))}
            {(data?.byPost.length ?? 0) === 0 && !llm.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Sin citas detectadas todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      {(data?.byCountry.length ?? 0) > 0 && (
        <Panel className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Desde qué países llegan las respuestas de IA</h2>
          <ul className="space-y-2 text-sm">
            {(data?.byCountry ?? []).slice(0, 12).map((row) => (
              <li key={row.country} className="flex items-center justify-between">
                <span>{countryLabel(row.country)}</span>
                <span className="text-muted-foreground">{row.views}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
