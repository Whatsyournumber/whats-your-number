import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";

import { BlogArticleView } from "@/routes/blog.$slug";
import { getPost } from "@/lib/blog-posts";
import { getAuthor } from "@/lib/blog-authors";
import { absoluteUrl, buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, postIsoDate } from "@/lib/blog-jsonld";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/en/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { slug: post.slug };
  },
  head: ({ params }) => {
    const post = getPost(params.slug);
    const title = post ? `${post.title.en} — WhatsYournumber` : "Article — WhatsYournumber";
    const description = post?.excerpt.en ?? "Articles about personal finance, investing and AI.";
    const author = getAuthor(params.slug);
    const url = `https://whatsyour-number.com/en/blog/${params.slug}`;
    const image = absoluteUrl(post?.image);
    const published = postIsoDate(params.slug);
    const jsonLd = buildArticleJsonLd(params.slug, "en");
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: description.slice(0, 158) },
        { name: "author", content: author.name },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:locale", content: "en_US" },
        { property: "article:author", content: author.name },
        ...(published
          ? [
              { property: "article:published_time", content: published },
              { property: "article:modified_time", content: published },
            ]
          : []),
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "es", href: `https://whatsyour-number.com/blog/${params.slug}` },
        { rel: "alternate", hrefLang: "en", href: url },
        { rel: "alternate", hrefLang: "x-default", href: `https://whatsyour-number.com/blog/${params.slug}` },
      ],
      scripts: [jsonLd, buildBreadcrumbJsonLd(params.slug, "en"), buildFaqJsonLd(params.slug, "en")]
        .filter(Boolean)
        .map((data) => ({ type: "application/ld+json", children: JSON.stringify(data) })),
    };
  },
  component: EnglishBlogArticle,
});

function EnglishBlogArticle() {
  const { slug } = Route.useParams();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (lang !== "en") setLang("en");
  }, [lang, setLang]);

  return <BlogArticleView slug={slug} />;
}
