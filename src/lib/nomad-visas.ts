/**
 * Regulaciones de visa para nómadas digitales (estado 2025-26).
 *
 * Fuentes de referencia: portales oficiales de inmigración de cada país,
 * Nomad List, Global Citizen Solutions Digital Nomad Visa Index y
 * resúmenes de PwC / Fragomen sobre tributación de nómadas.
 * Cifras aproximadas de referencia, no asesoría legal ni migratoria.
 */

export type NomadVisa = {
  /** Nombre oficial (o más conocido) del permiso */
  name: string;
  /** ¿Existe una visa específica para trabajo remoto? */
  exists: boolean;
  /** Ingreso mínimo mensual exigido en USD (0 = no aplica) */
  incomeUsd: number;
  /** Duración inicial en meses */
  months: number;
  /** Renovable / extensible */
  renewable: boolean;
  /** Nota fiscal resumida */
  taxEs: string;
  taxEn: string;
  /** Qué tan amigable es el marco regulatorio (0-100) */
  friendliness: number;
};

const V = (
  name: string,
  incomeUsd: number,
  months: number,
  renewable: boolean,
  friendliness: number,
  taxEs: string,
  taxEn: string,
): NomadVisa => ({ name, exists: true, incomeUsd, months, renewable, friendliness, taxEs, taxEn });

const NONE = (nameEs: string, friendliness: number): NomadVisa => ({
  name: nameEs,
  exists: false,
  incomeUsd: 0,
  months: 0,
  renewable: false,
  friendliness,
  taxEs: "Sin régimen especial para trabajo remoto",
  taxEn: "No special regime for remote work",
});

