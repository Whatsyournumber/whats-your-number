/**
 * Dataset del Lifestyle Simulator.
 *
 * Valores aproximados en USD/mes para una persona con estilo de vida medio,
 * construidos a partir de fuentes públicas (Numbeo cost of living, OECD /
 * World Bank income & tax wedge, World Happiness Report, WHO air quality,
 * Global Peace Index, Speedtest Global Index y Nomad List).
 * Son estimaciones de referencia, no cifras oficiales en tiempo real.
 */

export type Climate = "warm" | "beach" | "temperate" | "cold";

export type CityData = {
  id: string;
  name: string;
  country: string;
  photo: string;
  climate: Climate;
  climateLabelEs: string;
  climateLabelEn: string;
  /** Costos mensuales estimados en USD */
  housing: number;
  food: number;
  transport: number;
  healthcare: number;
  education: number;
  internet: number;
  entertainment: number;
  /** Salario neto medio mensual estimado (USD) */
  avgSalary: number;
  /** Carga fiscal efectiva media sobre la renta (%) */
  taxRate: number;
  /** Puntajes 0-100 */
  safety: number;
  healthcareScore: number;
  qualityOfLife: number;
  purchasingPower: number;
  walkability: number;
  publicTransport: number;
  airQuality: number;
  greenSpaces: number;
  internetSpeed: number; // Mbps
  englishFriendly: number;
  remoteWork: number;
  nightlife: number;
  schools: number;
  jobMarket: number;
  beachKm: number;
  intlAirport: boolean;
};

const PHOTO = {
  barcelona: "https://commons.wikimedia.org/wiki/Special:FilePath/Evening_light_over_Barcelona.jpg?width=1200",
  madrid:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg?width=1200",
  valencia:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Malvarrosa_Beach%2C_Valencia%2C_Spain_%2829812271043%29.jpg?width=1200",
  lisbon: "https://commons.wikimedia.org/wiki/Special:FilePath/Lisboa_-_Portugal_%2852597836992%29.jpg?width=1200",
  london: "https://commons.wikimedia.org/wiki/Special:FilePath/London_Skyline_%28125508655%29.jpeg?width=1200",
  dubai: "https://en.wikipedia.org/wiki/Special:FilePath/Burj_Khalifa_2021.jpg?width=1200",
  singapore: "https://commons.wikimedia.org/wiki/Special:FilePath/Marina_Bay_Sands_%28I%29.jpg?width=1200",
  tokyo: "https://commons.wikimedia.org/wiki/Special:FilePath/Shibuya_Crossing%2C_Aerial.jpg?width=1200",
  bangkok: "https://commons.wikimedia.org/wiki/Special:FilePath/4Y1A1159_Bangkok_%2833536795515%29.jpg?width=1200",
  miami: "https://commons.wikimedia.org/wiki/Special:FilePath/Ocean_drive_day_2009j.JPG?width=1200",
  newyork:
    "https://commons.wikimedia.org/wiki/Special:FilePath/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg?width=1200",
  sydney:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg?width=1200",
  vancouver: "https://commons.wikimedia.org/wiki/Special:FilePath/Skyline_of_Vancouver%2C_Canada.jpg?width=1200",
  zurich: "https://commons.wikimedia.org/wiki/Special:FilePath/Altstadt_Z%C3%BCrich_2015.jpg?width=1200",
  amsterdam:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png?width=1200",
  copenhagen:
    "https://commons.wikimedia.org/wiki/Special:FilePath/2018_-_Christiansborg_from_the_Marble_Bridge.jpg?width=1200",
  bali: "https://commons.wikimedia.org/wiki/Special:FilePath/Ubud_%2849818456887%29.jpg?width=1200",
  medellin: "https://commons.wikimedia.org/wiki/Special:FilePath/El_Poblado_Medell%C3%ADn.jpg?width=1200",
};

