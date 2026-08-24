/**
 * Estimación de coste de vida "cómodo" por ciudad (EUR/mes).
 *
 * "Cómodo" = piso de 1-2 dormitorios en zona buena, comer fuera varias veces
 * por semana, transporte (abono o coche), salud privada básica, ocio y un
 * pequeño colchón. Es deliberadamente MÁS caro que el mínimo de supervivencia
 * que publican los índices de coste de vida.
 *
 * Fuentes de referencia: Numbeo (rent + cost of living index), Expatistan,
 * Nomad List y OCDE. Cifras indicativas, no oficiales.
 */
import { cities } from "./onboarding";
import { lifestyleCities } from "./lifestyle-cities";
import { convertAmount } from "./fx";

/**
 * Multiplicador sobre el coste "medio" de los datasets para pasar a vida
 * cómoda (mejor barrio, ocio real, salud privada, imprevistos).
 */
export const COMFORT_FACTOR = 1.35;

/** Colchón mensual para imprevistos, ya incluido en las estimaciones (USD). */
const BUFFER_USD = 150;

/** Coste cómodo mensual estimado (USD) por país, para una persona. */
const COUNTRY_COST_USD: Record<string, number> = {
  // Norteamérica
  US: 4200, CA: 3400, MX: 2100,
  // Europa occidental / norte
  CH: 5600, NO: 4300, IS: 4200, LU: 4300, IE: 4000, DK: 4000, GB: 3900,
  NL: 3800, SE: 3400, FI: 3300, AT: 3300, DE: 3400, FR: 3500, BE: 3200,
  IT: 3000, ES: 2800, PT: 2500, GR: 2300, MT: 2600, CY: 2400,
  // Europa central / este
  CZ: 2300, PL: 2100, HU: 2000, SK: 2000, SI: 2300, HR: 2100, EE: 2200,
  LV: 2000, LT: 2000, RO: 1900, BG: 1800, RS: 1700, BA: 1500, MK: 1400,
  AL: 1400, ME: 1700, UA: 1300, MD: 1300, TR: 1700,
  // LatAm
  PA: 2400, UY: 2300, CL: 2200, CR: 2400, BR: 2100, AR: 2000, CO: 1800,
  PE: 1800, EC: 1700, DO: 1900, GT: 1700, PY: 1600, BO: 1500, SV: 1700,
  HN: 1500, NI: 1400, VE: 1400, PR: 3000,
  // Asia-Pacífico
  SG: 4300, AU: 3800, NZ: 3300, JP: 3000, KR: 2900, HK: 4200, TW: 2400,
  CN: 2400, MY: 1900, TH: 1900, VN: 1500, ID: 1600, PH: 1600, IN: 1400,
  LK: 1300, KH: 1400, NP: 1200, KZ: 1600, GE: 1600, AM: 1500, AZ: 1600,
  // Oriente Medio
  AE: 3900, QA: 3700, SA: 3000, IL: 4000, KW: 3000, BH: 2800, OM: 2500,
  JO: 1900, LB: 1900,
  // África
  ZA: 1900, MA: 1600, EG: 1300, TN: 1300, KE: 1600, NG: 1500, GH: 1500,
  TZ: 1400, SN: 1500, NA: 1700, BW: 1700, MU: 2100, ET: 1300,
};

