import { defaultFilters, type Filters } from "./lifestyle-cities";
import type { Profile } from "@/hooks/use-profile";
import { totalIncome } from "./onboarding";

/** Traduce las respuestas del onboarding en filtros sugeridos del simulador. */
export function suggestedFilters(profile: Profile): Filters {
  const income = totalIncome(profile);
  const monthlyTarget = profile.desired_retirement_income || Math.max(2000, income - profile.monthly_savings);
  const budget = Math.max(2000, Math.min(15000, Math.round(monthlyTarget / 250) * 250));

  const married = profile.marital_status === "Casado" || profile.marital_status === "En pareja";
  const kids = profile.children && profile.children !== "0";
  const stage: Filters["stage"] = kids
    ? married
      ? "family"
      : "single_parent"
    : profile.marital_status === "Casado"
      ? "married"
      : profile.marital_status === "En pareja"
        ? "relationship"
        : profile.marital_status
          ? "single"
          : "any";

  const comfort: Filters["comfort"] =
    profile.lifestyle === "minimalista" ? "tight" : profile.lifestyle === "premium" || profile.lifestyle === "lujo" ? "luxury" : "comfortable";

  const goalSource = profile.goal || profile.priority;
  const goal: Filters["goal"] =
    goalSource === "libertad" || goalSource === "retiro_temprano"
      ? "retire"
      : goalSource === "viajar"
        ? "nomad"
        : goalSource === "gastos" || goalSource === "ahorro" || goalSource === "vivienda" || goalSource === "casa"
          ? "save"
          : goalSource === "patrimonio" || goalSource === "invertir"
            ? "career"
            : kids
              ? "family"
              : "lifestyle";

  const climate: Filters["climate"] = profile.travel_frequency === "5+" ? "warm" : "any";

  const stability: Filters["stability"] = kids
    ? "veryhigh"
    : profile.risk_profile === "conservador"
      ? "high"
      : "medium";

  const safety: Filters["safety"] = kids ? "essential" : profile.risk_profile === "agresivo" ? "neutral" : "important";

  return { ...defaultFilters, budget, stage, comfort, goal, climate, stability, safety };
}

/** Frases cortas que explican por qué se sugieren esas ciudades. */
export function suggestionReasons(profile: Profile, f: Filters, t: (es: string, en: string) => string) {
  const out: string[] = [];
  out.push(t(`Presupuesto ~${f.budget} USD/mes`, `Budget ~${f.budget} USD/mo`));
  if (f.stage === "family") out.push(t("Con hijos: colegios y seguridad", "With kids: schools and safety"));
  if (f.stage === "married" || f.stage === "relationship") out.push(t("En pareja", "As a couple"));
  if (f.comfort === "luxury") out.push(t("Estilo de vida premium", "Premium lifestyle"));
  if (f.comfort === "tight") out.push(t("Estilo de vida minimalista", "Minimalist lifestyle"));
  if (f.goal === "retire") out.push(t("Objetivo: libertad financiera", "Goal: financial freedom"));
  if (f.goal === "save") out.push(t("Objetivo: ahorrar más", "Goal: save more"));
  if (f.goal === "nomad") out.push(t("Viajas mucho", "You travel a lot"));
  out.push(
    f.stability === "veryhigh"
      ? t("Estabilidad política muy alta", "Very high political stability")
      : f.stability === "high"
        ? t("Estabilidad política alta", "High political stability")
        : t("Estabilidad política media o mejor", "Medium+ political stability"),
  );
  if (profile.city) out.push(t(`Hoy vives en ${profile.city}`, `Currently in ${profile.city}`));
  return out.slice(0, 5);
}
