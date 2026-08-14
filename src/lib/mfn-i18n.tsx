/**
 * i18n mínimo y tipado para My First Number (ES / EN).
 * Uso: const { t } = useI18n();  t("Mis Deseos", "My Wishes")
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setMoneyLocale } from "@/lib/mfn";

export type Lang = "es" | "en";
const LANG_KEY = "mfn.lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Devuelve el texto según el idioma activo. */
  t: (es: string, en: string) => string;
};

const I18nContext = createContext<Ctx>({
  lang: "es",
  setLang: () => {},
  t: (es) => es,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    const initial: Lang =
      stored ?? (navigator.language?.toLowerCase().startsWith("en") ? "en" : "es");
    setLangState(initial);
  }, []);

  useEffect(() => {
    setMoneyLocale(lang === "en" ? "en-US" : "es-ES");
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback((es: string, en: string) => (lang === "en" ? en : es), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Selector de idioma compacto (ES / EN). */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-secondary/60 p-0.5 text-[11px] font-bold ${className}`}
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={
            l === lang
              ? "rounded-full bg-primary px-2.5 py-1 text-primary-foreground"
              : "rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
