/**
 * Your North Score (0-100).
 *
 * Puntuación compuesta por 6 pilares con los pesos definidos por producto.
 * Cada subfactor se normaliza a 0-100 a partir del dataset de ciudades, que
 * está construido con referencias públicas:
 *   Finanzas → Numbeo (costo y alquiler), OECD / World Bank (salarios),
 *              Numbeo (poder adquisitivo), OECD / PwC (impuestos efectivos).
 *   Calidad de vida → OECD Better Life Index, WHO, OECD education,
 *              World Bank (esperanza de vida), World Happiness Report.
 *   Seguridad → Global Peace Index, Numbeo crime index, World Bank Governance.
 *   Estilo de vida → OpenWeather / Meteostat (clima y sol), IQAir (aire),
 *              acceso a playa/naturaleza, Walk Score / OpenStreetMap.
 *   Trabajo → Ookla Speedtest Global Index, Nomad List (coworking y visado),
 *              EF English Proficiency, World Bank Doing Business.
 *   Potencial financiero → cálculo propio con los datos del usuario.
 * Son estimaciones de referencia, no cifras oficiales en tiempo real.
 */
import type { CityData } from "./lifestyle-cities";
import { stabilityScore } from "./political-stability";
import { expatScore } from "./expat-index";

export type PillarKey = "finance" | "quality" | "safety" | "lifestyle" | "work" | "potential";

/** Pesos base (sin filtros activos). */
export const PILLAR_WEIGHTS: Record<PillarKey, number> = {
  finance: 30,
  quality: 25,
  safety: 15,
  lifestyle: 15,
  work: 10,
  potential: 5,
};

export type WeightPrefs = {
  stage?: "single" | "relationship" | "married" | "family" | "single_parent" | "any";
  goal?: "save" | "lifestyle" | "retire" | "family" | "career" | "nomad";
  climate?: string;
  tax?: string;
  salary?: string;
  safety?: string;
  stability?: string;
  region?: string;
};

const GOAL_SHIFT: Record<string, Partial<Record<PillarKey, number>>> = {
  save: { finance: 10, potential: 4, quality: -6, lifestyle: -4, work: -4 },
  retire: { finance: 8, potential: 8, quality: -4, lifestyle: -6, work: -6 },
  lifestyle: { lifestyle: 12, quality: 4, finance: -10, work: -4, potential: -2 },
  family: { safety: 9, quality: 7, lifestyle: -6, work: -6, potential: -4 },
  career: { work: 12, finance: 4, lifestyle: -6, safety: -6, potential: -4 },
  nomad: { work: 14, lifestyle: 5, safety: -6, quality: -6, potential: -7 },
};

const STAGE_SHIFT: Record<string, Partial<Record<PillarKey, number>>> = {
  single: { lifestyle: 8, work: 5, quality: -5, safety: -6, potential: -2 },
  relationship: { lifestyle: 4, quality: 4, safety: -2, work: -4, potential: -2 },
  married: { quality: 6, safety: 5, lifestyle: -4, work: -5, potential: -2 },
  family: { safety: 9, quality: 6, lifestyle: -6, work: -7, potential: -2 },
  single_parent: { safety: 8, finance: 6, quality: 3, lifestyle: -8, work: -7, potential: -2 },
  any: {},
};

/**
 * Pesos de los pilares según lo que buscas en tu vida.
 * Sin filtros activos devuelve la base 30/25/15/15/10/5.
 */
export function pillarWeights(prefs?: WeightPrefs): Record<PillarKey, number> {
  const w = { ...PILLAR_WEIGHTS };
  if (!prefs) return w;
  const add = (shift: Partial<Record<PillarKey, number>>) => {
    for (const [k, v] of Object.entries(shift)) w[k as PillarKey] += v!;
  };
  // "save" es el valor por defecto del filtro: no altera la base.
  if (prefs.goal && prefs.goal !== "save") add(GOAL_SHIFT[prefs.goal] ?? {});
  if (prefs.stage && prefs.stage !== "any") add(STAGE_SHIFT[prefs.stage] ?? {});
  if (prefs.climate && prefs.climate !== "any") add({ lifestyle: 5, finance: -3, work: -2 });
  if (prefs.tax && prefs.tax !== "any") add({ finance: 5, quality: -3, lifestyle: -2 });
  if (prefs.salary && prefs.salary !== "any") add({ work: 4, finance: 3, lifestyle: -4, quality: -3 });
  if (prefs.safety === "essential") add({ safety: 9, lifestyle: -5, work: -4 });
  if (prefs.safety === "neutral") add({ safety: -7, lifestyle: 4, finance: 3 });
  if (prefs.stability && prefs.stability !== "any") add({ safety: 5, quality: -2, work: -3 });

  // Piso mínimo y normalización a 100
  for (const k of Object.keys(w) as PillarKey[]) w[k] = Math.max(3, w[k]);
  const sum = (Object.keys(w) as PillarKey[]).reduce((a, k) => a + w[k], 0);
  let acc = 0;
  const keys = Object.keys(w) as PillarKey[];
  keys.forEach((k, i) => {
    if (i === keys.length - 1) w[k] = 100 - acc;
    else {
      w[k] = Math.round((w[k] / sum) * 100);
      acc += w[k];
    }
  });
  return w;
}

