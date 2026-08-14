import campusEu1 from "@/assets/uni/campus-eu-1.jpg";
import campusEu2 from "@/assets/uni/campus-eu-2.jpg";
import campusNa1 from "@/assets/uni/campus-na-1.jpg";
import campusNa2 from "@/assets/uni/campus-na-2.jpg";
import campusLatam1 from "@/assets/uni/campus-latam-1.jpg";
import campusApac1 from "@/assets/uni/campus-apac-1.jpg";
import campusOther1 from "@/assets/uni/campus-other-1.jpg";
import campusGeneric1 from "@/assets/uni/campus-generic-1.jpg";

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

/** Foto de campus premium asignada de forma estable a cada universidad. */
export function uniPhoto(u: University) {
  const real = REAL_UNI_PHOTOS[u.id];
  if (real) return real;
  return uniPhotoFallback(u);
}

/** Imagen genérica de respaldo (si la foto real falla al cargar). */
export function uniPhotoFallback(u: University) {
  const pool = POOLS[u.region] ?? POOLS.eu;
  return pool[hash(u.id) % pool.length]!;
}