export const lifestyleCities: CityData[] = [
  {
    id: "barcelona", name: "Barcelona", country: "España", photo: PHOTO.barcelona,
    climate: "beach", climateLabelEs: "Mediterráneo", climateLabelEn: "Mediterranean",
    housing: 1450, food: 520, transport: 60, healthcare: 90, education: 260, internet: 35, entertainment: 380,
    avgSalary: 2450, taxRate: 32,
    safety: 72, healthcareScore: 86, qualityOfLife: 85, purchasingPower: 63, walkability: 93, publicTransport: 88,
    airQuality: 66, greenSpaces: 70, internetSpeed: 190, englishFriendly: 66, remoteWork: 88, nightlife: 92,
    schools: 78, jobMarket: 68, beachKm: 0, intlAirport: true,
  },
  {
    id: "madrid", name: "Madrid", country: "España", photo: PHOTO.madrid,
    climate: "temperate", climateLabelEs: "Continental seco", climateLabelEn: "Dry continental",
    housing: 1400, food: 500, transport: 55, healthcare: 85, education: 250, internet: 33, entertainment: 360,
    avgSalary: 2550, taxRate: 32,
    safety: 76, healthcareScore: 87, qualityOfLife: 84, purchasingPower: 66, walkability: 90, publicTransport: 93,
    airQuality: 68, greenSpaces: 74, internetSpeed: 210, englishFriendly: 60, remoteWork: 84, nightlife: 94,
    schools: 80, jobMarket: 76, beachKm: 350, intlAirport: true,
  },
  {
    id: "valencia", name: "Valencia", country: "España", photo: PHOTO.valencia,
    climate: "beach", climateLabelEs: "Mediterráneo cálido", climateLabelEn: "Warm Mediterranean",
    housing: 1000, food: 430, transport: 45, healthcare: 80, education: 210, internet: 30, entertainment: 290,
    avgSalary: 2050, taxRate: 30,
    safety: 82, healthcareScore: 85, qualityOfLife: 88, purchasingPower: 64, walkability: 92, publicTransport: 82,
    airQuality: 74, greenSpaces: 84, internetSpeed: 200, englishFriendly: 55, remoteWork: 86, nightlife: 78,
    schools: 76, jobMarket: 58, beachKm: 0, intlAirport: true,
  },
  {
    id: "lisbon", name: "Lisboa", country: "Portugal", photo: PHOTO.lisbon,
    climate: "beach", climateLabelEs: "Atlántico templado", climateLabelEn: "Mild Atlantic",
    housing: 1350, food: 470, transport: 45, healthcare: 85, education: 300, internet: 33, entertainment: 320,
    avgSalary: 1750, taxRate: 34,
    safety: 80, healthcareScore: 78, qualityOfLife: 82, purchasingPower: 52, walkability: 85, publicTransport: 78,
    airQuality: 72, greenSpaces: 66, internetSpeed: 180, englishFriendly: 82, remoteWork: 92, nightlife: 86,
    schools: 72, jobMarket: 58, beachKm: 8, intlAirport: true,
  },
  {
    id: "london", name: "Londres", country: "Reino Unido", photo: PHOTO.london,
    climate: "cold", climateLabelEs: "Oceánico fresco", climateLabelEn: "Cool oceanic",
    housing: 2650, food: 620, transport: 200, healthcare: 90, education: 620, internet: 35, entertainment: 520,
    avgSalary: 4100, taxRate: 33,
    safety: 62, healthcareScore: 80, qualityOfLife: 78, purchasingPower: 72, walkability: 88, publicTransport: 95,
    airQuality: 60, greenSpaces: 80, internetSpeed: 150, englishFriendly: 100, remoteWork: 84, nightlife: 95,
    schools: 88, jobMarket: 94, beachKm: 90, intlAirport: true,
  },
  {
    id: "dubai", name: "Dubái", country: "Emiratos Árabes", photo: PHOTO.dubai,
    climate: "warm", climateLabelEs: "Desértico cálido", climateLabelEn: "Hot desert",
    housing: 2300, food: 560, transport: 150, healthcare: 220, education: 750, internet: 90, entertainment: 480,
    avgSalary: 4600, taxRate: 0,
    safety: 92, healthcareScore: 82, qualityOfLife: 76, purchasingPower: 86, walkability: 45, publicTransport: 70,
    airQuality: 45, greenSpaces: 40, internetSpeed: 240, englishFriendly: 92, remoteWork: 82, nightlife: 78,
    schools: 82, jobMarket: 88, beachKm: 0, intlAirport: true,
  },
  {
    id: "singapore", name: "Singapur", country: "Singapur", photo: PHOTO.singapore,
    climate: "warm", climateLabelEs: "Tropical húmedo", climateLabelEn: "Humid tropical",
    housing: 2900, food: 600, transport: 90, healthcare: 200, education: 800, internet: 40, entertainment: 500,
    avgSalary: 4900, taxRate: 15,
    safety: 97, healthcareScore: 95, qualityOfLife: 86, purchasingPower: 82, walkability: 82, publicTransport: 96,
    airQuality: 62, greenSpaces: 88, internetSpeed: 300, englishFriendly: 96, remoteWork: 80, nightlife: 74,
    schools: 94, jobMarket: 92, beachKm: 5, intlAirport: true,
  },
  {
    id: "tokyo", name: "Tokio", country: "Japón", photo: PHOTO.tokyo,
    climate: "temperate", climateLabelEs: "Templado húmedo", climateLabelEn: "Humid temperate",
    housing: 1550, food: 470, transport: 110, healthcare: 120, education: 420, internet: 40, entertainment: 380,
    avgSalary: 2700, taxRate: 30,
    safety: 95, healthcareScore: 92, qualityOfLife: 85, purchasingPower: 62, walkability: 90, publicTransport: 99,
    airQuality: 76, greenSpaces: 62, internetSpeed: 230, englishFriendly: 38, remoteWork: 66, nightlife: 90,
    schools: 90, jobMarket: 80, beachKm: 60, intlAirport: true,
  },
  {
    id: "bangkok", name: "Bangkok", country: "Tailandia", photo: PHOTO.bangkok,
    climate: "warm", climateLabelEs: "Tropical", climateLabelEn: "Tropical",
    housing: 750, food: 320, transport: 60, healthcare: 90, education: 500, internet: 20, entertainment: 250,
    avgSalary: 1150, taxRate: 18,
    safety: 66, healthcareScore: 80, qualityOfLife: 70, purchasingPower: 44, walkability: 58, publicTransport: 74,
    airQuality: 38, greenSpaces: 46, internetSpeed: 230, englishFriendly: 52, remoteWork: 90, nightlife: 92,
    schools: 66, jobMarket: 54, beachKm: 130, intlAirport: true,
  },
  {
    id: "miami", name: "Miami", country: "Estados Unidos", photo: PHOTO.miami,
    climate: "beach", climateLabelEs: "Subtropical cálido", climateLabelEn: "Warm subtropical",
    housing: 2450, food: 620, transport: 220, healthcare: 420, education: 900, internet: 70, entertainment: 520,
    avgSalary: 4300, taxRate: 24,
    safety: 55, healthcareScore: 76, qualityOfLife: 74, purchasingPower: 78, walkability: 60, publicTransport: 48,
    airQuality: 70, greenSpaces: 58, internetSpeed: 220, englishFriendly: 96, remoteWork: 86, nightlife: 90,
    schools: 72, jobMarket: 84, beachKm: 0, intlAirport: true,
  },
  {
    id: "newyork", name: "Nueva York", country: "Estados Unidos", photo: PHOTO.newyork,
    climate: "cold", climateLabelEs: "Continental", climateLabelEn: "Continental",
    housing: 3400, food: 750, transport: 135, healthcare: 480, education: 1100, internet: 65, entertainment: 640,
    avgSalary: 5600, taxRate: 34,
    safety: 58, healthcareScore: 80, qualityOfLife: 74, purchasingPower: 80, walkability: 96, publicTransport: 92,
    airQuality: 62, greenSpaces: 64, internetSpeed: 220, englishFriendly: 100, remoteWork: 82, nightlife: 98,
    schools: 84, jobMarket: 96, beachKm: 25, intlAirport: true,
  },
  {
    id: "sydney", name: "Sídney", country: "Australia", photo: PHOTO.sydney,
    climate: "beach", climateLabelEs: "Oceánico cálido", climateLabelEn: "Warm oceanic",
    housing: 2400, food: 620, transport: 150, healthcare: 180, education: 700, internet: 60, entertainment: 480,
    avgSalary: 4200, taxRate: 30,
    safety: 80, healthcareScore: 88, qualityOfLife: 88, purchasingPower: 78, walkability: 74, publicTransport: 78,
    airQuality: 84, greenSpaces: 86, internetSpeed: 110, englishFriendly: 100, remoteWork: 78, nightlife: 80,
    schools: 88, jobMarket: 82, beachKm: 0, intlAirport: true,
  },
  {
    id: "vancouver", name: "Vancouver", country: "Canadá", photo: PHOTO.vancouver,
    climate: "cold", climateLabelEs: "Oceánico lluvioso", climateLabelEn: "Rainy oceanic",
    housing: 2150, food: 560, transport: 100, healthcare: 90, education: 500, internet: 60, entertainment: 400,
    avgSalary: 3500, taxRate: 31,
    safety: 78, healthcareScore: 86, qualityOfLife: 87, purchasingPower: 68, walkability: 80, publicTransport: 82,
    airQuality: 88, greenSpaces: 94, internetSpeed: 180, englishFriendly: 100, remoteWork: 82, nightlife: 68,
    schools: 88, jobMarket: 76, beachKm: 2, intlAirport: true,
  },
  {
    id: "zurich", name: "Zúrich", country: "Suiza", photo: PHOTO.zurich,
    climate: "cold", climateLabelEs: "Alpino templado", climateLabelEn: "Temperate alpine",
    housing: 2500, food: 780, transport: 90, healthcare: 420, education: 400, internet: 55, entertainment: 520,
    avgSalary: 7200, taxRate: 22,
    safety: 94, healthcareScore: 96, qualityOfLife: 94, purchasingPower: 100, walkability: 86, publicTransport: 97,
    airQuality: 88, greenSpaces: 86, internetSpeed: 240, englishFriendly: 84, remoteWork: 74, nightlife: 62,
    schools: 94, jobMarket: 86, beachKm: 300, intlAirport: true,
  },
  {
    id: "amsterdam", name: "Ámsterdam", country: "Países Bajos", photo: PHOTO.amsterdam,
    climate: "cold", climateLabelEs: "Oceánico fresco", climateLabelEn: "Cool oceanic",
    housing: 2100, food: 560, transport: 100, healthcare: 160, education: 450, internet: 45, entertainment: 430,
    avgSalary: 3600, taxRate: 37,
    safety: 84, healthcareScore: 90, qualityOfLife: 89, purchasingPower: 72, walkability: 97, publicTransport: 92,
    airQuality: 78, greenSpaces: 76, internetSpeed: 200, englishFriendly: 96, remoteWork: 88, nightlife: 88,
    schools: 90, jobMarket: 84, beachKm: 25, intlAirport: true,
  },
  {
    id: "copenhagen", name: "Copenhague", country: "Dinamarca", photo: PHOTO.copenhagen,
    climate: "cold", climateLabelEs: "Nórdico templado", climateLabelEn: "Mild Nordic",
    housing: 2000, food: 600, transport: 90, healthcare: 80, education: 350, internet: 40, entertainment: 430,
    avgSalary: 4200, taxRate: 45,
    safety: 92, healthcareScore: 92, qualityOfLife: 95, purchasingPower: 76, walkability: 96, publicTransport: 92,
    airQuality: 90, greenSpaces: 88, internetSpeed: 230, englishFriendly: 96, remoteWork: 82, nightlife: 76,
    schools: 94, jobMarket: 80, beachKm: 5, intlAirport: true,
  },
  {
    id: "bali", name: "Bali", country: "Indonesia", photo: PHOTO.bali,
    climate: "beach", climateLabelEs: "Tropical de playa", climateLabelEn: "Tropical beach",
    housing: 700, food: 300, transport: 70, healthcare: 90, education: 600, internet: 35, entertainment: 260,
    avgSalary: 850, taxRate: 15,
    safety: 72, healthcareScore: 58, qualityOfLife: 74, purchasingPower: 36, walkability: 40, publicTransport: 28,
    airQuality: 66, greenSpaces: 92, internetSpeed: 90, englishFriendly: 74, remoteWork: 94, nightlife: 78,
    schools: 58, jobMarket: 36, beachKm: 0, intlAirport: true,
  },
  {
    id: "medellin", name: "Medellín", country: "Colombia", photo: PHOTO.medellin,
    climate: "warm", climateLabelEs: "Primavera eterna", climateLabelEn: "Eternal spring",
    housing: 700, food: 320, transport: 55, healthcare: 70, education: 350, internet: 25, entertainment: 240,
    avgSalary: 900, taxRate: 19,
    safety: 52, healthcareScore: 74, qualityOfLife: 72, purchasingPower: 34, walkability: 66, publicTransport: 80,
    airQuality: 54, greenSpaces: 72, internetSpeed: 130, englishFriendly: 42, remoteWork: 88, nightlife: 88,
    schools: 62, jobMarket: 46, beachKm: 300, intlAirport: true,
  },
];

