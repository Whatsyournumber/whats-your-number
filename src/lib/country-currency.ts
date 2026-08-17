/** Mapa ISO-3166 alpha-2 → moneda oficial (para deducir la divisa de cualquier ciudad del mundo). */
export const COUNTRY_CURRENCY: Record<string, string> = {
  AD: "EUR", AE: "AED", AF: "AFN", AG: "XCD", AI: "XCD", AL: "ALL", AM: "AMD", AO: "AOA",
  AR: "ARS", AS: "USD", AT: "EUR", AU: "AUD", AW: "AWG", AX: "EUR", AZ: "AZN",
  BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "BGN", BH: "BHD", BI: "BIF",
  BJ: "XOF", BL: "EUR", BM: "BMD", BN: "BND", BO: "BOB", BQ: "USD", BR: "BRL", BS: "BSD",
  BT: "BTN", BW: "BWP", BY: "BYN", BZ: "BZD",
  CA: "CAD", CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF", CI: "XOF", CL: "CLP", CM: "XAF",
  CN: "CNY", CO: "COP", CR: "CRC", CU: "CUP", CV: "CVE", CW: "ANG", CY: "EUR", CZ: "CZK",
  DE: "EUR", DJ: "DJF", DK: "DKK", DM: "XCD", DO: "DOP", DZ: "DZD",
  EC: "USD", EE: "EUR", EG: "EGP", ER: "ERN", ES: "EUR", ET: "ETB",
  FI: "EUR", FJ: "FJD", FM: "USD", FO: "DKK", FR: "EUR",
  GA: "XAF", GB: "GBP", GD: "XCD", GE: "GEL", GF: "EUR", GG: "GBP", GH: "GHS", GI: "GIP",
  GL: "DKK", GM: "GMD", GN: "GNF", GP: "EUR", GQ: "XAF", GR: "EUR", GT: "GTQ", GU: "USD",
  GW: "XOF", GY: "GYD",
  HK: "HKD", HN: "HNL", HR: "EUR", HT: "HTG", HU: "HUF",
  ID: "IDR", IE: "EUR", IL: "ILS", IM: "GBP", IN: "INR", IQ: "IQD", IR: "IRR", IS: "ISK", IT: "EUR",
  JE: "GBP", JM: "JMD", JO: "JOD", JP: "JPY",
  KE: "KES", KG: "KGS", KH: "KHR", KM: "KMF", KN: "XCD", KP: "KPW", KR: "KRW", KW: "KWD",
  KY: "KYD", KZ: "KZT",
  LA: "LAK", LB: "LBP", LC: "XCD", LI: "CHF", LK: "LKR", LR: "LRD", LS: "LSL", LT: "EUR",
  LU: "EUR", LV: "EUR", LY: "LYD",
  MA: "MAD", MC: "EUR", MD: "MDL", ME: "EUR", MF: "EUR", MG: "MGA", MH: "USD", MK: "MKD",
  ML: "XOF", MM: "MMK", MN: "MNT", MO: "MOP", MQ: "EUR", MR: "MRU", MS: "XCD", MT: "EUR",
  MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN",
  NA: "NAD", NC: "XPF", NE: "XOF", NG: "NGN", NI: "NIO", NL: "EUR", NO: "NOK", NP: "NPR",
  NR: "AUD", NZ: "NZD",
  OM: "OMR",
  PA: "USD", PE: "PEN", PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN", PM: "EUR",
  PR: "USD", PS: "ILS", PT: "EUR", PW: "USD", PY: "PYG",
  QA: "QAR",
  RE: "EUR", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF",
  SA: "SAR", SB: "SBD", SC: "SCR", SD: "SDG", SE: "SEK", SG: "SGD", SI: "EUR", SK: "EUR",
  SL: "SLE", SM: "EUR", SN: "XOF", SO: "SOS", SR: "SRD", SS: "SSP", ST: "STN", SV: "USD",
  SX: "ANG", SY: "SYP", SZ: "SZL",
  TC: "USD", TD: "XAF", TG: "XOF", TH: "THB", TJ: "TJS", TL: "USD", TM: "TMT", TN: "TND",
  TO: "TOP", TR: "TRY", TT: "TTD", TW: "TWD", TZ: "TZS",
  UA: "UAH", UG: "UGX", US: "USD", UY: "UYU", UZ: "UZS",
  VA: "EUR", VC: "XCD", VE: "VES", VG: "USD", VI: "USD", VN: "VND", VU: "VUV",
  WS: "WST",
  XK: "EUR",
  YE: "YER",
  ZA: "ZAR", ZM: "ZMW", ZW: "USD",
};

/** Nombres de país frecuentes (es/en) → ISO-2, para resultados sin código. */
const NAME_TO_ISO: Record<string, string> = {
  espana: "ES", spain: "ES", francia: "FR", france: "FR", alemania: "DE", germany: "DE",
  italia: "IT", italy: "IT", portugal: "PT", "reino unido": "GB", "united kingdom": "GB",
  "estados unidos": "US", "united states": "US", mexico: "MX", colombia: "CO", peru: "PE",
  chile: "CL", argentina: "AR", brasil: "BR", brazil: "BR", canada: "CA", suiza: "CH",
  switzerland: "CH", australia: "AU", japon: "JP", japan: "JP", panama: "PA", ecuador: "EC",
  "el salvador": "SV", uruguay: "UY", andorra: "AD", "emiratos arabes unidos": "AE",
  "united arab emirates": "AE", venezuela: "VE",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

/** Devuelve la moneda del país (por código ISO-2 o nombre); USD si no se reconoce. */
export function currencyForCountry(code?: string | null, name?: string | null): string {
  const iso = (code ?? "").trim().toUpperCase();
  if (iso && COUNTRY_CURRENCY[iso]) return COUNTRY_CURRENCY[iso]!;
  const byName = name ? NAME_TO_ISO[normalize(name)] : undefined;
  if (byName && COUNTRY_CURRENCY[byName]) return COUNTRY_CURRENCY[byName]!;
  return "USD";
}
