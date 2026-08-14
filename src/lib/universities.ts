// Buscador de universidades: costes anuales indicativos (USD, tarifa internacional 2025).
// tuition = matrícula anual media; living = coste de vida anual estimado; years = duración del grado.

export type UniField =
  | "business"
  | "engineering"
  | "health"
  | "arts"
  | "science"
  | "law"
  | "tech"
  | "economics"
  | "architecture"
  | "media"
  | "psychology"
  | "education"
  | "math"
  | "sports";

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
  health: { es: "Salud y medicina", en: "Health & medicine", emoji: "🩺" },
  arts: { es: "Arte y diseño", en: "Arts & design", emoji: "🎨" },
  science: { es: "Ciencias", en: "Science", emoji: "🔬" },
  law: { es: "Derecho", en: "Law", emoji: "⚖️" },
  tech: { es: "Informática y IA", en: "Computer science & AI", emoji: "💻" },
  economics: { es: "Economía y finanzas", en: "Economics & finance", emoji: "💹" },
  architecture: { es: "Arquitectura", en: "Architecture", emoji: "🏛️" },
  media: { es: "Comunicación y medios", en: "Media & communication", emoji: "🎬" },
  psychology: { es: "Psicología", en: "Psychology", emoji: "🧠" },
  education: { es: "Educación", en: "Education", emoji: "📚" },
  math: { es: "Matemáticas y datos", en: "Maths & data", emoji: "📐" },
  sports: { es: "Deporte y nutrición", en: "Sports & nutrition", emoji: "🏅" },
};

/** Carreras derivadas que suelen ofrecerse junto a cada área base. */
const DERIVED: Partial<Record<UniField, UniField[]>> = {
  engineering: ["tech", "math", "architecture"],
  business: ["economics", "media"],
  health: ["psychology", "sports"],
  arts: ["architecture", "media", "education"],
  science: ["math", "tech", "psychology"],
  law: ["economics", "education"],
};

function fieldHash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Áreas de estudio completas (base + derivadas estables) de una universidad. */
export function uniFields(u: University): UniField[] {
  const out = new Set<UniField>(u.fields);
  for (const base of u.fields) {
    for (const extra of DERIVED[base] ?? []) {
      if (fieldHash(`${u.id}:${extra}`) % 3 !== 0) out.add(extra);
    }
  }
  return Array.from(out);
}


export const UNI_REGION_LABELS: Record<University["region"], { es: string; en: string }> = {
  eu: { es: "Europa", en: "Europe" },
  latam: { es: "Latinoamérica", en: "Latin America" },
  na: { es: "Norteamérica", en: "North America" },
  apac: { es: "Asia-Pacífico", en: "Asia-Pacific" },
  other: { es: "Otros", en: "Other" },
};

