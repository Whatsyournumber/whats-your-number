import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/hooks/use-language";

/**
 * Contenido base de políticas (UE/EEE, Reino Unido, EE. UU. y resto del mundo).
 * Se reutiliza en el aviso de cookies y en el footer.
 */
export function PoliciesBody() {
  const t = useT();
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p>
        {t(
          "Responsable: Oscar Alvarez, operador de WhatsYournumber (alvarez.o@perform-ly.com). Tratamos tus datos para crear tu cuenta, prestarte el análisis financiero y dar soporte.",
          "Controller: Oscar Alvarez, operator of WhatsYournumber (alvarez.o@perform-ly.com). We process your data to create your account, deliver the financial analysis and provide support.",
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
          "No vendemos ni compartimos tus datos personales con fines publicitarios (incluido el sentido de las leyes de privacidad de California). Puedes pedir acceso, corrección, portabilidad o eliminación escribiendo a alvarez.o@perform-ly.com.",
          "We do not sell or share your personal data for advertising purposes (including under California privacy laws). You can request access, correction, portability or deletion at alvarez.o@perform-ly.com.",
        )}
      </p>
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
  );
}

export function PoliciesDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children?: React.ReactNode;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {title ?? t("Privacidad y cookies", "Privacy and cookies")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Lo esencial, en claro. Aplica en la UE/EEE, Reino Unido, EE. UU. y el resto del mundo.",
              "The essentials, in plain language. Applies in the EU/EEA, UK, US and the rest of the world.",
            )}
          </DialogDescription>
        </DialogHeader>
        <PoliciesBody />
        {children}
      </DialogContent>
    </Dialog>
  );
}
