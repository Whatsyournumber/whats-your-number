// Buscador de universidades: costes anuales indicativos (USD, tarifa internacional 2025).
// tuition = matrícula anual media; living = coste de vida anual estimado; years = duración del grado.

export type UniField = "business" | "engineering" | "health" | "arts" | "science" | "law";

export type University = {
  id: string;
  name: string;
  city: string;
  country: string;
  countryEs: string;
  flag: string;
  region: "eu" | "latam" | "na" | "apac" | "other";
  tuition: number;
  living: number;
  years: number;
  /** Ranking mundial aproximado (posición o rango medio) */
  rank: number;
  fields: UniField[];
  scholarship?: boolean;
};

export const FIELD_LABELS: Record<UniField, { es: string; en: string; emoji: string }> = {
  business: { es: "Negocios", en: "Business", emoji: "📈" },
  engineering: { es: "Ingeniería", en: "Engineering", emoji: "🛠️" },
  health: { es: "Salud", en: "Health", emoji: "🩺" },
  arts: { es: "Arte y diseño", en: "Arts & design", emoji: "🎨" },
  science: { es: "Ciencias", en: "Science", emoji: "🔬" },
  law: { es: "Derecho", en: "Law", emoji: "⚖️" },
};

export const UNI_REGION_LABELS: Record<University["region"], { es: string; en: string }> = {
  eu: { es: "Europa", en: "Europe" },
  latam: { es: "Latinoamérica", en: "Latin America" },
  na: { es: "Norteamérica", en: "North America" },
  apac: { es: "Asia-Pacífico", en: "Asia-Pacific" },
  other: { es: "Otros", en: "Other" },
};

