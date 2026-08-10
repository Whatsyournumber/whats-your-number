/**
 * Estabilidad política e institucional por país (0-100).
 *
 * Estimación construida a partir de indicadores públicos de gobernanza
 * (World Bank Worldwide Governance Indicators — Political Stability &
 * Rule of Law, Global Peace Index y Fragile States Index).
 * Son valores de referencia, no cifras oficiales en tiempo real.
 */

export type StabilityPref = "any" | "medium" | "high" | "veryhigh";

const SCORES: Record<string, number> = {
  Suiza: 97,
  Noruega: 96,
  Nueva_Zelanda: 95,
  "Nueva Zelanda": 95,
  Finlandia: 95,
  Dinamarca: 95,
  Singapur: 94,
  Suecia: 92,
  Austria: 91,
  "Países Bajos": 91,
  Irlanda: 90,
  Canadá: 89,
  Australia: 89,
  Japón: 89,
  Portugal: 88,
  Alemania: 87,
  Bélgica: 84,
  Estonia: 85,
  Eslovenia: 85,
  Malta: 84,
  Uruguay: 84,
  Chequia: 84,
  Taiwán: 82,
  España: 81,
  Lituania: 81,
  Letonia: 81,
  Croacia: 80,
  "Corea del Sur": 79,
  Francia: 78,
  "Reino Unido": 78,
  Italia: 77,
  Eslovaquia: 77,
  Catar: 78,
  "Emiratos Árabes": 79,
  Mauricio: 79,
  Polonia: 76,
  Hungría: 74,
  Grecia: 73,
  Chile: 74,
  "Costa Rica": 80,
  Rumanía: 72,
  Bulgaria: 71,
  Malasia: 70,
  "Estados Unidos": 70,
  Panamá: 70,
  Botsuana: 74,
  Namibia: 71,
  Vietnam: 68,
  China: 66,
  Georgia: 63,
  Kazajistán: 62,
  Ruanda: 66,
  Tailandia: 60,
  Marruecos: 62,
  Indonesia: 62,
  "Rep. Dominicana": 62,
  Paraguay: 60,
  Argentina: 58,
  Brasil: 57,
  India: 57,
  Túnez: 55,
  Sri_Lanka: 54,
  "Sri Lanka": 54,
  Filipinas: 54,
  Ghana: 60,
  Senegal: 58,
  Tanzania: 56,
  Turquía: 52,
  Perú: 52,
  Bolivia: 50,
  México: 50,
  Colombia: 50,
  Sudáfrica: 50,
  Ecuador: 45,
  Egipto: 45,
  Kenia: 48,
  Israel: 45,
  Etiopía: 35,
  Nigeria: 33,
};

/** Puntaje de estabilidad política del país (0-100). */
export function stabilityScore(country: string): number {
  return SCORES[country] ?? 60;
}

export type StabilityLevel = "veryhigh" | "high" | "medium" | "low";

export function stabilityLevel(country: string): StabilityLevel {
  const s = stabilityScore(country);
  if (s >= 85) return "veryhigh";
  if (s >= 72) return "high";
  if (s >= 55) return "medium";
  return "low";
}

const MIN: Record<Exclude<StabilityPref, "any">, number> = {
  medium: 55,
  high: 72,
  veryhigh: 85,
};

export function passesStability(country: string, pref: StabilityPref) {
  if (pref === "any") return true;
  return stabilityScore(country) >= MIN[pref];
}

export function stabilityBadge(country: string, t: (es: string, en: string) => string) {
  const level = stabilityLevel(country);
  const map = {
    veryhigh: { dot: "🟢", text: t("Estabilidad muy alta", "Very high stability") },
    high: { dot: "🟢", text: t("Estabilidad alta", "High stability") },
    medium: { dot: "🟡", text: t("Estabilidad media", "Medium stability") },
    low: { dot: "🔴", text: t("Estabilidad baja", "Low stability") },
  } as const;
  return { ...map[level], score: stabilityScore(country), level };
}
