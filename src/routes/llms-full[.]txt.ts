import { createFileRoute } from "@tanstack/react-router";

import { blogPosts, type BlogPost } from "@/lib/blog-posts";

const SITE = "https://whatsyour-number.com";

function render(post: BlogPost, lang: "es" | "en") {
  const url = lang === "en" ? `${SITE}/en/blog/${post.slug}` : `${SITE}/blog/${post.slug}`;
  const lines: string[] = [
    `# ${post.title[lang]}`,
    `URL: ${url}`,
    `${lang === "en" ? "Published" : "Publicado"}: ${post.date[lang]} · ${post.readMinutes} min · ${post.tag[lang]}`,
    "",
    post.intro[lang],
    "",
  ];
  for (const section of post.sections) {
    lines.push(`## ${section.heading[lang]}`);
    for (const paragraph of section.paragraphs) lines.push(paragraph[lang], "");
    for (const bullet of section.bullets ?? []) lines.push(`- ${bullet[lang]}`);
    if (section.bullets?.length) lines.push("");
    for (const sub of section.subsections ?? []) {
      lines.push(`### ${sub.heading[lang]}`);
      for (const paragraph of sub.paragraphs ?? []) lines.push(paragraph[lang], "");
      for (const bullet of sub.bullets ?? []) lines.push(`- ${bullet[lang]}`);
      if (sub.bullets?.length) lines.push("");
    }
  }
  lines.push(`> ${post.takeaway[lang]}`, "", "---", "");
  return lines.join("\n");
}

/**
 * /llms-full.txt — texto completo de todos los artículos (ES + EN) en texto
 * plano para que los asistentes de IA puedan citarlos con atribución.
 */
export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: () => {
        const header = `# WhatsYourNumber — contenido completo para modelos de lenguaje
Fuente: ${SITE} · Licencia de uso: cita permitida con atribución y enlace a la URL original.
Actualizado: ${new Date().toISOString()}

---

`;
        const body =
          header +
          blogPosts.map((post) => `${render(post, "es")}${render(post, "en")}`).join("");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
