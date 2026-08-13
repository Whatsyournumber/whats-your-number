/**
 * Índice de satisfacción de expatriados por país (0-100).
 *
 * Fuente de referencia: InterNations "Expat Insider 2026" (ranking de los
 * mejores países para expatriados) combinado con el Expat Insider histórico
 * 2023-2025 para los países que no aparecen en el top publicado.
 *
 * Se usa como un factor más dentro del pilar "Calidad de vida" del
 * Your North Score, para que el ranking se parezca a los rankings globales
 * de expatriados y no sólo a los índices de costo de vida.
 */

/** Top 10 Expat Insider 2026 (en orden): Panamá, México, Tailandia, EAU,
 *  Brasil, España, Singapur, Portugal, Malasia, Luxemburgo. */
const EXPAT_SCORE: Record<string, number> = {
  // Top 10 publicado
  "Panamá": 96,
  "México": 94,
  "Tailandia": 92,
  "Emiratos Árabes": 90,
  "Brasil": 88,
  "España": 86,
  "Singapur": 84,
  "Portugal": 82,
  "Malasia": 80,
  "Luxemburgo": 78,

  // Resto del ranking (posiciones 11-53 aproximadas)
  "Vietnam": 77,
  "Filipinas": 76,
  "Indonesia": 75,
  "Colombia": 75,
  "Costa Rica": 74,
  "Uruguay": 72,
  "Taiwán": 74,
  "Catar": 73,
  "Omán": 72,
  "Baréin": 72,
  "Kenia": 66,
  "Ecuador": 70,
  "Rep. Dominicana": 70,
  "Paraguay": 66,
  "Bolivia": 62,
  "Perú": 64,
  "Chile": 66,
  "Argentina": 64,
  "Grecia": 72,
  "Chequia": 71,
  "Hungría": 68,
  "Polonia": 70,
  "Rumanía": 68,
  "Bulgaria": 67,
  "Croacia": 70,
  "Eslovenia": 70,
  "Eslovaquia": 66,
  "Estonia": 68,
  "Letonia": 64,
  "Lituania": 66,
  "Georgia": 68,
  "Turquía": 62,
  "Malta": 68,
  "Chipre": 70,
  "Australia": 74,
  "Nueva Zelanda": 72,
  "Canadá": 68,
  "Estados Unidos": 60,
  "Reino Unido": 54,
  "Irlanda": 58,
  "Países Bajos": 66,
  "Bélgica": 56,
  "Francia": 54,
  "Alemania": 50,
  "Austria": 62,
  "Suiza": 62,
  "Italia": 62,
  "Suecia": 56,
  "Dinamarca": 58,
  "Noruega": 60,
  "Finlandia": 60,
  "Japón": 62,
  "Corea del Sur": 58,
  "China": 60,
  "Hong Kong": 58,
  "India": 62,
  "Sri Lanka": 62,
  "Kazajistán": 60,
  "Israel": 58,
  "Sudáfrica": 62,
  "Marruecos": 64,
  "Egipto": 62,
  "Túnez": 62,
  "Ghana": 62,
  "Nigeria": 52,
  "Ruanda": 64,
  "Senegal": 62,
  "Tanzania": 62,
  "Namibia": 64,
  "Botsuana": 64,
  "Etiopía": 54,
  "Mauricio": 72,
  "Andorra": 78,
  "Montenegro": 68,
  "Serbia": 64,
  "Albania": 66,
  "Bosnia y Herzegovina": 60,
  "Puerto Rico": 68,
  "El Salvador": 60,
  "Venezuela": 42,
};

/** Satisfacción de expatriados del país (0-100). 60 = promedio global. */
export function expatScore(country: string): number {
  return EXPAT_SCORE[country] ?? 60;
}
