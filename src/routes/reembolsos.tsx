import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/reembolsos")({
  head: () => ({
    meta: [
      { title: "Política de reembolsos — WhatsYournumber" },
      { name: "description", content: "Garantía de devolución de 30 días en WhatsYournumber. Cómo solicitar tu reembolso a través de Paddle." },
      { property: "og:title", content: "Política de reembolsos — WhatsYournumber" },
      { property: "og:description", content: "30 días de garantía de devolución, gestionada por Paddle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReembolsosPage,
});

function ReembolsosPage() {
  const t = useT();
  return (
    <LegalPage
      eyebrow={t("Legal", "Legal")}
      title={t("Política de reembolsos", "Refund policy")}
      subtitle={t("30 días de garantía. Sin letra pequeña.", "30-day guarantee. No small print.")}
    >
      <LegalSection title={t("Garantía de 30 días", "30-day guarantee")}>
        <p>
          {t(
            "Ofrecemos una garantía de devolución de 30 días. Si no estás satisfecho con tu compra, puedes solicitar el reembolso completo dentro de los 30 días posteriores a la fecha de tu pedido, tanto en planes mensuales como anuales.",
            "We offer a 30-day money-back guarantee. If you're not satisfied with your purchase, you can request a full refund within 30 days of your order date, on both monthly and yearly plans.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("Cómo solicitarlo", "How to request it")}>
        <p>
          {t(
            "Los reembolsos son procesados por nuestro proveedor de pagos y Merchant of Record, Paddle. Para pedir uno, visita paddle.net con el correo que usaste al comprar, o escríbenos a alvarez.o@perform-ly.com y lo gestionamos contigo.",
            "Refunds are processed by our payment provider and Merchant of Record, Paddle. To request one, visit paddle.net with the email you used at purchase, or write to alvarez.o@perform-ly.com and we'll handle it with you.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("Renovaciones y cancelación", "Renewals and cancellation")}>
        <p>
          {t(
            "Puedes cancelar tu suscripción en cualquier momento desde el portal del cliente. Conservarás el acceso hasta el final del periodo ya pagado y no se realizarán cobros posteriores. Las solicitudes fuera de la ventana de 30 días se revisan caso por caso, junto con Paddle y conforme a la política de reembolsos de Paddle.",
            "You can cancel your subscription anytime from the customer portal. You keep access until the end of the period already paid and no further charges are made. Requests outside the 30-day window are reviewed case by case, together with Paddle and under Paddle's refund policy.",
          )}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
