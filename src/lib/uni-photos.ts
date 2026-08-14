import campusEu1 from "@/assets/uni/campus-eu-1.jpg";
import campusEu2 from "@/assets/uni/campus-eu-2.jpg";
import campusNa1 from "@/assets/uni/campus-na-1.jpg";
import campusNa2 from "@/assets/uni/campus-na-2.jpg";
import campusLatam1 from "@/assets/uni/campus-latam-1.jpg";
import campusApac1 from "@/assets/uni/campus-apac-1.jpg";
import campusOther1 from "@/assets/uni/campus-other-1.jpg";
import campusGeneric1 from "@/assets/uni/campus-generic-1.jpg";
import curatedBuap from "@/assets/uni/mx-buap.jpg";
import curatedUnal from "@/assets/uni/co-unal.jpg";
import curatedAntioquia from "@/assets/uni/co-antioquia.jpg";
import curatedUnivalle from "@/assets/uni/co-univalle.jpg";
import curatedCuyo from "@/assets/uni/ar-cuyo.jpg";
import curatedUnb from "@/assets/uni/br-unb.jpg";
import curatedUfsc from "@/assets/uni/br-ufsc.jpg";
import curatedUfpe from "@/assets/uni/br-ufpe.jpg";
import curatedSanMarcos from "@/assets/uni/pe-sanmarcos.jpg";
import curatedTum from "@/assets/uni/de-tum.jpg";
import curatedLmu from "@/assets/uni/de-lmu.jpg";
import curatedHumboldt from "@/assets/uni/de-humboldt.jpg";
import curatedFuBerlin from "@/assets/uni/de-fu-berlin.jpg";
import curatedTuBerlin from "@/assets/uni/de-tu-berlin.jpg";
import curatedHamburg from "@/assets/uni/de-hamburg.jpg";
import curatedKit from "@/assets/uni/de-kit.jpg";
import curatedPolimi from "@/assets/uni/it-polimi.jpg";
import curatedSapienza from "@/assets/uni/it-sapienza.jpg";
import curatedBologna from "@/assets/uni/it-bologna.jpg";
import curatedFirenze from "@/assets/uni/it-firenze.jpg";
import curatedUfrgs from "@/assets/uni/br-ufrgs.jpg";
import curatedUanl from "@/assets/uni/mx-uanl.jpg";
import curatedUtp from "@/assets/uni/pa-utp.jpg";
import curatedUcr from "@/assets/uni/cr-ucr.jpg";
import curatedGuadalajara from "@/assets/uni/mx-guadalajara.jpg";
import curatedAixMarseille from "@/assets/uni/fr-aix-marseille.jpg";
import curatedGrenoble from "@/assets/uni/fr-grenoble.jpg";
import curatedSalamanca from "@/assets/uni/es-salamanca.jpg";
import curatedComplutense from "@/assets/uni/es-complutense.jpg";
import curatedAutonomaMadrid from "@/assets/uni/es-autonoma-madrid.jpg";
import curatedUb from "@/assets/uni/es-ub.jpg";
import curatedUab from "@/assets/uni/es-uab.jpg";
import curatedUc3m from "@/assets/uni/es-uc3m.jpg";
import curatedUpv from "@/assets/uni/es-upv.jpg";
import curatedEsade from "@/assets/uni/es-esade.jpg";
import curatedIe from "@/assets/uni/es-ie.jpg";
import curatedGranada from "@/assets/uni/es-granada.jpg";
import curatedBelgrano from "@/assets/uni/ar-belgrano.jpg";
import curatedPucRio from "@/assets/uni/br-puc-rio.jpg";
import curatedUcu from "@/assets/uni/uy-ucu.jpg";
import curatedNavarra from "@/assets/uni/es-navarra.jpg";
import curatedLima from "@/assets/uni/pe-lima.jpg";
import curatedInsaLyon from "@/assets/uni/fr-insa-lyon.jpg";
import curatedLatinaPa from "@/assets/uni/pa-latina.jpg";
import curatedBolivariana from "@/assets/uni/co-bolivariana.jpg";
import curatedUca from "@/assets/uni/ar-uca.jpg";
import curatedFrontera from "@/assets/uni/cl-frontera.jpg";
import curatedUninorte from "@/assets/uni/co-uninorte.jpg";
import curatedAustralCl from "@/assets/uni/cl-austral.jpg";
import curatedValparaiso from "@/assets/uni/cl-valparaiso.jpg";
import curatedExternado from "@/assets/uni/co-externado.jpg";
import curatedEafit from "@/assets/uni/co-eafit.jpg";
import curatedUsach from "@/assets/uni/cl-usach.jpg";
import curatedCetys from "@/assets/uni/mx-cetys.jpg";
import curatedUsfq from "@/assets/uni/ec-usfq.jpg";
import curatedConcepcion from "@/assets/uni/cl-concepcion.jpg";
import curatedSabana from "@/assets/uni/co-sabana.jpg";
import curatedRosario from "@/assets/uni/co-rosario.jpg";
import curatedWarsaw from "@/assets/uni/pl-warsaw.jpg";
import curatedTilburg from "@/assets/uni/nl-tilburg.jpg";
import curatedUdlap from "@/assets/uni/mx-udlap.jpg";
import curatedFgv from "@/assets/uni/br-fgv.jpg";
import curatedJaveriana from "@/assets/uni/co-javeriana.jpg";
import curatedAustralAr from "@/assets/uni/ar-austral.jpg";
import curatedItba from "@/assets/uni/ar-itba.jpg";
import curatedRadboud from "@/assets/uni/nl-radboud.jpg";
import curatedGroningen from "@/assets/uni/nl-groningen.jpg";
import curatedIcesi from "@/assets/uni/co-icesi.jpg";
import curatedCattolica from "@/assets/uni/it-cattolica.jpg";

