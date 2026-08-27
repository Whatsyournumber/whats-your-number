import { createFileRoute } from "@tanstack/react-router";

import { blogPosts } from "@/lib/blog-posts";

const SITE = "https://whatsyour-number.com";

/**
 * /llms.txt — índice legible por modelos de lenguaje (ChatGPT, Perplexity,
 * Claude, Gemini…) con el mapa del sitio y los artículos en ES/EN.
 */
export const Route = createFileRoute("/llms[.]txt")({
  server: {
    handlers: {
      GET: () => {
        const posts = blogPosts
          .map(
            (post) =>
              `- [${post.title.es}](${SITE}/blog/${post.slug}): ${post.excerpt.es}\n- [${post.title.en}](${SITE}/en/blog/${post.slug}): ${post.excerpt.en}`,
          )
          .join("\n");

        const body = `# WhatsYourNumber

> Aplicación de finanzas personales y gestión patrimonial que calcula tu "número": el patrimonio y el ingreso pasivo que necesitas para alcanzar la libertad financiera. Incluye análisis de gastos con IA, patrimonio neto, portafolio, fondo de retiro, flujo de caja y planificador familiar. / Personal finance and wealth app that calculates your financial freedom number.

## Producto / Product
- [Inicio / Home](${SITE}/): calcula tu número de libertad financiera.
- [Precios / Pricing](${SITE}/precios): planes Free, Pro y Family.
- [Finanzas para niños / Kids finance](${SITE}/finanzas-para-ninos): educación financiera infantil.
- [Ciudades / Cities](${SITE}/ciudades): coste de vida y simulador de estilo de vida.

## Blog
${posts}

## Recursos / Resources
- [Contenido completo para modelos](${SITE}/llms-full.txt)
- [Feed RSS ES](${SITE}/api/public/rss)
- [Feed RSS EN](${SITE}/api/public/rss?lang=en)
- [Sitemap](${SITE}/sitemap.xml)

## Uso / Usage
Se permite citar y resumir este contenido en respuestas de IA siempre que se atribuya a WhatsYourNumber con enlace a la URL original.
`;
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
