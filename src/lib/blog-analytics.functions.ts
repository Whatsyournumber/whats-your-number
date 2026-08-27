import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  headerCity,
  headerCountry,
  insertBlogView,
  loadKeywordRankings,
  loadSearchConsole,
  loadTraffic,
  type GscSummary,
  type KeywordRankings,
  type TrafficSummary,
} from "@/lib/blog-analytics.server";
import type { SerpRankings } from "@/lib/keyword-serp.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Forbidden: admin only");
}

/** Registra una visita a un artículo del blog (público, sin datos personales). */
export const trackBlogView = createServerFn({ method: "POST" })
  .inputValidator((data: { slug: string; lang?: string; referrer?: string; device?: string; sessionId?: string }) => {
    if (!data?.slug || typeof data.slug !== "string") throw new Error("slug required");
    return {
      slug: data.slug.slice(0, 120),
      lang: data.lang === "en" ? "en" : "es",
      referrer: data.referrer?.slice(0, 300) ?? null,
      device: data.device?.slice(0, 20) ?? null,
      sessionId: data.sessionId?.slice(0, 64) ?? null,
    };
  })
  .handler(async ({ data }) => {
    const request = getRequest();
    await insertBlogView({
      slug: data.slug,
      lang: data.lang,
      country: headerCountry(request?.headers),
      city: headerCity(request?.headers),
      referrer: data.referrer,
      device: data.device,
      session_id: data.sessionId,
    } as never);
    return { ok: true };
  });

/** Agregados de tráfico interno del blog (solo admins). */
export const getBlogTraffic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => ({
    days: Math.min(Math.max(Number(data?.days ?? 28), 1), 365),
  }))
  .handler(async ({ data, context }): Promise<TrafficSummary> => {
    await assertAdmin(context.supabase, context.userId);
    return loadTraffic(data.days);
  });

/** Keywords, clics e impresiones de Google Search Console (solo admins). */
export const getBlogSearchConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteUrl?: string; days?: number }) => ({
    siteUrl: data?.siteUrl?.slice(0, 200),
    days: Math.min(Math.max(Number(data?.days ?? 28), 1), 180),
  }))
  .handler(async ({ data, context }): Promise<GscSummary> => {
    await assertAdmin(context.supabase, context.userId);
    return loadSearchConsole("https://whatsyour-number.com/", data.siteUrl, data.days);
  });

/** Posicionamiento de las keywords objetivo (home, niños y artículos). Solo admins. */
export const getKeywordRankings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { keywords: string[]; days?: number; siteUrl?: string }) => ({
    keywords: (data?.keywords ?? []).slice(0, 400).map((k) => String(k).slice(0, 120)),
    days: Math.min(Math.max(Number(data?.days ?? 28), 1), 180),
    siteUrl: data?.siteUrl?.slice(0, 200),
  }))
  .handler(async ({ data, context }): Promise<KeywordRankings> => {
    await assertAdmin(context.supabase, context.userId);
    return loadKeywordRankings("https://whatsyour-number.com/", data.keywords, data.days, data.siteUrl);
  });

/**
 * Fuente alternativa de posiciones (SERP público) mientras Search Console
 * todavía no devuelve datos para la propiedad. Solo admins.
 */
export const getSerpRankings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { keywords: { keyword: string; region?: string }[] }) => ({
    keywords: (data?.keywords ?? []).slice(0, 24).map((k) => ({
      keyword: String(k?.keyword ?? "").slice(0, 120),
      region: (["es", "mx", "us", "gb"].includes(String(k?.region)) ? String(k?.region) : "es") as
        | "es"
        | "mx"
        | "us"
        | "gb",
    })),
  }))
  .handler(async ({ data, context }): Promise<SerpRankings> => {
    await assertAdmin(context.supabase, context.userId);
    const { fetchSerpRanks } = await import("@/lib/keyword-serp.server");
    return fetchSerpRanks(data.keywords, "whatsyour-number.com");
  });

/** Análisis deep de tráfico procedente de LLM / asistentes de IA (solo admins). */
export const getLlmInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => ({
    days: Math.min(Math.max(Number(data?.days ?? 28), 1), 365),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { loadLlmInsights } = await import("@/lib/blog-analytics.server");
    return loadLlmInsights(data.days);
  });