export const UNIVERSITIES: University[] = [
  // Europa
  { id: "ie", name: "IE University", city: "Madrid", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 24000, living: 12000, years: 4, rank: 225, fields: ["business", "law", "arts"], scholarship: true },
  { id: "ucm", name: "Universidad Complutense", city: "Madrid", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2500, living: 11000, years: 4, rank: 175, fields: ["health", "science", "law"] },
  { id: "ub", name: "Universitat de Barcelona", city: "Barcelona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2800, living: 12000, years: 4, rank: 149, fields: ["science", "health", "arts"] },
  { id: "esade", name: "ESADE", city: "Barcelona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 21000, living: 12000, years: 4, rank: 300, fields: ["business", "law"] },
  { id: "tum", name: "TU München", city: "Múnich", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 28, fields: ["engineering", "science"] },
  { id: "lmu", name: "LMU München", city: "Múnich", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 59, fields: ["science", "health", "law"] },
  { id: "tudelft", name: "TU Delft", city: "Delft", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 16000, living: 13000, years: 3, rank: 47, fields: ["engineering", "science"] },
  { id: "uva", name: "University of Amsterdam", city: "Ámsterdam", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 13500, living: 14000, years: 3, rank: 53, fields: ["business", "science", "law"] },
  { id: "bocconi", name: "Bocconi", city: "Milán", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 15000, living: 12000, years: 3, rank: 120, fields: ["business", "law"], scholarship: true },
  { id: "polimi", name: "Politecnico di Milano", city: "Milán", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 4000, living: 12000, years: 3, rank: 111, fields: ["engineering", "arts"] },
  { id: "nova", name: "NOVA Lisboa", city: "Lisboa", country: "Portugal", countryEs: "Portugal", flag: "🇵🇹", region: "eu", tuition: 7000, living: 9000, years: 3, rank: 400, fields: ["business", "science"] },
  { id: "sorbonne", name: "Sorbonne Université", city: "París", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 3800, living: 14000, years: 3, rank: 59, fields: ["science", "arts", "health"] },
  { id: "sciencespo", name: "Sciences Po", city: "París", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 15000, living: 14000, years: 3, rank: 250, fields: ["law", "business"], scholarship: true },
  { id: "oxford", name: "University of Oxford", city: "Oxford", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 40000, living: 16000, years: 3, rank: 3, fields: ["science", "law", "health"], scholarship: true },
  { id: "ucl", name: "UCL", city: "Londres", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 32000, living: 20000, years: 3, rank: 9, fields: ["engineering", "arts", "health"] },
  { id: "edinburgh", name: "University of Edinburgh", city: "Edimburgo", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 27000, living: 14000, years: 4, rank: 27, fields: ["science", "arts", "business"] },
  { id: "ethz", name: "ETH Zürich", city: "Zúrich", country: "Switzerland", countryEs: "Suiza", flag: "🇨🇭", region: "eu", tuition: 1800, living: 24000, years: 3, rank: 7, fields: ["engineering", "science"] },
  { id: "ku", name: "University of Copenhagen", city: "Copenhague", country: "Denmark", countryEs: "Dinamarca", flag: "🇩🇰", region: "eu", tuition: 12000, living: 15000, years: 3, rank: 100, fields: ["health", "science"] },
  { id: "warsaw", name: "University of Warsaw", city: "Varsovia", country: "Poland", countryEs: "Polonia", flag: "🇵🇱", region: "eu", tuition: 3500, living: 7000, years: 3, rank: 262, fields: ["business", "science", "law"] },

  // Norteamérica
  { id: "mit", name: "MIT", city: "Boston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 22000, years: 4, rank: 1, fields: ["engineering", "science", "business"], scholarship: true },
  { id: "stanford", name: "Stanford University", city: "Palo Alto", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 24000, years: 4, rank: 6, fields: ["engineering", "business", "science"], scholarship: true },
  { id: "bu", name: "Boston University", city: "Boston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 20000, years: 4, rank: 108, fields: ["business", "health", "arts"] },
  { id: "asu", name: "Arizona State University", city: "Phoenix", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 14000, years: 4, rank: 179, fields: ["business", "engineering", "arts"] },
  { id: "fiu", name: "Florida International", city: "Miami", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 18500, living: 15000, years: 4, rank: 500, fields: ["business", "health"] },
  { id: "utoronto", name: "University of Toronto", city: "Toronto", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 45000, living: 15000, years: 4, rank: 25, fields: ["science", "health", "engineering"] },
  { id: "ubc", name: "UBC", city: "Vancouver", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 38000, living: 16000, years: 4, rank: 38, fields: ["science", "business", "arts"] },
  { id: "mcgill", name: "McGill University", city: "Montreal", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 27000, living: 13000, years: 4, rank: 29, fields: ["health", "law", "science"] },

  // Latinoamérica
  { id: "unam", name: "UNAM", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 500, living: 7000, years: 4, rank: 94, fields: ["health", "science", "law"] },
  { id: "tec", name: "Tec de Monterrey", city: "Monterrey", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 15000, living: 9000, years: 4, rank: 170, fields: ["business", "engineering"], scholarship: true },
  { id: "andes", name: "Universidad de los Andes", city: "Bogotá", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 9500, living: 6500, years: 5, rank: 234, fields: ["engineering", "business", "law"] },
  { id: "uba", name: "Universidad de Buenos Aires", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 71, fields: ["health", "law", "science"] },
  { id: "puc", name: "PUC de Chile", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 8000, living: 8000, years: 5, rank: 93, fields: ["engineering", "health", "business"] },
  { id: "usp", name: "Universidade de São Paulo", city: "São Paulo", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 92, fields: ["science", "health", "engineering"] },
  { id: "udelas", name: "Universidad Latina", city: "Ciudad de Panamá", country: "Panama", countryEs: "Panamá", flag: "🇵🇦", region: "latam", tuition: 7500, living: 9000, years: 4, rank: 900, fields: ["business", "health"] },

  // Asia-Pacífico y otros
  { id: "nus", name: "NUS", city: "Singapur", country: "Singapore", countryEs: "Singapur", flag: "🇸🇬", region: "apac", tuition: 25000, living: 14000, years: 4, rank: 8, fields: ["engineering", "business", "science"], scholarship: true },
  { id: "unimelb", name: "University of Melbourne", city: "Melbourne", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 33000, living: 18000, years: 3, rank: 13, fields: ["health", "business", "arts"] },
  { id: "usyd", name: "University of Sydney", city: "Sídney", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 35000, living: 19000, years: 3, rank: 18, fields: ["business", "arts", "health"] },
  { id: "waseda", name: "Waseda University", city: "Tokio", country: "Japan", countryEs: "Japón", flag: "🇯🇵", region: "apac", tuition: 9000, living: 12000, years: 4, rank: 181, fields: ["business", "science", "arts"], scholarship: true },
  { id: "nyuad", name: "NYU Abu Dhabi", city: "Abu Dabi", country: "UAE", countryEs: "Emiratos Árabes", flag: "🇦🇪", region: "other", tuition: 58000, living: 16000, years: 4, rank: 30, fields: ["science", "business", "arts"], scholarship: true },
];

/** Coste total del grado en USD (matrícula + vida). */
export function uniTotalUsd(u: University, includeLiving = true) {
  return (u.tuition + (includeLiving ? u.living : 0)) * u.years;
}

/** Proyección de capital: base + aportes mensuales capitalizados hasta la edad objetivo. */
export function projectCapital(base: number, monthly: number, years: number, ratePct: number) {
  const r = ratePct / 100;
  const months = Math.max(0, Math.round(years * 12));
  const rm = Math.pow(1 + r, 1 / 12) - 1;
  const fvBase = base * Math.pow(1 + r, Math.max(0, years));
  const fvMonthly = rm === 0 ? monthly * months : monthly * ((Math.pow(1 + rm, months) - 1) / rm);
  return Math.round(fvBase + fvMonthly);
}
