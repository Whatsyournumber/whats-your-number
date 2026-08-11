/** Traducción de textos generados en libs de datos (objetivos, notas). */
export type Lang = "es" | "en";

const GOAL_NAMES: Record<string, string> = {
  "Fondo de emergencia": "Emergency fund",
  "Cartera de inversión": "Investment portfolio",
  "Retiro anticipado": "Early retirement",
  "Your Number": "Your Number",
};

export function translateGoalName(name: string, lang: Lang) {
  if (lang !== "en") return name;
  if (GOAL_NAMES[name]) return GOAL_NAMES[name]!;
  if (name.startsWith("Vivir en ")) return `Live in ${name.slice("Vivir en ".length)}`;
  return name;
}

export function translateGoalNote(note: string, lang: Lang) {
  if (lang !== "en") return note;
  return note
    .replace("Vivir en ", "Live in ")
    .replace("Ciudad objetivo", "Target city")
    .replace("ahorro ", "savings ")
    .replace("/mes", "/mo")
    .replace("/mes", "/mo")
    .replace("te retiras en menos de 1 año", "you retire in under 1 year")
    .replace(/te retiras en (\d+) años/, "you retire in $1 years")
    .replace("te retiras en +60 años", "you retire in 60+ years");
}
