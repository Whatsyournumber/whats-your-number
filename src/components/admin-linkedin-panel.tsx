import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Linkedin, ExternalLink, RefreshCw, Send, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/use-language";
import { blogPosts } from "@/lib/blog-posts";
import { buildCommentary } from "@/lib/linkedin-caption";
import {
  linkedinAuthorizeUrl,
  linkedinDisconnect,
  linkedinPublishArticle,
  linkedinStatus,
} from "@/lib/linkedin.functions";

const SITE_URL = "https://whatsyour-number.com";

export function AdminLinkedInPanel() {
  const t = useT();
  const status = useServerFn(linkedinStatus);
  const authorize = useServerFn(linkedinAuthorizeUrl);
  const disconnect = useServerFn(linkedinDisconnect);
  const publish = useServerFn(linkedinPublishArticle);

  const [slug, setSlug] = useState(blogPosts[0]?.slug ?? "");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [commentary, setCommentary] = useState("");
  const [busy, setBusy] = useState(false);

  const statusQuery = useQuery({ queryKey: ["linkedin-status"], queryFn: () => status({}) });
  const historyQuery = useQuery({
    queryKey: ["linkedin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linkedin_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const post = useMemo(() => blogPosts.find((p) => p.slug === slug), [slug]);
  const defaultCaption = useMemo(
    () => (post ? buildCommentary(post, lang, `${SITE_URL}/blog/${post.slug}`) : ""),
    [post, lang],
  );
  const caption = commentary || defaultCaption;
  const s = statusQuery.data;

  async function onConnect() {
    setBusy(true);
    try {
      const { url } = await authorize({});
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    try {
      await disconnect({});
      toast.success(t("Conexión eliminada", "Connection removed"));
      statusQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function onPublish() {
    if (!post) return;
    setBusy(true);
    try {
      const res = await publish({ data: { slug: post.slug, lang, commentary: caption } });
      toast.success(t("Publicado en LinkedIn", "Published on LinkedIn"), {
        description: res.url ?? undefined,
      });
      historyQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title={t("Página de LinkedIn", "LinkedIn page")}
        description={t(
          "Publicación automática en la página de empresa mediante la Community Management API.",
          "Automatic publishing to the company page via the Community Management API.",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Linkedin className="h-5 w-5 text-primary" />
          {s?.connected ? (
            <Badge className="bg-emerald-500/15 text-emerald-400">
              {t("Conectada", "Connected")}
              {s.orgName ? ` · ${s.orgName}` : s.orgId ? ` · ${s.orgId}` : ""}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("Sin conectar", "Not connected")}</Badge>
          )}
          {!s?.configured && (
            <Badge variant="destructive">{t("Faltan secretos de configuración", "Missing configuration secrets")}</Badge>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => statusQuery.refetch()} disabled={busy}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("Actualizar", "Refresh")}
            </Button>
            <Button size="sm" onClick={onConnect} disabled={busy || !s?.configured}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {s?.connected ? t("Volver a autorizar", "Re-authorize") : t("Conectar página", "Connect page")}
            </Button>
            {s?.connected && (
              <Button variant="ghost" size="sm" onClick={onDisconnect} disabled={busy}>
                <Unplug className="mr-2 h-4 w-4" />
                {t("Desconectar", "Disconnect")}
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("URL de redirección (configúrala en la app de LinkedIn):", "Redirect URL (set it in the LinkedIn app):")}{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">{s?.redirectUri ?? `${SITE_URL}/api/public/linkedin/callback`}</code>
          {s?.expiresAt && (
            <>
              {" · "}
              {t("Token válido hasta", "Token valid until")} {new Date(s.expiresAt).toLocaleString()}
            </>
          )}
        </p>
      </Panel>

      <Panel
        title={t("Publicar artículo", "Publish article")}
        description={t("Elige el artículo, el idioma y ajusta el texto del post.", "Pick the article, the language and tweak the post copy.")}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <Select value={slug} onValueChange={(v) => { setSlug(v); setCommentary(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {blogPosts.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>{p.title[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lang} onValueChange={(v) => { setLang(v as "es" | "en"); setCommentary(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          className="mt-3 min-h-40"
          value={caption}
          onChange={(e) => setCommentary(e.target.value)}
          maxLength={2900}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={onPublish} disabled={busy || !s?.connected}>
            <Send className="mr-2 h-4 w-4" />
            {t("Publicar en la página", "Publish to page")}
          </Button>
          <span className="text-xs text-muted-foreground">{caption.length}/2900</span>
        </div>
      </Panel>

      <Panel title={t("Historial", "History")} description={t("Últimas publicaciones enviadas.", "Latest posts sent.")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Fecha", "Date")}</TableHead>
                <TableHead>{t("Artículo", "Article")}</TableHead>
                <TableHead>{t("Idioma", "Language")}</TableHead>
                <TableHead>{t("Estado", "Status")}</TableHead>
                <TableHead className="text-right">{t("Enlace", "Link")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(historyQuery.data ?? []).map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>{row.slug}</TableCell>
                  <TableCell className="uppercase">{row.lang}</TableCell>
                  <TableCell>
                    {row.status === "published" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400">{t("Publicado", "Published")}</Badge>
                    ) : (
                      <Badge variant="destructive" title={row.error ?? ""}>{t("Error", "Failed")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.post_url ? (
                      <a className="text-primary hover:underline" href={row.post_url} target="_blank" rel="noreferrer">
                        {t("Ver", "View")}
                      </a>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {(historyQuery.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("Sin publicaciones todavía", "No posts yet")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
