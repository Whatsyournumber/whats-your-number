import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Check,
  Copy,
  Link2,
  Loader2,
  MessageCircle,
  PartyPopper,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { useMyAffiliate } from "@/hooks/use-affiliate";
import { getPaddleEnvironment } from "@/lib/paddle";
import { joinAffiliateProgram } from "@/utils/affiliates.functions";
import { endAffiliateWizard, startAffiliateWizard } from "@/lib/affiliate-wizard-state";

const AUDIENCES = [
  { es: "Familias", en: "Families" },
  { es: "Amigos", en: "Friends" },
  { es: "Emprendedores", en: "Entrepreneurs" },
  { es: "Inversores", en: "Investors" },
  { es: "Expatriados", en: "Expats" },
  { es: "Audiencia general", en: "General audience" },
];

const COUNTRIES = [
  { name: "España", flag: "🇪🇸" },
  { name: "México", flag: "🇲🇽" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Perú", flag: "🇵🇪" },
  { name: "Panamá", flag: "🇵🇦" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "República Dominicana", flag: "🇩🇴" },
  { name: "Estados Unidos", flag: "🇺🇸" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Reino Unido", flag: "🇬🇧" },
  { name: "Andorra", flag: "🇦🇩" },
  { name: "Otro", flag: "🌎" },
];

export function AffiliateWizard() {
  const t = useT();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { affiliate } = useMyAffiliate();

  const [step, setStep] = useState(affiliate ? 1 : 0); // 0 = about you, 1 = link ready, 2 = share

  // Mientras el wizard esté abierto, /afiliados no debe saltar al dashboard.
  useEffect(() => {
    startAffiliateWizard();
  }, []);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.["full_name"] ?? (user?.email ?? ""));
  const [audience, setAudience] = useState(AUDIENCES[0]!.es);
  const [country, setCountry] = useState("");
  const payoutEmail = user?.email ?? "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const code = affiliate?.code ?? "";
  const link = code ? `${origin}/?ref=${code}` : "";

  // Paso 2 ya está hecho (la cuenta existe); el wizard cubre los pasos 3, 4 y 5.
  const steps = [
    t("Crea tu cuenta", "Create account"),
    t("Sobre ti", "About you"),
    t("Tu link", "Your link"),
    t("Comparte", "Share"),
  ];

  const create = async () => {
    setBusy(true);
    try {
      await joinAffiliateProgram({
        data: {
          displayName: displayName || (user?.user_metadata?.["full_name"] ?? ""),
          payoutEmail: payoutEmail || user?.email || "",
          environment: getPaddleEnvironment(),
        },
      });
      await qc.invalidateQueries({ queryKey: ["affiliate"] });
      await qc.invalidateQueries({ queryKey: ["subscription"] });
      setStep(1);
    } catch {
      toast.error(t("No pudimos crear tu cuenta de afiliado.", "We couldn't create your affiliate account."));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("Enlace copiado", "Link copied"));
    setTimeout(() => setCopied(false), 1800);
  };

  const shareText = t(
    "Estoy usando WhatsYournumber para gestionar mi patrimonio. Únete con mi enlace y empecemos juntos:",
    "I'm using WhatsYournumber to manage my wealth. Join with my link and let's start together:",
  );

  const share = (where: "whatsapp" | "x" | "linkedin" | "copy") => {
    if (where === "copy") {
      void copy();
      return;
    }
    const url = encodeURIComponent(link);
    const text = encodeURIComponent(`${shareText} ${link}`);
    const target =
      where === "whatsapp"
        ? `https://wa.me/?text=${text}`
        : where === "x"
          ? `https://twitter.com/intent/tweet?text=${text}`
          : `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Stepper */}
      <div className="mb-6 flex flex-nowrap items-center justify-center gap-1.5">
        {steps.map((label, i) => {
          const done = i <= step; // el índice 0 (cuenta creada) siempre está completo
          const active = i === step + 1;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-4 bg-border" />}
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done && !active ? <Check className="h-3 w-3" /> : i + 2}
              </span>
              <span className={`text-[10px] ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 3 — About you */}
        {step === 0 && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="surface p-6"
          >
            <div className="flex flex-col items-center text-center">
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {t("Cuéntanos un poco sobre ti", "Tell us a bit about you")}
              </h2>
              <p className="mt-1.5 whitespace-nowrap text-xs text-muted-foreground">
                {t("Con esto creamos tu enlace personalizado.", "With this we create your personalized link.")}
              </p>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <Label htmlFor="aff-name" className="text-xs text-muted-foreground">
                  {t("Tu nombre", "Your name")}
                </Label>
                <Input
                  id="aff-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="aff-audience" className="text-xs text-muted-foreground">
                  {t("¿A quién llegas principalmente?", "Who is your main audience?")}
                </Label>
                <select
                  id="aff-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.es} value={a.es}>
                      {t(a.es, a.en)}
                    </option>
                  ))}
                  <option value="Otro">{t("Otro", "Other")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="aff-country" className="text-xs text-muted-foreground">
                  {t("País de residencia", "Country of residence")}
                </Label>
                <Input
                  id="aff-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={t("Escribe tu país", "Type your country")}
                  className="mt-1.5 rounded-xl"
                />


              </div>

            </div>

            <Button className="mt-5 w-full rounded-full" disabled={busy} onClick={() => void create()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {t("Crear mi enlace", "Create my link")}
            </Button>
          </motion.div>
        )}

        {/* STEP 4 — Link ready */}
        {step === 1 && (
          <motion.div
            key="link"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="surface p-6 text-center"
          >
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <PartyPopper className="h-6 w-6" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {t("¡Tu enlace está listo!", "Your link is ready!")}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("Este es tu enlace único. Guárdalo y compártelo donde quieras.", "This is your unique link. Save it and share it anywhere.")}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={link} className="font-mono text-xs sm:text-sm" />
              <Button onClick={() => void copy()} className="shrink-0">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {t("Copiar", "Copy")}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("Tu código:", "Your code:")} <span className="font-mono text-foreground">{code}</span>
            </p>

            <Button className="mt-5 w-full rounded-full" onClick={() => setStep(2)}>
              {t("Siguiente: compártelo", "Next: share it")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* STEP 5 — Share */}
        {step === 2 && (
          <motion.div
            key="share"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="surface p-6 text-center"
          >
            <span className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Share2 className="h-5 w-5" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {t("Compártelo y gana", "Share it and earn")}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t(
                "Cuando 3 amigos se registren con tu enlace, te regalamos 12 meses del plan Pro.",
                "When 3 friends sign up with your link, we gift you 12 months of the Pro plan.",
              )}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => share("whatsapp")}>
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => share("x")}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                </svg>
                X
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => share("linkedin")}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => share("copy")}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {t("Copiar", "Copy")}
              </Button>
            </div>

            <Button
              className="mt-5 w-full rounded-full"
              onClick={() => {
                endAffiliateWizard();
                void navigate({ to: "/afiliados" });
              }}
            >
              {t("Ir a mi panel", "Go to my dashboard")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
