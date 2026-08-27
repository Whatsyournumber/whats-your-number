/**
 * Snapshot del tráfico global del sitio medido por la analítica de Lovable.
 * Se actualiza manualmente (última lectura abajo) y se muestra en el back office
 * del blog dentro de la pestaña "Tráfico".
 */

export type DayPoint = { date: string; visitors: number; pageviews: number };
export type LabeledCount = { label: string; value: number };

export const lovableAnalytics = {
  updatedAt: "2026-08-27",
  period: { start: "2026-07-30", end: "2026-08-27" },
  totals: {
    visitors: 261,
    pageviews: 1636,
    pageviewsPerVisit: 6.27,
    sessionDuration: 408,
    bounceRate: 46,
  },
  byDay: [
    { date: "2026-08-07", visitors: 3, pageviews: 27 },
    { date: "2026-08-08", visitors: 8, pageviews: 53 },
    { date: "2026-08-09", visitors: 16, pageviews: 59 },
    { date: "2026-08-10", visitors: 12, pageviews: 141 },
    { date: "2026-08-11", visitors: 15, pageviews: 225 },
    { date: "2026-08-12", visitors: 13, pageviews: 228 },
    { date: "2026-08-13", visitors: 10, pageviews: 157 },
    { date: "2026-08-14", visitors: 8, pageviews: 20 },
    { date: "2026-08-15", visitors: 8, pageviews: 113 },
    { date: "2026-08-16", visitors: 6, pageviews: 20 },
    { date: "2026-08-17", visitors: 6, pageviews: 44 },
    { date: "2026-08-18", visitors: 4, pageviews: 75 },
    { date: "2026-08-19", visitors: 30, pageviews: 98 },
    { date: "2026-08-20", visitors: 42, pageviews: 105 },
    { date: "2026-08-21", visitors: 11, pageviews: 54 },
    { date: "2026-08-22", visitors: 10, pageviews: 10 },
    { date: "2026-08-23", visitors: 19, pageviews: 77 },
    { date: "2026-08-24", visitors: 8, pageviews: 53 },
    { date: "2026-08-25", visitors: 15, pageviews: 29 },
    { date: "2026-08-26", visitors: 6, pageviews: 18 },
    { date: "2026-08-27", visitors: 11, pageviews: 30 },
  ] as DayPoint[],
  pages: [
    { label: "/", value: 188 },
    { label: "/auth", value: 89 },
    { label: "/dashboard", value: 73 },
    { label: "/gastos", value: 48 },
    { label: "/retiro", value: 36 },
    { label: "/cash-flow", value: 33 },
    { label: "/patrimonio", value: 32 },
    { label: "/ciudades", value: 30 },
    { label: "/portafolio", value: 26 },
    { label: "/finanzas-para-ninos", value: 25 },
  ] as LabeledCount[],
  sources: [
    { label: "Directo", value: 228 },
    { label: "accounts.google.com", value: 74 },
    { label: "oauth.lovable.app", value: 16 },
    { label: "bing.com", value: 1 },
    { label: "google.com", value: 1 },
    { label: "whatsyournumber.lovable.app", value: 1 },
  ] as LabeledCount[],
  devices: [
    { label: "desktop", value: 224 },
    { label: "mobile", value: 45 },
  ] as LabeledCount[],
  countries: [
    { label: "ES", value: 143 },
    { label: "??", value: 88 },
    { label: "US", value: 19 },
    { label: "RU", value: 5 },
    { label: "PA", value: 4 },
    { label: "DE", value: 2 },
    { label: "IT", value: 1 },
    { label: "TH", value: 1 },
  ] as LabeledCount[],
};
