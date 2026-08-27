/**
 * Secciones adicionales por artículo (ampliación de contenido para SEO/GEO).
 * Cada archivo exporta un array de BlogSection que se añade al final de las
 * secciones del artículo, antes del bloque "Nuestra visión".
 */

import type { BlogSection } from "@/lib/blog-posts";

import boringBusiness from "./boring-business-comprar-libertad-financiera";
import kids100k from "./100k-hijo-18-anos-sp500";
import ricoVsAdinerado from "./rico-vs-adinerado";
import patrimonioNeto from "./calcular-patrimonio-neto-real";
import runway from "./runway-personal";
import portafolio from "./portafolio-vs-sp500";
import gastosIa from "./clasificacion-automatica-gastos-ia";
import numeroLibertad from "./numero-libertad-financiera";
import revision20 from "./revision-financiera-20-minutos";

export const extraSections: Record<string, BlogSection[]> = {
  "boring-business-comprar-libertad-financiera": boringBusiness,
  "100k-hijo-18-anos-sp500": kids100k,
  "rico-vs-adinerado": ricoVsAdinerado,
  "calcular-patrimonio-neto-real": patrimonioNeto,
  "runway-personal": runway,
  "portafolio-vs-sp500": portafolio,
  "clasificacion-automatica-gastos-ia": gastosIa,
  "numero-libertad-financiera": numeroLibertad,
  "revision-financiera-20-minutos": revision20,
};
