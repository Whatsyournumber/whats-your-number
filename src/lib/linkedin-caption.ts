import type { BlogPost } from "@/lib/blog-posts";

const HASHTAGS: Record<"es" | "en", string> = {
  es: "#FinanzasPersonales #LibertadFinanciera #Inversion #WhatsYourNumber",
  en: "#PersonalFinance #FinancialFreedom #Investing #WhatsYourNumber",
};

/** Builds a default LinkedIn caption for a blog article. */
export function buildCommentary(post: BlogPost, lang: "es" | "en", url: string) {
  const title = post.title[lang];
  const excerpt = post.excerpt[lang];
  const cta = lang === "es" ? "Léelo completo aquí:" : "Read the full article here:";
  return [title, "", excerpt, "", `${cta} ${url}`, "", HASHTAGS[lang]].join("\n").slice(0, 2900);
}