import type { University } from "@/lib/universities";
import { REAL_UNI_PHOTOS } from "@/lib/uni-photos-real";

const POOLS: Record<University["region"], string[]> = {
  eu: [campusEu1, campusEu2, campusGeneric1],
  na: [campusNa1, campusNa2, campusGeneric1],
  latam: [campusLatam1, campusEu1, campusGeneric1],
  apac: [campusApac1, campusEu2, campusNa2],
  other: [campusOther1, campusApac1, campusGeneric1],
};

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Fotos curadas de alta calidad que sustituyen a las fuentes externas. */
const CURATED: Record<string, string> = {
  "mx-buap": curatedBuap,
  "co-universidad-nacional-de-colo": curatedUnal,
  "co-universidad-de-antioquia": curatedAntioquia,
  "co-universidad-del-valle": curatedUnivalle,
  "ar-universidad-nacional-de-cuyo": curatedCuyo,
  "br-unb": curatedUnb,
  "br-ufsc": curatedUfsc,
  "br-ufpe": curatedUfpe,
  "lat-universidad-nacional-mayor-d": curatedSanMarcos,
  "de-tu-munchen": curatedTum,
  "de-lmu-munchen": curatedLmu,
  "de-humboldt-universitat": curatedHumboldt,
  "de-freie-universitat-berlin": curatedFuBerlin,
  "de-tu-berlin": curatedTuBerlin,
  "de-universitat-hamburg": curatedHamburg,
  "de-kit-karlsruhe": curatedKit,
  "it-politecnico-di-milano": curatedPolimi,
  "it-sapienza-universita-di-roma": curatedSapienza,
  "it-universita-di-bologna": curatedBologna,
  "it-universita-di-firenze": curatedFirenze,
  "br-ufrgs": curatedUfrgs,
  "mx-uanl": curatedUanl,
  "lat-universidad-tecnologica-de-p": curatedUtp,
  "lat-universidad-de-costa-rica": curatedUcr,
  "mx-universidad-de-guadalajara": curatedGuadalajara,
  "fr-aix-marseille-universite": curatedAixMarseille,
  "fr-universite-grenoble-alpes": curatedGrenoble,
  "es-universidad-de-salamanca": curatedSalamanca,
  "es-universidad-complutense": curatedComplutense,
  "es-universidad-autonoma-de-madr": curatedAutonomaMadrid,
  "es-universitat-de-barcelona": curatedUb,
  "es-universitat-autonoma-de-barc": curatedUab,
  "es-universidad-carlos-iii": curatedUc3m,
  "es-universitat-politecnica-de-v": curatedUpv,
  "es-esade": curatedEsade,
  "es-ie-university": curatedIe,
  "es-universidad-de-granada": curatedGranada,
  "ar-universidad-de-belgrano": curatedBelgrano,
  "br-puc-rio": curatedPucRio,
  "lat-universidad-catolica-del-uru": curatedUcu,
};

/** Foto de campus premium asignada de forma estable a cada universidad. */
export function uniPhoto(u: University) {
  const curated = CURATED[u.id];
  if (curated) return curated;
  const real = REAL_UNI_PHOTOS[u.id];
  if (real) return real;
  return uniPhotoFallback(u);
}


/** Imagen genérica de respaldo (si la foto real falla al cargar). */
export function uniPhotoFallback(u: University) {
  const pool = POOLS[u.region] ?? POOLS.eu;
  return pool[hash(u.id) % pool.length]!;
}