/* ---------------- Filtros y scoring ---------------- */

export type ClimatePref = Climate | "any";
export type SalaryPref = "low_cost" | "balanced" | "high_income" | "highest_paying" | "any";
export type TaxPref = "low" | "medium" | "high" | "any";
export type SafetyPref = "essential" | "important" | "neutral";
export type LifeStage = "single" | "relationship" | "married" | "family" | "single_parent" | "any";
export type GoalPref = "save" | "lifestyle" | "retire" | "family" | "career" | "nomad";

export type ComfortPref = "tight" | "comfortable" | "luxury";

export type Filters = {
  budget: number;
  climate: ClimatePref;
  salary: SalaryPref;
  tax: TaxPref;
  safety: SafetyPref;
  stage: LifeStage;
  goal: GoalPref;
  comfort: ComfortPref;
};

export const defaultFilters: Filters = {
  budget: 5000,
  climate: "any",
  salary: "any",
  tax: "any",
  safety: "important",
  stage: "any",
  goal: "save",
  comfort: "comfortable",
};

/** Cuánto encarece el costo de vida según cómo quieres vivir. */
export const COMFORT_FACTOR: Record<ComfortPref, number> = {
  tight: 0.82,
  comfortable: 1,
  luxury: 1.55,
};


export type Metric =
  | "cost" | "housing" | "salary" | "purchasingPower" | "taxes" | "safety" | "healthcare"
  | "climate" | "internet" | "quality" | "walkability" | "transport" | "air" | "green"
  | "remote" | "english" | "savings" | "retirement" | "schools" | "nightlife" | "jobs";

