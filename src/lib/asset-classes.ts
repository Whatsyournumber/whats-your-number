/**
 * Clase de activo y nivel de riesgo por instrumento.
 * Se usa para mostrar, junto al tipo de posición, a qué clase pertenece
 * y su riesgo aproximado (entre paréntesis, en texto pequeño).
 */

export type RiskLevel = "muy_bajo" | "bajo" | "medio" | "alto" | "muy_alto";

export type AssetClassInfo = { es: string; en: string; risk: RiskLevel };

export const ASSET_CLASSES: Record<string, AssetClassInfo> = {
  bond: { es: "Renta fija", en: "Fixed income", risk: "bajo" },
  tbill: { es: "Renta fija", en: "Fixed income", risk: "muy_bajo" },
  note: { es: "Renta fija", en: "Fixed income", risk: "medio" },
  stock: { es: "Renta variable", en: "Equities", risk: "alto" },
  etf: { es: "Fondos / ETF", en: "Funds / ETF", risk: "medio" },
  mutual_fund: { es: "Fondos de inversión", en: "Mutual funds", risk: "medio" },
  structured: { es: "Productos estructurados", en: "Structured products", risk: "medio" },
  cash: { es: "Efectivo y equivalentes", en: "Cash and equivalents", risk: "muy_bajo" },
  bank: { es: "Efectivo y equivalentes", en: "Cash and equivalents", risk: "muy_bajo" },
  money_market: { es: "Efectivo y equivalentes", en: "Cash and equivalents", risk: "muy_bajo" },
  deposit: { es: "Efectivo y equivalentes", en: "Cash and equivalents", risk: "muy_bajo" },
  crypto: { es: "Activos digitales", en: "Digital assets", risk: "muy_alto" },
  commodity: { es: "Materias primas", en: "Commodities", risk: "alto" },
  private_equity: { es: "Inversiones alternativas", en: "Alternative investments", risk: "muy_alto" },
  property: { es: "Bienes raíces", en: "Real estate", risk: "medio" },
  retirement: { es: "Fondos de inversión", en: "Mutual funds", risk: "medio" },
  other: { es: "Otros", en: "Other", risk: "medio" },
};

const RISK_ES: Record<RiskLevel, string> = {
  muy_bajo: "riesgo muy bajo",
  bajo: "riesgo bajo",
  medio: "riesgo medio",
  alto: "riesgo alto",
  muy_alto: "riesgo muy alto",
};

const RISK_EN: Record<RiskLevel, string> = {
  muy_bajo: "very low risk",
  bajo: "low risk",
  medio: "medium risk",
  alto: "high risk",
  muy_alto: "very high risk",
};

/** Texto "Clase de activo (riesgo X)" para el idioma dado. */
export function assetClassText(kind: string, lang: "es" | "en"): string {
  const info = ASSET_CLASSES[kind];
  if (!info) return "";
  return lang === "en" ? `${info.en} (${RISK_EN[info.risk]})` : `${info.es} (${RISK_ES[info.risk]})`;
}

/** Solo la clase de activo, sin el riesgo. */
export function assetClassName(kind: string, lang: "es" | "en"): string {
  const info = ASSET_CLASSES[kind];
  if (!info) return "";
  return lang === "en" ? info.en : info.es;
}

/** Solo el nivel de riesgo, traducido. */
export function riskText(kind: string, lang: "es" | "en"): string {
  const info = ASSET_CLASSES[kind];
  if (!info) return "";
  return lang === "en" ? RISK_EN[info.risk] : RISK_ES[info.risk];
}