/** Clave = país tal como aparece en el dataset de ciudades. */
export const NOMAD_VISAS: Record<string, NomadVisa> = {
  España: V("Visado de Teletrabajo Internacional (Ley de Startups)", 2760, 12, true, 88,
    "Régimen Beckham: 24% sobre rentas del trabajo hasta 600k durante 6 años",
    "Beckham regime: 24% flat on employment income up to 600k for 6 years"),
  Portugal: V("D8 Digital Nomad Visa", 3480, 12, true, 92,
    "Residencia fiscal tras 183 días; incentivo IFICI 20% para perfiles cualificados",
    "Tax residency after 183 days; IFICI 20% incentive for qualified profiles"),
  Estonia: V("Digital Nomad Visa (Type D)", 4500, 12, false, 86,
    "Exento si permaneces menos de 183 días; e-Residency para facturar",
    "Exempt if you stay under 183 days; e-Residency to invoice"),
  Croacia: V("Permiso de estancia para nómadas digitales", 2870, 18, true, 90,
    "Ingresos del exterior exentos de IRPF croata durante el permiso",
    "Foreign income exempt from Croatian income tax during the permit"),
  Grecia: V("Digital Nomad Visa", 3960, 12, true, 84,
    "50% de descuento en IRPF durante 7 años si trasladas tu residencia",
    "50% income tax discount for 7 years if you relocate tax residency"),
  Italia: V("Visto per Nomadi Digitali", 2900, 12, true, 74,
    "Régimen impatriados: 50% de la renta exenta hasta 5 años",
    "Impatriate regime: 50% of income exempt for up to 5 years"),
  Hungría: V("White Card", 3350, 12, true, 78,
    "IRPF plano del 15% si te vuelves residente fiscal",
    "Flat 15% income tax if you become a tax resident"),
  Chequia: V("Zivno / Digital Nomad Programme", 3200, 12, true, 76,
    "Autónomo con gasto a tanto alzado del 60%: carga efectiva ~7-10%",
    "Freelance with 60% lump-sum expenses: effective load ~7-10%"),
  Malta: V("Nomad Residence Permit", 3900, 12, true, 85,
    "10% de impuesto sobre la renta cualificada del permiso",
    "10% tax on qualifying income under the permit"),
  Rumanía: V("Digital Nomad Visa", 4000, 12, true, 82,
    "Exención de IRPF rumano si no superas 183 días",
    "Romanian income tax exemption if you stay under 183 days"),
  Letonia: V("Digital Nomad Visa (OCDE)", 3200, 12, true, 74,
    "Tributas en Letonia si superas 183 días",
    "Taxable in Latvia beyond 183 days"),
  Alemania: V("Freiberufler (visa de autónomo)", 2800, 12, true, 66,
    "Tributación alemana completa desde la residencia",
    "Full German taxation once resident"),
  "Países Bajos": V("DAFT (solo EE. UU.) / self-employed permit", 1600, 24, true, 70,
    "Tributación neerlandesa; posible 30% ruling en algunos casos",
    "Dutch taxation; 30% ruling possible in some cases"),
  Noruega: V("Independent contractor visa (Svalbard aparte)", 3600, 24, true, 60,
    "Tributación noruega completa",
    "Full Norwegian taxation"),
  Islandia: V("Long-term visa for remote workers", 7300, 6, false, 62,
    "Exento si permaneces menos de 183 días",
    "Exempt under 183 days"),
  Georgia: V("Remotely from Georgia", 2000, 12, true, 94,
    "Régimen de pequeño empresario: 1% sobre facturación hasta 155k/año",
    "Small business regime: 1% turnover tax up to 155k/year"),
  Turquía: V("Digital Nomad Visa (Ministerio de Cultura)", 3000, 12, true, 80,
    "Exento si no adquieres residencia fiscal",
    "Exempt unless you acquire tax residency"),
  "Emiratos Árabes": V("Virtual Working Programme (Dubái)", 3500, 12, true, 93,
    "0% de impuesto sobre la renta personal",
    "0% personal income tax"),
  Catar: NONE("Sin visa de nómada digital", 45),
  Indonesia: V("E33G Remote Worker KITAS (Bali)", 5000, 12, true, 86,
    "Renta extranjera exenta bajo el KITAS de trabajo remoto",
    "Foreign income exempt under the remote worker KITAS"),
  Tailandia: V("Destination Thailand Visa (DTV)", 0, 60, true, 90,
    "Requiere 500k THB de fondos; renta extranjera no remitida, exenta",
    "Requires ~500k THB in funds; unremitted foreign income exempt"),
  Malasia: V("DE Rantau Nomad Pass", 2000, 12, true, 84,
    "Renta de fuente extranjera exenta hasta 2036",
    "Foreign-sourced income exempt until 2036"),
  "Corea del Sur": V("Workation Visa (F-1-D)", 5100, 12, true, 72,
    "Exento si no superas 183 días",
    "Exempt under 183 days"),
  Japón: V("Digital Nomad Visa", 6800, 6, false, 68,
    "Sin residencia fiscal en estancias de 6 meses",
    "No tax residency on 6-month stays"),
  Taiwán: V("Employment Gold Card", 4700, 36, true, 78,
    "50% de la renta sobre 3M TWD exenta durante 5 años",
    "50% of income above TWD 3M exempt for 5 years"),
  Filipinas: V("Digital Nomad Visa (EO 86, 2025)", 2400, 12, true, 76,
    "Renta extranjera no gravada bajo la visa",
    "Foreign income not taxed under the visa"),
  Vietnam: NONE("Sin visa específica (e-visa 90 días)", 52),
  India: NONE("Sin visa de nómada digital", 42),
  "Sri Lanka": V("Digital Nomad Visa (2024)", 2000, 12, true, 70,
    "Renta extranjera exenta si se recibe fuera del país",
    "Foreign income exempt if received abroad"),
  Singapur: NONE("Sin visa de nómada (ONE Pass para altos salarios)", 55),
  China: NONE("Sin visa de nómada digital", 30),
  Mauricio: V("Premium Travel Visa", 1500, 12, true, 88,
    "Renta extranjera no remitida, exenta",
    "Unremitted foreign income exempt"),
  Sudáfrica: V("Remote Work Visa (2024)", 5000, 36, true, 72,
    "Exento de tributación si estás menos de 6 meses en 12",
    "Exempt if present under 6 months in 12"),
  Namibia: V("Digital Nomad Visa", 2000, 6, false, 74,
    "Renta extranjera exenta durante la visa",
    "Foreign income exempt during the visa"),
  Kenia: V("Digital Nomad Work Permit (2024)", 4200, 12, true, 68,
    "Renta extranjera exenta bajo el permiso",
    "Foreign income exempt under the permit"),
  Marruecos: NONE("Estancia turística de 90 días", 50),
  Egipto: NONE("Sin visa de nómada digital", 38),
  Túnez: NONE("Sin visa específica", 44),
  Ghana: NONE("Sin visa específica", 40),
  Nigeria: NONE("Sin visa específica", 32),
  Etiopía: NONE("Sin visa específica", 28),
  Ruanda: V("Work-from-Rwanda / Class G", 1500, 12, true, 66,
    "Tributación local si te vuelves residente",
    "Local taxation if you become resident"),
  Tanzania: NONE("Sin visa específica", 38),
  Botsuana: NONE("Sin visa específica", 42),
  Senegal: NONE("Sin visa específica", 38),
  México: V("Residente Temporal (usada por nómadas)", 4400, 12, true, 86,
    "Renta extranjera no gravada si no eres residente fiscal",
    "Foreign income untaxed if not a tax resident"),
  "Costa Rica": V("Ley de Nómadas Digitales (Rentista remoto)", 3000, 12, true, 88,
    "Renta extranjera exenta y exención de aranceles a equipo",
    "Foreign income exempt plus equipment duty exemption"),
  Panamá: V("Short Stay Visa for Remote Workers", 3000, 9, true, 90,
    "Territorial: la renta de fuente extranjera no tributa",
    "Territorial system: foreign-source income is not taxed"),
  Colombia: V("Visa V Nómada Digital", 900, 24, true, 89,
    "Exento si permaneces menos de 183 días al año",
    "Exempt if under 183 days per year"),
  Brasil: V("VITEM XIV Digital Nomad Visa", 1500, 12, true, 80,
    "Residencia fiscal tras 183 días; renta mundial gravada",
    "Tax residency after 183 days; worldwide income taxed"),
  Argentina: V("Visa de Nómada Digital", 0, 6, true, 70,
    "Renta extranjera no gravada durante la estancia",
    "Foreign income untaxed during the stay"),
  Ecuador: V("Visa de Rentista / Nómada Digital", 1350, 24, true, 78,
    "Renta extranjera exenta bajo la visa",
    "Foreign income exempt under the visa"),
  Uruguay: V("Permiso para nómadas digitales", 0, 12, true, 82,
    "Territorial: renta extranjera exenta hasta 11 años",
    "Territorial: foreign income exempt for up to 11 years"),
  Chile: NONE("Visa temporal (sin programa nómada)", 54),
  Perú: NONE("Sin visa específica", 46),
  Bolivia: NONE("Sin visa específica", 36),
  Paraguay: NONE("Residencia fácil, sin visa nómada", 58),
  "Rep. Dominicana": NONE("Estancia turística prorrogable", 56),
  "Estados Unidos": NONE("Sin visa de nómada digital", 40),
  Canadá: NONE("Estancia de visitante 6 meses (estrategia tech talent)", 52),
  Australia: NONE("Sin visa de nómada (Working Holiday por edad)", 48),
  "Nueva Zelanda": V("Visitor visa con trabajo remoto permitido (2025)", 0, 9, false, 72,
    "Trabajo remoto permitido para empleador extranjero",
    "Remote work allowed for a foreign employer"),
  "Reino Unido": NONE("Sin visa de nómada digital", 44),
  Irlanda: NONE("Sin visa de nómada digital", 46),
  Francia: NONE("Profession libérale (no específica)", 50),
  Bélgica: NONE("Sin visa específica", 46),
  Suiza: NONE("Sin visa específica", 44),
  Austria: NONE("Red-White-Red (no específica)", 48),
  Dinamarca: NONE("Sin visa específica", 46),
  Suecia: NONE("Self-employment permit", 50),
  Finlandia: NONE("Self-employment permit", 52),
  Polonia: NONE("B2B / actividad económica (sin visa nómada)", 60),
  Bulgaria: NONE("Freelance permit (sin visa nómada)", 58),
  Eslovaquia: NONE("Trade licence (sin visa nómada)", 56),
  Eslovenia: V("Digital Nomad Permit (desde nov. 2025)", 3000, 12, false, 76,
    "Exento si no adquieres residencia fiscal",
    "Exempt unless you become a tax resident"),
  Lituania: NONE("Freelance permit (sin visa nómada)", 58),
  Israel: NONE("Sin visa de nómada digital", 44),
  Kazajistán: V("Neo Nomad Visa", 3000, 12, true, 66,
    "Renta extranjera exenta bajo la visa",
    "Foreign income exempt under the visa"),
};

