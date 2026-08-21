import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

/** Configuration + connection status for the LinkedIn company page. */
export const linkedinStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { linkedinConfig, getConnection } = await import("@/lib/linkedin.server");
    const cfg = linkedinConfig();
    const conn = await getConnection();
    return {
      configured: cfg.configured,
      redirectUri: cfg.redirectUri,
      orgId: cfg.orgId ?? null,
      connected: Boolean(conn?.access_token),
      orgName: conn?.org_name ?? null,
      expiresAt: conn?.expires_at ?? null,
      scope: conn?.scope ?? null,
    };
  });

/** Starts the OAuth flow: stores a state token and returns the authorize URL. */
export const linkedinAuthorizeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { buildAuthorizeUrl, saveConnection } = await import("@/lib/linkedin.server");
    const state = crypto.randomUUID().replace(/-/g, "");
    await saveConnection({
      oauth_state: state,
      oauth_state_at: new Date().toISOString(),
      connected_by: context.userId,
    });
    return { url: buildAuthorizeUrl(state) };
  });

export const linkedinDisconnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { saveConnection } = await import("@/lib/linkedin.server");
    await saveConnection({
      access_token: null,
      refresh_token: null,
      expires_at: null,
      refresh_expires_at: null,
      oauth_state: null,
      oauth_state_at: null,
    });
    return { ok: true };
  });

/** Publishes a blog article on the LinkedIn company page. */
export const linkedinPublishArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; lang?: "es" | "en"; commentary?: string }) => {
    if (!data?.slug) throw new Error("slug required");
    return { slug: data.slug, lang: data.lang === "en" ? "en" : "es", commentary: data.commentary ?? "" };
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { linkedinConfig, publishOrganizationPost, adminDb } = await import("@/lib/linkedin.server");
    const { blogPosts } = await import("@/lib/blog-posts");
    const { buildCommentary } = await import("@/lib/linkedin-caption");

    const post = blogPosts.find((p) => p.slug === data.slug);
    if (!post) throw new Error("Artículo no encontrado");

    const cfg = linkedinConfig();
    const lang = data.lang as "es" | "en";
    const url = `${cfg.siteUrl}/blog/${post.slug}`;
    const commentary = data.commentary?.trim() || buildCommentary(post, lang, url);

    const db = await adminDb();
    try {
      const result = await publishOrganizationPost({
        commentary,
        articleUrl: url,
        articleTitle: post.title[lang],
        articleDescription: post.excerpt[lang],
      });
      await db.from("linkedin_posts").insert({
        slug: post.slug,
        lang,
        post_urn: result.urn,
        post_url: result.url,
        commentary,
        status: "published",
        created_by: context.userId,
      });
      return { ok: true as const, url: result.url, urn: result.urn };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db.from("linkedin_posts").insert({
        slug: post.slug,
        lang,
        commentary,
        status: "failed",
        error: message.slice(0, 2000),
        created_by: context.userId,
      });
      throw new Error(message);
    }
  });