export const UNIVERSITIES: University[] = [
  // Estados Unidos (Top 100)
  { id: "us-mit", name: "MIT", city: "Boston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 1, fields: ["engineering", "science", "business"], scholarship: true },
  { id: "us-harvard-university", name: "Harvard University", city: "Cambridge", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 59000, living: 18000, years: 4, rank: 2, fields: ["law", "health", "business"], scholarship: true },
  { id: "us-stanford-university", name: "Stanford University", city: "Palo Alto", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 3, fields: ["engineering", "business", "science"], scholarship: true },
  { id: "us-caltech", name: "Caltech", city: "Pasadena", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 18000, years: 4, rank: 4, fields: ["engineering", "science"], scholarship: true },
  { id: "us-princeton-university", name: "Princeton University", city: "Princeton", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 59000, living: 18000, years: 4, rank: 5, fields: ["science", "engineering", "law"], scholarship: true },
  { id: "us-yale-university", name: "Yale University", city: "New Haven", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 64000, living: 18000, years: 4, rank: 6, fields: ["law", "arts", "health"], scholarship: true },
  { id: "us-university-of-chicago", name: "University of Chicago", city: "Chicago", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 7, fields: ["business", "science", "law"], scholarship: true },
  { id: "us-columbia-university", name: "Columbia University", city: "Nueva York", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 66000, living: 18000, years: 4, rank: 8, fields: ["business", "law", "arts"], scholarship: true },
  { id: "us-university-of-pennsylvania", name: "University of Pennsylvania", city: "Filadelfia", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 66000, living: 18000, years: 4, rank: 9, fields: ["business", "health", "law"], scholarship: true },
  { id: "us-cornell-university", name: "Cornell University", city: "Ithaca", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 66000, living: 18000, years: 4, rank: 10, fields: ["engineering", "science", "business"], scholarship: true },
  { id: "us-johns-hopkins-university", name: "Johns Hopkins University", city: "Baltimore", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 63000, living: 18000, years: 4, rank: 11, fields: ["health", "science"], scholarship: true },
  { id: "us-uc-berkeley", name: "UC Berkeley", city: "Berkeley", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 49000, living: 18000, years: 4, rank: 12, fields: ["engineering", "business", "science"] },
  { id: "us-ucla", name: "UCLA", city: "Los Ángeles", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 47000, living: 18000, years: 4, rank: 13, fields: ["health", "arts", "business"] },
  { id: "us-university-of-michigan", name: "University of Michigan", city: "Ann Arbor", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 58000, living: 18000, years: 4, rank: 14, fields: ["engineering", "business", "health"] },
  { id: "us-northwestern-university", name: "Northwestern University", city: "Evanston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 15, fields: ["business", "arts", "law"], scholarship: true },
  { id: "us-duke-university", name: "Duke University", city: "Durham", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 64000, living: 18000, years: 4, rank: 16, fields: ["health", "business", "law"], scholarship: true },
  { id: "us-new-york-university", name: "New York University", city: "Nueva York", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 17, fields: ["business", "arts", "law"], scholarship: true },
  { id: "us-carnegie-mellon-university", name: "Carnegie Mellon University", city: "Pittsburgh", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 63000, living: 18000, years: 4, rank: 18, fields: ["engineering", "arts", "science"], scholarship: true },
  { id: "us-university-of-washington", name: "University of Washington", city: "Seattle", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 42000, living: 18000, years: 4, rank: 19, fields: ["health", "engineering", "science"] },
  { id: "us-georgia-tech", name: "Georgia Tech", city: "Atlanta", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 34000, living: 18000, years: 4, rank: 20, fields: ["engineering", "science", "business"] },
  { id: "us-uc-san-diego", name: "UC San Diego", city: "San Diego", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 47000, living: 18000, years: 4, rank: 21, fields: ["science", "health", "engineering"] },
  { id: "us-university-of-texas-at-austi", name: "University of Texas at Austin", city: "Austin", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 42000, living: 18000, years: 4, rank: 22, fields: ["engineering", "business", "science"] },
  { id: "us-university-of-illinois-urban", name: "University of Illinois Urbana-Champaign", city: "Champaign", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 40000, living: 18000, years: 4, rank: 23, fields: ["engineering", "business", "science"] },
  { id: "us-brown-university", name: "Brown University", city: "Providence", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 24, fields: ["arts", "health", "science"], scholarship: true },
  { id: "us-university-of-wisconsin-madi", name: "University of Wisconsin-Madison", city: "Madison", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 41000, living: 18000, years: 4, rank: 25, fields: ["science", "business", "health"] },
  { id: "us-rice-university", name: "Rice University", city: "Houston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 58000, living: 18000, years: 4, rank: 26, fields: ["engineering", "science", "business"], scholarship: true },
  { id: "us-vanderbilt-university", name: "Vanderbilt University", city: "Nashville", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 63000, living: 18000, years: 4, rank: 27, fields: ["health", "business", "arts"], scholarship: true },
  { id: "us-washington-university-in-st-", name: "Washington University in St. Louis", city: "San Luis", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 63000, living: 18000, years: 4, rank: 28, fields: ["health", "business", "arts"], scholarship: true },
  { id: "us-university-of-north-carolina", name: "University of North Carolina", city: "Chapel Hill", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 39000, living: 18000, years: 4, rank: 29, fields: ["health", "business", "law"] },
  { id: "us-boston-university", name: "Boston University", city: "Boston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 30, fields: ["business", "health", "arts"] },
  { id: "us-purdue-university", name: "Purdue University", city: "West Lafayette", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 30000, living: 18000, years: 4, rank: 31, fields: ["engineering", "science", "business"] },
  { id: "us-ohio-state-university", name: "Ohio State University", city: "Columbus", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 37000, living: 18000, years: 4, rank: 32, fields: ["business", "health", "engineering"] },
  { id: "us-penn-state-university", name: "Penn State University", city: "State College", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 39000, living: 18000, years: 4, rank: 33, fields: ["engineering", "business", "science"] },
  { id: "us-university-of-maryland", name: "University of Maryland", city: "College Park", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 39000, living: 18000, years: 4, rank: 34, fields: ["engineering", "business", "science"] },
  { id: "us-university-of-florida", name: "University of Florida", city: "Gainesville", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 29000, living: 18000, years: 4, rank: 35, fields: ["health", "business", "engineering"] },
  { id: "us-university-of-southern-calif", name: "University of Southern California", city: "Los Ángeles", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 68000, living: 18000, years: 4, rank: 36, fields: ["arts", "business", "engineering"], scholarship: true },
  { id: "us-emory-university", name: "Emory University", city: "Atlanta", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 18000, years: 4, rank: 37, fields: ["health", "business", "law"], scholarship: true },
  { id: "us-university-of-minnesota", name: "University of Minnesota", city: "Mineápolis", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 36000, living: 18000, years: 4, rank: 38, fields: ["health", "engineering", "business"] },
  { id: "us-university-of-virginia", name: "University of Virginia", city: "Charlottesville", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 56000, living: 18000, years: 4, rank: 39, fields: ["business", "law", "science"] },
  { id: "us-michigan-state-university", name: "Michigan State University", city: "East Lansing", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 42000, living: 18000, years: 4, rank: 40, fields: ["science", "business", "health"] },
  { id: "us-uc-davis", name: "UC Davis", city: "Davis", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 46000, living: 18000, years: 4, rank: 41, fields: ["science", "health", "engineering"] },
  { id: "us-uc-irvine", name: "UC Irvine", city: "Irvine", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 46000, living: 18000, years: 4, rank: 42, fields: ["health", "business", "science"] },
  { id: "us-uc-santa-barbara", name: "UC Santa Barbara", city: "Santa Bárbara", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 46000, living: 18000, years: 4, rank: 43, fields: ["science", "arts", "engineering"] },
  { id: "us-texas-a-m-university", name: "Texas A&M University", city: "College Station", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 40000, living: 18000, years: 4, rank: 44, fields: ["engineering", "science", "business"] },
  { id: "us-university-of-pittsburgh", name: "University of Pittsburgh", city: "Pittsburgh", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 38000, living: 18000, years: 4, rank: 45, fields: ["health", "science", "business"] },
  { id: "us-rutgers-university", name: "Rutgers University", city: "New Brunswick", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 35000, living: 18000, years: 4, rank: 46, fields: ["science", "business", "health"] },
  { id: "us-arizona-state-university", name: "Arizona State University", city: "Phoenix", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 47, fields: ["business", "engineering", "arts"] },
  { id: "us-university-of-colorado-bould", name: "University of Colorado Boulder", city: "Boulder", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 40000, living: 18000, years: 4, rank: 48, fields: ["science", "engineering", "business"] },
  { id: "us-university-of-arizona", name: "University of Arizona", city: "Tucson", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 39000, living: 18000, years: 4, rank: 49, fields: ["science", "health", "business"] },
  { id: "us-indiana-university-bloomingt", name: "Indiana University Bloomington", city: "Bloomington", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 40000, living: 18000, years: 4, rank: 50, fields: ["business", "arts", "science"] },
  { id: "us-dartmouth-college", name: "Dartmouth College", city: "Hanover", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 51, fields: ["business", "science", "arts"], scholarship: true },
  { id: "us-georgetown-university", name: "Georgetown University", city: "Washington D.C.", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 52, fields: ["law", "business", "health"], scholarship: true },
  { id: "us-university-of-notre-dame", name: "University of Notre Dame", city: "South Bend", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 53, fields: ["business", "law", "science"], scholarship: true },
  { id: "us-tufts-university", name: "Tufts University", city: "Boston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 65000, living: 18000, years: 4, rank: 54, fields: ["health", "science", "arts"], scholarship: true },
  { id: "us-case-western-reserve-univers", name: "Case Western Reserve University", city: "Cleveland", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 55, fields: ["health", "engineering", "science"], scholarship: true },
  { id: "us-university-of-rochester", name: "University of Rochester", city: "Rochester", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 63000, living: 18000, years: 4, rank: 56, fields: ["health", "arts", "science"], scholarship: true },
  { id: "us-northeastern-university", name: "Northeastern University", city: "Boston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 57, fields: ["engineering", "business", "health"] },
  { id: "us-university-of-miami", name: "University of Miami", city: "Miami", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 18000, years: 4, rank: 58, fields: ["business", "health", "arts"], scholarship: true },
  { id: "us-florida-international-univer", name: "Florida International University", city: "Miami", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 18500, living: 18000, years: 4, rank: 59, fields: ["business", "health", "arts"] },
  { id: "us-university-of-utah", name: "University of Utah", city: "Salt Lake City", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 32000, living: 18000, years: 4, rank: 60, fields: ["health", "engineering", "science"] },
  { id: "us-virginia-tech", name: "Virginia Tech", city: "Blacksburg", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 36000, living: 18000, years: 4, rank: 61, fields: ["engineering", "science", "business"] },
  { id: "us-north-carolina-state-univers", name: "North Carolina State University", city: "Raleigh", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 62, fields: ["engineering", "science", "business"] },
  { id: "us-university-of-iowa", name: "University of Iowa", city: "Iowa City", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 63, fields: ["health", "business", "arts"] },
  { id: "us-university-of-georgia", name: "University of Georgia", city: "Athens", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 32000, living: 18000, years: 4, rank: 64, fields: ["business", "science", "law"] },
  { id: "us-university-of-tennessee", name: "University of Tennessee", city: "Knoxville", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 32000, living: 18000, years: 4, rank: 65, fields: ["engineering", "business", "health"] },
  { id: "us-university-of-massachusetts-", name: "University of Massachusetts Amherst", city: "Amherst", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 39000, living: 18000, years: 4, rank: 66, fields: ["science", "business", "engineering"] },
  { id: "us-stony-brook-university", name: "Stony Brook University", city: "Nueva York", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 32000, living: 18000, years: 4, rank: 67, fields: ["science", "health", "engineering"] },
  { id: "us-university-at-buffalo", name: "University at Buffalo", city: "Buffalo", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 30000, living: 18000, years: 4, rank: 68, fields: ["engineering", "health", "business"] },
  { id: "us-university-of-illinois-chica", name: "University of Illinois Chicago", city: "Chicago", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 31000, living: 18000, years: 4, rank: 69, fields: ["health", "engineering", "business"] },
  { id: "us-colorado-state-university", name: "Colorado State University", city: "Fort Collins", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 70, fields: ["science", "health", "business"] },
  { id: "us-oregon-state-university", name: "Oregon State University", city: "Corvallis", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 34000, living: 18000, years: 4, rank: 71, fields: ["science", "engineering", "business"] },
  { id: "us-university-of-oregon", name: "University of Oregon", city: "Eugene", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 41000, living: 18000, years: 4, rank: 72, fields: ["arts", "business", "science"] },
  { id: "us-washington-state-university", name: "Washington State University", city: "Pullman", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 30000, living: 18000, years: 4, rank: 73, fields: ["science", "business", "health"] },
  { id: "us-university-of-nebraska-linco", name: "University of Nebraska-Lincoln", city: "Lincoln", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 27000, living: 18000, years: 4, rank: 74, fields: ["science", "business", "engineering"] },
  { id: "us-university-of-kansas", name: "University of Kansas", city: "Lawrence", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 30000, living: 18000, years: 4, rank: 75, fields: ["business", "health", "arts"] },
  { id: "us-university-of-missouri", name: "University of Missouri", city: "Columbia (MO)", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 30000, living: 18000, years: 4, rank: 76, fields: ["health", "business", "arts"] },
  { id: "us-university-of-oklahoma", name: "University of Oklahoma", city: "Norman", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 29000, living: 18000, years: 4, rank: 77, fields: ["engineering", "business", "arts"] },
  { id: "us-university-of-kentucky", name: "University of Kentucky", city: "Lexington", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 78, fields: ["health", "business", "engineering"] },
  { id: "us-university-of-south-florida", name: "University of South Florida", city: "Tampa", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 18000, living: 18000, years: 4, rank: 79, fields: ["health", "business", "engineering"] },
  { id: "us-university-of-central-florid", name: "University of Central Florida", city: "Orlando", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 22000, living: 18000, years: 4, rank: 80, fields: ["engineering", "business", "arts"] },
  { id: "us-florida-state-university", name: "Florida State University", city: "Tallahassee", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 22000, living: 18000, years: 4, rank: 81, fields: ["business", "arts", "law"] },
  { id: "us-clemson-university", name: "Clemson University", city: "Clemson", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 40000, living: 18000, years: 4, rank: 82, fields: ["engineering", "business", "science"] },
  { id: "us-auburn-university", name: "Auburn University", city: "Auburn", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 83, fields: ["engineering", "business", "science"] },
  { id: "us-university-of-alabama", name: "University of Alabama", city: "Tuscaloosa", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 33000, living: 18000, years: 4, rank: 84, fields: ["business", "engineering", "health"] },
  { id: "us-louisiana-state-university", name: "Louisiana State University", city: "Baton Rouge", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 30000, living: 18000, years: 4, rank: 85, fields: ["engineering", "business", "science"] },
  { id: "us-university-of-houston", name: "University of Houston", city: "Houston", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 26000, living: 18000, years: 4, rank: 86, fields: ["engineering", "business", "health"] },
  { id: "us-baylor-university", name: "Baylor University", city: "Waco", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 56000, living: 18000, years: 4, rank: 87, fields: ["health", "business", "law"], scholarship: true },
  { id: "us-southern-methodist-universit", name: "Southern Methodist University", city: "Dallas", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 64000, living: 18000, years: 4, rank: 88, fields: ["business", "law", "arts"], scholarship: true },
  { id: "us-syracuse-university", name: "Syracuse University", city: "Syracuse", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 89, fields: ["arts", "business", "law"], scholarship: true },
  { id: "us-fordham-university", name: "Fordham University", city: "Nueva York", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 18000, years: 4, rank: 90, fields: ["business", "law", "arts"], scholarship: true },
  { id: "us-george-washington-university", name: "George Washington University", city: "Washington D.C.", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 64000, living: 18000, years: 4, rank: 91, fields: ["law", "business", "health"], scholarship: true },
  { id: "us-american-university", name: "American University", city: "Washington D.C.", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 56000, living: 18000, years: 4, rank: 92, fields: ["law", "business", "arts"], scholarship: true },
  { id: "us-drexel-university", name: "Drexel University", city: "Filadelfia", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 58000, living: 18000, years: 4, rank: 93, fields: ["engineering", "health", "business"], scholarship: true },
  { id: "us-rensselaer-polytechnic-insti", name: "Rensselaer Polytechnic Institute", city: "Troy", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 62000, living: 18000, years: 4, rank: 94, fields: ["engineering", "science"], scholarship: true },
  { id: "us-stevens-institute-of-technol", name: "Stevens Institute of Technology", city: "Hoboken", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 18000, years: 4, rank: 95, fields: ["engineering", "business", "science"], scholarship: true },
  { id: "us-illinois-institute-of-techno", name: "Illinois Institute of Technology", city: "Chicago", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 50000, living: 18000, years: 4, rank: 96, fields: ["engineering", "science", "business"], scholarship: true },
  { id: "us-rochester-institute-of-techn", name: "Rochester Institute of Technology", city: "Rochester", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 56000, living: 18000, years: 4, rank: 97, fields: ["engineering", "arts", "business"], scholarship: true },
  { id: "us-pepperdine-university", name: "Pepperdine University", city: "Malibú", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 67000, living: 18000, years: 4, rank: 98, fields: ["business", "law", "arts"], scholarship: true },
  { id: "us-santa-clara-university", name: "Santa Clara University", city: "Santa Clara", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 60000, living: 18000, years: 4, rank: 99, fields: ["business", "engineering", "law"], scholarship: true },
  { id: "us-howard-university", name: "Howard University", city: "Washington D.C.", country: "United States", countryEs: "Estados Unidos", flag: "🇺🇸", region: "na", tuition: 34000, living: 18000, years: 4, rank: 100, fields: ["health", "law", "business"], scholarship: true },

  // España
  { id: "es-ie-university", name: "IE University", city: "Madrid", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 24000, living: 12000, years: 4, rank: 225, fields: ["business", "law", "arts"], scholarship: true },
  { id: "es-universidad-complutense", name: "Universidad Complutense", city: "Madrid", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2500, living: 12000, years: 4, rank: 175, fields: ["health", "science", "law"] },
  { id: "es-universitat-de-barcelona", name: "Universitat de Barcelona", city: "Barcelona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2800, living: 12000, years: 4, rank: 149, fields: ["science", "health", "arts"] },
  { id: "es-esade", name: "ESADE", city: "Barcelona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 21000, living: 12000, years: 4, rank: 300, fields: ["business", "law"], scholarship: true },
  { id: "es-universidad-autonoma-de-madr", name: "Universidad Autónoma de Madrid", city: "Madrid", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2400, living: 12000, years: 4, rank: 180, fields: ["science", "law", "health"] },
  { id: "es-universitat-autonoma-de-barc", name: "Universitat Autònoma de Barcelona", city: "Barcelona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2600, living: 12000, years: 4, rank: 154, fields: ["science", "arts", "health"] },
  { id: "es-universidad-de-navarra", name: "Universidad de Navarra", city: "Pamplona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 13500, living: 12000, years: 4, rank: 250, fields: ["health", "business", "law"], scholarship: true },
  { id: "es-universitat-politecnica-de-c", name: "Universitat Politècnica de Catalunya", city: "Barcelona", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 3500, living: 12000, years: 4, rank: 290, fields: ["engineering", "science"] },
  { id: "es-universitat-politecnica-de-v", name: "Universitat Politècnica de València", city: "Valencia", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 3200, living: 12000, years: 4, rank: 340, fields: ["engineering", "arts"] },
  { id: "es-universidad-carlos-iii", name: "Universidad Carlos III", city: "Madrid", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 3000, living: 12000, years: 4, rank: 320, fields: ["business", "law", "engineering"] },
  { id: "es-universidad-de-salamanca", name: "Universidad de Salamanca", city: "Salamanca", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2200, living: 12000, years: 4, rank: 600, fields: ["law", "arts", "science"] },
  { id: "es-universidad-de-granada", name: "Universidad de Granada", city: "Granada", country: "Spain", countryEs: "España", flag: "🇪🇸", region: "eu", tuition: 2100, living: 12000, years: 4, rank: 480, fields: ["health", "science", "arts"] },

  // Reino Unido
  { id: "uk-university-of-oxford", name: "University of Oxford", city: "Oxford", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 40000, living: 15000, years: 3, rank: 3, fields: ["science", "law", "health"], scholarship: true },
  { id: "uk-university-of-cambridge", name: "University of Cambridge", city: "Cambridge", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 40000, living: 15000, years: 3, rank: 5, fields: ["science", "engineering", "law"], scholarship: true },
  { id: "uk-imperial-college-london", name: "Imperial College London", city: "Londres", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 38000, living: 15000, years: 3, rank: 2, fields: ["engineering", "health", "science"], scholarship: true },
  { id: "uk-ucl", name: "UCL", city: "Londres", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 32000, living: 15000, years: 3, rank: 9, fields: ["engineering", "arts", "health"] },
  { id: "uk-london-school-of-economics", name: "London School of Economics", city: "Londres", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 30000, living: 15000, years: 3, rank: 50, fields: ["business", "law"], scholarship: true },
  { id: "uk-university-of-edinburgh", name: "University of Edinburgh", city: "Edimburgo", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 27000, living: 15000, years: 3, rank: 27, fields: ["science", "arts", "business"] },
  { id: "uk-king-s-college-london", name: "King's College London", city: "Londres", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 31000, living: 15000, years: 3, rank: 40, fields: ["health", "law", "arts"] },
  { id: "uk-university-of-manchester", name: "University of Manchester", city: "Mánchester", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 26000, living: 15000, years: 3, rank: 34, fields: ["engineering", "health", "business"] },
  { id: "uk-university-of-bristol", name: "University of Bristol", city: "Bristol", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 26000, living: 15000, years: 3, rank: 54, fields: ["engineering", "science", "arts"] },
  { id: "uk-university-of-warwick", name: "University of Warwick", city: "Coventry", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 27000, living: 15000, years: 3, rank: 69, fields: ["business", "engineering", "science"] },
  { id: "uk-university-of-glasgow", name: "University of Glasgow", city: "Glasgow", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 24000, living: 15000, years: 3, rank: 78, fields: ["health", "science", "law"] },
  { id: "uk-university-of-leeds", name: "University of Leeds", city: "Leeds", country: "United Kingdom", countryEs: "Reino Unido", flag: "🇬🇧", region: "eu", tuition: 24000, living: 15000, years: 3, rank: 82, fields: ["business", "engineering", "arts"] },

  // Alemania
  { id: "de-tu-munchen", name: "TU München", city: "Múnich", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 28, fields: ["engineering", "science"] },
  { id: "de-lmu-munchen", name: "LMU München", city: "Múnich", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 59, fields: ["science", "health", "law"] },
  { id: "de-universitat-heidelberg", name: "Universität Heidelberg", city: "Heidelberg", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 84, fields: ["health", "science"] },
  { id: "de-kit-karlsruhe", name: "KIT Karlsruhe", city: "Karlsruhe", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 3000, living: 13500, years: 3, rank: 119, fields: ["engineering", "science"] },
  { id: "de-rwth-aachen", name: "RWTH Aachen", city: "Aquisgrán", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 99, fields: ["engineering", "science"] },
  { id: "de-humboldt-universitat", name: "Humboldt-Universität", city: "Berlín", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 120, fields: ["arts", "law", "science"] },
  { id: "de-freie-universitat-berlin", name: "Freie Universität Berlin", city: "Berlín", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 97, fields: ["science", "arts", "law"] },
  { id: "de-tu-berlin", name: "TU Berlin", city: "Berlín", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 147, fields: ["engineering", "science"] },
  { id: "de-universitat-hamburg", name: "Universität Hamburg", city: "Hamburgo", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 205, fields: ["science", "law", "health"] },
  { id: "de-goethe-universitat", name: "Goethe-Universität", city: "Fráncfort", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 270, fields: ["business", "law", "science"] },
  { id: "de-universitat-stuttgart", name: "Universität Stuttgart", city: "Stuttgart", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 3000, living: 13500, years: 3, rank: 312, fields: ["engineering", "science"] },
  { id: "de-tu-dresden", name: "TU Dresden", city: "Dresde", country: "Germany", countryEs: "Alemania", flag: "🇩🇪", region: "eu", tuition: 600, living: 13500, years: 3, rank: 340, fields: ["engineering", "health", "science"] },

  // Países Bajos
  { id: "nl-tu-delft", name: "TU Delft", city: "Delft", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 16000, living: 13500, years: 3, rank: 47, fields: ["engineering", "science"] },
  { id: "nl-university-of-amsterdam", name: "University of Amsterdam", city: "Ámsterdam", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 13500, living: 13500, years: 3, rank: 53, fields: ["business", "science", "law"] },
  { id: "nl-erasmus-university-rotterdam", name: "Erasmus University Rotterdam", city: "Róterdam", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 12500, living: 13500, years: 3, rank: 176, fields: ["business", "health", "law"] },
  { id: "nl-utrecht-university", name: "Utrecht University", city: "Utrecht", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 12000, living: 13500, years: 3, rank: 105, fields: ["science", "health", "law"] },
  { id: "nl-leiden-university", name: "Leiden University", city: "Leiden", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 12500, living: 13500, years: 3, rank: 126, fields: ["law", "health", "arts"] },
  { id: "nl-eindhoven-university-of-tech", name: "Eindhoven University of Technology", city: "Eindhoven", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 15000, living: 13500, years: 3, rank: 124, fields: ["engineering", "science"] },
  { id: "nl-university-of-groningen", name: "University of Groningen", city: "Groninga", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 11500, living: 13500, years: 3, rank: 139, fields: ["science", "health", "business"] },
  { id: "nl-maastricht-university", name: "Maastricht University", city: "Maastricht", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 12000, living: 13500, years: 3, rank: 231, fields: ["business", "health", "law"] },
  { id: "nl-vrije-universiteit-amsterdam", name: "Vrije Universiteit Amsterdam", city: "Ámsterdam", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 12000, living: 13500, years: 3, rank: 215, fields: ["science", "health", "business"] },
  { id: "nl-radboud-university", name: "Radboud University", city: "Nimega", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 11000, living: 13500, years: 3, rank: 240, fields: ["health", "science", "arts"] },
  { id: "nl-university-of-twente", name: "University of Twente", city: "Enschede", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 13000, living: 13500, years: 3, rank: 210, fields: ["engineering", "business"] },
  { id: "nl-tilburg-university", name: "Tilburg University", city: "Tilburg", country: "Netherlands", countryEs: "Países Bajos", flag: "🇳🇱", region: "eu", tuition: 10500, living: 13500, years: 3, rank: 350, fields: ["business", "law"] },

  // Francia
  { id: "fr-sorbonne-universite", name: "Sorbonne Université", city: "París", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 3800, living: 14000, years: 3, rank: 59, fields: ["science", "arts", "health"] },
  { id: "fr-sciences-po", name: "Sciences Po", city: "París", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 15000, living: 14000, years: 3, rank: 250, fields: ["law", "business"], scholarship: true },
  { id: "fr-universite-psl", name: "Université PSL", city: "París", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 4000, living: 14000, years: 3, rank: 24, fields: ["science", "arts", "engineering"], scholarship: true },
  { id: "fr-ecole-polytechnique", name: "École Polytechnique", city: "Palaiseau", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 15000, living: 14000, years: 3, rank: 38, fields: ["engineering", "science"], scholarship: true },
  { id: "fr-hec-paris", name: "HEC Paris", city: "Jouy-en-Josas", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 22000, living: 14000, years: 3, rank: 300, fields: ["business"], scholarship: true },
  { id: "fr-universite-paris-saclay", name: "Université Paris-Saclay", city: "Saclay", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 4000, living: 14000, years: 3, rank: 71, fields: ["science", "engineering", "health"] },
  { id: "fr-essec-business-school", name: "ESSEC Business School", city: "Cergy", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 20000, living: 14000, years: 3, rank: 320, fields: ["business", "law"], scholarship: true },
  { id: "fr-universite-grenoble-alpes", name: "Université Grenoble Alpes", city: "Grenoble", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 3500, living: 14000, years: 3, rank: 300, fields: ["engineering", "science"] },
  { id: "fr-universite-de-lyon", name: "Université de Lyon", city: "Lyon", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 3500, living: 14000, years: 3, rank: 330, fields: ["health", "science", "law"] },
  { id: "fr-aix-marseille-universite", name: "Aix-Marseille Université", city: "Marsella", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 3300, living: 14000, years: 3, rank: 420, fields: ["health", "law", "science"] },
  { id: "fr-universite-de-bordeaux", name: "Université de Bordeaux", city: "Burdeos", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 3400, living: 14000, years: 3, rank: 400, fields: ["health", "science", "law"] },
  { id: "fr-insa-lyon", name: "INSA Lyon", city: "Lyon", country: "France", countryEs: "Francia", flag: "🇫🇷", region: "eu", tuition: 6000, living: 14000, years: 3, rank: 450, fields: ["engineering", "science"] },

  // Italia
  { id: "it-bocconi", name: "Bocconi", city: "Milán", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 15000, living: 12000, years: 3, rank: 120, fields: ["business", "law"], scholarship: true },
  { id: "it-politecnico-di-milano", name: "Politecnico di Milano", city: "Milán", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 4000, living: 12000, years: 3, rank: 111, fields: ["engineering", "arts"] },
  { id: "it-sapienza-universita-di-roma", name: "Sapienza Università di Roma", city: "Roma", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 2800, living: 12000, years: 3, rank: 132, fields: ["health", "science", "law"] },
  { id: "it-universita-di-bologna", name: "Università di Bologna", city: "Bolonia", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 3000, living: 12000, years: 3, rank: 133, fields: ["law", "arts", "health"] },
  { id: "it-universita-di-padova", name: "Università di Padova", city: "Padua", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 2800, living: 12000, years: 3, rank: 219, fields: ["health", "science"] },
  { id: "it-politecnico-di-torino", name: "Politecnico di Torino", city: "Turín", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 3500, living: 12000, years: 3, rank: 250, fields: ["engineering", "science"] },
  { id: "it-universita-di-milano", name: "Università di Milano", city: "Milán", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 3200, living: 12000, years: 3, rank: 276, fields: ["health", "science", "law"] },
  { id: "it-universita-di-pisa", name: "Università di Pisa", city: "Pisa", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 2600, living: 12000, years: 3, rank: 349, fields: ["engineering", "science"] },
  { id: "it-universita-di-firenze", name: "Università di Firenze", city: "Florencia", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 2600, living: 12000, years: 3, rank: 400, fields: ["arts", "health", "law"] },
  { id: "it-universita-di-napoli-federic", name: "Università di Napoli Federico II", city: "Nápoles", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 2500, living: 12000, years: 3, rank: 392, fields: ["engineering", "health", "law"] },
  { id: "it-universita-cattolica", name: "Università Cattolica", city: "Milán", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 9000, living: 12000, years: 3, rank: 400, fields: ["business", "health", "law"], scholarship: true },
  { id: "it-universita-di-torino", name: "Università di Torino", city: "Turín", country: "Italy", countryEs: "Italia", flag: "🇮🇹", region: "eu", tuition: 2800, living: 12000, years: 3, rank: 430, fields: ["science", "law", "arts"] },

  // Canadá
  { id: "ca-university-of-toronto", name: "University of Toronto", city: "Toronto", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 45000, living: 15000, years: 4, rank: 25, fields: ["science", "health", "engineering"] },
  { id: "ca-ubc", name: "UBC", city: "Vancouver", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 38000, living: 15000, years: 4, rank: 38, fields: ["science", "business", "arts"] },
  { id: "ca-mcgill-university", name: "McGill University", city: "Montreal", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 27000, living: 15000, years: 4, rank: 29, fields: ["health", "law", "science"] },
  { id: "ca-university-of-alberta", name: "University of Alberta", city: "Edmonton", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 29000, living: 15000, years: 4, rank: 96, fields: ["engineering", "health", "science"] },
  { id: "ca-university-of-waterloo", name: "University of Waterloo", city: "Waterloo", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 45000, living: 15000, years: 4, rank: 115, fields: ["engineering", "science", "business"] },
  { id: "ca-western-university", name: "Western University", city: "London (ON)", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 38000, living: 15000, years: 4, rank: 114, fields: ["business", "health", "law"] },
  { id: "ca-mcmaster-university", name: "McMaster University", city: "Hamilton", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 38000, living: 15000, years: 4, rank: 176, fields: ["health", "engineering", "science"] },
  { id: "ca-university-of-montreal", name: "University of Montreal", city: "Montreal", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 22000, living: 15000, years: 4, rank: 141, fields: ["health", "law", "science"] },
  { id: "ca-queen-s-university", name: "Queen's University", city: "Kingston", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 45000, living: 15000, years: 4, rank: 209, fields: ["business", "engineering", "law"] },
  { id: "ca-university-of-calgary", name: "University of Calgary", city: "Calgary", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 26000, living: 15000, years: 4, rank: 182, fields: ["engineering", "business", "health"] },
  { id: "ca-university-of-ottawa", name: "University of Ottawa", city: "Ottawa", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 30000, living: 15000, years: 4, rank: 203, fields: ["law", "health", "science"] },
  { id: "ca-simon-fraser-university", name: "Simon Fraser University", city: "Vancouver", country: "Canada", countryEs: "Canadá", flag: "🇨🇦", region: "na", tuition: 28000, living: 15000, years: 4, rank: 318, fields: ["business", "science", "arts"] },

  // México
  { id: "mx-unam", name: "UNAM", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 500, living: 8000, years: 4, rank: 94, fields: ["health", "science", "law"] },
  { id: "mx-tec-de-monterrey", name: "Tec de Monterrey", city: "Monterrey", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 15000, living: 8000, years: 4, rank: 170, fields: ["business", "engineering"], scholarship: true },
  { id: "mx-ipn", name: "IPN", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 400, living: 8000, years: 4, rank: 700, fields: ["engineering", "science"] },
  { id: "mx-universidad-iberoamericana", name: "Universidad Iberoamericana", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 11000, living: 8000, years: 4, rank: 800, fields: ["business", "law", "arts"], scholarship: true },
  { id: "mx-itam", name: "ITAM", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 12000, living: 8000, years: 4, rank: 600, fields: ["business", "law", "science"], scholarship: true },
  { id: "mx-udlap", name: "UDLAP", city: "Puebla", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 10000, living: 8000, years: 4, rank: 900, fields: ["business", "engineering", "arts"], scholarship: true },
  { id: "mx-universidad-anahuac", name: "Universidad Anáhuac", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 11500, living: 8000, years: 4, rank: 850, fields: ["business", "health", "law"] },
  { id: "mx-universidad-de-guadalajara", name: "Universidad de Guadalajara", city: "Guadalajara", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 600, living: 8000, years: 4, rank: 650, fields: ["health", "science", "arts"] },
  { id: "mx-uanl", name: "UANL", city: "Monterrey", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 600, living: 8000, years: 4, rank: 750, fields: ["engineering", "health", "business"] },
  { id: "mx-buap", name: "BUAP", city: "Puebla", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 500, living: 8000, years: 4, rank: 1000, fields: ["science", "health", "law"] },
  { id: "mx-universidad-panamericana", name: "Universidad Panamericana", city: "Ciudad de México", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 12000, living: 8000, years: 4, rank: 900, fields: ["business", "law", "health"] },
  { id: "mx-cetys-universidad", name: "CETYS Universidad", city: "Tijuana", country: "Mexico", countryEs: "México", flag: "🇲🇽", region: "latam", tuition: 9000, living: 8000, years: 4, rank: 1100, fields: ["business", "engineering"] },

  // Colombia
  { id: "co-universidad-de-los-andes", name: "Universidad de los Andes", city: "Bogotá", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 9500, living: 6500, years: 5, rank: 234, fields: ["engineering", "business", "law"] },
  { id: "co-universidad-nacional-de-colo", name: "Universidad Nacional de Colombia", city: "Bogotá", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 1500, living: 6500, years: 5, rank: 239, fields: ["engineering", "health", "science"] },
  { id: "co-pontificia-universidad-javer", name: "Pontificia Universidad Javeriana", city: "Bogotá", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 8000, living: 6500, years: 5, rank: 461, fields: ["health", "law", "business"] },
  { id: "co-universidad-de-antioquia", name: "Universidad de Antioquia", city: "Medellín", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 1200, living: 6500, years: 5, rank: 570, fields: ["health", "science", "law"] },
  { id: "co-universidad-eafit", name: "Universidad EAFIT", city: "Medellín", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 7000, living: 6500, years: 5, rank: 700, fields: ["business", "engineering"], scholarship: true },
  { id: "co-universidad-del-rosario", name: "Universidad del Rosario", city: "Bogotá", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 7500, living: 6500, years: 5, rank: 750, fields: ["law", "health", "business"] },
  { id: "co-universidad-del-norte", name: "Universidad del Norte", city: "Barranquilla", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 6500, living: 6500, years: 5, rank: 800, fields: ["engineering", "health", "business"] },
  { id: "co-universidad-externado", name: "Universidad Externado", city: "Bogotá", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 6800, living: 6500, years: 5, rank: 900, fields: ["law", "business"] },
  { id: "co-universidad-icesi", name: "Universidad Icesi", city: "Cali", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 6200, living: 6500, years: 5, rank: 950, fields: ["business", "health", "engineering"] },
  { id: "co-universidad-del-valle", name: "Universidad del Valle", city: "Cali", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 1200, living: 6500, years: 5, rank: 850, fields: ["health", "engineering", "science"] },
  { id: "co-universidad-de-la-sabana", name: "Universidad de La Sabana", city: "Chía", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 7200, living: 6500, years: 5, rank: 1000, fields: ["health", "business", "arts"] },
  { id: "co-universidad-pontificia-boliv", name: "Universidad Pontificia Bolivariana", city: "Medellín", country: "Colombia", countryEs: "Colombia", flag: "🇨🇴", region: "latam", tuition: 6000, living: 6500, years: 5, rank: 1100, fields: ["engineering", "arts", "law"] },

  // Argentina
  { id: "ar-universidad-de-buenos-aires", name: "Universidad de Buenos Aires", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 71, fields: ["health", "law", "science"] },
  { id: "ar-universidad-austral", name: "Universidad Austral", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 9000, living: 5500, years: 5, rank: 400, fields: ["health", "business", "law"], scholarship: true },
  { id: "ar-utdt-torcuato-di-tella", name: "UTDT (Torcuato Di Tella)", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 9500, living: 5500, years: 5, rank: 500, fields: ["business", "law", "arts"], scholarship: true },
  { id: "ar-universidad-nacional-de-cord", name: "Universidad Nacional de Córdoba", city: "Córdoba", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 600, fields: ["health", "engineering", "law"] },
  { id: "ar-universidad-nacional-de-la-p", name: "Universidad Nacional de La Plata", city: "La Plata", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 650, fields: ["science", "health", "law"] },
  { id: "ar-uca-universidad-catolica-arg", name: "UCA (Universidad Católica Argentina)", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 7000, living: 5500, years: 5, rank: 700, fields: ["law", "business", "health"] },
  { id: "ar-utn-universidad-tecnologica-", name: "UTN (Universidad Tecnológica Nacional)", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 800, fields: ["engineering"] },
  { id: "ar-universidad-de-san-andres", name: "Universidad de San Andrés", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 10000, living: 5500, years: 5, rank: 750, fields: ["business", "law", "science"], scholarship: true },
  { id: "ar-universidad-nacional-de-rosa", name: "Universidad Nacional de Rosario", city: "Rosario", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 850, fields: ["health", "engineering", "arts"] },
  { id: "ar-universidad-nacional-de-cuyo", name: "Universidad Nacional de Cuyo", city: "Mendoza", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 0, living: 5500, years: 5, rank: 900, fields: ["science", "health", "arts"] },
  { id: "ar-itba", name: "ITBA", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 9000, living: 5500, years: 5, rank: 950, fields: ["engineering", "science"] },
  { id: "ar-universidad-de-belgrano", name: "Universidad de Belgrano", city: "Buenos Aires", country: "Argentina", countryEs: "Argentina", flag: "🇦🇷", region: "latam", tuition: 6500, living: 5500, years: 5, rank: 1100, fields: ["business", "arts", "law"] },

  // Chile
  { id: "cl-puc-de-chile", name: "PUC de Chile", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 8000, living: 8000, years: 5, rank: 93, fields: ["engineering", "health", "business"] },
  { id: "cl-universidad-de-chile", name: "Universidad de Chile", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 7000, living: 8000, years: 5, rank: 152, fields: ["health", "law", "science"] },
  { id: "cl-universidad-de-concepcion", name: "Universidad de Concepción", city: "Concepción", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 6000, living: 8000, years: 5, rank: 450, fields: ["engineering", "health", "science"] },
  { id: "cl-universidad-adolfo-ibanez", name: "Universidad Adolfo Ibáñez", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 9000, living: 8000, years: 5, rank: 500, fields: ["business", "law"], scholarship: true },
  { id: "cl-universidad-tecnica-federico", name: "Universidad Técnica Federico Santa María", city: "Valparaíso", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 7000, living: 8000, years: 5, rank: 550, fields: ["engineering", "science"] },
  { id: "cl-universidad-de-santiago-usac", name: "Universidad de Santiago (USACH)", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 5500, living: 8000, years: 5, rank: 600, fields: ["engineering", "health", "business"] },
  { id: "cl-universidad-austral-de-chile", name: "Universidad Austral de Chile", city: "Valdivia", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 5000, living: 8000, years: 5, rank: 700, fields: ["science", "health", "arts"] },
  { id: "cl-universidad-diego-portales", name: "Universidad Diego Portales", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 7500, living: 8000, years: 5, rank: 750, fields: ["law", "arts", "business"] },
  { id: "cl-universidad-de-los-andes-chi", name: "Universidad de los Andes (Chile)", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 8500, living: 8000, years: 5, rank: 800, fields: ["health", "business", "law"] },
  { id: "cl-universidad-del-desarrollo", name: "Universidad del Desarrollo", city: "Santiago", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 8200, living: 8000, years: 5, rank: 850, fields: ["health", "business", "engineering"] },
  { id: "cl-universidad-de-valparaiso", name: "Universidad de Valparaíso", city: "Valparaíso", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 5000, living: 8000, years: 5, rank: 900, fields: ["health", "law", "arts"] },
  { id: "cl-universidad-de-la-frontera", name: "Universidad de La Frontera", city: "Temuco", country: "Chile", countryEs: "Chile", flag: "🇨🇱", region: "latam", tuition: 4500, living: 8000, years: 5, rank: 1000, fields: ["health", "science", "engineering"] },

  // Brasil
  { id: "br-universidade-de-sao-paulo", name: "Universidade de São Paulo", city: "São Paulo", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 92, fields: ["science", "health", "engineering"] },
  { id: "br-unicamp", name: "UNICAMP", city: "Campinas", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 219, fields: ["engineering", "science", "health"] },
  { id: "br-ufrj", name: "UFRJ", city: "Río de Janeiro", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 350, fields: ["engineering", "health", "science"] },
  { id: "br-unesp", name: "UNESP", city: "São Paulo", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 400, fields: ["science", "health", "arts"] },
  { id: "br-ufmg", name: "UFMG", city: "Belo Horizonte", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 420, fields: ["health", "engineering", "law"] },
  { id: "br-ufrgs", name: "UFRGS", city: "Porto Alegre", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 450, fields: ["health", "engineering", "science"] },
  { id: "br-puc-rio", name: "PUC-Rio", city: "Río de Janeiro", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 8000, living: 7000, years: 4, rank: 600, fields: ["business", "engineering", "law"], scholarship: true },
  { id: "br-insper", name: "Insper", city: "São Paulo", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 12000, living: 7000, years: 4, rank: 700, fields: ["business", "engineering"], scholarship: true },
  { id: "br-fgv", name: "FGV", city: "São Paulo", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 11000, living: 7000, years: 4, rank: 500, fields: ["business", "law"], scholarship: true },
  { id: "br-unb", name: "UnB", city: "Brasilia", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 650, fields: ["law", "science", "health"] },
  { id: "br-ufsc", name: "UFSC", city: "Florianópolis", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 700, fields: ["engineering", "science", "health"] },
  { id: "br-ufpe", name: "UFPE", city: "Recife", country: "Brazil", countryEs: "Brasil", flag: "🇧🇷", region: "latam", tuition: 0, living: 7000, years: 4, rank: 800, fields: ["health", "engineering", "law"] },

  // Perú, Panamá y Centroamérica
  { id: "lat-pucp", name: "PUCP", city: "Lima", country: "Peru", countryEs: "Perú", flag: "🇵🇪", region: "latam", tuition: 7000, living: 8000, years: 4, rank: 436, fields: ["business", "engineering", "law"] },
  { id: "lat-universidad-de-lima", name: "Universidad de Lima", city: "Lima", country: "Peru", countryEs: "Perú", flag: "🇵🇪", region: "latam", tuition: 6500, living: 8000, years: 4, rank: 700, fields: ["business", "arts", "law"] },
  { id: "lat-upc", name: "UPC", city: "Lima", country: "Peru", countryEs: "Perú", flag: "🇵🇪", region: "latam", tuition: 6000, living: 8000, years: 4, rank: 900, fields: ["engineering", "business", "health"] },
  { id: "lat-universidad-nacional-mayor-d", name: "Universidad Nacional Mayor de San Marcos", city: "Lima", country: "LatAm", countryEs: "Latinoamérica", flag: "🌎", region: "latam", tuition: 800, living: 8000, years: 4, rank: 700, fields: ["health", "law", "science"] },
  { id: "lat-universidad-latina-de-panama", name: "Universidad Latina de Panamá", city: "Ciudad de Panamá", country: "Panama", countryEs: "Panamá", flag: "🇵🇦", region: "latam", tuition: 7500, living: 8000, years: 4, rank: 900, fields: ["business", "health"] },
  { id: "lat-universidad-tecnologica-de-p", name: "Universidad Tecnológica de Panamá", city: "Ciudad de Panamá", country: "Panama", countryEs: "Panamá", flag: "🇵🇦", region: "latam", tuition: 3000, living: 8000, years: 4, rank: 1000, fields: ["engineering", "science"] },
  { id: "lat-incae-business-school", name: "INCAE Business School", city: "San José", country: "Costa Rica", countryEs: "Costa Rica", flag: "🇨🇷", region: "latam", tuition: 14000, living: 8000, years: 4, rank: 600, fields: ["business"], scholarship: true },
  { id: "lat-universidad-de-costa-rica", name: "Universidad de Costa Rica", city: "San José", country: "Costa Rica", countryEs: "Costa Rica", flag: "🇨🇷", region: "latam", tuition: 4000, living: 8000, years: 4, rank: 500, fields: ["health", "science", "law"] },
  { id: "lat-tec-de-costa-rica", name: "Tec de Costa Rica", city: "Cartago", country: "Costa Rica", countryEs: "Costa Rica", flag: "🇨🇷", region: "latam", tuition: 4500, living: 8000, years: 4, rank: 700, fields: ["engineering", "science"] },
  { id: "lat-udla-ecuador", name: "UDLA Ecuador", city: "Quito", country: "Ecuador", countryEs: "Ecuador", flag: "🇪🇨", region: "latam", tuition: 6000, living: 8000, years: 4, rank: 1100, fields: ["business", "health", "arts"] },
  { id: "lat-usfq", name: "USFQ", city: "Quito", country: "Ecuador", countryEs: "Ecuador", flag: "🇪🇨", region: "latam", tuition: 9000, living: 8000, years: 4, rank: 800, fields: ["business", "health", "arts"], scholarship: true },
  { id: "lat-universidad-catolica-del-uru", name: "Universidad Católica del Uruguay", city: "Montevideo", country: "Uruguay", countryEs: "Uruguay", flag: "🇺🇾", region: "latam", tuition: 7000, living: 8000, years: 4, rank: 1000, fields: ["business", "law", "health"] },

  // Asia-Pacífico
  { id: "ap-nus", name: "NUS", city: "Singapur", country: "Singapore", countryEs: "Singapur", flag: "🇸🇬", region: "apac", tuition: 25000, living: 15000, years: 4, rank: 8, fields: ["engineering", "business", "science"], scholarship: true },
  { id: "ap-ntu-singapore", name: "NTU Singapore", city: "Singapur", country: "Singapore", countryEs: "Singapur", flag: "🇸🇬", region: "apac", tuition: 22000, living: 15000, years: 4, rank: 15, fields: ["engineering", "business", "science"], scholarship: true },
  { id: "ap-university-of-melbourne", name: "University of Melbourne", city: "Melbourne", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 33000, living: 15000, years: 4, rank: 13, fields: ["health", "business", "arts"] },
  { id: "ap-university-of-sydney", name: "University of Sydney", city: "Sídney", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 35000, living: 15000, years: 4, rank: 18, fields: ["business", "arts", "health"] },
  { id: "ap-australian-national-universi", name: "Australian National University", city: "Canberra", country: "Asia-Pacific", countryEs: "Asia-Pacífico", flag: "🌏", region: "apac", tuition: 32000, living: 15000, years: 4, rank: 30, fields: ["science", "law", "arts"] },
  { id: "ap-unsw-sydney", name: "UNSW Sydney", city: "Sídney", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 34000, living: 15000, years: 4, rank: 19, fields: ["engineering", "business", "law"] },
  { id: "ap-university-of-queensland", name: "University of Queensland", city: "Brisbane", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 31000, living: 15000, years: 4, rank: 40, fields: ["health", "science", "business"] },
  { id: "ap-monash-university", name: "Monash University", city: "Melbourne", country: "Australia", countryEs: "Australia", flag: "🇦🇺", region: "apac", tuition: 32000, living: 15000, years: 4, rank: 37, fields: ["health", "engineering", "business"] },
  { id: "ap-university-of-auckland", name: "University of Auckland", city: "Auckland", country: "New Zealand", countryEs: "Nueva Zelanda", flag: "🇳🇿", region: "apac", tuition: 26000, living: 15000, years: 4, rank: 65, fields: ["science", "health", "business"] },
  { id: "ap-university-of-tokyo", name: "University of Tokyo", city: "Tokio", country: "Japan", countryEs: "Japón", flag: "🇯🇵", region: "apac", tuition: 5000, living: 15000, years: 4, rank: 32, fields: ["science", "engineering", "health"], scholarship: true },
  { id: "ap-kyoto-university", name: "Kyoto University", city: "Kioto", country: "Japan", countryEs: "Japón", flag: "🇯🇵", region: "apac", tuition: 5000, living: 15000, years: 4, rank: 46, fields: ["science", "engineering", "health"] },
  { id: "ap-waseda-university", name: "Waseda University", city: "Tokio", country: "Japan", countryEs: "Japón", flag: "🇯🇵", region: "apac", tuition: 9000, living: 15000, years: 4, rank: 181, fields: ["business", "science", "arts"], scholarship: true },
  { id: "ap-kaist", name: "KAIST", city: "Daejeon", country: "South Korea", countryEs: "Corea del Sur", flag: "🇰🇷", region: "apac", tuition: 7000, living: 15000, years: 4, rank: 53, fields: ["engineering", "science"], scholarship: true },
  { id: "ap-seoul-national-university", name: "Seoul National University", city: "Seúl", country: "South Korea", countryEs: "Corea del Sur", flag: "🇰🇷", region: "apac", tuition: 6000, living: 15000, years: 4, rank: 31, fields: ["engineering", "health", "law"] },
  { id: "ap-university-of-hong-kong", name: "University of Hong Kong", city: "Hong Kong", country: "Hong Kong", countryEs: "Hong Kong", flag: "🇭🇰", region: "apac", tuition: 22000, living: 15000, years: 4, rank: 17, fields: ["business", "health", "law"] },

  // Otros destinos
  { id: "ot-nyu-abu-dhabi", name: "NYU Abu Dhabi", city: "Abu Dabi", country: "UAE", countryEs: "Emiratos Árabes", flag: "🇦🇪", region: "other", tuition: 58000, living: 14000, years: 4, rank: 30, fields: ["science", "business", "arts"], scholarship: true },
  { id: "ot-khalifa-university", name: "Khalifa University", city: "Abu Dabi", country: "UAE", countryEs: "Emiratos Árabes", flag: "🇦🇪", region: "other", tuition: 25000, living: 14000, years: 4, rank: 202, fields: ["engineering", "science"], scholarship: true },
  { id: "ot-american-university-of-dubai", name: "American University of Dubai", city: "Dubái", country: "UAE", countryEs: "Emiratos Árabes", flag: "🇦🇪", region: "other", tuition: 25000, living: 14000, years: 4, rank: 900, fields: ["business", "arts", "engineering"] },
  { id: "ot-university-of-cape-town", name: "University of Cape Town", city: "Ciudad del Cabo", country: "South Africa", countryEs: "Sudáfrica", flag: "🇿🇦", region: "other", tuition: 7000, living: 14000, years: 4, rank: 171, fields: ["health", "law", "business"] },
  { id: "ot-tel-aviv-university", name: "Tel Aviv University", city: "Tel Aviv", country: "Israel", countryEs: "Israel", flag: "🇮🇱", region: "other", tuition: 18000, living: 14000, years: 4, rank: 215, fields: ["engineering", "health", "law"] },
  { id: "ot-technion", name: "Technion", city: "Haifa", country: "Israel", countryEs: "Israel", flag: "🇮🇱", region: "other", tuition: 17000, living: 14000, years: 4, rank: 258, fields: ["engineering", "science"] },
  { id: "ot-eth-zurich", name: "ETH Zürich", city: "Zúrich", country: "Switzerland", countryEs: "Suiza", flag: "🇨🇭", region: "eu", tuition: 1800, living: 14000, years: 4, rank: 7, fields: ["engineering", "science"] },
  { id: "ot-epfl", name: "EPFL", city: "Lausana", country: "Switzerland", countryEs: "Suiza", flag: "🇨🇭", region: "eu", tuition: 1800, living: 14000, years: 4, rank: 26, fields: ["engineering", "science"] },
  { id: "ot-university-of-copenhagen", name: "University of Copenhagen", city: "Copenhague", country: "Denmark", countryEs: "Dinamarca", flag: "🇩🇰", region: "eu", tuition: 12000, living: 14000, years: 4, rank: 100, fields: ["health", "science"] },
  { id: "ot-kth-royal-institute", name: "KTH Royal Institute", city: "Estocolmo", country: "Sweden", countryEs: "Suecia", flag: "🇸🇪", region: "eu", tuition: 16000, living: 14000, years: 4, rank: 73, fields: ["engineering", "science"] },
  { id: "ot-lund-university", name: "Lund University", city: "Lund", country: "Sweden", countryEs: "Suecia", flag: "🇸🇪", region: "eu", tuition: 15000, living: 14000, years: 4, rank: 85, fields: ["science", "law", "business"] },
  { id: "ot-university-of-warsaw", name: "University of Warsaw", city: "Varsovia", country: "Poland", countryEs: "Polonia", flag: "🇵🇱", region: "eu", tuition: 3500, living: 14000, years: 4, rank: 262, fields: ["business", "science", "law"] },
  { id: "ot-charles-university", name: "Charles University", city: "Praga", country: "Czechia", countryEs: "Chequia", flag: "🇨🇿", region: "eu", tuition: 6000, living: 14000, years: 4, rank: 248, fields: ["health", "law", "science"] },
  { id: "ot-nova-lisboa", name: "NOVA Lisboa", city: "Lisboa", country: "Portugal", countryEs: "Portugal", flag: "🇵🇹", region: "eu", tuition: 7000, living: 14000, years: 4, rank: 400, fields: ["business", "science"] },
  { id: "ot-universidade-do-porto", name: "Universidade do Porto", city: "Oporto", country: "Portugal", countryEs: "Portugal", flag: "🇵🇹", region: "eu", tuition: 7000, living: 14000, years: 4, rank: 275, fields: ["engineering", "health", "science"] },
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
