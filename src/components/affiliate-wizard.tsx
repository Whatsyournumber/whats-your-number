import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Link2,
  Loader2,
  MessageCircle,
  PartyPopper,
  QrCode,
  Share2,
  Sparkles,
  X,
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const payoutEmail = user?.email ?? "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const code = affiliate?.code ?? "";
  const link = code ? `${origin}/?ref=${code}` : "";

  const generateQr = async () => {
    if (!link) return;
    if (qrDataUrl) {
      setShowQr(true);
      return;
    }
    setQrLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(link, {
        margin: 2,
        width: 320,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setShowQr(true);
    } catch {
      toast.error(t("No pudimos generar el código QR.", "We couldn't generate the QR code."));
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `WUO-${code}.png`;
    a.click();
    toast.success(t("QR descargado", "QR downloaded"));
  };

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

  const share = (where: "whatsapp" | "instagram" | "telegram" | "linkedin" | "x" | "copy") => {
    if (where === "copy") {
      void copy();
      return;
    }
    const url = encodeURIComponent(link);
    const text = encodeURIComponent(`${shareText} ${link}`);
    if (where === "instagram") {
      // Instagram no permite compartir enlaces por web: copiamos y abrimos la app.
      void copy();
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      return;
    }
    const target =
      where === "whatsapp"
        ? `https://wa.me/?text=${text}`
        : where === "telegram"
          ? `https://t.me/share/url?url=${url}&text=${encodeURIComponent(shareText)}`
          : where === "x"
            ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${url}`
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
            <div key={label} className="flex flex-nowrap items-center gap-1.5">
              {i > 0 && <span className="h-px w-3 shrink-0 bg-border" />}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done && !active ? <Check className="h-3 w-3" /> : i + 2}
              </span>
              <span
                className={`whitespace-nowrap text-[10px] ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
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
            className="surface relative overflow-hidden p-6 text-center"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 shadow-[0_0_30px_-8px_hsl(var(--primary))]">
                <PartyPopper className="h-6 w-6" />
              </span>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {t("¡Tu enlace está listo!", "Your link is ready!")}
              </h2>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("Compártelo y gana 30% de cada suscripción, cada mes.", "Share it and earn 30% of every subscription, every month.")}
              </p>

              <div className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.07] to-transparent p-5 text-left backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5" />
                  {t("Tu código de afiliado", "Your affiliate code")}
                </div>

                <p className="mt-2 text-center font-mono text-2xl font-semibold tracking-[0.12em] text-primary">
                  {code}
                </p>

                <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                <p
                  className="truncate text-center font-mono text-xs text-muted-foreground"
                  title={link}
                >
                  {link.replace(/^https?:\/\//, "").split("/?")[0]}/?ref={code}
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => void copy()} className="flex-1 rounded-xl">
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? t("¡Copiado!", "Copied!") : t("Copiar enlace", "Copy link")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-primary/30 hover:bg-primary/10"
                    onClick={() => {
                      void navigator.clipboard.writeText(code ?? "");
                      toast.success(t("Código copiado", "Code copied"));
                    }}
                  >
                    {t("Copiar código", "Copy code")}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="mt-2 w-full rounded-xl text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  disabled={qrLoading || !link}
                  onClick={() => void generateQr()}
                >
                  {qrLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  {t("Generar código QR", "Generate QR code")}
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {t("Compártelo con tus amigos y empieza a ganar.", "Share it with your friends and start earning.")}
              </p>
            </div>



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
              <Button variant="outline" className="rounded-xl" onClick={() => share("instagram")}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.38.896.42.42.679.82.896 1.38.166.422.362 1.057.415 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.415 2.227a3.72 3.72 0 0 1-.896 1.38c-.42.42-.82.679-1.38.896-.422.166-1.057.362-2.227.415-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.415a3.72 3.72 0 0 1-1.38-.896 3.72 3.72 0 0 1-.896-1.38c-.166-.422-.362-1.057-.415-2.227C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.053-1.17.249-1.805.415-2.227.217-.56.477-.96.896-1.38.42-.42.82-.679 1.38-.896.422-.166 1.057-.362 2.227-.415 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .63 4.14C.333 4.902.13 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.058 1.277.261 2.15.558 2.912a5.88 5.88 0 0 0 1.384 2.126A5.88 5.88 0 0 0 4.14 23.37c.762.297 1.635.5 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.15-.261 2.912-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.297-.762.5-1.635.558-2.912C23.986 15.668 24 15.259 24 12s-.014-3.668-.072-4.948c-.058-1.277-.261-2.15-.558-2.912a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.86.63c-.762-.297-1.635-.5-2.912-.558C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                </svg>
                Instagram
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => share("telegram")}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
                </svg>
                Telegram
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => share("x")}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                </svg>
                X
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => share("instagram")}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.38.896.42.42.679.82.896 1.38.166.422.362 1.057.415 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.415 2.227a3.72 3.72 0 0 1-.896 1.38c-.42.42-.82.679-1.38.896-.422.166-1.057.362-2.227.415-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.415a3.72 3.72 0 0 1-1.38-.896 3.72 3.72 0 0 1-.896-1.38c-.166-.422-.362-1.057-.415-2.227C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.053-1.17.249-1.805.415-2.227.217-.56.477-.96.896-1.38.42-.42.82-.679 1.38-.896.422-.166 1.057-.362 2.227-.415 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .63 4.14C.333 4.902.13 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.058 1.277.261 2.15.558 2.912a5.88 5.88 0 0 0 1.384 2.126A5.88 5.88 0 0 0 4.14 23.37c.762.297 1.635.5 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.15-.261 2.912-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.297-.762.5-1.635.558-2.912C23.986 15.668 24 15.259 24 12s-.014-3.668-.072-4.948c-.058-1.277-.261-2.15-.558-2.912a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.86.63c-.762-.297-1.635-.5-2.912-.558C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                </svg>
                Instagram
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

      {/* QR Modal */}
      <AnimatePresence>
        {showQr && qrDataUrl && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQr(false)}
          >
            <motion.div
              className="relative w-full max-w-xs rounded-3xl border border-border bg-card p-6 text-center shadow-2xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setShowQr(false)}
                aria-label={t("Cerrar", "Close")}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {t("Tu código QR", "Your QR code")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Escanea para abrir tu enlace de afiliado.", "Scan to open your affiliate link.")}
              </p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white p-3">
                <img src={qrDataUrl} alt={`QR ${code}`} className="h-48 w-48 mx-auto" />
              </div>

              <p className="mt-3 font-mono text-sm font-semibold tracking-[0.12em] text-primary">{code}</p>

              <Button className="mt-4 w-full rounded-full" onClick={() => downloadQr()}>
                <Download className="mr-2 h-4 w-4" />
                {t("Descargar QR", "Download QR")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
