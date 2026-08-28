import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/hooks/use-language";
import { updateConsent } from "@/lib/analytics";

const STORAGE_KEY = "wyn.consent.v1";

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  ts: string;
};

function save(consent: Omit<Consent, "essential" | "ts">) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ essential: true, ...consent, ts: new Date().toISOString() } satisfies Consent),
    );
  } catch {
    /* storage bloqueado */
  }
}

/**
 * Aviso de cookies y políticas básicas (UE/EEE, Reino Unido, EE. UU. y resto del mundo).
 * Se muestra hasta que el visitante registra una decisión.
 */
export function ConsentBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const decide = (a: boolean, m: boolean) => {
    save({ analytics: a, marketing: m });
    updateConsent();
    setOpen(false);
    setVisible(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4">
        <div className="surface mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(
                "Usamos cookies esenciales para que la app funcione y, solo con tu permiso, cookies de medición. Tus datos financieros nunca se venden.",
                "We use essential cookies to run the app and, only with your permission, measurement cookies. Your financial data is never sold.",
              )}{" "}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {t("Ver políticas", "View policies")}
              </button>
            </p>
          </div>
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => decide(false, false)}>
              {t("Solo esenciales", "Essential only")}
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => decide(true, true)}>
              {t("Aceptar todo", "Accept all")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t("Privacidad y cookies", "Privacy and cookies")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Lo esencial, en claro. Aplica en la UE/EEE, Reino Unido, EE. UU. y el resto del mundo.",
                "The essentials, in plain language. Applies in the EU/EEA, UK, US and the rest of the world.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              {t(
                "El operador de WhatsYournumber trata tus datos para crear tu cuenta, prestarte el análisis financiero y dar soporte.",
                "The operator of WhatsYournumber processes your data to create your account, deliver the financial analysis and provide support.",
              )}
            </p>
            <p>
              {t(
                "Los pagos los gestiona Paddle.com, nuestro Merchant of Record: se encarga de facturación, impuestos, atención al cliente y devoluciones. Ofrecemos 30 días de garantía de devolución.",
                "Payments are handled by Paddle.com, our Merchant of Record: it manages invoicing, taxes, customer service and returns. We offer a 30-day money-back guarantee.",
              )}
            </p>
            <p>
              {t(
                "No vendemos ni compartimos tus datos personales con fines publicitarios (incluido el sentido de las leyes de privacidad de California). Puedes pedir acceso, corrección, portabilidad o eliminación desde tu perfil.",
                "We do not sell or share your personal data for advertising purposes (including under California privacy laws). You can request access, correction, portability or deletion from your profile.",
              )}
            </p>

            <div className="space-y-3 rounded-xl border border-border/70 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Esenciales", "Essential")}</p>
                  <p className="text-xs">
                    {t("Sesión, seguridad e idioma. Siempre activas.", "Session, security and language. Always on.")}
                  </p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Medición", "Analytics")}</p>
                  <p className="text-xs">
                    {t("Uso agregado para mejorar el producto.", "Aggregated usage to improve the product.")}
                  </p>
                </div>
                <Switch checked={analytics} onCheckedChange={setAnalytics} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Marketing", "Marketing")}</p>
                  <p className="text-xs">
                    {t("Comunicaciones sobre novedades y ofertas.", "Communications about news and offers.")}
                  </p>
                </div>
                <Switch checked={marketing} onCheckedChange={setMarketing} />
              </div>
            </div>

            <p className="text-xs">
              <Link to="/privacidad" className="underline underline-offset-4 hover:text-foreground">
                {t("Aviso de privacidad", "Privacy notice")}
              </Link>
              {" · "}
              <Link to="/terminos" className="underline underline-offset-4 hover:text-foreground">
                {t("Términos", "Terms")}
              </Link>
              {" · "}
              <Link to="/reembolsos" className="underline underline-offset-4 hover:text-foreground">
                {t("Reembolsos", "Refunds")}
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => decide(false, false)}>
              {t("Rechazar opcionales", "Reject optional")}
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => decide(analytics, marketing)}>
              {t("Guardar preferencias", "Save preferences")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
