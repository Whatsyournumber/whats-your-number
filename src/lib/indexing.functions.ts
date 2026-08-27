import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Lanza la indexación acelerada + difusión off-site (solo admins). */
export const runIndexingDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slugs?: string[] } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    const { data: role, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!role) throw new Error("Forbidden: admin only");

    const { SITE, distribute } = await import("@/lib/indexing.server");
    const { blogPosts } = await import("@/lib/blog-posts");

    const slugs = data.slugs?.length ? data.slugs : blogPosts.map((post) => post.slug);
    const urls = [
      SITE,
      `${SITE}/blog`,
      `${SITE}/en/blog`,
      `${SITE}/finanzas-para-ninos`,
      ...slugs.flatMap((slug) => [`${SITE}/blog/${slug}`, `${SITE}/en/blog/${slug}`]),
    ];

    return distribute(urls);
  });
