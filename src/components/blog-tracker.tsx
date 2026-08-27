import { useEffect } from "react";

import { trackBlogView } from "@/lib/blog-analytics.functions";

function sessionId(): string {
  try {
    const key = "wyn_blog_sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function deviceKind(): string {
  if (typeof window === "undefined") return "desconocido";
  const width = window.innerWidth;
  if (width < 640) return "móvil";
  if (width < 1024) return "tablet";
  return "escritorio";
}

/** Registra una visita a un artículo del blog (una vez por artículo y sesión). */
export function BlogTracker({ slug, lang }: { slug: string; lang: "es" | "en" }) {
  useEffect(() => {
    const key = `wyn_blog_seen_${lang}_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* almacenamiento no disponible: registramos igualmente */
    }
    void trackBlogView({
      data: {
        slug,
        lang,
        referrer: document.referrer || "",
        device: deviceKind(),
        sessionId: sessionId(),
      },
    }).catch(() => undefined);
  }, [slug, lang]);

  return null;
}
