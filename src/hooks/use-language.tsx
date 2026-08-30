import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

import { detectLang } from "@/lib/geo";
import { langFromPath, localizedPath } from "@/lib/lang-routes";

export type Lang = "es" | "en";

const STORAGE_KEY = "yn.lang";

const DICT = {
  es: {
    "auth.back": "Volver al inicio",
    "auth.tagline": "Tu número financiero",
    "auth.login": "Iniciar sesión",
    "auth.signup": "Crear cuenta",
    "auth.title.login": "Bienvenido de vuelta",
    "auth.title.signup": "Empieza con WhatsYournumber",
    "auth.subtitle.login": "Entra para ver tu patrimonio en tiempo real.",
    "auth.subtitle.signup": "Crea tu cuenta en menos de un minuto.",
    "auth.name": "Nombre completo",
    "auth.email": "Email",
    "auth.password": "Contraseña",
    "auth.submit.login": "Entrar",
    "auth.submit.signup": "Crear cuenta",
    "auth.or": "o",
    "auth.google": "Continuar con otras cuentas",
    "auth.google.note":
      "Al registrarte con Google pedimos tu nombre, email, teléfono y foto para crear tu perfil.",
    "auth.promo.label": "Código de invitación (opcional)",
    "auth.promo.hint": "Sin tarjeta de crédito. Se activa solo al crear tu cuenta.",
    "auth.legal": "Tus datos financieros se guardan de forma privada y cifrada.",
    "auth.toast.signup": "Cuenta creada. ¡Bienvenido!",
    "auth.toast.login": "Sesión iniciada",
    "auth.toast.error": "No pudimos completar la operación",
    "auth.toast.oauth": "No pudimos conectar con tu proveedor de identidad",
  },
  en: {
    "auth.back": "Back to home",
    "auth.tagline": "Your financial number",
    "auth.login": "Sign in",
    "auth.signup": "Sign up",
    "auth.title.login": "Welcome back",
    "auth.title.signup": "Start with WhatsYournumber",
    "auth.subtitle.login": "Sign in to see your net worth in real time.",
    "auth.subtitle.signup": "Create your account in under a minute.",
    "auth.name": "Full name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.submit.login": "Sign in",
    "auth.submit.signup": "Create account",
    "auth.or": "or",
    "auth.google": "Continue with other accounts",
    "auth.google.note":
      "Signing up with Google requests your name, email, phone and photo to build your profile.",
    "auth.promo.label": "Invite code (optional)",
    "auth.promo.hint": "No credit card needed. It activates when your account is created.",
    "auth.legal": "Your financial data is stored privately and encrypted.",
    "auth.toast.signup": "Account created. Welcome!",
    "auth.toast.login": "Signed in",
    "auth.toast.error": "We couldn't complete the request",
    "auth.toast.oauth": "We couldn't connect with your identity provider",
  },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof (typeof DICT)["es"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: TranslationKey) => string };

const LanguageContext = createContext<Ctx>({ lang: "es", setLang: () => {}, t: (k) => DICT.es[k] });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Las URLs /en/* mandan sobre la preferencia guardada.
    if (langFromPath(pathname) === "en") {
      setLangState("en");
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") {
      setLangState(stored);
      return;
    }
    setLangState(detectLang());
  }, [pathname]);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: (key) => DICT[lang][key] ?? DICT.es[key] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Traducción inline: tr("Texto en español", "English text").
 * Pensado para textos de UI que no viven en el diccionario.
 */
export function useT() {
  const { lang } = useLanguage();
  return (es: string, en: string) => (lang === "en" ? en : es);
}



/** Selector minimalista ES / EN. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  const location = useRouterState({ select: (s) => s.location });

  const handleSelect = (code: Lang) => {
    setLang(code);
    const next = localizedPath(location.pathname, code);
    if (next) {
      void router.navigate({ to: next, search: location.search as never, hash: location.hash });
    }
  };

  return (
    <div className={`inline-flex items-center rounded-full border border-white/10 bg-black/30 p-0.5 text-[11px] shadow-sm backdrop-blur-md ${className}`}>
      {(["es", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => handleSelect(code)}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors ${
            lang === code
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