const BASE_WEIGHTS: Record<Metric, number> = {
  cost: 10, housing: 6, salary: 6, purchasingPower: 6, taxes: 6, safety: 8, healthcare: 6,
  climate: 5, internet: 4, quality: 8, walkability: 4, transport: 4, air: 4, green: 3,
  remote: 3, english: 3, savings: 10, retirement: 6, schools: 3, nightlife: 3, jobs: 4,
};

const STAGE_WEIGHTS: Record<LifeStage, Partial<Record<Metric, number>>> = {
  single: { nightlife: 9, remote: 7, jobs: 8, walkability: 7, english: 5, schools: 0 },
  relationship: { nightlife: 6, quality: 10, walkability: 6, healthcare: 7 },
  married: { quality: 10, safety: 10, housing: 8, healthcare: 8, schools: 5 },
  family: { safety: 14, schools: 10, healthcare: 10, air: 8, green: 8, transport: 7, nightlife: 0 },
  single_parent: { safety: 13, schools: 9, healthcare: 9, cost: 13, transport: 7, nightlife: 0 },
  any: {},
};

const GOAL_WEIGHTS: Record<GoalPref, Partial<Record<Metric, number>>> = {
  save: { savings: 18, cost: 14, taxes: 9, housing: 9 },
  lifestyle: { quality: 14, climate: 10, green: 7, nightlife: 7, walkability: 7 },
  retire: { savings: 18, retirement: 14, taxes: 10, healthcare: 9 },
  family: { safety: 13, schools: 10, healthcare: 9, air: 7, green: 7 },
  career: { jobs: 14, salary: 12, purchasingPower: 9, english: 6 },
  nomad: { remote: 14, internet: 10, english: 8, cost: 10, climate: 8 },
};

