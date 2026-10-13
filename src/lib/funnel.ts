import { supabase } from "@/integrations/supabase/client";

export type FunnelEvent = "visit" | "auth_view" | "sign_up" | "login" | "onboarding_step" | "onboarding_complete";

function sid(): string {
  try {
    const k = "wyn_funnel_sid";
    let id = localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Registra un paso del embudo (visita → auth → registro → onboarding) una vez por sesión y paso. */
export function trackFunnel(event: FunnelEvent, step?: number) {
  if (typeof window === "undefined") return;
  const onceKey = `wyn_funnel_${event}_${step ?? ""}`;
  try {
    if (sessionStorage.getItem(onceKey)) return;
    sessionStorage.setItem(onceKey, "1");
  } catch {
    /* sin almacenamiento */
  }
  void (async () => {
    const { data } = await supabase.auth.getSession();
    await supabase.from("funnel_events").insert({
      session_id: sid(),
      user_id: data.session?.user.id ?? null,
      event,
      step: step ?? null,
      path: window.location.pathname.slice(0, 200),
    });
  })().catch(() => undefined);
}