export const PILLAR_META: Record<PillarKey, { emoji: string; es: string; en: string }> = {
  finance: { emoji: "💰", es: "Finanzas", en: "Finances" },
  quality: { emoji: "🌍", es: "Calidad de vida", en: "Quality of life" },
  safety: { emoji: "🛡️", es: "Seguridad", en: "Safety" },
  lifestyle: { emoji: "🌤️", es: "Estilo de vida", en: "Lifestyle" },
  work: { emoji: "💻", es: "Trabajo y conectividad", en: "Work & connectivity" },
  potential: { emoji: "📈", es: "Potencial financiero", en: "Financial potential" },
};

export type PillarBreakdown = {
  key: PillarKey;
  score: number;
  weight: number;
  factors: { es: string; en: string; value: number; source: string; weight?: number }[];
};

export type NorthScore = {
  total: number;
  pillars: PillarBreakdown[];
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
/** Normaliza invirtiendo: `best` → 100, `worst` → 0. */
const inv = (value: number, best: number, worst: number) =>
  Math.max(0, Math.min(100, ((worst - value) / (worst - best)) * 100));

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

/** Promedio ponderado (weight por defecto 1). */
const wavg = (fs: { value: number; weight?: number }[]) => {
  const w = fs.reduce((a, f) => a + (f.weight ?? 1), 0);
  return w > 0 ? fs.reduce((a, f) => a + f.value * (f.weight ?? 1), 0) / w : 0;
};

/** Horas de sol estimadas a partir del tipo de clima (Meteostat / OpenWeather). */
const SUN_SCORE: Record<CityData["climate"], number> = { warm: 92, beach: 88, temperate: 68, cold: 45 };

export function northScore(
  c: CityData,
  ctx: {
    /** Costo mensual estimado según etapa/confort */
    cost: number;
    /** Ahorro potencial mensual con el presupuesto del usuario */
    savings: number;
    savingsRate: number;
    /** Años estimados hasta la libertad financiera */
    yearsToRetire: number | null;
    expectedReturn: number;
    /** Etapa de vida: si es soltero/a, el nightlife pesa alto en estilo de vida */
    stage?: "single" | "relationship" | "married" | "family" | "single_parent" | "any";
    /** Pesos dinámicos por pilar según los filtros del usuario */
    weights?: Record<PillarKey, number>;
  },
): NorthScore {
  const stability = stabilityScore(c.country);
  const expat = expatScore(c.country);

  const finance = [
    { es: "Costo de vida", en: "Cost of living", value: inv(ctx.cost, 900, 7000), source: "Numbeo" },
    { es: "Alquiler promedio", en: "Average rent", value: inv(c.housing, 500, 3800), source: "Numbeo / Idealista / Zillow" },
    { es: "Salario promedio", en: "Average salary", value: inv(c.avgSalary, 7500, 700), source: "OECD / World Bank" },
    { es: "Poder adquisitivo", en: "Purchasing power", value: c.purchasingPower, source: "Numbeo" },
    { es: "Impuestos efectivos", en: "Effective taxes", value: inv(c.taxRate, 5, 48), source: "OECD / PwC" },
  ];

  const quality = [
    { es: "Calidad de vida", en: "Quality of life", value: c.qualityOfLife, source: "OECD Better Life Index" },
    { es: "Sistema de salud", en: "Healthcare system", value: c.healthcareScore, source: "WHO" },
    { es: "Educación", en: "Education", value: c.schools, source: "OECD" },
    {
      es: "Esperanza de vida",
      en: "Life expectancy",
      value: clamp(c.healthcareScore * 0.6 + c.airQuality * 0.4),
      source: "World Bank",
    },
    {
      es: "Índice de felicidad",
      en: "Happiness index",
      value: clamp(c.qualityOfLife * 0.7 + stability * 0.3),
      source: "World Happiness Report",
    },
    {
      es: "Satisfacción de expatriados",
      en: "Expat satisfaction",
      value: expat,
      source: "InterNations Expat Insider 2026",
    },
  ];

  const safety = [
    { es: "Paz global", en: "Global peace", value: clamp(c.safety * 0.6 + stability * 0.4), source: "Global Peace Index" },
    { es: "Índice de criminalidad", en: "Crime index", value: c.safety, source: "Numbeo" },
    { es: "Estabilidad política", en: "Political stability", value: stability, source: "World Bank Governance" },
  ];

  const lifestyle = [
    { es: "Clima", en: "Climate", value: SUN_SCORE[c.climate], source: "OpenWeather / Meteostat" },
    { es: "Horas de sol", en: "Sunshine hours", value: clamp(SUN_SCORE[c.climate] * 0.9 + 5), source: "Meteostat" },
    { es: "Calidad del aire", en: "Air quality", value: c.airQuality, source: "IQAir" },
    {
      es: "Playa y naturaleza",
      en: "Beach & nature",
      value: clamp(inv(c.beachKm, 0, 400) * 0.5 + c.greenSpaces * 0.5),
      source: "OpenStreetMap",
    },
    { es: "Walkability", en: "Walkability", value: clamp(c.walkability * 0.7 + c.publicTransport * 0.3), source: "Walk Score / OSM" },
    {
      es: "Vida nocturna y ocio",
      en: "Nightlife & going out",
      value: c.nightlife,
      source: "Numbeo / Nomad List",
      // Soltero/a → prioridad alta; en pareja/casado → peso medio; con hijos → bajo
      weight:
        ctx.stage === "single"
          ? 3
          : ctx.stage === "relationship"
            ? 1.5
            : ctx.stage === "family" || ctx.stage === "single_parent"
              ? 0.5
              : 1,
    },
  ];

  const work = [
    { es: "Velocidad de internet", en: "Internet speed", value: clamp((c.internetSpeed / 250) * 100), source: "Ookla Speedtest" },
    { es: "Coworking", en: "Coworking spaces", value: clamp(c.remoteWork * 0.7 + c.jobMarket * 0.3), source: "Nomad List" },
    { es: "Visa nómada digital", en: "Digital nomad visa", value: c.remoteWork, source: "Nomad List" },
    { es: "Nivel de inglés", en: "English level", value: c.englishFriendly, source: "EF EPI" },
    { es: "Facilidad de instalarse", en: "Ease of settling in", value: clamp(expat * 0.7 + c.englishFriendly * 0.3), source: "InterNations Expat Insider 2026" },
    { es: "Hacer negocios", en: "Ease of doing business", value: clamp(c.jobMarket * 0.6 + stability * 0.4), source: "World Bank" },
  ];

  const growth = clamp(50 + (ctx.expectedReturn - 5) * 8 + ctx.savingsRate * 60);
  const potential = [
    { es: "Capacidad de ahorro", en: "Saving capacity", value: clamp(ctx.savingsRate * 200), source: "Your North" },
    {
      es: "Tiempo hasta el retiro",
      en: "Time to retirement",
      value: ctx.yearsToRetire === null ? 0 : clamp(100 - ctx.yearsToRetire * 3),
      source: "Your North",
    },
    { es: "Crecimiento del patrimonio", en: "Wealth growth", value: growth, source: "Your North" },
  ];

  const groups: Record<PillarKey, typeof finance> = { finance, quality, safety, lifestyle, work, potential };

  const weights = ctx.weights ?? PILLAR_WEIGHTS;
  const pillars: PillarBreakdown[] = (Object.keys(weights) as PillarKey[]).map((key) => ({
    key,
    weight: weights[key],
    score: clamp(wavg(groups[key])),
    factors: groups[key].map((f) => ({ ...f, value: clamp(f.value) })),
  }));

  const total = clamp(
    pillars.reduce((acc, p) => acc + p.score * p.weight, 0) /
      pillars.reduce((acc, p) => acc + p.weight, 0),
  );

  return { total, pillars };
}
