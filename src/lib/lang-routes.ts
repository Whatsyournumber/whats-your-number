/** Mapeo de URLs equivalentes ES <-> EN para el selector de idioma. */

const ES_TO_EN: Array<[string, string]> = [
  ["/finanzas-para-ninos", "/en/finance-for-kids"],
  ["/demo", "/en/demo"],
  ["/blog", "/en/blog"],
  ["/", "/en"],
];

/** Devuelve la ruta equivalente en el idioma pedido, o null si no hay par. */
export function localizedPath(pathname: string, target: "es" | "en"): string | null {
  const clean = pathname.replace(/\/+$/, "") || "/";

  if (target === "en") {
    if (clean === "/en" || clean.startsWith("/en/")) return null;
    for (const [es, en] of ES_TO_EN) {
      if (es === "/") continue;
      if (clean === es) return en;
      if (clean.startsWith(`${es}/`)) return en + clean.slice(es.length);
    }
    return clean === "/" ? "/en" : null;
  }

  if (clean !== "/en" && !clean.startsWith("/en/")) return null;
  if (clean === "/en") return "/";
  for (const [es, en] of ES_TO_EN) {
    if (clean === en) return es;
    if (clean.startsWith(`${en}/`)) return es + clean.slice(en.length);
  }
  return null;
}

/** Idioma implícito en la URL (null si la ruta no es específica de idioma). */
export function langFromPath(pathname: string): "en" | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return clean === "/en" || clean.startsWith("/en/") ? "en" : null;
}