export function nomadVisa(country: string): NomadVisa {
  return NOMAD_VISAS[country] ?? NONE("Sin datos de visa nómada", 45);
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Qué tan amigable es una ciudad para trabajar en remoto:
 * regulación (visa + fiscalidad) + infraestructura real (internet, comunidad,
 * inglés) + costo. 0-100.
 */
export function nomadFriendly(c: {
  country: string;
  internetSpeed: number;
  englishFriendly: number;
  remoteWork: number;
  housing: number;
  food: number;
}): number {
  const visa = nomadVisa(c.country);
  const internet = clamp((c.internetSpeed / 300) * 100);
  const cost = clamp(((3000 - (c.housing + c.food)) / 2400) * 100);
  const durationBonus = visa.exists ? clamp((visa.months / 24) * 100) : 0;
  const incomeEase = visa.exists ? clamp(100 - (visa.incomeUsd / 7000) * 100) : 0;
  const regulation = visa.exists
    ? visa.friendliness * 0.6 + durationBonus * 0.2 + incomeEase * 0.2
    : visa.friendliness * 0.6;
  return Math.round(
    clamp(
      regulation * 0.4 +
        c.remoteWork * 0.2 +
        internet * 0.15 +
        c.englishFriendly * 0.12 +
        cost * 0.13,
    ),
  );
}
