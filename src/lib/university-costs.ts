// Average university costs by country (USD per year, indicative 2025 estimates).
// tuitionPublic / tuitionPrivate = average annual tuition for a bachelor's degree.
// living = average annual student living cost (housing, food, transport).
// years = typical bachelor's duration.

export type UniversityCountry = {
  code: string;
  flag: string;
  name: { es: string; en: string };
  region: "eu" | "latam" | "na" | "apac" | "other";
  tuitionPublic: number;
  tuitionPrivate: number;
  living: number;
  years: number;
  note: { es: string; en: string };
};

export const UNIVERSITY_COUNTRIES: UniversityCountry[] = [
  {
    code: "ES", flag: "🇪🇸", name: { es: "España", en: "Spain" }, region: "eu",
    tuitionPublic: 1500, tuitionPrivate: 11000, living: 9600, years: 4,
    note: { es: "Pública muy asequible; privadas top (IE, ESADE) mucho más caras.", en: "Very affordable public system; top private schools (IE, ESADE) cost far more." },
  },
  {
    code: "US", flag: "🇺🇸", name: { es: "Estados Unidos", en: "United States" }, region: "na",
    tuitionPublic: 11000, tuitionPrivate: 43000, living: 16000, years: 4,
    note: { es: "Pública estatal para residentes; fuera del estado casi duplica.", en: "In-state public rates; out-of-state nearly doubles." },
  },
  {
    code: "GB", flag: "🇬🇧", name: { es: "Reino Unido", en: "United Kingdom" }, region: "eu",
    tuitionPublic: 12000, tuitionPrivate: 26000, living: 15000, years: 3,
    note: { es: "Grados de 3 años; tarifa internacional muy superior a la local.", en: "3-year degrees; international fees far above home rates." },
  },
  {
    code: "MX", flag: "🇲🇽", name: { es: "México", en: "Mexico" }, region: "latam",
    tuitionPublic: 800, tuitionPrivate: 9000, living: 6000, years: 4,
    note: { es: "UNAM casi gratuita; Tec de Monterrey e Ibero en el rango alto.", en: "UNAM nearly free; Tec de Monterrey and Ibero at the high end." },
  },
  {
    code: "CO", flag: "🇨🇴", name: { es: "Colombia", en: "Colombia" }, region: "latam",
    tuitionPublic: 900, tuitionPrivate: 7500, living: 5000, years: 5,
    note: { es: "Los Andes y Javeriana marcan el techo del sector privado.", en: "Los Andes and Javeriana set the private ceiling." },
  },
  {
    code: "AR", flag: "🇦🇷", name: { es: "Argentina", en: "Argentina" }, region: "latam",
    tuitionPublic: 0, tuitionPrivate: 6500, living: 4800, years: 5,
    note: { es: "Universidad pública gratuita, incluso para extranjeros.", en: "Public university is free, even for foreigners." },
  },
  {
    code: "CL", flag: "🇨🇱", name: { es: "Chile", en: "Chile" }, region: "latam",
    tuitionPublic: 4500, tuitionPrivate: 8500, living: 6500, years: 5,
    note: { es: "Gratuidad parcial según ingresos familiares.", en: "Partial free tuition depending on family income." },
  },
  {
    code: "PA", flag: "🇵🇦", name: { es: "Panamá", en: "Panama" }, region: "latam",
    tuitionPublic: 1200, tuitionPrivate: 8000, living: 8400, years: 4,
    note: { es: "Privadas con convenios americanos elevan el coste.", en: "Private schools with US partnerships push costs up." },
  },
  {
    code: "PE", flag: "🇵🇪", name: { es: "Perú", en: "Peru" }, region: "latam",
    tuitionPublic: 700, tuitionPrivate: 7000, living: 4800, years: 5,
    note: { es: "UPC y PUCP en la franja alta del sector privado.", en: "UPC and PUCP sit at the top of the private range." },
  },
  {
    code: "BR", flag: "🇧🇷", name: { es: "Brasil", en: "Brazil" }, region: "latam",
    tuitionPublic: 0, tuitionPrivate: 6000, living: 6000, years: 4,
    note: { es: "Federales gratuitas pero con acceso muy competitivo.", en: "Federal universities are free but highly competitive." },
  },
  {
    code: "DE", flag: "🇩🇪", name: { es: "Alemania", en: "Germany" }, region: "eu",
    tuitionPublic: 400, tuitionPrivate: 14000, living: 12000, years: 3,
    note: { es: "Sin matrícula en la mayoría de estados, solo tasas semestrales.", en: "No tuition in most states, only semester fees." },
  },
  {
    code: "FR", flag: "🇫🇷", name: { es: "Francia", en: "France" }, region: "eu",
    tuitionPublic: 1000, tuitionPrivate: 13000, living: 11000, years: 3,
    note: { es: "Grandes Écoles privadas muy por encima de la media.", en: "Private Grandes Écoles run well above average." },
  },
  {
    code: "IT", flag: "🇮🇹", name: { es: "Italia", en: "Italy" }, region: "eu",
    tuitionPublic: 1800, tuitionPrivate: 12000, living: 10000, years: 3,
    note: { es: "Bocconi y LUISS elevan la media privada.", en: "Bocconi and LUISS lift the private average." },
  },
  {
    code: "PT", flag: "🇵🇹", name: { es: "Portugal", en: "Portugal" }, region: "eu",
    tuitionPublic: 1400, tuitionPrivate: 7000, living: 8500, years: 3,
    note: { es: "Coste de vida bajo comparado con el resto de Europa occidental.", en: "Low living costs compared with the rest of Western Europe." },
  },
  {
    code: "NL", flag: "🇳🇱", name: { es: "Países Bajos", en: "Netherlands" }, region: "eu",
    tuitionPublic: 2600, tuitionPrivate: 13000, living: 13000, years: 3,
    note: { es: "Tarifa UE baja; no-UE ronda los 12.000 al año.", en: "Low EU rate; non-EU students pay around 12,000 a year." },
  },
  {
    code: "CH", flag: "🇨🇭", name: { es: "Suiza", en: "Switzerland" }, region: "eu",
    tuitionPublic: 1600, tuitionPrivate: 30000, living: 24000, years: 3,
    note: { es: "Matrícula baja, pero el coste de vida es el más alto de Europa.", en: "Low tuition, but the highest living costs in Europe." },
  },
  {
    code: "CA", flag: "🇨🇦", name: { es: "Canadá", en: "Canada" }, region: "na",
    tuitionPublic: 5500, tuitionPrivate: 25000, living: 13000, years: 4,
    note: { es: "Internacionales pagan entre 3 y 4 veces la tarifa local.", en: "International students pay 3–4x the domestic rate." },
  },
  {
    code: "AU", flag: "🇦🇺", name: { es: "Australia", en: "Australia" }, region: "apac",
    tuitionPublic: 8000, tuitionPrivate: 28000, living: 17000, years: 3,
    note: { es: "Group of Eight en el extremo alto para internacionales.", en: "Group of Eight schools at the top end for internationals." },
  },
  {
    code: "AE", flag: "🇦🇪", name: { es: "Emiratos Árabes", en: "United Arab Emirates" }, region: "other",
    tuitionPublic: 9000, tuitionPrivate: 22000, living: 15000, years: 4,
    note: { es: "Campus internacionales (NYU, Sorbonne) con precios premium.", en: "International campuses (NYU, Sorbonne) at premium prices." },
  },
  {
    code: "JP", flag: "🇯🇵", name: { es: "Japón", en: "Japan" }, region: "apac",
    tuitionPublic: 4000, tuitionPrivate: 9000, living: 11000, years: 4,
    note: { es: "Becas MEXT cubren matrícula completa para extranjeros.", en: "MEXT scholarships cover full tuition for foreign students." },
  },
];

export const REGION_LABELS: Record<UniversityCountry["region"], { es: string; en: string }> = {
  eu: { es: "Europa", en: "Europe" },
  latam: { es: "Latinoamérica", en: "Latin America" },
  na: { es: "Norteamérica", en: "North America" },
  apac: { es: "Asia-Pacífico", en: "Asia-Pacific" },
  other: { es: "Otros", en: "Other" },
};

export function totalCost(c: UniversityCountry, type: "public" | "private", includeLiving: boolean) {
  const tuition = type === "public" ? c.tuitionPublic : c.tuitionPrivate;
  return (tuition + (includeLiving ? c.living : 0)) * c.years;
}
