/**
 * Presencia en rankings globales (0-100).
 *
 * Muchas ciudades tienen buenos números "de tabla" pero nunca aparecen en los
 * rankings que la gente realmente consulta. Este índice captura esa señal
 * usando la posición histórica de cada ciudad en:
 *   - InterNations Expat City Ranking (2023-2026)
 *   - Mercer Quality of Living Survey
 *   - Numbeo Quality of Life Index (ciudades)
 *   - Nomad List / Global Liveability Index (EIU)
 *
 * 50 = ciudad que no suele aparecer en ningún ranking global.
 * 90+ = ciudad que aparece de forma recurrente en el top 10.
 */

/** Ciudades que aparecen de forma recurrente en los rankings globales. */
const CITY_PRESENCE: Record<string, number> = {
  // Top recurrente del Expat City Ranking
  valencia: 98,
  malaga: 94,
  panama: 96,
  mexico: 90,
  madrid: 88,
  barcelona: 86,
  lisbon: 88,
  porto: 84,
  bangkok: 88,
  kualalumpur: 86,
  dubai: 90,
  abudhabi: 86,
  singapore: 88,
  hochiminh: 82,
  hanoi: 78,
  saopaulo: 80,
  rio: 80,
  medellin: 84,
  bogota: 76,
  buenosaires: 78,
  montevideo: 78,

  // Mercer / EIU liveability
  vienna: 94,
  zurich: 92,
  geneva: 88,
  copenhagen: 90,
  munich: 86,
  vancouver: 88,
  toronto: 84,
  calgary: 82,
  sydney: 88,
  melbourne: 90,
  adelaide: 84,
  perth: 82,
  brisbane: 82,
  auckland: 86,
  wellington: 82,
  amsterdam: 86,
  rotterdam: 76,
  helsinki: 84,
  oslo: 82,
  stockholm: 82,
  tokyo: 84,
  osaka: 82,
  taipei: 76,
  seoul: 76,
  hongkong: 74,
  dublin: 78,
  edinburgh: 78,
  london: 80,
  paris: 80,
  berlin: 80,
  prague: 82,
  warsaw: 78,
  budapest: 78,
  ljubljana: 78,
  tallinn: 78,
  athens: 76,
  rome: 76,
  milan: 78,
  tbilisi: 78,
  istanbul: 74,
  capetown: 80,
  nairobi: 70,
  marrakech: 74,
  seville: 84,
  palma: 84,
  chiangmai: 84,
  phuket: 80,
  bali: 86,
    newyork: 76,
  miami: 78,
  austin: 76,
  sanfrancisco: 72,
  chicago: 70,
  palermo: 68,
  belgrade: 70,
  tirana: 66,
  sarajevo: 62,
  kotor: 70,
  andorra: 66,
  sanjuan: 66,
  guayaquil: 58,
  sansalvador: 55,
  caracas: 45,
  margarita: 55,
};

/** Refuerzo por país cuando la ciudad no está listada arriba. */
const COUNTRY_PRESENCE: Record<string, number> = {
  "Panamá": 88,
  "México": 84,
  "Tailandia": 84,
  "Emiratos Árabes": 82,
  "Brasil": 78,
  "España": 86,
  "Singapur": 84,
  "Portugal": 84,
  "Malasia": 80,
  "Luxemburgo": 78,
  "Vietnam": 76,
  "Indonesia": 76,
  "Colombia": 74,
  "Costa Rica": 74,
  "Uruguay": 72,
  "Australia": 80,
  "Nueva Zelanda": 78,
  "Suiza": 80,
  "Austria": 80,
  "Dinamarca": 78,
  "Países Bajos": 76,
  "Japón": 74,
  "Taiwán": 70,
  "Canadá": 78,
  "Estados Unidos": 66,
  "Andorra": 66,
  "Montenegro": 66,
  "Serbia": 64,
  "Albania": 62,
  "Bosnia y Herzegovina": 58,
  "Puerto Rico": 64,
  "El Salvador": 54,
  "Venezuela": 45,
};

/** 0-100. 50 = sin presencia relevante en rankings globales. */
export function globalRankingScore(cityId: string, country: string): number {
  return CITY_PRESENCE[cityId] ?? COUNTRY_PRESENCE[country] ?? 55;
}