/** Nombres de país (es/en) → ISO2, para cuando no llega el country_code. */
const COUNTRY_ALIASES: Record<string, string> = {
  "estados unidos": "US", "united states": "US", usa: "US",
  canada: "CA", canadá: "CA", mexico: "MX", méxico: "MX",
  españa: "ES", spain: "ES", portugal: "PT", francia: "FR", france: "FR",
  alemania: "DE", germany: "DE", italia: "IT", italy: "IT",
  "reino unido": "GB", "united kingdom": "GB", inglaterra: "GB",
  "paises bajos": "NL", "países bajos": "NL", netherlands: "NL", holanda: "NL",
  suiza: "CH", switzerland: "CH", austria: "AT", belgica: "BE", bélgica: "BE", belgium: "BE",
  irlanda: "IE", ireland: "IE", dinamarca: "DK", denmark: "DK",
  suecia: "SE", sweden: "SE", noruega: "NO", norway: "NO",
  finlandia: "FI", finland: "FI", islandia: "IS", iceland: "IS",
  grecia: "GR", greece: "GR", polonia: "PL", poland: "PL",
  "republica checa": "CZ", "chequia": "CZ", "czechia": "CZ",
  hungria: "HU", hungría: "HU", hungary: "HU", rumania: "RO", romania: "RO",
  bulgaria: "BG", croacia: "HR", croatia: "HR", serbia: "RS", eslovenia: "SI",
  estonia: "EE", letonia: "LV", lituania: "LT", turquia: "TR", turquía: "TR", turkey: "TR",
  brasil: "BR", brazil: "BR", argentina: "AR", chile: "CL", colombia: "CO",
  peru: "PE", perú: "PE", uruguay: "UY", paraguay: "PY", bolivia: "BO",
  ecuador: "EC", venezuela: "VE", panama: "PA", panamá: "PA",
  "costa rica": "CR", guatemala: "GT", "republica dominicana": "DO", "república dominicana": "DO",
  "puerto rico": "PR", "el salvador": "SV", honduras: "HN", nicaragua: "NI",
  japon: "JP", japón: "JP", japan: "JP", china: "CN", "corea del sur": "KR", "south korea": "KR",
  singapur: "SG", singapore: "SG", tailandia: "TH", thailand: "TH",
  vietnam: "VN", indonesia: "ID", filipinas: "PH", philippines: "PH",
  india: "IN", malasia: "MY", malaysia: "MY", taiwan: "TW", "taiwán": "TW",
  australia: "AU", "nueva zelanda": "NZ", "new zealand": "NZ",
  "emiratos arabes": "AE", "emiratos árabes": "AE", "united arab emirates": "AE",
  israel: "IL", qatar: "QA", "arabia saudi": "SA", "arabia saudí": "SA",
  marruecos: "MA", morocco: "MA", egipto: "EG", egypt: "EG",
  sudafrica: "ZA", sudáfrica: "ZA", "south africa": "ZA",
  kenia: "KE", kenya: "KE", nigeria: "NG", ghana: "GH", "hong kong": "HK",
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

function countryCodeOf(country?: string, code?: string) {
  if (code && code.length === 2) return code.toUpperCase();
  if (!country) return undefined;
  return COUNTRY_ALIASES[norm(country)];
}

/** Ajuste por tamaño de ciudad: las grandes capitales son más caras. */
function sizeFactor(population?: number) {
  if (!population) return 1;
  if (population >= 5_000_000) return 1.2;
  if (population >= 1_500_000) return 1.12;
  if (population >= 500_000) return 1.04;
  if (population >= 150_000) return 0.96;
  return 0.9;
}

/** Coste cómodo mensual en USD para una ciudad conocida del catálogo lifestyle. */
export function comfortableCostUsdFromDataset(name: string) {
  const lc = lifestyleCities.find((c) => norm(c.name) === norm(name));
  if (!lc) return undefined;
  const base = lc.housing + lc.food + lc.transport + lc.healthcare + lc.internet + lc.entertainment;
  return Math.round(base * COMFORT_FACTOR + BUFFER_USD);
}

/**
 * Coste de vida cómodo estimado en EUR/mes.
 * Orden: catálogo curado → dataset lifestyle → tabla por país → media global.
 */
export function comfortableCostEur(opts: {
  name: string;
  country?: string;
  countryCode?: string;
  population?: number;
}) {
  const curated = cities.find((c) => norm(c.name) === norm(opts.name));
  if (curated) return Math.round(convertAmount(curated.cost, curated.currency, "EUR"));

  const dataset = comfortableCostUsdFromDataset(opts.name);
  if (dataset) return Math.round(convertAmount(dataset, "USD", "EUR"));

  const code = countryCodeOf(opts.country, opts.countryCode);
  const usd = (code && COUNTRY_COST_USD[code]) || 2600;
  const value = usd * sizeFactor(opts.population) + BUFFER_USD;
  return Math.round(convertAmount(value, "USD", "EUR") / 50) * 50;
}