const CLIMATE_SCORE: Record<ClimatePref, Record<Climate, number>> = {
  warm: { warm: 100, beach: 85, temperate: 55, cold: 15 },
  beach: { beach: 100, warm: 80, temperate: 50, cold: 15 },
  temperate: { temperate: 100, beach: 75, warm: 60, cold: 55 },
  cold: { cold: 100, temperate: 70, beach: 35, warm: 15 },
  any: { warm: 70, beach: 70, temperate: 70, cold: 70 },
};

export function monthlyCost(c: CityData, stage: LifeStage, comfort: ComfortPref = "comfortable") {
  const base = c.housing + c.food + c.transport + c.healthcare + c.internet + c.entertainment;
  const k = COMFORT_FACTOR[comfort];
  if (stage === "family") return Math.round((base * 1.55 + c.education) * k);
  if (stage === "single_parent") return Math.round((base * 1.3 + c.education * 0.8) * k);
  if (stage === "married" || stage === "relationship") return Math.round(base * 1.4 * k);
  return Math.round(base * k);
}

export function costBreakdown(c: CityData, stage: LifeStage, comfort: ComfortPref = "comfortable") {
  const stageM =
    stage === "family" ? 1.55 : stage === "single_parent" ? 1.3 : stage === "any" || stage === "single" ? 1 : 1.4;
  const m = stageM * COMFORT_FACTOR[comfort];
  const edu = stage === "family" ? c.education : stage === "single_parent" ? Math.round(c.education * 0.8) : 0;
  return {
    housing: Math.round(c.housing * m),
    food: Math.round(c.food * m),
    transport: Math.round(c.transport * m),
    healthcare: Math.round(c.healthcare * m),
    education: Math.round(edu * COMFORT_FACTOR[comfort]),
    internet: c.internet,
    entertainment: Math.round(c.entertainment * m),
  };
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const inv = (value: number, best: number, worst: number) => clamp(((worst - value) / (worst - best)) * 100);

export type CityScore = {
  city: CityData;
  score: number;
  cost: number;
  savings: number;
  savingsRate: number;
  taxLevel: "low" | "medium" | "high";
  retireAge: number | null;
  yearsToRetire: number | null;
  reasons: { label: string; value: number }[];
};

function taxLevel(rate: number): "low" | "medium" | "high" {
  if (rate <= 20) return "low";
  if (rate <= 33) return "medium";
  return "high";
}

/** Años hasta la independencia financiera con la regla del 4%. */
export function yearsToFreedom(currentCapital: number, monthlySavings: number, annualSpend: number, returnRate = 6) {
  const target = annualSpend * 25;
  if (target <= currentCapital) return 0;
  if (monthlySavings <= 0) return null;
  const r = returnRate / 100 / 12;
  let value = currentCapital;
  for (let m = 1; m <= 12 * 60; m++) {
    value = value * (1 + r) + monthlySavings;
    if (value >= target) return Math.round((m / 12) * 10) / 10;
  }
  return null;
}

export function scoreCity(
  c: CityData,
  f: Filters,
  ctx: { netWorth: number; age: number; expectedReturn: number },
): CityScore {
  const cost = monthlyCost(c, f.stage);
  const savings = Math.round(f.budget - cost);
  const savingsRate = f.budget > 0 ? savings / f.budget : 0;

  const salaryScore = (() => {
    const raw = inv(c.avgSalary, 7500, 800);
    switch (f.salary) {
      case "low_cost": return inv(cost, 900, 6000);
      case "high_income": return raw * 0.6 + c.purchasingPower * 0.4;
      case "highest_paying": return raw;
      case "balanced": return c.purchasingPower;
      default: return raw * 0.5 + c.purchasingPower * 0.5;
    }
  })();

  const taxScore = (() => {
    const low = inv(c.taxRate, 0, 45);
    if (f.tax === "low") return low;
    if (f.tax === "medium") return 100 - Math.abs(c.taxRate - 27) * 3.5;
    if (f.tax === "high") return clamp(c.taxRate * 2.2);
    return low * 0.6 + 40;
  })();

  const annualSpend = cost * 12;
  const years = yearsToFreedom(ctx.netWorth, Math.max(0, savings), annualSpend, ctx.expectedReturn);
  const retireAge = years === null ? null : Math.round(ctx.age + years);

  const values: Record<Metric, number> = {
    cost: inv(cost, 900, 7000),
    housing: inv(c.housing, 600, 3500),
    salary: salaryScore,
    purchasingPower: c.purchasingPower,
    taxes: clamp(taxScore),
    safety: c.safety,
    healthcare: c.healthcareScore,
    climate: CLIMATE_SCORE[f.climate][c.climate],
    internet: clamp((c.internetSpeed / 300) * 100),
    quality: c.qualityOfLife,
    walkability: c.walkability,
    transport: c.publicTransport,
    air: c.airQuality,
    green: c.greenSpaces,
    remote: c.remoteWork,
    english: c.englishFriendly,
    savings: clamp(savingsRate * 200),
    retirement: years === null ? 0 : clamp(100 - years * 3),
    schools: c.schools,
    nightlife: c.nightlife,
    jobs: c.jobMarket,
  };

  const weights: Record<Metric, number> = { ...BASE_WEIGHTS };
  for (const [k, v] of Object.entries(STAGE_WEIGHTS[f.stage])) weights[k as Metric] = v!;
  for (const [k, v] of Object.entries(GOAL_WEIGHTS[f.goal])) weights[k as Metric] = v!;
  if (f.safety === "essential") weights.safety = Math.max(weights.safety, 16);
  if (f.safety === "neutral") weights.safety = 3;
  if (f.climate !== "any") weights.climate = Math.max(weights.climate, 10);
  if (f.tax !== "any") weights.taxes = Math.max(weights.taxes, 10);

  let total = 0;
  let weightSum = 0;
  for (const key of Object.keys(weights) as Metric[]) {
    total += values[key] * weights[key];
    weightSum += weights[key];
  }
  let score = weightSum > 0 ? total / weightSum : 0;
  if (cost > f.budget) score *= 0.72; // no alcanza el presupuesto

  const reasons = (Object.keys(weights) as Metric[])
    .map((k) => ({ label: k, value: values[k] * weights[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return {
    city: c,
    score: Math.round(clamp(score)),
    cost,
    savings,
    savingsRate,
    taxLevel: taxLevel(c.taxRate),
    retireAge,
    yearsToRetire: years,
    reasons,
  };
}

export function rankCities(f: Filters, ctx: { netWorth: number; age: number; expectedReturn: number }) {
  return lifestyleCities.map((c) => scoreCity(c, f, ctx)).sort((a, b) => b.score - a.score);
}
